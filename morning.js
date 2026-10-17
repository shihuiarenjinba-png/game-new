/* 独立した第二章：人間の沈黙をめぐる翌朝の調査。外部通信なし。 */
(function (root, factory) {
  const first = typeof module !== "undefined" && module.exports
    ? require("./story.js")
    : root.HandoverStory;
  const api = factory(first);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HandoverMorning = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (first) {
  "use strict";

  const VERSION = 1;
  const ORDER = ["letter", "maho", "sahara", "report", "epilogue"];
  const FINDINGS = Object.freeze({
    envelope: { title: "封筒に残された言葉", detail: "机に置かれた封筒には「自分で決めた」とある。筆者も、書かれた状況もまだ不明だ。" },
    unsealed: { title: "差出人不明の書き置き", detail: "封筒は封がされていなかった。誰が読んだか分からない以上、内容を共有してよいとは限らない。" },
    mark: { title: "文字の重なり", detail: "一度消された『大丈夫』の上から、『自分で』と書き直されていた。訂正した理由は分からない。" },
    unhurried: { title: "答えを急がない約束", detail: "真帆は「今なら一人で話せる」と言った。ただし、話すことのすべてを報告書に載せてよいとは言っていない。" },
    distance: { title: "守るための沈黙", detail: "真帆は「止めたら、次に削られるのは別の人のシフト」と言った。誰がそう決めたかは明かさなかった。" },
    interruption: { title: "言葉が止まった瞬間", detail: "あなたが班長の名を出すと、真帆は目を伏せた。それだけでは、班長が加害者だという証拠にならない。" },
    voice: { title: "本人が口にした言葉", detail: "佐原は「続けると言ったのは本当」と話した。同時に、「止めてもいいよと言われた記憶はない」とも語った。" },
    consent: { title: "引用への条件付き同意", detail: "佐原は言葉の引用を認めたが、同僚の名前を出さないことを条件とした。公表の許可ではない。" },
    refusal: { title: "署名をためらう理由", detail: "佐原は「正しい文章が誰かをクビにするなら、書きたくない」と話した。強制か善意か、まだ一つに決められない。" }
  });

  const SCENES = Object.freeze({
    letter: {
      label: "翌朝 / 届いた封筒", title: "自分で決めた、と誰が書いた",
      body: "夜が明けるころ、工場の守衛が茶封筒を持ってきた。「今朝、鍵のかかった調査室の前にありました」。差出人の名前はない。中には一枚だけ、短い手書きの紙。「自分で決めたと言ってください」。末尾の句点だけが二重になっている。",
      question: "この一枚を、どう扱いますか？",
      choices: [
        { id: "preserve", label: "原本を保管し、内容はまだ公表しない", hint: "出所が分かるまで推測を広げない。", clue: "envelope", flag: "care" },
        { id: "share", label: "誰が書いたか確認するため現場に見せる", hint: "情報は集まるかもしれないが、誰かの立場を危うくする。", clue: "unsealed", flag: "exposed" },
        { id: "examine", label: "書き直された文字だけを記録する", hint: "断定を避け、書いた人の迷いを想像する。", clue: "mark", flag: "care" }
      ]
    },
    maho: {
      label: "翌朝 / 控室", title: "やさしい人ほど黙ってしまう",
      body: "真帆は退勤するところだった。「昨日はごめんなさい。みんな、自分が言ったことの責任を取れる人ばかりじゃないんです」。その言葉は言い訳にも、誰かへの謝罪にも聞こえた。",
      question: "真帆に、もう一度だけ尋ねます。",
      choices: [
        { id: "private", label: "話したくないことは書かない、と伝える", hint: "自由に話せる場所をつくる。", clue: "unhurried", flag: "privacy" },
        { id: "why", label: "なぜ皆が佐原の判断を守ろうとするのか尋ねる", hint: "沈黙が生まれる事情をたどる。", clue: "distance", flag: "context" },
        { id: "name", label: "班長が口裏合わせを指示したのか、直接問う", hint: "疑いを口にすることで、相手の言葉が変わる。", clue: "interruption", flag: "confront" }
      ]
    },
    sahara: {
      label: "翌朝 / 本人からの連絡", title: "あのとき、続けたいと言った",
      body: "休職中の佐原から、本人の希望で短い連絡があった。「続けるって言ったのは本当です」。そこで沈黙が続く。「でも、止めてもいいとは、誰も言わなかった」。あなたは、相手の口から出た言葉と、その前にあった沈黙を分けて記録しようとする。",
      question: "佐原への最後の質問を選びます。",
      choices: [
        { id: "ask", label: "『続ける以外の選択肢はあると思えましたか』", hint: "発言の背景にあった選択の自由を聞く。", clue: "voice", flag: "voice" },
        { id: "quote", label: "『この言葉を報告に引用してもよいですか』", hint: "本人が許す範囲を具体的に確かめる。", clue: "consent", flag: "consent" },
        { id: "sign", label: "『正しい報告書なら署名できますか』", hint: "正しさが誰かに及ぼす影響を思い知る。", clue: "refusal", flag: "worry" }
      ]
    },
    report: {
      label: "翌朝 / 最終記録", title: "真実を一文にすることの暴力",
      body: "報告書には空欄が一つ残る。「本人の意思で作業を続けた」。その言葉を残すのか、消すのか、それとも言葉では足りなかったことも書くのか。真実を確定するだけが、この部屋の仕事ではない。",
      question: "あなたが残すのは、どんな記録ですか？",
      choices: [
        { id: "context", label: "本人の発言と、選択を妨げた可能性を分けて記す", hint: "確かめた事実と未確認の事情を混同しない。", decision: "context" },
        { id: "protect", label: "名前を伏せて再聴取を申請し、結論を保留する", hint: "誰かが安全に話せる状況を優先する。", decision: "protect" },
        { id: "accuse", label: "班長の指示だったと断定して提出する", hint: "結論を急ぐ。だがその確証は、まだ手元にない。", decision: "accuse" }
      ]
    }
  });

  const ENDINGS = Object.freeze({
    layered: {
      title: "結末：二つとも、本当だった",
      text: "『続けると言った』という佐原の言葉を、そのまま残した。だが、選ぶ自由があったかは別の項目に書いた。翌週、真帆は自分の言葉で事情を補った。事故の責任は簡単には決まらない。誰も嘘をついていなかったとしても、誰も自由に話せなかったのかもしれない。"
    },
    incomplete: {
      title: "結末：書けなかった余白",
      text: "断定を避けて報告を出した。記録は前より正確だが、あなたが聞けなかったことは書けない。真帆の席には、何も書かれていないメモが残っていた。勇気の問題だったのか、話せる場所がなかったのか。それも、まだ分からない。"
    },
    late: {
      title: "結末：もう一枚の報告書",
      text: "一度受理された『本人の意思』という文を、今さら消すことはできない。あなたは補足の報告書を出した。だが古い報告書だけを読んだ人は、これからも現れるだろう。記録は二枚になった。真実は一つに戻らなかった。"
    },
    room: {
      title: "結末：鍵のかからない部屋",
      text: "あなたは結論を保留し、名前を伏せたまま個別に話せる時間を用意した。何も片付かないまま一日が終わる。それでも真帆が帰り際に言った。「明日なら、もう少し話せると思います」。職場に必要だったのは、犯人を見つける目だけではなかった。"
    },
    waiting: {
      title: "結末：待つことの代償",
      text: "人を守るために報告を保留した。しかし現場は変わらないまま、次の勤務表が貼られた。誰かが話せる日を待つだけでは、また同じ言葉が生まれるかもしれない。その予感だけが、あなたの手に残った。"
    },
    fracture: {
      title: "結末：一人の悪人が必要だった",
      text: "あなたは班長を名指しした。会議では全員が安堵した顔を見せたが、真帆は退職願を出した。告発が間違いだったとは証明できない。けれど、何も確かめないまま『あの人だけが悪かった』と言えるようになったことが、最後にいちばん怖かった。"
    }
  });

  function origin(firstNight) {
    return firstNight.history.map(x => x.choice).join("/") + "#" + firstNight.ending;
  }
  function fresh(firstNight) {
    if (!first.isValid(firstNight) || firstNight.scene !== "ending") throw new Error("第一夜の調査が完了していません");
    return { version: VERSION, origin: origin(firstNight), scene: "letter", flags: [], findings: [], history: [], ending: null };
  }
  function chooseEnding(decision, flags, firstNight) {
    if (decision === "accuse") return "fracture";
    if (decision === "protect") return flags.includes("privacy") && !flags.includes("exposed") ? "room" : "waiting";
    if (firstNight.ending === "closed") return "late";
    if (flags.includes("care") && (flags.includes("voice") || flags.includes("consent")) && !flags.includes("confront")) return "layered";
    return "incomplete";
  }
  function compute(firstNight, ids) {
    let state = fresh(firstNight);
    for (const id of ids) {
      if (state.scene === "epilogue") throw new Error("物語は終了しています");
      const scene = SCENES[state.scene];
      const choice = scene.choices.find(x => x.id === id);
      if (!choice) throw new Error("選べない行動です");
      state = {
        version: VERSION, origin: state.origin,
        scene: ORDER[ORDER.indexOf(state.scene) + 1],
        flags: choice.flag ? [...state.flags, choice.flag] : [...state.flags],
        findings: choice.clue ? [...state.findings, choice.clue] : [...state.findings],
        history: [...state.history, id],
        ending: choice.decision ? chooseEnding(choice.decision, state.flags, firstNight) : null
      };
    }
    return state;
  }
  function isValid(s, firstNight) {
    try {
      if (!s || typeof s !== "object" || Array.isArray(s) || !Number.isSafeInteger(s.version) || s.version !== VERSION ||
          !Array.isArray(s.history) || s.history.length > 4 || !Array.isArray(s.flags) || !Array.isArray(s.findings) ||
          !first.isValid(firstNight) || firstNight.scene !== "ending") return false;
      const actual = compute(firstNight, s.history);
      return JSON.stringify(actual) === JSON.stringify(s);
    } catch (_err) { return false; }
  }
  function advance(s, firstNight, id) {
    if (!isValid(s, firstNight)) throw new Error("不正なセーブデータです");
    const next = compute(firstNight, [...s.history, id]);
    if (!isValid(next, firstNight)) throw new Error("シナリオの進行に失敗しました");
    return next;
  }
  function view(s, firstNight) {
    if (!isValid(s, firstNight)) throw new Error("不正なセーブデータです");
    if (s.scene === "epilogue") {
      const trace = s.flags.includes("exposed")
        ? "あの封筒の内容を現場に広めたことは、もう取り消せない。"
        : s.flags.includes("care")
          ? "差出人を確かめられない封筒は、誰にも見せないまま記録に残した。"
          : "封筒に書いた人物と、その意図は最後まで確定しなかった。";
      const voice = s.flags.includes("consent")
        ? "佐原は引用の条件を示した。それが全情報の公開を認めたことにはならない。"
        : s.flags.includes("voice")
          ? "佐原が口にした事実は記録できた。ただし、本人の意思だけで全てを説明することはできなかった。"
          : "佐原の発言をどこまで他者に伝えてよいか、十分に確かめられなかった。";
      return { label: "翌朝 / 記録完了", title: ENDINGS[s.ending].title,
        body: ENDINGS[s.ending].text + "\n\nあなたの調査が残したもの。\n" + trace + "\n" + voice,
        question: "調査記録はここで閉じられる。", choices: [] };
    }
    const sc = SCENES[s.scene];
    let body = sc.body;
    if (s.scene === "letter" && firstNight.ending === "closed")
      body += " あなたが昨夜署名した報告書は、すでに本部へ送られている。";
    if (s.scene === "letter" && firstNight.ending === "correction")
      body += " あなたが差し戻した書類は、机の端に伏せられていた。";
    if (s.scene === "maho" && s.flags.includes("exposed"))
      body += " 封筒の内容が現場に広まったせいか、真帆はあなたの目を避けた。";
    if (s.scene === "maho" && s.flags.includes("care"))
      body += " 「昨夜の紙、まだ誰にも見せてないんですよね」と彼女が確かめた。";
    if (s.scene === "sahara" && s.flags.includes("privacy"))
      body += " 真帆からは「話した内容を出さないでくれてありがとう」とだけ伝言があった。";
    if (s.scene === "report" && firstNight.ending === "closed")
      body += " すでに提出済みの報告があることだけは、なかったことにはできない。";
    if (s.scene === "report" && s.flags.includes("exposed"))
      body += " 朝礼で封筒のことが話題になっている。言葉を戻すことはできない。";
    return { label: sc.label, title: sc.title, body, question: sc.question,
      choices: sc.choices.map(({id,label,hint}) => ({ id, label, hint })) };
  }
  function clueList(s, firstNight) {
    if (!isValid(s, firstNight)) throw new Error("不正なセーブデータです");
    return s.findings.map(id => ({ id, ...FINDINGS[id] }));
  }
  return Object.freeze({ VERSION, ORDER, fresh, isValid, advance, view, clueList, ENDINGS });
});
