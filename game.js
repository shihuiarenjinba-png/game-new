"use strict";
(function () {
  const engine = window.HandoverStory;
  const key = "handover-room-prototype-v1";
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

  let saveStatus = "progress";
  let state = engine.fresh();
  let lastClue = null;

  try {
    const old = localStorage.getItem(key);
    if (old) {
      const parsed = JSON.parse(old);
      if (engine.isValid(parsed)) state = parsed;
      else saveStatus = "invalid";
    }
  } catch (_err) {
    saveStatus = "unavailable";
  }

  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
      if (saveStatus !== "progress") saveStatus = "progress";
    } catch (_err) {
      saveStatus = "unavailable";
    }
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function draw() {
    const screen = engine.view(state);
    const done = state.scene === "ending";
    const step = engine.progress(state);
    stage.textContent = screen.label;
    heading.textContent = screen.title;
    narrative.textContent = screen.body;
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
          const next = engine.advance(state, option.id);
          const freshClue = next.clues.find((id) => !state.clues.includes(id));
          lastClue = freshClue || null;
          state = next;
          save();
          draw();
          heading.focus({ preventScroll: true });
        } catch (_err) {
          notice.textContent = "進行できませんでした。画面を再読み込みしてください。";
        }
      });
      choices.append(button);
    }

    if (done) {
      const restart = element("button", "option replay");
      restart.type = "button";
      restart.append(element("span", "option-title", "別の判断で最初から調べる"), element("span", "option-hint", "記録をリセットして再挑戦"), element("span", "option-arrow", "↺"));
      restart.addEventListener("click", resetGame);
      choices.append(restart);
    }

    const discovered = engine.clueList(state);
    clues.replaceChildren();
    clueCount.textContent = String(discovered.length).padStart(2, "0");
    if (discovered.length === 0) {
      clues.append(element("p", "empty", "ここには、あなたが実際に選んで調べた記録だけが残ります。"));
    } else {
      for (const clue of discovered) {
        const note = element("article", "clue");
        note.append(
          element("div", "clue-title", clue.title),
          element("p", "clue-description", clue.detail)
        );
        if (lastClue === clue.id) note.classList.add("new");
        clues.append(note);
      }
    }

    progress.style.width = String(100 * step.step / step.total) + "%";
    progressText.textContent = done ? "第一夜の調査終了" : String(step.step + 1) + " / " + String(step.total) + " 場面";
    notice.textContent = saveStatus === "unavailable"
      ? "このブラウザでは進行の保存を確認できません。閉じると失われる可能性があります。"
      : saveStatus === "invalid"
        ? "保存形式を読み取れなかったため、新しい記録を表示しています。"
        : done ? "これは試作版の結末です。事実と推測を分けて考えてみてください。" : "何が本当か、すぐに決めなくてもかまいません。";
    document.body.classList.toggle("finished", done);
  }

  function resetGame() {
    if (state.history.length && !window.confirm("これまでの調査記録を消して、最初からやり直しますか？")) return;
    state = engine.fresh();
    lastClue = null;
    save();
    draw();
    heading.focus({ preventScroll: true });
  }

  reset.addEventListener("click", resetGame);
  draw();
})();
