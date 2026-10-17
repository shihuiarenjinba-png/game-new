/* New decisions reuse validated v13 hypothesis mechanics; render less repetition. */
(function(root,factory){
 const old=typeof module!=="undefined"&&module.exports?require("./deliberation-v13.js"):root.HandoverDeliberation;
 const arcs=typeof module!=="undefined"&&module.exports?require("./deliberative-arcs-v13.js"):root.HandoverDeliberativeArcs;
 const api=factory(old,arcs);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverMidpointV14=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,arcs){
 "use strict";
 const toDelib=s=>s?.arcMode==="responsive"?{...s,arcMode:"deliberative"}:s;
 const toImmerse=s=>s?.arcMode==="responsive"?{...s,arcMode:"immersive"}:old.compatible(s);
 function conciseBeginning(s){
  const sc=old.beginning(toDelib(s));
  if(s.arcMode!=="responsive")return sc;
  return {...sc,title:"いまの仮説",body:sc.body.replace("これは結論ではない。今の考えを一つ残し、翌朝の証言で検証する。",
    "今の考えを仮に残す。翌朝の証言で変えてもよい。"),
    choices:sc.choices.map(x=>({...x,hint:"仮説はまだ事実ではない"}))};
 }
 function conciseSecond(s){
  const sc=old.second(toDelib(s));
  if(s.arcMode!=="responsive")return sc;
  const a=arcs.active(toDelib(s)),st=arcs.status(toDelib(s));
  const first=sc.body.split("\n\n")[0];
  const signals=[
   st?.support?"・別の立場の説明を得た":"・支える説明は未確認",
   st?.counter?"・解釈を変えうる発言を得た":"・反対側の発言は未確認"
  ];
  return {...sc,title:"仮説を見直す",body:first+"\n\n"+signals.join("\n")+
    "\n何を言い切れるかは、この後で証拠を照合して判断する。",
   choices:sc.choices.map(x=>({...x,hint:""}))};
 }
 function initial(s,id){
  const result=old.chooseInitial(toDelib(s),id);
  return s.arcMode==="responsive"?{...result,arcMode:"responsive"}:result;
 }
 function revision(s,id){
  const result=old.chooseRevision(toDelib(s),id);
  return s.arcMode==="responsive"?{...result,arcMode:"responsive"}:result;
 }
 return Object.freeze({...old,compatible:toImmerse,
  active:s=>arcs.active(toDelib(s)),firstOptions:s=>old.firstOptions(toDelib(s)),
  beginning:conciseBeginning,second:conciseSecond,
  chooseInitial:initial,chooseRevision:revision,
  reflection:s=>old.reflection(toDelib(s))});
});
