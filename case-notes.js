/* v0.3: source-aware narrative emphasis. Pure and deterministic; does not alter saves. */
(function (root, factory) {
  const first = typeof module !== "undefined" && module.exports ? require("./story.js") : root.HandoverStory;
  const morning = typeof module !== "undefined" && module.exports ? require("./morning.js") : root.HandoverMorning;
  const api = factory(first, morning);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HandoverCaseNotes = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (first, morning) {
  "use strict";

  /* Only evidence actually discovered by the player may be used. */
  const VERIFIED = Object.freeze({
    wording: "報告書三通の文章が一致していた",
    stoppage: "申し送りの「停止の相談」が線で消されていた",
    renewals: "生産停止回数が評価に関係する掲示があった",
    confession: "真帆は停止の相談を耳にしたと語った",
    rote: "真帆は報告書の一文を繰り返したが出所を説明できなかった",
    distance: "真帆は班長の視線を気にしていた",
    draft: "荻野は報告文を自分が整えたと話した",
    quota: "荻野は納期への不安を口にした",
    silence: "荻野は反対がなかったことを根拠にした",
    envelope: "筆者不明の封筒が調査室の前に置かれた",
    unsealed: "封のされていない書き置きを現場に見せた",
    mark: "封筒の紙には書き直した跡があった",
    unhurried: "真帆は一人で話せる時間ならあると答えた",
    distance2: "真帆は誰かのシフトが減る不安を語った",
    interruption: "班長の名前を出すと真帆の言葉が止まった",
    voice: "佐原は自分で「続ける」と言ったと話した",
    consent: "佐原は同僚の匿名を条件に言葉の引用を認めた",
    refusal: "佐原は報告で誰かが職を失うことを恐れた"
  });
  const UNRESOLVED = Object.freeze({
    wording: "同じ文面は、口裏合わせだけでなく報告の書式統一でも起こり得る。",
    stoppage: "誰が、いつ、何のために文字を消したかは分からない。",
    renewals: "掲示があっただけでは、誰かが停止を命じたとは言えない。",
    confession: "真帆が知るのは一部の会話であり、その前後は確かめられていない。",
    rote: "言葉が同じでも、真帆の本心や事実の全てまでは分からない。",
    distance: "人目を気にする理由は恐れだけとは限らない。",
    draft: "文面を整えた行為と、証言を強制した行為は違う。",
    quota: "納期への不安が明確な強制命令になったかは分からない。",
    silence: "誰も反対しなかった理由は、それぞれ異なるかもしれない。",
    envelope: "筆者不明の紙を誰かの証言や意思だと決めつけられない。",
    unsealed: "誰が紙を読んだか、見せた後で誰に伝わったかは分からない。",
    mark: "文字を直した跡はためらいにも訂正にも見える。",
    unhurried: "話せることと、公にしてよいことは別だ。",
    distance2: "シフトを決める人物も実際の決定経緯も未確認だ。",
    interruption: "沈黙だけで班長の指示を立証できない。",
    voice: "本人が発言したことと、断れる状況にいたことは同じではない。",
    consent: "引用の許可は、氏名や事情を無条件で公開する許可ではない。",
    refusal: "署名できない事情と事故原因の確定は別である。"
  });
  const MORNING_ID = Object.freeze({distance: "distance2"});
  function valid(state) {
    return !!state && typeof state === "object" && !Array.isArray(state) &&
      first.isValid(state.night1) &&
      (state.morning === null || (state.night1.scene === "ending" && morning.isValid(state.morning, state.night1)));
  }
  function observed(state) {
    if (!valid(state)) throw new Error("調査記録の整合性が確認できません");
    const keys = [
      ...state.night1.clues,
      ...(state.morning ? state.morning.findings.map(id => MORNING_ID[id] || id) : [])
    ];
    return keys.map(id => Object.freeze({id, fact: VERIFIED[id], caveat: UNRESOLVED[id]}));
  }
  function emphasis(state) {
    if (!valid(state)) throw new Error("調査記録の整合性が確認できません");
    const n = state.night1, m = state.morning;
    if (!m) {
      if (n.scene === "supervisor" && n.clues.includes("stoppage"))
        return "消された『停止の相談』について、誰が記したのかはまだ不明だ。ここで班長に問う言葉が、その後の聞き取りを左右する。";
      if (n.scene === "supervisor" && n.clues.includes("wording"))
        return "三枚の報告書は、読点まで同じだった。誰が文面を整えたかを聞けば、意図を推測する材料になるかもしれない。";
      if (n.scene === "supervisor" && n.clues.includes("renewals"))
        return "生産停止が評価に関係する掲示を見た。班長の『禁止していない』という言葉だけでは、現場が選べたか分からない。";
      if (n.scene === "judgment" && n.clues.includes("draft"))
        return "班長が文面を整えたことは確認できた。ただし、それだけで強制的な口裏合わせだったとは断定できない。";
      if (n.scene === "judgment" && n.clues.includes("confession"))
        return "真帆が聞いた『止めたい』という言葉は、提出予定の報告書にはない。本人の発言との前後関係は、まだ分からない。";
      return "";
    }
    if (m.scene === "letter" && n.ending === "closed")
      return "昨日の受理を覆しても、すでに読まれた報告書の記憶は戻らない。";
    if (m.scene === "maho" && m.flags.includes("exposed"))
      return "あなたが封筒を見せたことで、真帆は『誰が書いたと思うか』ではなく『私が疑われているのか』を気にし始めた。";
    if (m.scene === "maho" && m.flags.includes("care") && n.clues.includes("stoppage"))
      return "消された申し送りの筆跡を、あなたは真帆に見せないことにした。彼女が何かを知っていても、尋問で引き出せるとは限らない。";
    if (m.scene === "sahara" && m.flags.includes("privacy") && n.clues.includes("rote"))
      return "昨日、真帆は同じ説明を繰り返していた。今日は『自分の言葉で話してもいい』という小さな約束だけが残った。";
    if (m.scene === "sahara" && m.flags.includes("context"))
      return "真帆の言う『他人のシフトを守る』という理由は、佐原本人の意思と食い違うのだろうか。それとも同時に成立するのだろうか。";
    if (m.scene === "report") {
      const records = observed(state);
      const facts = records.slice(-2).map(x => x.fact).join("。");
      const caveat = records.length ? records[records.length - 1].caveat : "";
      return "いま手元にある記録：" + facts + "。\nただし、" + caveat;
    }
    if (m.scene === "epilogue" && n.clues.includes("stoppage") && m.findings.includes("voice"))
      return "一つのノートには『停止の相談』、本人の言葉には『続けると言った』。その二つは、同じ瞬間の発言だったと決まったわけではない。";
    if (m.scene === "epilogue" && n.clues.includes("wording") && n.clues.includes("draft"))
      return "三枚の同じ文面。その作成を班長は認めた。それでも、その一致が何を隠すためだったのかは最後まで確定しなかった。";
    return "";
  }
  function forDisplay(state) {
    return observed(state).map(x => ({...x, title: "確認したこと", uncertainty: "まだ分からないこと"}));
  }
  return Object.freeze({observed, emphasis, forDisplay});
});
