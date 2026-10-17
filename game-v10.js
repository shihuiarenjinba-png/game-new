"use strict";
/* v0.10: compact scene reading without altering any prior save/branch logic. */
(function () {
  const first = window.HandoverStory;
  const morning = window.HandoverMorning;
  const guard = window.HandoverSaveV9;
  const grand = window.HandoverImmersiveArcs;
  const beats = window.HandoverSceneBeats;
  const reading = window.HandoverReadingV10;
  const cases = window.HandoverCases;
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

  function randomSeed() {
    const words = new Uint32Array(1);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(words);
      return words[0] % cases.COUNT;
    }
    return Math.floor(Math.random() * cases.COUNT);
  }
  let state = guard.blank(randomSeed());
  let saveStatus = "";
  let lastFinding = null;

  try {
    const current=localStorage.getItem(guard.KEY);
    if (current!==null) state=guard.parse(current);
    else {
      const keys=[guard.LEGACY_KEY,guard.V7_KEY,guard.V6_KEY,guard.V5_KEY,guard.V4_KEY,guard.V2_KEY,guard.V1_KEY];
      for(const key of keys) {
        const previous=localStorage.getItem(key);
        if(previous!==null) {
          state=guard.migrateAny(previous);
          saveStatus="以前の進行を元の物語ルールのまま引き継ぎました。新しい検証済み事件は次の周回から始まります。";
          break;
        }
      }
    }
  } catch (_err) {
    saveStatus="以前の保存記録を検証できませんでした。元のデータは変更していません。";
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
    const contextText = window.HandoverCaseNotesV9.emphasis(state);
    // At the final two scenes the authored main revelation gets priority.
    // The small randomized mystery remains a concise secondary thread.
    const mainClimax = ["major","verified","expanded","immersive"].includes(state.arcMode) && inMorning &&
      ["report","epilogue"].includes(state.morning.scene);
    const caseText = beats.isNew(state)
      ? beats.safeCaseText(state)
      : mainClimax ? "" : cases.sceneText(state.case,state);
    const majorText = grand.sceneText(state);
    const reactionText = beats.line(state);
    let storyText = screen.body + (!doingDeduction && contextText ? "\n\n" + contextText : "") + (caseText ? "\n\n" + caseText : "") + (majorText ? "\n\n" + majorText : "") + (reactionText ? "\n\n" + reactionText : "");
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
    if (mainClimax && finished && !beats.isNew(state)) {
      const variant=cases.profile(state.case);
      if (variant) {
        storyText += cases.isRevealed(state.case,state)
          ? "\n\n【もう一つの小さな謎】 匿名の書き置きは" + variant.author.name +
              "が残したと確認できた。ただし本当の動機については、まだ調べきれていない。"
          : "\n\n【まだ残る小さな謎】 匿名の書き置きの筆者までは確かめられなかった。";
      }
    }
    const edited = reading.compose(state, screen, {
      context: contextText, case: caseText, major: majorText, beat: reactionText,
      verified: grand.verified(state),
      review: state.deduction?.stage === "complete"
        ? deduction.assessment(state.deduction, state) : null
    });
    if (edited !== null) storyText = edited;
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
              deduction: newMorning.scene === "report" ? deduction.start() : state.deduction, case: state.case, arcMode: state.arcMode};
          } else {
            const newNight = first.advance(state.night1, option.id);
            const fresh = newNight.clues.find(id => !state.night1.clues.includes(id));
            lastFinding = fresh ? "n:" + fresh : null;
            next = {night1: newNight, morning: null, deduction: null, case: state.case, arcMode: state.arcMode};
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

    if (inMorning && state.morning.scene === "report" && state.deduction?.stage !== "focus") {
      const back = element("button", "deduction-back", "← 推理を一段戻す");
      back.type = "button";
      back.addEventListener("click", () => {
        try {
          const next = { ...state, deduction: deduction.rewind(state.deduction, state) };
          if (!guard.validState(next)) throw new Error("戻る操作で保存形式が不正になりました");
          state = next;
          write(state);
          draw();
          revealStory();
        } catch (_err) {
          notice.textContent = "推理の見直しに失敗しました。元の進行は保護されています。";
        }
      });
      choices.append(back);
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
        const next = {night1: state.night1, morning: morning.fresh(state.night1), deduction: null, case: state.case, arcMode: state.arcMode};
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
      const newCase = element("button", "option continue");
      newCase.type = "button";
      newCase.append(
        element("span", "option-title", "別の事件を調査する"),
        element("span", "option-hint", "今の記録は書き出して保存できます。新しい人物の動機と小さな出来事を調べます。"),
        element("span", "option-arrow", "→")
      );
      newCase.addEventListener("click", () => {
        if (!window.confirm("新しい事件を始めますか？ 現在の記録は上書きされます。必要なら先に書き出してください。")) return;
        const seed = state.case.mode === "procedural" ? grand.nextSeed(state.case.seed) : randomSeed();
        const next = guard.blank(seed);
        state = next;
        lastFinding = null;
        saveStatus = "";
        write(next);
        draw();
        revealStory();
      });
      choices.append(newCase);
    }

    if (finished) {
      const note = element("p", "end-note", "これは試作版の終幕です。違う質問を選べば、別の沈黙が見えるかもしれません。");
      choices.append(note);
    }

    if (isFirstEnd() || finished) {
      const again = element("button", "option replay");
      again.type = "button";
      again.append(element("span", "option-title", "同じ事件を最初から調べ直す"), element("span", "option-hint", "いまの進行は消去されます。必要なら先に保存を書き出してください。"), element("span", "option-arrow", "↺"));
      again.addEventListener("click", resetGame);
      choices.append(again);
    }

    const firstNotes = first.clueList(state.night1).map(f => ({ ...f, unique: "n:" + f.id }));
    const morningNotes = inMorning
      ? morning.clueList(state.morning, state.night1).map(f => ({ ...f, unique: "m:" + f.id }))
      : [];
    const proceduralNotes = beats.safeCaseNotes(state).map(f => ({ ...f, unique: "p:" + f.id }));
    const largeNotes = grand.observed(state).map(f => ({...f, unique:"a:"+f.id}));
    const discovered = [...firstNotes, ...morningNotes, ...proceduralNotes, ...largeNotes];
    clues.replaceChildren();
    clueCount.textContent = String(discovered.length).padStart(2, "0");
    if (!discovered.length) {
      clues.append(element("p", "empty", "自分で確認した記録だけが、ここに残ります。"));
    } else {
      for (const clue of discovered) {
        const note = element("details", "clue");
        const headline = element("summary", "clue-title", clue.title);
        const body = element("div", "clue-inner");
        const related = window.HandoverCaseNotesV9.observed(state).find(item => item.id === (
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
    const next = guard.restart(state);
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
      anchor.download = "handover-room-save-v9.json";
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
      const imported = guard.migrateAny(raw);
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
