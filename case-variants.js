/* 引継ぎ室 v0.5: 編集済みの因果関係を保つ、72組の再現可能な事件。
 * 「ランダムに文章を並べる」ことはしない。封筒の筆者・理由・副次的出来事
 * を開始時に固定し、実際に調べた証拠に応じてのみ伏線と回収を表示する。
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverCases=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const VERSION=1, COUNT=72;
  const AUTHORS=Object.freeze([
    {
      id:"ogino",name:"荻野",trigger:"wording",
      lead:"三人の報告書の欄外には、荻野が普段使う小さな三角の訂正記号があった。これは筆者の証明ではない。",
      letter:"差出人のない紙にも同じ三角の訂正記号が見える。筆跡だけで書いた本人を決めてはいけない。",
      witness:"真帆は、荻野が茶封筒を調査室の前に置くところを見たと説明した。置いた人と書いた人が同じかは確認が要る。",
      reveal:"荻野は、封筒も自分が書いたと認めた。報告書の文面を整えたことも本人が説明した。ただし、彼が負傷の直接原因を作ったとはまだ言えない。",
      route:{letter:"examine",maho:"why"},
      motives:[
        {id:"schedule",clue:"誰にも追加勤務を押し付けたくない、と彼は漏らしていた。",why:"欠勤した佐原の仕事が、契約更新を待つ同僚に回ることを恐れていた。"},
        {id:"contract",clue:"次の発注が失われれば現場ごと消える、と彼は考えていた。",why:"事故調査が広がれば、発注元が契約を切ると恐れていた。"},
        {id:"career",clue:"彼の机には異動願いが裏返して置かれていた。",why:"過去にも報告の不備を注意され、今度こそ職を失うと思っていた。"}
      ]
    },
    {
      id:"maho",name:"真帆",trigger:"stoppage",
      lead:"消された『停止の相談』の脇に、真帆が日々の申し送りに使う小さな丸印が残る。本人が消したとは限らない。",
      letter:"書き置きの句点が二重になっている。真帆のメモでも同じ癖を見たが、それだけでは特定できない。",
      witness:"真帆は、匿名の書き置きを自分で調査室の前に置いたと話した。内容を書いたのも自分だと認めた。",
      reveal:"真帆は『私が書きました』と打ち明けた。彼女は佐原の声を無かったことにしたかったのではなく、別の誰かの生活が壊れることを恐れていた。",
      route:{letter:"examine",maho:"private"},
      motives:[
        {id:"colleague",clue:"真帆は、替わりに夜勤へ入った人の家族写真を気にしていた。",why:"事故後の責任追及で、子どもを養う同僚が職を失うことを恐れていた。"},
        {id:"sahara",clue:"真帆は佐原からの短い『大丈夫』という返信を消せずにいた。",why:"佐原自身が問い詰められるのを恐れ、本人の言葉を盾にしてしまった。"},
        {id:"self",clue:"真帆は、自分の聞き違いかもしれない、と何度も言っていた。",why:"自分だけが停止の相談を聞いたことになれば、自分の責任を問われると恐れていた。"}
      ]
    },
    {
      id:"sahara",name:"佐原",trigger:"renewals",
      lead:"契約更新の掲示の裏には、佐原自身が提出した勤務希望の写しが残っていた。『来月も働きたい』とだけある。",
      letter:"書き置きの文字には、佐原の勤務希望書と似た字形がある。写真や筆跡の一致は、まだ決め手ではない。",
      witness:"佐原は連絡の最後に、守衛に書き置きを預けたと明かした。守衛は今朝、封筒を運んだと記録している。",
      reveal:"佐原が封筒の筆者だった。『自分が続けると言ったのは本当です』と語りながらも、その決断が自由だったかは別だと話した。",
      route:{letter:"examine",sahara:"ask"},
      motives:[
        {id:"protection",clue:"佐原は同僚の契約更新日を、自分の日程帳にも書いていた。",why:"自分の訴えが、代わりに働いた同僚の更新に影響すると考えた。"},
        {id:"guilt",clue:"佐原は休職後も『迷惑をかけてすみません』と謝り続けていた。",why:"誰も自分に命令していないと思う一方で、仕事を止められなかった自分を責めていた。"},
        {id:"family",clue:"佐原は翌月の家賃支払日を勤務希望書に書き込んでいた。",why:"働き続ける以外の選択肢を考えると生活が成り立たず、強い言葉で自分の決断を守ろうとした。"}
      ]
    },
    {
      id:"kawashima",name:"川島",trigger:"wording",
      lead:"報告書三通の印字欄には、事務担当・川島が普段使う青い『受領』の印があった。文章を書いた人を示す印ではない。",
      letter:"差出人のない紙の裏には、事務室でだけ使う青い受領印が薄く転写されていた。",
      witness:"真帆は川島が書き置きを調査室へ運んだところを見た。川島は後から、書いたのも自分だと認めた。",
      reveal:"書き置きは事務担当の川島が作った。荻野が事故報告書の文面を整えたという話とは両立する。二人が口裏を合わせたかどうかは、それでも未確認だった。",
      route:{letter:"examine",maho:"why"},
      motives:[
        {id:"template",clue:"事務室には『説明文を統一』と書かれた古い業務手順が残る。",why:"処理を遅らせないため、証言を同じ文面にまとめることが公平だと誤解していた。"},
        {id:"quota",clue:"月末締めの処理表だけ、赤い印で何度も確認されていた。",why:"事故の扱いが未確定だと月末の支払い処理が止まることを恐れた。"},
        {id:"protect",clue:"川島は提出書類に真帆の名前が載るのを何度も避けた。",why:"真帆に責任を押し付ける問い合わせが来るのを避けようとした。"}
      ]
    }
  ]);
  const INCIDENTS=Object.freeze([
    {id:"roster",hook:"作業予定表に、一度書かれた名前が別の名前で上書きされていた。",
     answer:"上書きしたのは交代勤務を探した同僚だった。事故を隠すためと断定はできないが、『代わりに誰が働くか』の不安が確かに残った。",
     caution:"勤務表の変更を不正行為だとはまだ言えない。"},
    {id:"cup",hook:"休憩室の棚に、持ち主の名前が消えかけたマグカップが一つ残されていた。",
     answer:"真帆は、佐原が出勤した日にいつも同じ席にいたと語った。空いた席を誰も片付けられなかった。証言ではなく、誰も口にしない不在の証拠だった。",
     caution:"持ち物だけでは、事故が起きた理由を証明できない。"},
    {id:"handover",hook:"引継ぎノートの一頁だけ、誰かが破らずに折り込んでいた。",
     answer:"折り込んだのは新人の同僚だった。『相談していたこと』を目立たせたかったが、名前を出す勇気はなかったと言う。",
     caution:"折られた紙の意図は、本人に確認するまで推測だった。"}
  ]);
  const AMBIENCE=Object.freeze([
    {id:"rain",opening:"外では雨が降っている。濡れた上着の匂いが、誰もいない事務室まで届く。",
     morning:"雨は止んだが、傘立てには持ち主の分からない傘が一本残った。"},
    {id:"hum",opening:"休憩時間になっても換気扇が回り続ける。扉の向こうで誰かが音を小さくしようとしている。",
     morning:"換気扇の音が止まると、昨日よりも職場が静かに感じられた。"}
  ]);

  function profile(c){
    if(!valid(c) || c.mode!=="procedural")return null;
    const seed=c.seed;
    const author=AUTHORS[seed%4], motive=author.motives[Math.floor(seed/4)%3],
      incident=INCIDENTS[Math.floor(seed/12)%3], ambience=AMBIENCE[Math.floor(seed/36)%2];
    return {author,motive,incident,ambience};
  }
  function valid(c){
    return !!c && typeof c==="object"&&!Array.isArray(c)&&
      Object.keys(c).sort().join(",")==="mode,seed,version" &&
      c.version===VERSION && ((c.mode==="legacy"&&c.seed===null)||
      (c.mode==="procedural"&&Number.isInteger(c.seed)&&c.seed>=0&&c.seed<COUNT));
  }
  function create(seed){const c={version:VERSION,mode:"procedural",seed};if(!valid(c))throw Error("事件番号が不正です");return c;}
  function legacy(){return {version:VERSION,mode:"legacy",seed:null};}
  function nextSeed(seed){if(!Number.isInteger(seed)||seed<0||seed>=COUNT)throw Error("番号が不正です");return (seed+1)%COUNT;}
  function has(history,scene,choice){
    // Morning chapter stores a compact ordered array of choice IDs.
    const i=["letter","maho","sahara","report"].indexOf(scene);
    return i>=0 && Array.isArray(history) && history[i]===choice;
  }
  function isRevealed(c,state){
    const p=profile(c);if(!p||!state.morning)return false;
    const n=state.night1, m=state.morning;
    if(m.history.length<3 || !n.clues.includes(p.author.trigger))return false;
    if(!has(m.history,"letter",p.author.route.letter))return false;
    const requirement=p.author.route;
    return (!requirement.maho||has(m.history,"maho",requirement.maho)) &&
      (!requirement.sahara||has(m.history,"sahara",requirement.sahara));
  }
  function observed(c,state){
    const p=profile(c);if(!p)return [];
    const n=state.night1,m=state.morning, result=[];
    if(n.clues.includes(p.author.trigger)){
      result.push({id:"case-record",fact:"前夜の記録に、報告と関係しそうな小さな手掛かりがあった",
        caveat:""+p.author.lead,title:"前夜の小さな痕跡",detail:p.author.lead});
    }
    if(m && m.history.length>=1){
      result.push({id:"case-letter",fact:"差出人不明の書き置きに、紙や文字の特徴があった",
        caveat:p.author.letter,title:"匿名の書き置き",detail:p.author.letter});
    }
    if(m && m.history.length>=2 && has(m.history,"maho","why")){
      result.push({id:"case-side",fact:"現場の小さな出来事について、真帆から別の説明を聞いた",
        caveat:p.incident.caution,title:"誰も説明しなかったこと",
        detail:p.incident.answer+"\n"+p.incident.caution});
    }
    if(isRevealed(c,state)){
      result.push({id:"case-witness",fact:p.author.name+"の手紙との関係が証言で裏付けられた",
        caveat:"誰が書いたか分かっても、負傷の原因や共謀は証明されたとは限らない。",
        title:"匿名の書き置きの筆者",detail:p.author.witness+"\n"+p.author.reveal});
    }
    return result;
  }
  function sceneText(c,state){
    const p=profile(c);if(!p)return "";
    const n=state.night1,m=state.morning;
    if(!m){
      if(n.scene==="opening")return p.ambience.opening;
      if(n.scene==="coworker")return p.incident.hook;
      if(n.scene==="supervisor"){
        return n.clues.includes(p.author.trigger)?p.author.lead+"\n"+p.motive.clue:"工場の外には、誰かが片付け忘れた書類がある。何が重要なのか、まだ分からない。";
      }
      if(n.scene==="judgment")return p.motive.clue;
      return "";
    }
    if(m.scene==="letter")return p.ambience.morning;
    if(m.scene==="maho"){
      if(!m.history.length)return "";
      return has(m.history,"letter","examine")?p.author.letter:
        "紙には気になる特徴があった。しかし今ある記録だけで筆者を決めることはできない。";
    }
    if(m.scene==="sahara"){
      if(has(m.history,"maho","why"))return p.incident.answer;
      return "休憩室で見た小さな出来事の意味は、まだ誰にも尋ねられていない。";
    }
    if(m.scene==="report"){
      return isRevealed(c,state)?
        "【回収された伏線】 "+p.author.witness+" "+p.author.reveal+"\n動機を確かめると、"+p.motive.why:
        "匿名の書き置きが誰のものか、確かな証言は得られていない。記録に残るのはまだ手掛かりだけだ。";
    }
    if(m.scene==="epilogue"){
      if(isRevealed(c,state))return "【今回の事件で確かめられたこと】\n"+p.author.reveal+
        "\n【その人が隠したかったこと】\n"+p.motive.why+"\n【別の小さな出来事】\n"+p.incident.answer;
      return "【今回の事件で残った問い】\n封筒の筆者は特定できなかった。ただ、"+p.motive.clue+
        "\n"+p.incident.caution+" 周回を変えて、別の記録から探れるかもしれない。";
    }
    return "";
  }
  return Object.freeze({VERSION,COUNT,AUTHORS,INCIDENTS,AMBIENCE,create,legacy,valid,profile,nextSeed,isRevealed,observed,sceneText});
});
