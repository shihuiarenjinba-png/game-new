"use strict";
/* v0.4: deduce from two sources before reporting; one choice column, offline saves. */
(function () {
  const first = window.HandoverStory;
  const morning = window.HandoverMorning;
  const guard = window.HandoverSaveV4;
  const deduction = window.HandoverDeduction;
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const heading = $("heading");
  const narrative = $("narrative");
  const question = $("question");
  const choices = $("choices");
  const clues = $("clues");
  const clueCount = $("clue-count");
  const progress = $("progress");
  const progressText = $("progress-text");
  const notice = $("notice");
  const reset = $("reset");
  const exportButton = $("export-save");
  const importButton = $("import-save");
  const importFile = $("import-file");
  const storageStatus = $("storage-status");

  let state = guard.blank();
  let saveStatus = "";
  let lastFinding = null;

  try {
    const current = localStorage.getItem(guard.KEY);
    if (current !== null) state = guard.parse(current);
    else {
      const prior = localStorage.getItem(guard.LEGACY_KEY);
      const firstSave = prior === null ? localStorage.getItem(guard.FIRST_KEY) : null;
      if (prior !== null) {
        state = guard.migrateV2(prior);
        saveStatus = "以前の試作版の進行を引き継ぎました。";
      } else if (firstSave !== null) {
        state = guard.migrateV1(firstSave);
        saveStatus = "最初の試作版から進行を引き継ぎました。";
      }
    }
  } catch (_err) {
    saveStatus = "既存の進行データを確認できませんでした。以前の記録は変更していません。";
  }

  function write(value) {
    const text = guard.serialize(value);
    try {
      localStorage.setItem(guard.KEY, text);
      return true;
    } catch (_err) {
      saveStatus = "ブラウザへの自動保存に失敗しました。下部の「記録の管理」から書き出してください。";
      return false;
    }
  }

  function element(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function isMorning() { return state.morning !== null; }
  function isFirstEnd() { return !isMorning() && state.night1.scene === "ending"; }
  function isFinal() { return isMorning() && state.morning.scene === "epilogue"; }

  function revealStory() {
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start", behavior: "auto" });
  }

  function draw() {
    const inMorning = isMorning();
    const doingDeduction = inMorning && state.morning.scene === "report" &&
      state.deduction && state.deduction.stage !== "complete";
    const screen = doingDeduction
      ? deduction.display(state.deduction, state)
      : inMorning ? morning.view(state.morning, state.night1) : first.view(state.night1);
    const finished = isFinal();
    const step = state.night1.history.length + (inMorning ? state.morning.history.length : 0);
    stage.textContent = screen.label;
    heading.textContent = screen.title;
    const contextText = window.HandoverCaseNotes.emphasis(state);
    let storyText = screen.body + (!doingDeduction && contextText ? "\n\n" + contextText : "");
    if (finished && state.deduction && state.deduction.stage === "complete") {
      const review = deduction.assessment(state.deduction, state);
      storyText += "\n\n【あなたが残した推理】 " + review.status + "\n" + review.detail +
        "\n\nその後：" + review.consequence;
    }
    if (inMorning && state.morning.scene === "report" && state.deduction?.stage === "complete") {
      const review = deduction.assessment(state.deduction, state);
      storyText = "照合した証拠についての判断： " + review.status + "\n" + review.detail +
        "\n\n" + storyText;
    }
    narrative.textContent = storyText;
    question.textContent = screen.question;
    choices.replaceChildren();

    for (const option of screen.choices) {
      const button = element("button", "option");
      button.type = "button";
      button.append(
        element("span", "option-title", option.label),
        element("span", "option-hint", option.hint),
        element("span", "option-arrow", "↗")
      );
      button.addEventListener("click", () => {
        try {
          let next;
          if (doingDeduction) {
            next = { ...state, deduction: deduction.advance(state.deduction, state, option.id) };
          } else if (inMorning) {
            const newMorning = morning.advance(state.morning, state.night1, option.id);
            const fresh = newMorning.findings.find(id => !state.morning.findings.includes(id));
            lastFinding = fresh ? "m:" + fresh : null;
            next = {night1: state.night1, morning: newMorning,
              deduction: newMorning.scene === "report" ? deduction.start() : state.deduction};
          } else {
            const newNight = first.advance(state.night1, option.id);
            const fresh = newNight.clues.find(id => !state.night1.clues.includes(id));
            lastFinding = fresh ? "n:" + fresh : null;
            next = {night1: newNight, morning: null, deduction: null};
          }
          if (!guard.validState(next)) throw new Error("進行の整合性を確認できません");
          state = next;
          write(state);
          draw();
          revealStory();
        } catch (_err) {
          notice.textContent = "進行に問題が起きました。記録の書き出しと画面の再読み込みをお試しください。";
        }
      });
      choices.append(button);
    }

    if (isFirstEnd()) {
      const nextButton = element("button", "option continue");
      nextButton.type = "button";
      nextButton.append(
        element("span", "option-title", "翌朝の調査を始める"),
        element("span", "option-hint", "最初の判断は消えず、翌朝に影響します。"),
        element("span", "option-arrow", "→")
      );
      nextButton.addEventListener("click", () => {
        const next = {night1: state.night1, morning: morning.fresh(state.night1), deduction: null};
        if (!guard.validState(next)) { notice.textContent = "進行を開始できませんでした。"; return; }
        state = next;
        lastFinding = null;
        write(state);
        draw();
        revealStory();
      });
      choices.append(nextButton);
    }

    if (finished) {
      const note = element("p", "end-note", "これは試作版の終幕です。違う質問を選べば、別の沈黙が見えるかもしれません。");
      choices.append(note);
    }

    if (isFirstEnd() || finished) {
      const again = element("button", "option replay");
      again.type = "button";
      again.append(element("span", "option-title", "最初から別の判断を試す"), element("span", "option-hint", "いまの進行は消去されます。必要なら先に保存を書き出してください。"), element("span", "option-arrow", "↺"));
      again.addEventListener("click", resetGame);
      choices.append(again);
    }

    const firstNotes = first.clueList(state.night1).map(f => ({ ...f, unique: "n:" + f.id }));
    const morningNotes = inMorning
      ? morning.clueList(state.morning, state.night1).map(f => ({ ...f, unique: "m:" + f.id }))
      : [];
    const discovered = [...firstNotes, ...morningNotes];
    clues.replaceChildren();
    clueCount.textContent = String(discovered.length).padStart(2, "0");
    if (!discovered.length) {
      clues.append(element("p", "empty", "自分で確認した記録だけが、ここに残ります。"));
    } else {
      for (const clue of discovered) {
        const note = element("details", "clue");
        const headline = element("summary", "clue-title", clue.title);
        const body = element("div", "clue-inner");
        const related = window.HandoverCaseNotes.observed(state).find(item => item.id === (
          clue.unique === "m:distance" ? "distance2" : clue.id
        ));
        body.append(element("p", "clue-description", clue.detail));
        if (related) {
          body.append(
            element("p", "clue-caveat-label", "まだ確定していないこと"),
            element("p", "clue-caveat", related.caveat)
          );
        }
        note.append(headline, body);
        if (clue.unique === lastFinding) {
          note.classList.add("new");
          note.open = true;
        }
        clues.append(note);
      }
    }

    progress.style.width = String((step / 9) * 100) + "%";
    progressText.textContent = doingDeduction ? "最終報告の前に証拠を照合" :
      finished ? "調査終了" : isFirstEnd() ? "第一夜終了 ・ 翌朝へ" : String(step + 1) + " / 9 場面";
    notice.textContent = saveStatus || (finished
      ? "事実と推測を分けて、あなた自身の判断を振り返ってください。"
      : "情報が足りないときは、結論を急がないことも選択です。");
    if (storageStatus) storageStatus.textContent = "この端末にだけ保存します。外部への送信はありません。";
    document.body.classList.toggle("finished", finished || isFirstEnd());
    document.body.classList.toggle("started", step > 0);
  }

  function resetGame() {
    const inProgress = state.night1.history.length > 0;
    if (inProgress && !window.confirm("この端末の現在の調査記録を消して、初めからやり直しますか？\n必要なら先に記録を書き出してください。")) return;
    const next = guard.blank();
    state = next;
    lastFinding = null;
    saveStatus = "";
    write(next);
    draw();
    revealStory();
  }

  function exportSave() {
    try {
      const text = guard.serialize(state);
      const blob = new Blob([text], {type: "application/json;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "handover-room-save-v4.json";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      if (storageStatus) storageStatus.textContent = "記録を書き出しました。実際にファイルが保存されたか確認してください。";
    } catch (_err) {
      if (storageStatus) storageStatus.textContent = "書き出しに失敗しました。記録は変更していません。";
    }
  }

  async function importSave() {
    const file = importFile.files && importFile.files[0];
    if (!file) return;
    try {
      if (file.size < 1 || file.size > guard.MAX_BYTES) throw new Error("ファイル容量が不正です");
      const raw = await file.text();
      let imported;
      try { imported = guard.parse(raw); }
      catch (_versionError) { imported = guard.migrateV2(raw); }
      if (!window.confirm("保存されている調査記録を、このファイルの記録で置き換えますか？\n現在の記録を先に書き出しておくことをおすすめします。")) return;
      const text = guard.serialize(imported);
      try {
        localStorage.setItem(guard.KEY, text);
      } catch (_err) {
        throw new Error("端末への保存に失敗したため、復元しませんでした");
      }
      state = imported;
      saveStatus = "保存ファイルから調査を復元しました。";
      lastFinding = null;
      draw();
      revealStory();
    } catch (err) {
      if (storageStatus) storageStatus.textContent = "読み込みを中止しました：" + (err?.message || "不明なエラー");
    } finally {
      importFile.value = "";
    }
  }

  reset.addEventListener("click", resetGame);
  exportButton.addEventListener("click", exportSave);
  importButton.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", importSave);
  draw();
})();
