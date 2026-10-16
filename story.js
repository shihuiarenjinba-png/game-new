/* 引継ぎ室 — independent fictional interactive story core.
 * No network, no imported code, deterministic narrative branches.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HandoverStory = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = 1;
  const ORDER = ["opening", "records", "coworker", "supervisor", "judgment", "ending"];

  const CLUES = Object.freeze({
    wording: {
      title: "同じ一文",
      detail: "三人の報告書に、読点の位置まで同じ「本人が自ら希望したため、作業を続行した」が記されている。事実なのか、誰かが用意した言葉なのか。"
    },
    stoppage: {
      title: "消された申し送り",
      detail: "作業ノートには「佐原：停止の相談」と一度書かれ、後から線が引かれている。誰が消したかは分からない。"
    },
    renewals: {
      title: "契約更新の掲示",
      detail: "「現場の生産停止回数を評価に反映」の掲示。停止が禁じられた証拠ではないが、現場が何を恐れていたかは想像できる。"
    },
    confession: {
      title: "真帆の言葉",
      detail: "「止めたいとは言ってた。でも、私が聞いたことにしたら、あの人が困る」。彼女は署名にはまだ同意していない。"
    },
    rote: {
      title: "繰り返された説明",
      detail: "真帆は「本人が自ら希望した」と正確に繰り返すが、誰がその場で言ったかを説明できない。"
    },
    distance: {
      title: "席を離す理由",
      detail: "真帆は「あなたが来たことを、班長が見ている」と言った。続きを話すには場所と時間が必要そうだ。"
    },
    draft: {
      title: "報告文の作成者",
      detail: "班長は「文面は私が整えた」と答えた。文面を整えたことと、内容が虚偽であることは同じではない。"
    },
    quota: {
      title: "止めにくい空気",
      detail: "班長は明確な停止禁止命令を否定した一方で「今月はもう納期を落とせない」と繰り返した。"
    },
    silence: {
      title: "反対しなかった理由",
      detail: "班長は「誰も異論を言わなかった」と言う。反対がなかったことが、賛成を意味するのだろうか。"
    }
  });

  const SCENES = Object.freeze({
    opening: {
      label: "第一夜 / 調査開始",
      title: "全員が同じことを言った",
      body: "夜の梱包工場。数日前、若い作業員・佐原が作業中に負傷し、休職した。翌朝には事故報告が提出される。現場の三人が口を揃えて言う。「本人が自分で続けると決めた」。言葉の揃い方だけが、妙に耳に残る。",
      question: "誰から、どのように話を始めますか？",
      choices: [
        { id: "listen", label: "まず、誰も責めないと伝える", hint: "警戒を弱める。話は遅くなるかもしれない。", warmth: 1, pressure: 0 },
        { id: "formal", label: "聞き取りの目的と記録方法を説明する", hint: "公平さを示すが、相手は慎重になる。", warmth: 0, pressure: 0 },
        { id: "confront", label: "三人の説明が同じなのは不自然だと告げる", hint: "核心に近づくが、誰かを黙らせる可能性がある。", warmth: -1, pressure: 1 }
      ]
    },
    records: {
      label: "第一夜 / 記録室",
      title: "書類は嘘をつかない、とは限らない",
      body: "記録室には、使い込まれたノートと壁の掲示、提出前の報告書。どれも普通の工場にあるものだ。それでも、ここでひとつ選んだ記録が、次の質問の仕方を変える。",
      question: "今夜、最も気になる記録を一つだけ持ち出せます。",
      choices: [
        { id: "wording", label: "三人の事故報告を読み比べる", hint: "不自然に一致した言葉を確かめる。", clue: "wording" },
        { id: "stoppage", label: "現場の手書き申し送りを調べる", hint: "誰かが残した小さな違和感を追う。", clue: "stoppage" },
        { id: "renewals", label: "契約更新と生産目標の掲示を見る", hint: "発言できない理由を探る。", clue: "renewals" }
      ]
    },
    coworker: {
      label: "第一夜 / 休憩室",
      title: "誰かを守ろうとする声",
      body: "同僚の真帆は、あなたの足音で話を止めた。マグカップを両手で持ったまま「報告書の通りです」と言う。その後、小さな声で「でも、何が聞きたいんですか」と尋ねた。",
      question: "真帆に、何を尋ねますか？",
      choices: [
        { id: "private", label: "『あなたが見たことだけでいい』と聞く", hint: "証言を急がせず、相手に選ぶ余地を残す。", warmth: 2, pressure: 0, clue: "confession" },
        { id: "repeat", label: "『なぜ皆、同じ一文を使うのですか』と問う", hint: "言葉の出所を確認する。", warmth: -1, pressure: 1, clue: "rote" },
        { id: "space", label: "『ここで話しづらいですか』と確かめる", hint: "話す場所そのものが問題かもしれない。", warmth: 1, pressure: 0, clue: "distance" }
      ]
    },
    supervisor: {
      label: "第一夜 / 班長室",
      title: "誰も命令していない",
      body: "班長の荻野は静かに言う。「私は止めるなとは言っていません。誰も反対しなかった」。扉の向こうでは、休憩時間なのに作業音が続いている。",
      question: "質問は一つだけ許されました。",
      choices: [
        { id: "author", label: "『あの報告文は、誰が書いたのですか』", hint: "書類が生まれた経緯を確認する。", clue: "draft" },
        { id: "targets", label: "『納期や契約更新は関係しましたか』", hint: "明示されない圧力に踏み込む。", clue: "quota" },
        { id: "agreement", label: "『反対しなかったら、同意したことになりますか』", hint: "沈黙の意味を問い直す。", clue: "silence" }
      ]
    },
    judgment: {
      label: "第一夜 / 提出直前",
      title: "きれいな報告書ほど、怖い",
      body: "午前零時。署名欄だけ空いた事故報告書が机に置かれた。誰かを罰すること、今夜の言葉を残すこと、明日まで待つこと。そのどれも、誰かの生活を動かす。",
      question: "あなたは報告書をどう扱いますか？",
      choices: [
        { id: "amend", label: "『本人の判断』という断定を差し戻す", hint: "確認できない部分を確定事実にしない。", finish: "amend" },
        { id: "hold", label: "提出を保留して、安全な再聴取を提案する", hint: "調査を続ける。ただし、時間は残り少ない。", finish: "hold" },
        { id: "approve", label: "今ある記録だけで正式に受理する", hint: "手続きを終わらせる。真相が残るかは別だ。", finish: "approve" }
      ]
    }
  });

  const ENDINGS = Object.freeze({
    correction: {
      title: "結末：誰かが、自分の言葉で話す",
      text: "あなたは『本人が希望した』という断定だけを差し戻した。真帆が少し遅れて、自分の見たことを一つ話す。誰かが一度『止めてもいいですか』と尋ねたらしい。全員を救う報告書にはならない。それでも、誰かの言葉が初めて誰かのものになった。"
    },
    isolated: {
      title: "結末：正しい言葉、閉ざされた扉",
      text: "断定を差し戻した判断は記録に残った。しかし、現場から新しい証言は出なかった。間違った報告を防ぐことと、安心して本当のことを話せることは別だった。休憩室の椅子が、一つずつ奥に寄せられていく。"
    },
    continuation: {
      title: "結末：明日のための空席",
      text: "あなたは提出を保留した。真帆はすぐには頷かないが、後で話せる場所を教えてくれた。真相はまだ分からない。けれど、誰も見ていないところで話す余地を、ようやく一つ作ることができた。"
    },
    stalled: {
      title: "結末：また同じ朝礼が始まる",
      text: "報告を保留したが、誰にも話す準備ができていなかった。翌朝、班長は『個別の事情は確認中です』と読み上げる。言葉は昨日とは違うのに、部屋に流れる沈黙はまったく同じだった。"
    },
    closed: {
      title: "結末：全員一致",
      text: "あなたの署名で書類は閉じられた。誰も抗議しない。真帆は小さく礼を言い、すぐに目を伏せる。工場は明日も動くだろう。『本人が自ら希望した』という文が、誰の口から最初に出たのか、もう確かめる人はいない。"
    }
  });

  function fresh() {
    return { version: VERSION, scene: "opening", warmth: 0, pressure: 0, clues: [], history: [], ending: null };
  }

  function isValid(s) {
    return !!s && typeof s === "object" && !Array.isArray(s) &&
      s.version === VERSION && ORDER.includes(s.scene) &&
      Number.isInteger(s.warmth) && s.warmth >= -5 && s.warmth <= 8 &&
      Number.isInteger(s.pressure) && s.pressure >= 0 && s.pressure <= 8 &&
      Array.isArray(s.clues) && s.clues.length <= 4 &&
      s.clues.every((x) => Object.hasOwn(CLUES, x)) &&
      new Set(s.clues).size === s.clues.length &&
      Array.isArray(s.history) && s.history.length <= 5 &&
      s.history.every((x) => x && typeof x === "object" && typeof x.scene === "string" && typeof x.choice === "string") &&
      (s.ending === null || Object.hasOwn(ENDINGS, s.ending)) &&
      (s.scene === "ending") === (s.ending !== null) &&
      s.history.length === ORDER.indexOf(s.scene);
  }

  function advance(s, choiceId) {
    if (!isValid(s)) throw new Error("不正なセーブデータです");
    if (s.scene === "ending") throw new Error("物語は終了しています");
    const scene = SCENES[s.scene];
    const chosen = scene.choices.find((x) => x.id === choiceId);
    if (!chosen) throw new Error("選べない行動です");
    const next = {
      version: VERSION,
      scene: ORDER[ORDER.indexOf(s.scene) + 1],
      warmth: Math.max(-5, Math.min(8, s.warmth + (chosen.warmth || 0))),
      pressure: Math.max(0, Math.min(8, s.pressure + (chosen.pressure || 0))),
      clues: chosen.clue ? [...s.clues, chosen.clue] : [...s.clues],
      history: [...s.history, { scene: s.scene, choice: choiceId }],
      ending: null
    };
    if (chosen.finish === "approve") next.ending = "closed";
    if (chosen.finish === "hold") next.ending = next.warmth >= 2 && next.pressure === 0 ? "continuation" : "stalled";
    if (chosen.finish === "amend") next.ending = next.warmth >= 2 && next.pressure === 0 &&
      (next.clues.includes("confession") || next.clues.includes("distance")) ? "correction" : "isolated";
    if (!isValid(next)) throw new Error("物語の進行に失敗しました");
    return next;
  }

  function view(s) {
    if (!isValid(s)) throw new Error("不正なセーブデータです");
    if (s.scene === "ending") {
      return { label: "第一夜 / 記録終了", title: ENDINGS[s.ending].title, body: ENDINGS[s.ending].text, question: "記録はここで止まります。", choices: [] };
    }
    const scene = SCENES[s.scene];
    let body = scene.body;
    if (s.scene === "coworker" && s.pressure > 0) body += " あなたが近づくと、真帆は開いていたメモ帳を伏せた。";
    if (s.scene === "coworker" && s.warmth > 0) body += " 「私の言葉で話してもいいですか」と、彼女は小さく聞いた。";
    if (s.scene === "supervisor" && s.clues.includes("confession")) body += " 真帆の言葉を聞いた今、『反対しなかった』の意味が違って聞こえる。";
    if (s.scene === "judgment") body += " あなたが見たのは、証明済みの悪意ではなく、それぞれが飲み込んだ言葉の跡だった。";
    return { label: scene.label, title: scene.title, body, question: scene.question, choices: scene.choices.map(({id, label, hint}) => ({id, label, hint})) };
  }

  function clueList(s) {
    if (!isValid(s)) throw new Error("不正なセーブデータです");
    return s.clues.map((id) => ({ id, ...CLUES[id] }));
  }

  function progress(s) {
    if (!isValid(s)) throw new Error("不正なセーブデータです");
    return { step: s.history.length, total: 5, finished: s.scene === "ending" };
  }

  return Object.freeze({ VERSION, fresh, isValid, advance, view, clueList, progress, ENDINGS });
});
