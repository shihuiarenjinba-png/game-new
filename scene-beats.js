/* v0.9 — authored character reactions and earned callbacks in existing scenes.
 * Absolutely no procedurally fabricated "confession" or unexamined document.
 * All output is derived from the current scene and prior recorded choices.
 */
(function(root,factory){
  const arcs=typeof module!=="undefined"&&module.exports?require("./immersive-arcs.js"):root.HandoverImmersiveArcs;
  const cases=typeof module!=="undefined"&&module.exports?require("./case-variants.js"):root.HandoverCases;
  const api=factory(arcs,cases);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverSceneBeats=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(arcs,cases){
  "use strict";
  const PACKS=Object.freeze({
    prefilled:{
      opening:"誰かが『報告書の通りです』と言う前に、別の誰かが紙を一枚めくる音がした。",
      coworker:"真帆は報告書を見てから少し視線を逸らした。文章の意味を考えているのか、誰かを気にしているのかは分からない。",
      supervisor:"荻野は机上の書類を一度揃えた。話す前に整える癖なのか、話を整えたいのかは分からない。",
      judgment:"一文が揃っているのに、その一文を最初に発した人の名前が残らない。",
      maho:"真帆は報告書のことになると、返事を一度言い直した。言い直した理由まで推測してはいけない。",
      sahara:"佐原は紙に残された言葉より、誰がその紙を持つのかを気にしていた。まだ本人の意思を代弁することはできない。",
      callback:"最初に揃って聞こえた一文は、同じ経験を持つ三人の言葉とは限らなかった。あの紙をめくる音が、違う意味で蘇る。",
      missed:"報告書の一文は今夜も揃ったままだ。誰が先に言葉を用意したのかを確かめる道は、まだ残っている。"
    },
    "two-moments":{
      opening:"休憩室の時計は一分遅れていた。時刻の記録は、誰が書くかによって違って見える。",
      coworker:"『いつの話ですか』と真帆が問い返す。その質問に答えられる記録を、まだ持っていないかもしれない。",
      supervisor:"荻野は話の終わりだけを短く説明しようとした。相談の前後については、まだ聞いていない。",
      judgment:"一度の発言だけを切り取れば、途中で迷ったことさえ無かったことになる。",
      maho:"真帆は昨日の表情を思い出そうとしたようだが、いつのことかを即座には答えなかった。",
      sahara:"佐原が何を選んだかだけでなく、その前に選べると知っていたものが気にかかる。",
      callback:"『最後には』という班長の言葉が、最初の停止相談を否定する証拠ではなくなった。二つの声を同じ時刻に押し込める必要はない。",
      missed:"時計の針は進んだが、二つの発言を結び付ける記録はまだない。順序を決めつけることはできない。"
    },
    "silent-rule":{
      opening:"掲示物の端が風でめくれた。文字のない部分まで、誰かが読んでいるように見えた。",
      coworker:"真帆は質問に答える前、通路の向こうを確かめた。何を気にしたのかを、こちらで決めつけてはいけない。",
      supervisor:"『そんな命令はない』。荻野は短く答えた。あなたは、その言葉を否定できる証拠をまだ持っていない。",
      judgment:"禁止と書かれたものがないことだけで、選べる状況だったと記録してよいのか。",
      maho:"真帆は掲示のほうを見ようとせず、あなたが質問を続けるか確かめるように黙った。",
      sahara:"佐原は止める権利を知っていたかもしれない。それでも、実際に止められると思えたかは別だ。",
      callback:"『そんな命令はない』という答えは、初めから嘘だったとは限らない。怖かったのは、書かれない決まりが共有されていた可能性だった。",
      missed:"壁の掲示は残った。誰がどの規則を信じていたのかを調べなければ、沈黙の理由は一つに定まらない。"
    },
    "permission-is-not-consent":{
      opening:"名前を付けずに書かれた報告文は、誰の許可で誰の手へ渡るのだろう。",
      coworker:"真帆は『話したら、その言葉をどこまで使うんですか』と聞いた。あなたは、まだ何も約束していない。",
      supervisor:"荻野は『記録に必要だから』と言った。必要性は、言葉を公表する許可と同じなのだろうか。",
      judgment:"正確な引用でも、誰かに渡すことで別の人を傷つけることがある。",
      maho:"真帆は周囲の足音に合わせて話を止めた。何を許したことにされるかを恐れているのかもしれない。",
      sahara:"佐原は『書くなら、誰が読むか教えてください』と尋ねた。答える前に、引用の範囲を確かめるべきだ。",
      callback:"最初の『誰の許可で』という疑問は、同じ報告文があるだけでは答えられないと分かった。言葉の正しさと持ち主の意思は別だった。",
      missed:"どの言葉を誰に渡せるかは未確認のままだ。発言しなかった人の同意を推測で補うことはできない。"
    },
    "the-unspoken-objection":{
      opening:"『異論なし』という言葉が部屋に残るとき、反対を口にしかけた人がいたかどうかは分からない。",
      coworker:"真帆は『何も言わなかった人のことまで、分かりますか』と問い返した。",
      supervisor:"荻野は『反対するならその場で言えばよかった』と述べた。言える機会が実際にあったのかは、別に調べる必要がある。",
      judgment:"反対がなかったという記録は、反対できなかった人がいなかったことを証明しない。",
      maho:"真帆は周りの人がいないことを確かめてから、小さく息を吐いた。何かを話すかは、まだ彼女が決めることだ。",
      sahara:"佐原の沈黙を、誰の賛成として扱うこともできない。本人から聞いていないことは空白のまま残す。",
      callback:"『異論なし』は、誰も何も考えなかったという意味ではなかった。空白の欄からは、賛成の意思を読み取れない。",
      missed:"反対の有無と、反対できたかどうかを調べる問いは残った。空白を勝手に埋めるべきではない。"
    },
    "protection-that-erases":{
      opening:"誰かを守るために言わないことがある。その相手が、本当に守られるかどうかは分からない。",
      coworker:"真帆は『本当のことを言う人が、いつも正しい結果を受け取るとは限りません』と言いかけて止まった。",
      supervisor:"荻野は『誰も損をしない報告書は作れません』と答えた。だからと言って、誰かの言葉を消してよいとは限らない。",
      judgment:"誰かを守ろうとする沈黙が、別の人の言葉を奪うことがある。",
      maho:"真帆は言葉を選び続けた。誰を気にしているのかは、本人に聞かなければならない。",
      sahara:"佐原は『誰の生活も壊してほしくない』と述べた。実際に誰が不利益を受けるかを知っているとは限らない。",
      callback:"二人が守ろうとした人は同じとは限らない。それでも、沈黙が本人の選択だけを残した。最初の『守るため』は簡単な美談ではなかった。",
      missed:"誰かを守るための沈黙が何を消したのか、記録には残らなかった。善意だけで出来事を説明できない。"
    }
  });
  const reaction=Object.freeze({
    gentle:"あなたは相手の言葉を遮らずに聞いた。答えが増えたかどうかは、まだ分からない。",
    neutral:"言葉を記録することを優先した。相手が慎重になった理由は決めつけられない。",
    confront:"質問を突き付けると、相手は答える前に一度息を飲んだ。強い問いが、いつも本音を引き出すとは限らない。",
    share:"封筒の内容が現場にも伝わっている。誰が読んだかまで確かめられたわけではない。",
    preserve:"あなたは封筒を公開しなかった。筆者を決める材料が、すぐ増えるとは限らない。",
    examine:"文字の書き直しだけを記録した。その痕跡に、筆者の理由を付け足してはいけない。",
    private:"真帆が話すかどうかを自分で決められるよう、あなたは沈黙を急かさなかった。",
    why:"真帆に質問の意図が伝わったかどうかを、あなたは確かめながら聞き取った。",
    name:"班長の名前を出すと、真帆は一歩引いた。名前を避けた理由はまだ分からない。"
  });
  function isNew(s){return !!s&&s.arcMode==="immersive"&&cases.valid(s.case);}
  function relevant(s,a){
    return !!a && s.night1.clues.includes(a.entry);
  }
  function line(s){
    if(!isNew(s))return "";
    const arc=arcs.active(s),p=arc&&PACKS[arc.id],n=s.night1,m=s.morning;
    if(!p)return "";
    if(!m){
      if(n.scene==="opening")return p.opening;
      if(n.scene==="coworker"){
        const firstChoice=n.history[0]?.choice;
        const tone=firstChoice==="confront"?reaction.confront:
          firstChoice==="listen"?reaction.gentle:reaction.neutral;
        return (relevant(s,arc)?p.coworker:"持ち出した記録について、まだ誰の解釈も確かめられていない。")+"\n"+tone;
      }
      if(n.scene==="supervisor"){
        const last=n.history[2]?.choice;
        return (relevant(s,arc)?p.supervisor:"記録を一つ見たからといって、出来事の理由まで分かるわけではない。")+
          (last==="repeat"?"\n『その一文は、誰から聞いたんですか』と尋ねたことを思い出した。":"");
      }
      if(n.scene==="judgment")return relevant(s,arc)?p.judgment:"今ある言葉だけで、誰か一人の責任は決められない。";
      if(n.scene==="ending")return relevant(s,arc)?"ひとつの疑問が残ったまま、あなたの初夜の判断は記録された。":"調べなかったものにも答えがあったかもしれない。けれど今は知らない。";
      return "";
    }
    if(m.scene==="letter")return "手書きの紙は、誰かの本音かもしれない。だが筆跡に気づく前から、誰が書いたかは決められない。";
    if(m.scene==="maho"){
      const policy=m.history[0];
      const act=policy==="share"?reaction.share:policy==="examine"?reaction.examine:reaction.preserve;
      return (relevant(s,arc)?p.maho:"真帆は、あなたがどんな言葉を期待しているのかを気にしていた。")+"\n"+act;
    }
    if(m.scene==="sahara"){
      const previous=m.history[1];
      const act=previous==="why"?reaction.why:previous==="private"?reaction.private:reaction.name;
      return (relevant(s,arc)?p.sahara:"佐原が何を知っていたかは、本人の言葉から確かめなければならない。")+"\n"+act;
    }
    if(m.scene==="report"){
      const st=arcs.status(s);
      if(st?.full)return "三つの手掛かりの意味は、並べただけでは決まらない。どの証言がどの主張を支えるか、あなたが選ばなくてはならない。";
      if(st?.mid)return "一方の言葉は得られた。もう一方を聞かなかったことも、この報告に残る。";
      return "空白を無理に埋めれば、確かめていないことまで事実になる。";
    }
    if(m.scene==="epilogue")return arcs.verified(s)?p.callback:p.missed;
    return "";
  }
  function safeCaseText(s){
    if(!isNew(s))return cases.sceneText(s.case,s);
    const p=cases.profile(s.case),n=s.night1,m=s.morning;
    if(!p)return "";
    if(!m){
      if(n.scene==="opening")return p.ambience.opening;
      if(n.scene==="coworker")return p.incident.hook;
      if(n.scene==="supervisor"&&n.clues.includes(p.author.trigger))return p.author.lead;
      return ""; // No unobserved private motive slips into night judgment.
    }
    if(m.scene==="letter")return p.ambience.morning;
    if(m.scene==="maho"&&m.history[0]==="examine")return p.author.letter;
    if(m.scene==="sahara"&&m.history[1]==="why")return p.incident.answer;
    if(m.scene==="epilogue")return "【残るもう一つの謎】 匿名の封筒は誰が書いたのか。本人に筆者だと確認する聞き取りまでは実施していない。";
    return ""; // Never synthesize testimony, confession, motive or original documents.
  }
  function safeCaseNotes(s){
    if(!isNew(s))return cases.observed(s.case,s);
    return cases.observed(s.case,s).filter(clue=>
      clue.id==="case-record" ||
      (clue.id==="case-letter"&&!!s.morning&&s.morning.history[0]==="examine") ||
      (clue.id==="case-side"&&!!s.morning&&s.morning.history[1]==="why"));
  }
  return Object.freeze({PACKS,isNew,line,safeCaseText,safeCaseNotes});
});
