/* 引継ぎ室 v0.8 — six authored thematic payoff arcs, evidence gated.
 * A run fixes ONE central question. Minor seeded incidents never establish
 * the major answer. Existing v0.7 and earlier modes retain their old rules.
 */
(function(root,factory){
  const former=typeof module!=="undefined"&&module.exports?require("./verified-arcs.js"):root.HandoverVerifiedArcs;
  const cases=typeof module!=="undefined"&&module.exports?require("./case-variants.js"):root.HandoverCases;
  const api=factory(former,cases);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverSixArcs=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(former,cases){
  "use strict";
  const VERSION=8;
  const NEW_ARCS=[
    {
      id:"permission-is-not-consent",
      title:"誰の言葉なら使っていいのか",
      focus:"records",
      entry:"wording",
      promise:"同じ文章に署名していたとしても、本人以外の言葉を自由に公開してよいのだろうか。",
      opening:"調査室には、署名欄のある報告書が積まれている。きれいな文章を読み上げる声が、誰のものだったのかはまだ分からない。",
      first:"三人の報告書は同じ文面だった。しかし、それぞれが何を他者へ伝えることを許したのかは書かれていない。",
      second:"真帆は班長に見られていることを意識していた。相手が見ている場所で、何も断らなかったことは自由な同意だろうか。",
      turn:"佐原は、同僚の名前を伏せることを条件に自分の言葉の引用を認めた。引用の許可は、他人の個人情報の公開許可ではなかった。",
      reveal:"【大きな回収：言葉には持ち主がいる】\n三人の報告書の一致は、それぞれが同じ内容の公開を許した証明ではなかった。真帆は班長の視線を気にしていた。佐原は『自分の言葉なら引用してよい、ただし同僚の名前は伏せてほしい』という条件を示した。報告内容の正確さとは別に、誰の言葉を、誰のために、どこまで共有できるかが問題だった。誰かが明確に同意を強要したかまでは、まだ立証されていない。",
      unresolved:"同じ報告文の正確さと、証言者がどこまで公開に同意したかを分けて確認できなかった。",
      support:{stage:"night",clue:"distance",scene:"coworker",choice:"space"},
      counter:{stage:"morning",clue:"consent",scene:"sahara",choice:"quote"},
      after:{
        accuse:"同意の条件を確認しないまま責任者を名指ししたため、関係者は次の聞き取りで口を閉ざした。",
        protect:"名前を伏せて追加の聞き取りを行うことになった。ただし公開範囲の確認は別途必要になった。",
        context:"引用の範囲と未確認事項を区別した報告が残った。発言した本人が全情報の公開を許したわけではない。"
      }
    },
    {
      id:"the-unspoken-objection",
      title:"異議のない会議",
      focus:"agency",
      entry:"stoppage",
      promise:"『誰も反対しなかった』という言葉は、反対できる場所があったことを示すのか。",
      opening:"休憩室には使われていない椅子がある。誰も意見を言わなかった時間と、何も考えなかった時間は同じなのだろうか。",
      first:"申し送りには『停止の相談』が書かれ、あとで線が引かれていた。誰が削除したのかは不明だ。",
      second:"荻野は『誰も異論を言わなかった』と繰り返した。反対が出なかったことを、本人たちの同意と結び付けようとしていた。",
      turn:"真帆は一人で話せる時間ならあると答えた。公の場で発言しなかった人にも、別の場所なら話せることがある。",
      reveal:"【大きな回収：誰も反対していなかった、の意味】\n荻野の言葉は『その場で反対が出なかった』という範囲では正しい。一方、手書きの申し送りには停止の相談があった。真帆も個別なら話せると言った。反対意見が記録されていないことと、疑問や不安が存在しなかったことは別だ。誰が申し送りを消したか、本人の明確な異議だったかはなお未確認。それでも会議の沈黙を全員の合意と扱うことはできない。",
      unresolved:"停止の相談と、会議で表明されなかった意見との関係を確かめられなかった。",
      support:{stage:"night",clue:"silence",scene:"supervisor",choice:"agreement"},
      counter:{stage:"morning",clue:"unhurried",scene:"maho",choice:"private"},
      after:{
        accuse:"班長だけの責任と断定したことで、会議で意見を残す方法そのものは変わらなかった。",
        protect:"一人で話す時間を確保したが、会議での沈黙をどう記録するかという問題は残った。",
        context:"会議の無言と、個別の相談を分けて記した。発言できなかった理由の調査は続いた。"
      }
    },
    {
      id:"protection-that-erases",
      title:"守るために消した言葉",
      focus:"pressure",
      entry:"renewals",
      promise:"誰かを守ろうとした二人の行動が、なぜ本人の不安まで消してしまったのか。",
      opening:"勤務を終える人々が、次の月の予定を口にするときだけ小声になる。何を恐れているのかはまだ分からない。",
      first:"生産停止が評価に関係する掲示がある。雇用への影響はまだ確かめられていない。",
      second:"真帆は『止めたいと言っていた』と耳にした話を認めつつ、『私が聞いたことにすると、あの人が困る』と口にした。守るために言葉を伏せようとしている。",
      turn:"佐原は『正しい文章が誰かをクビにするなら書きたくない』と話した。自分の言葉よりも、別の人への影響を恐れていた。",
      reveal:"【大きな回収：守った先で失われた声】\n真帆は、誰かが困ることを恐れて『止めたい』という言葉の証言をためらった。佐原も正しい報告によって誰かが職を失うことを恐れ、署名をためらった。二人は同じ人物を守ろうとしていたとは限らない。それでも相手を守るために言わなかったことが、結果として事故の記録を『本人の判断だけ』に近づけた。善意が沈黙を生んだ可能性はある。実際に誰が解雇されるはずだったかは分からない。",
      unresolved:"誰かを守るために証言を控えた事情と、実際の雇用上の危険との関係を確認できなかった。",
      support:{stage:"night",clue:"confession",scene:"coworker",choice:"private"},
      counter:{stage:"morning",clue:"refusal",scene:"sahara",choice:"sign"},
      after:{
        accuse:"誰かを処分するという報告が出ると、互いを守ろうとしていた二人はさらに口を閉ざした。",
        protect:"追加の聞き取りは行われたが、誰かを守るために事実を隠すことの代償は残った。",
        context:"誰を守りたかったかと、実際に確認できた発言を分けて記した。善意を事実認定の代わりにはしなかった。"
      }
    }
  ];
  const ARCS=Object.freeze([...former.ARCS,...NEW_ARCS].map(x=>Object.freeze(x)));
  const NEW_IDS=Object.freeze(new Set(NEW_ARCS.map(x=>x.id)));
  function arcIndex(seed){
    if(!Number.isInteger(seed)||seed<0||seed>=cases.COUNT)throw Error("事件番号の範囲外");
    const author=seed%4,motive=Math.floor(seed/4)%3,
      incident=Math.floor(seed/12)%3, ambience=Math.floor(seed/36)%2;
    return (author+incident+2*motive+3*ambience)%6;
  }
  const buckets=Array.from({length:6},()=>[]);
  for(let seed=0;seed<cases.COUNT;seed++)buckets[arcIndex(seed)].push(seed);
  if(buckets.some(b=>b.length!==12))throw Error("6事件の割当が不均等です");
  const ORDER=Object.freeze(Array.from({length:12},(_,i)=>buckets.map(b=>b[(i*5)%12])).flat());
  function active(s){
    if(s && s.arcMode==="expanded" && cases.valid(s.case) && s.case.mode==="procedural")
      return ARCS[arcIndex(s.case.seed)];
    return former.active(s);
  }
  function status(s){
    if(s.arcMode!=="expanded")return former.status(s);
    const a=active(s);if(!a)return null;
    const source=s.night1.clues.includes(a.entry);
    let support=false,counter=false;
    if(NEW_IDS.has(a.id)){
      support=source&&s.night1.clues.includes(a.support.clue);
      counter=source&&!!s.morning&&s.morning.findings.includes(a.counter.clue);
    }else{
      support=source&&!!a.support(s);
      counter=source&&!!a.counter(s);
    }
    return {id:a.id,source,support,counter,mid:source&&(support||counter),
      full:source&&support&&counter,tally:Number(source)+Number(support)+Number(counter)};
  }
  function verified(s){
    if(s.arcMode!=="expanded")return former.verified(s);
    const a=active(s),st=status(s),d=s.deduction;
    if(!a||!st||!st.full||!d||d.stage!=="complete"||d.focus!==a.focus||
      d.reading==="dismiss"||typeof d.pair!=="string")return false;
    const ids=d.pair.split("|");
    return ids.length===2&&new Set(ids).size===2&&
      ids.includes("arc-support")&&ids.includes("arc-counter");
  }
  function observed(s){
    if(s.arcMode!=="expanded")return former.observed(s);
    const a=active(s),st=status(s);
    if(!a||!st.source)return [];
    const out=[{id:"arc-primary",title:"発端の記録",fact:a.first,detail:a.first,
      caveat:"この記録だけでは、行動の動機や責任は確定できない。"}];
    if(st.support)out.push({id:"arc-support",title:"支える証言",fact:a.second,detail:a.second,
      caveat:"本人がそう話したことと、原因が証明できたことは別だ。"});
    if(st.counter)out.push({id:"arc-counter",title:"解釈を変える証言",fact:a.turn,detail:a.turn,
      caveat:"証言による確認と、人物の本心の推測は分ける。"});
    return out;
  }
  function sceneText(s){
    if(s.arcMode!=="expanded")return former.sceneText(s);
    const a=active(s),st=status(s);
    if(!a)return "";
    const n=s.night1,m=s.morning;
    if(!m){
      if(n.scene==="opening")return a.opening;
      if(n.scene==="coworker"&&st.source)return "【残る違和感】 "+a.first;
      if(n.scene==="judgment"&&st.source)return "【一つ目の問い】 "+a.promise+
        (st.support?"\n【別の証言】 "+a.second:"");
      return "";
    }
    if(m.scene==="letter"&&st.source)return "新しい書き置きが届いた。だがこの紙だけで以前の疑問への答えは出ない。";
    if(m.scene==="maho"&&st.support)return "【まだ説明されないこと】 "+a.second;
    if(m.scene==="sahara"&&st.counter)return "【見方を変える言葉】 "+a.turn;
    const finale=NEW_IDS.has(a.id) ? {title:"【大きな回収："+a.title+"】",content:a.reveal,unresolved:a.unresolved} :
      former.VERIFIED_ENDINGS[a.id];
    if(m.scene==="report"){
      if(st.full)return "【異なる立場からの情報が揃った】 同じ問題について、二つの説明を照合してから結論を書こう。";
      if(st.mid)return "【まだ欠けている証言】 "+finale.unresolved;
      return st.source?"【未解決の記録】 "+finale.unresolved:"";
    }
    if(m.scene==="epilogue"){
      if(!verified(s))return st.full?
        "【回収されなかった真相】 情報は集まったが、中心の問いについて必要な証拠の比較を残せなかった。":
        "【足りなかった証拠】 "+finale.unresolved;
      const report=m.history[3];
      const outcome=NEW_IDS.has(a.id)?
        (a.after[report]||a.after.context):
        (report==="accuse"?"班長に責任を集中させたため、現場の仕組みはそのまま残った。":
          report==="protect"?"匿名で追加の聞き取りを行ったが、改善には時間がかかった。":
            "確かめた発言と推測を分けて報告した。");
      const note=s.deduction.reading==="assert"?
        "ただし、責任者を断定した部分は得られた証拠の範囲を超えていた。":
        "証明できない事項を事実とは断定しなかった。";
      return finale.title+"\n"+finale.content+"\n【あなたの報告後】\n"+outcome+"\n"+note;
    }
    return "";
  }
  function nextSeed(seed){
    if(!Number.isInteger(seed)||seed<0||seed>=cases.COUNT)throw Error("無効な事件番号");
    return ORDER[(ORDER.indexOf(seed)+1)%ORDER.length];
  }
  return Object.freeze({VERSION,ARCS,NEW_IDS,arcIndex,active,status,verified,observed,sceneText,nextSeed});
});
