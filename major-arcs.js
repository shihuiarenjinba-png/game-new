/* 引継ぎ室 v0.6 — 72小変種の上に置く「3つの大型伏線回収ルート」。
 * プレイヤーが調べた記録→中間の解釈→反証→大きな回収、の因果のみを扱う。
 * 以前のセーブには後付けしない。章を増やさず既存場面の言葉を深める。
 */
(function(root,factory){
  const cases=typeof module!=="undefined"&&module.exports?require("./case-variants.js"):root.HandoverCases;
  const api=factory(cases);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverGrandArcs=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(cases){
  "use strict";
  const VERSION=1;
  const ARCS=Object.freeze([
    Object.freeze({
      id:"prefilled",title:"聞く前に書かれた答え",focus:"records",entry:"wording",
      promise:"誰も口裏合わせをしていないのに、全員が同じ文章を語ったのはなぜか。",
      opening:"書類をめくると、ひとつだけ折り目の位置が揃っている。印刷された紙なら偶然だろうか。",
      first:"文章の一致に目が留まる。聞き取りを済ませたあとで文章を揃えたのか、そもそも聞く前から用意されていたのか。",
      second:"班長は原稿を整えたと言った。だが、その原稿が誰に、いつ渡ったのかはまだ説明していない。",
      turn:"真帆は『自分の言葉を書こうとしたら、もう文章が入っていた』と話した。三人が同じ嘘を考えたという説明だけでは足りない。",
      reveal:"【大きな回収：聞く前の答え】\n事故の聞き取り前に、荻野が作った共通の記入例が配られていた。真帆が保管していた、まだ署名のない用紙には同じ一文が印字されていた。三人が口裏合わせをした証拠だと思っていた一致は、先に用意された言葉へ自分たちを合わせた結果だった。荻野は文面を整えたと認めていたが、誰にも異論を言う余地がなかったかは別の問いとして残った。",
      unresolved:"元の文章が配られた時刻を確認できず、文章の一致が何を意味するかは確定しなかった。",
      support(state){return !!state.night1.clues.includes("draft");},
      counter(state){return !!state.morning&&state.morning.history[1]==="why";},
      supportText:"班長が文章を整えたと話した。誰が署名する前に原稿を見たかはまだ分からない。",
      counterText:"真帆の説明では、報告文が先に存在した可能性が出てきた。配布の時刻を確かめる必要がある。",
      evidenceTitle:"署名前の記入例",
      proof:"真帆が保管していた未署名の記入例。報告書の三通と同じ一文が先に印字されていた。",
      after:["書類の仕組みを訂正せず、荻野一人の悪意と断定したため、同じ用紙は別の班でも使われ続けた。",
             "報告は保留された。真帆の名前は伏せられたが、記入例の配布を止める決定は翌週へ延びた。",
             "記入例の使用を見直し、証言者それぞれの言葉を残す欄が作られた。ただし全員が話せるとは限らない。"]
    }),
    Object.freeze({
      id:"two-moments",title:"二つの発言のあいだ",focus:"agency",entry:"stoppage",
      promise:"『止めたい』と『続けたい』。その矛盾は、同じ時刻の言葉だったのか。",
      opening:"申し送りの裏表に、少しだけ異なる時刻が書かれている。昨日の誰かの手が、一つを消していた。",
      first:"消された『停止の相談』は確かにあった。しかし、記録はいつの会話かを説明していない。",
      second:"真帆が耳にした『止めたい』は本当らしい。ただ、彼女は佐原がその後で何と言ったかは聞いていない。",
      turn:"佐原は『続けると言ったのは本当』と繰り返した。真帆の言葉を否定しないまま、二人の記憶は別の瞬間を指していた。",
      reveal:"【大きな回収：二つの時刻】\n交代要員を探した時点で、佐原は一度『止めたい』と相談していた。そのあと欠員が見つかり、職場を止めたくないと考えて、自分で『続ける』と言い直した。真帆の証言も佐原の証言も間違いではなかった。報告書が省いたのは、二つの言葉のあいだに佐原が感じた責任と、断る選択肢を示されなかった時間だった。",
      unresolved:"『止めたい』と『続けたい』がいつ入れ替わったのか、本人以外から裏付けを得られなかった。",
      support(state){return !!state.night1.clues.includes("confession");},
      counter(state){return !!state.morning&&state.morning.history[2]==="ask";},
      supportText:"真帆は『止めたい』という言葉を聞いていた。だが、その後のやり取りは知らない。",
      counterText:"佐原が『続けたい』と言ったことも確認できた。二人が同じ時刻を話しているとは限らない。",
      evidenceTitle:"交代要員を探した前後の時刻",
      proof:"佐原の説明と、真帆が記した申し送り時刻を突き合わせると、二つの発言の間に交代要員の相談があった。",
      after:["佐原の『続けた』という一文だけを残し、なぜ言い直したかを聞かずに責任を決めた。彼は訂正する言葉を失った。",
             "一時的に結論を止めたが、現場には交代を断りやすくする仕組みがなく、別の人が同じ選択を迫られた。",
             "二つの発言と、そのあいだの事情を分けて記した。誰か一人の意思だけでは説明できない出来事が残った。"]
    }),
    Object.freeze({
      id:"silent-rule",title:"命令のない規則",focus:"pressure",entry:"renewals",
      promise:"班長は『止めるな』と言わなかった。それなのに誰も止めようとしなかった。",
      opening:"壁の隅に、個人名のない評価表が貼られている。誰も、何の数字か尋ねようとしない。",
      first:"停止回数を評価に反映する掲示。評価されるのは誰なのか、そこには書かれていない。",
      second:"荻野は止めるなとは言っていないと話す。ただ『納期に間に合わない』とは繰り返した。",
      turn:"真帆は『停止を増やすと次の更新が危ないと、みんなが思っていた』と語った。でも、そのように説明した人の名前は出てこない。",
      reveal:"【大きな回収：命令のない規則】\n掲示の停止回数は工場全体の評価項目であり、個人の雇用更新と直接連動する規則はなかった。けれど誰かが『止めた人のせいで更新されない』と口にし、反論する人がいないまま噂が規則のようになっていた。荻野の『命令していない』は事実でも、人々が止められなかったことも事実だった。誰も発しなかった命令を、全員が守っていた。",
      unresolved:"停止回数と契約更新が本当に結び付いていたのか、誰も書面で確かめなかった。",
      support(state){return !!state.night1.clues.includes("quota");},
      counter(state){return !!state.morning&&state.morning.history[1]==="why";},
      supportText:"荻野が納期を気にしていたことは確かだ。だが停止禁止の指示は見つからない。",
      counterText:"真帆は『更新が危ない』という噂を語った。規則にあることと現場が信じたことが食い違い始めた。",
      evidenceTitle:"誰も確認しなかった評価の対象",
      proof:"部署評価の掲示と、個人の契約更新書類を照合。停止回数が個人の更新条件であるとの記載は見つからなかった。",
      after:["班長を処分すれば終わると思われたが、掲示は残り、次の班でも誰も停止を申告しなかった。",
             "一度現場の意見を聞くために報告を保留した。しかし噂を否定する正式な説明は出されなかった。",
             "部署評価と個人契約を明確に分けて説明した。だが誰も止められなかった記憶は、すぐには消えなかった。"]
    })
  ]);

  function valid(state){return !!state&&state.case&&cases.valid(state.case)&&
    state.night1&&Array.isArray(state.night1.clues)&&
    (state.morning===null || (state.morning&&Array.isArray(state.morning.history)));}
  function active(state){
    if(!valid(state)||state.arcMode!=="major"||state.case.mode!=="procedural")return null;
    return ARCS[Math.floor(state.case.seed/24)];
  }
  function status(state){
    const arc=active(state);
    if(!arc)return null;
    const source=state.night1.clues.includes(arc.entry);
    const support=source && !!arc.support(state);
    const counter=source && !!arc.counter(state);
    return {id:arc.id,source,support,counter,tally:Number(source)+Number(support)+Number(counter),
      mid:source&&(support||counter),full:source&&support&&counter};
  }
  function observed(state){
    const arc=active(state),s=status(state);
    if(!arc||!s.source)return [];
    const a=[{id:"arc-primary",title:"大きな謎の入口",
      fact:arc.first,detail:arc.first,
      caveat:"これだけでは封筒の筆者や事故の原因は特定できない。"}];
    if(s.support) a.push({id:"arc-support",title:"もう一つの証言",
      fact:arc.second,detail:arc.second,caveat:"まだ反対側の証言が足りない。"});
    if(s.counter) a.push({id:"arc-counter",title:"解釈を変える証言",
      fact:arc.turn,detail:arc.turn,caveat:"資料の存在だけでは、誰が責任を負うかは決まらない。"});
    if(s.full && state.morning && ["report","epilogue"].includes(state.morning.scene))
      a.push({id:"arc-proof",title:arc.evidenceTitle,
        fact:arc.proof,detail:arc.proof,
        caveat:"この証拠で説明できることと、負傷の直接原因を立証することは別だ。"});
    return a;
  }
  function sceneText(state){
    const arc=active(state),s=status(state);
    if(!arc)return "";
    const n=state.night1,m=state.morning;
    if(!m) {
      if(n.scene==="opening")return arc.opening;
      if(n.scene==="records")return "この夜、何を調べるかによって、見えてくる事件の輪郭が変わる。";
      if(n.scene==="coworker"&&s.source)return "【小さな伏線】 "+arc.first;
      if(n.scene==="judgment"&&s.source)return "【まだ終わらない疑問】 "+arc.promise;
      return "";
    }
    if(m.scene==="letter" && s.source)return "匿名の封筒が届いた。そこに書かれた言葉は、前夜の疑問にも似ている。けれど同じ意味だとは決められない。";
    if(m.scene==="maho"&&s.mid)return "【中間の反転】 "+(s.support?arc.second:arc.turn);
    if(m.scene==="sahara"&&s.mid)return "【反対側の証言】 "+(s.counter?arc.turn:arc.second);
    if(m.scene==="report"){
      if(s.full)return "【伏線がつながる】 "+arc.proof+"。誰を責めるかを決める前に、解釈を組み立て直す必要がある。";
      if(s.mid)return "【まだ欠けている一片】 二つの記録は結び付いた。しかし"+arc.unresolved;
      return s.source?"【残る違和感】 "+arc.unresolved:"【見送った疑問】 "+arc.promise;
    }
    if(m.scene==="epilogue"){
      if(!s.full)return "【まだ回収されない大きな謎】 "+arc.unresolved;
      const report=m.history[3];
      const after=report==="accuse"?arc.after[0]:report==="protect"?arc.after[1]:arc.after[2];
      const reading=state.deduction && state.deduction.stage==="complete"
        ? state.deduction.reading:null;
      const caution=reading==="assert"?"推理で断定した部分は、記録に残った事実より強い言葉になっていた。":
        reading==="dismiss"?"せっかくつながった証拠を、報告では扱わなかった。":
          reading==="balanced"?"証拠が示すことと、まだ説明できないことを区別して記録した。":"";
      return arc.reveal+"\n【あなたの行動が残したもの】\n"+after+(caution?"\n"+caution:"");
    }
    return "";
  }
  function nextSeed(seed){
    if(!Number.isInteger(seed)||seed<0||seed>=cases.COUNT)throw Error("事件番号が不正です");
    // 25 is coprime with 72: all 72 combinations visited once, while major arcs alternate.
    return (seed+25)%cases.COUNT;
  }
  return Object.freeze({VERSION,ARCS,active,status,observed,sceneText,nextSeed});
});
