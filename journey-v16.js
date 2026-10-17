/* v0.16: one short orientation line, derived from actual progress only.
 * Does not change choices, evidence, game state or old saved stories.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverJourneyV16=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 function describe(s){
  const m=s.morning;
  const hasMid=!!s.midpoint && (s.arcMode==="responsive"||s.arcMode==="deliberative");
  const night=s.night1.history.length,days=m?m.history.length:0;
  const theory=hasMid&&s.midpoint.initial!==null;
  const revision=hasMid&&s.midpoint.revision!==null;
  const d=m?.scene==="report"?s.deduction:null;
  const inference=d?({focus:0,pair:1,reading:2,complete:3}[d.stage]??0):0;
  const max=hasMid?14:12,now=Math.min(max,night+days+Number(theory)+Number(revision)+inference);
  let current,next;
  if(!m){
   if(night===5&&!theory&&hasMid){current="仮説を立てる";next="翌朝の聞き取り";}
   else if(night===5){current="第一夜の終了";next="翌朝の聞き取り";}
   else {current="第一夜の調査";next=night===4?(hasMid?"仮説を立てる":"翌朝の聞き取り"):"次の聞き取り";}
  }else if(m.scene==="epilogue"){current="事件の結末";next="別の事件または再調査";}
  else if(m.scene==="report"){
   if(hasMid&&!revision){current="仮説を見直す";next="証拠の照合";}
   else if(d?.stage==="complete"){current="報告方針を決める";next="事件の結末";}
   else {current="証拠を照合する";next=d?.stage==="reading"?"報告方針を決める":"次の推理";}
  }else{current="翌朝の聞き取り";next=days===2?(hasMid?"仮説を見直す":"証拠の照合"):"次の聞き取り";}
  return {current,next,now,max,
    guide:current+"  →  "+next,
    instruction:m?.scene==="epilogue"?"次の事件を始める前に、必要なら記録を書き出してください。":
      "選んだ行動が次の場面につながります。進行はこの端末に自動保存されます。"};
 }
 return Object.freeze({describe});
});
