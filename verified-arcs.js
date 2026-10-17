/* v0.7: evidence provenance gates for major-arc resolutions.
 * v0.6 logic remains intact for migrated saves. No proof documents are invented.
 */
(function(root,factory){
  const old=typeof module!=="undefined"&&module.exports?require("./major-arcs.js"):root.HandoverGrandArcs;
  const cases=typeof module!=="undefined"&&module.exports?require("./case-variants.js"):root.HandoverCases;
  const api=factory(old,cases);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverVerifiedArcs=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,cases){
  "use strict";
  const VERSION=7, ARCS=old.ARCS;
  const VERIFIED_ENDINGS=Object.freeze({
    prefilled:{
      title:"【大きな回収：誰の言葉だったのか】",
      content:"三通の報告書には同じ文がある。荻野は文面を整えたと認め、真帆は自分が書こうとした時点で既に文章があったと話した。少なくとも真帆の署名欄の言葉は、彼女自身が考えた文章ではなかった。『三人が同じ嘘を考えた』という仮説から、『先にある文面へ各自が合わせた』という説明へ焦点が変わった。ただし他の二人がいつ文面を受け取ったか、明確な虚偽の指示があったかは確認できない。",
      unresolved:"報告書の文面が誰によっていつ共有されたかが分からず、真帆の説明と荻野の編集行為を結び付けきれなかった。"
    },
    "two-moments":{
      title:"【大きな回収：二つの発言は両立する】",
      content:"真帆は佐原の『止めたい』という相談を聞いた。佐原本人は『続けると言った』ことを認める。二人の言葉は互いを否定しない。むしろ、違う時点や違う状況を説明している可能性がある。これまでの報告書は後者だけを残していた。いつ決心を変えたのかは確定できないが、『続けると発言した』だけで『自由に選べた』と結論することはできない。",
      unresolved:"『止めたい』という相談と、本人の『続ける』という発言が、いつどのような順序で交わされたかを確認できなかった。"
    },
    "silent-rule":{
      title:"【大きな回収：命令なしでも生まれる圧力】",
      content:"壁には停止回数を評価に反映する掲示がある。荻野は納期への不安を繰り返し、真帆は『停止が増えると契約更新が危ない』という現場の認識を語った。明示的な停止禁止命令が見つからなくても、人々が止められないと考える理由はあった。掲示が実際に個人の更新条件だったかは不明であり、『禁止命令がない＝圧力もない』とは言えない。",
      unresolved:"雇用への不安は聞けたが、停止回数と更新条件の正式な関係や、誰から噂が広まったかは確かめられなかった。"
    }
  });
  // Factor-balanced allocation: each main arc receives all author types,
  // motives, side incidents and ambience types; avoid seed-range correlations.
  function arcIndex(seed){
    if(!Number.isInteger(seed)||seed<0||seed>=cases.COUNT)throw Error("不正な事件番号");
    const author=seed%4,motive=Math.floor(seed/4)%3,
      incident=Math.floor(seed/12)%3, ambience=Math.floor(seed/36)%2;
    return (author+motive+incident+ambience)%ARCS.length;
  }
  const buckets=ARCS.map(()=>[]);
  for(let seed=0;seed<cases.COUNT;seed++)buckets[arcIndex(seed)].push(seed);
  if(buckets.some(x=>x.length!==24))throw Error("大型事件の割当が不均等です");
  const ORDER=Object.freeze(Array.from({length:24},(_,i)=>
    buckets.map(b=>b[(i*5)%24])).flat());
  function valid(s){return !!s && s.case && cases.valid(s.case) && s.night1 && Array.isArray(s.night1.clues) &&
    (s.morning===null || (s.morning && Array.isArray(s.morning.history)));}
  function active(s){
    if(!valid(s))return null;
    if(s.arcMode==="verified" && s.case.mode==="procedural")return ARCS[arcIndex(s.case.seed)];
    if(s.arcMode==="major")return old.active(s);
    return null;
  }
  function status(s){
    if(s.arcMode==="major")return old.status(s);
    const a=active(s);if(!a)return null;
    const source=s.night1.clues.includes(a.entry);
    const support=source&&Boolean(a.support(s));
    const counter=source&&Boolean(a.counter(s));
    return {id:a.id,source,support,counter,mid:source&&(support||counter),
      full:source&&support&&counter,tally:Number(source)+Number(support)+Number(counter)};
  }
  function verified(s){
    const a=active(s),st=status(s),d=s.deduction;
    if(!a||!st||s.arcMode!=="verified"||!st.full||!d||d.stage!=="complete"||
      d.focus!==a.focus||d.reading==="dismiss"||typeof d.pair!=="string")return false;
    const ids=d.pair.split("|");
    return ids.length===2 && ids.includes("arc-support") && ids.includes("arc-counter");
  }
  function observed(s){
    if(s.arcMode==="major")return old.observed(s);
    const a=active(s),st=status(s);
    if(!a||!st.source)return [];
    const out=[{id:"arc-primary",title:"発端となる記録",
      fact:a.first,detail:a.first,
      caveat:"この一件だけでは、原因や責任を断定できない。"}];
    if(st.support)out.push({id:"arc-support",title:"異なる立場の説明",
      fact:a.second,detail:a.second,caveat:"反対の立場からの確認が必要。"});
    if(st.counter)out.push({id:"arc-counter",title:"推理を変える発言",
      fact:a.turn,detail:a.turn,caveat:"人物の発言の確かさと、発言から推測できることは区別する。"});
    // Do not auto-create a 'signed original' or payroll record merely because
    // three dialogue flags are true. All evidence here comes from played scenes.
    return out;
  }
  function sceneText(s){
    if(s.arcMode==="major")return old.sceneText(s);
    const a=active(s),st=status(s);
    if(!a)return "";
    const n=s.night1,m=s.morning;
    if(!m){
      if(n.scene==="opening")return a.opening;
      if(n.scene==="coworker"&&st.source)return "【小さな伏線】 "+a.first;
      if(n.scene==="judgment"&&st.source)return "【残された疑問】 "+a.promise;
      return "";
    }
    if(m.scene==="letter"&&st.source)return "匿名の封筒にも、あの説明と似た言葉があった。しかし書き手はまだ分からない。";
    if(m.scene==="maho"&&st.support)return "【説明が食い違い始めた】 "+a.second;
    if(m.scene==="sahara"&&st.counter)return "【反対側から見た言葉】 "+a.turn;
    if(m.scene==="report"){
      if(st.full)return "【三つの手掛かりが揃った】 何が確かで、何が推測か。最終報告の前に証拠を照合しよう。";
      if(st.mid)return "【証拠がまだ足りない】 "+VERIFIED_ENDINGS[a.id].unresolved;
      return st.source?"【説明のつかない違和感】 "+VERIFIED_ENDINGS[a.id].unresolved:"";
    }
    if(m.scene==="epilogue"){
      if(!verified(s)) {
        if(!st.full)return "【回収されなかった大きな謎】 "+VERIFIED_ENDINGS[a.id].unresolved;
        return "【照合されなかった真相】 手掛かりは揃ったが、その核心を最終報告に結び付けなかった。別の立場から見れば、重要な矛盾は残ったままだ。";
      }
      const e=VERIFIED_ENDINGS[a.id];
      const mChoice=m.history[3],reading=s.deduction.reading;
      const consequence=mChoice==="accuse"
        ?"班長に責任を集中させたため、職場の仕組みはそのまま残った。":
        mChoice==="protect"
          ?"匿名で追加の聞き取りが行われたが、制度の修正には時間がかかった。":
          "確認できた発言と、推測にとどまる点が分けて記録された。";
      const caveat=reading==="assert"
        ?"ただし『誰が強制したか』まで断定した部分は、証拠の範囲を超えていた。":
        "誰か一人の悪意を証明したわけではないことも明記された。";
      return e.title+"\n"+e.content+"\n【あなたの記録が残した影響】\n"+consequence+" "+caveat;
    }
    return "";
  }
  function nextSeed(seed){
    if(!Number.isInteger(seed)||seed<0||seed>=cases.COUNT)throw Error("不正な事件番号");
    return ORDER[(ORDER.indexOf(seed)+1)%ORDER.length];
  }
  return Object.freeze({VERSION,ARCS,VERIFIED_ENDINGS,arcIndex,active,status,verified,observed,sceneText,nextSeed});
});
