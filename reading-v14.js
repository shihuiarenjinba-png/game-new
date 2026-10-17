/* v0.14 – fewer paragraphs on screen, more consequential information.
 * Evidence remains available verbatim in its existing folded notes.
 */
(function(root,factory){
 const old=typeof module!=="undefined"&&module.exports?require("./reading-v13.js"):root.HandoverReadingV13;
 const mid=typeof module!=="undefined"&&module.exports?require("./midpoint-v14.js"):root.HandoverMidpointV14;
 const outcomes=typeof module!=="undefined"&&module.exports?require("./consequences-v14.js"):root.HandoverConsequencesV14;
 const api=factory(old,mid,outcomes);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverReadingV14=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(old,mid,outcomes){
 "use strict";
 const join=parts=>parts.filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim()).join("\n\n");
 function cleanFinal(s){
  if(typeof s!=="string")return "";
  const src=s.split("【あなたの報告後】")[0].trim();
  const lines=src.split("\n");
  if(lines.length>1&&/^【大きな回収[^】]*】$/.test(lines[0])&&
    /^【大きな回収[^】]*】$/.test(lines[1]))return lines.slice(1).join("\n");
  return src;
 }
 function compose(s,screen,pieces){
  if(s?.arcMode!=="responsive")return old.compose(s,screen,pieces);
  const m=s.morning,base=old.compose({...s,arcMode:"deliberative"},screen,pieces);
  if(m?.scene==="report"){
   if(s.deduction?.stage!=="complete")return screen.body;
   return join([screen.body,outcomes.prompt(s)]);
  }
  if(m?.scene==="epilogue"){
   return join([cleanFinal(pieces.major)||screen.body,outcomes.result(s),
     pieces.case]);
  }
  if(m?.scene==="maho"||m?.scene==="sahara"){
   const oldIntro=base||screen.body;
   const echo=mid.reflection(s);
   // v13 already adds the same reflection. Preserve it once only.
   return oldIntro.includes(echo)?oldIntro:join([oldIntro,echo]);
  }
  if(!m&&s.night1.scene==="ending"){
   // A single restrained preview. Do not duplicate the next hypothesis prompt.
   return join([screen.body,pieces.beat]);
  }
  return base;
 }
 return Object.freeze({compose,cleanFinal});
});
