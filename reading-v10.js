/* v0.10: editorial composition only. The underlying clues and old save modes
 * are untouched. Hide redundant narration; never truncate factual evidence.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.HandoverReadingV10=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  function join(parts){
    return parts.filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim()).join("\n\n");
  }
  function compose(state,screen,pieces){
    if(state.arcMode!=="immersive")return null;
    const m=state.morning,n=state.night1;
    const inDeduction=!!m&&m.scene==="report"&&state.deduction?.stage!=="complete";
    if(inDeduction)return screen.body; // Three distinct steps, no repeated backstory.
    if(m?.scene==="report"){
      return join([screen.body,pieces.major,
        state.deduction?.stage==="complete"&&pieces.review?
        "【照合した結論】 "+pieces.review.status+"\n"+pieces.review.detail:""]);
    }
    if(m?.scene==="epilogue"){
      const recovered=pieces.verified;
      const reflection=pieces.review?"【推理の記録】 "+pieces.review.status+
        "\n"+pieces.review.detail:"";
      return join([recovered?"":screen.body,pieces.major,pieces.beat,reflection,
        pieces.case]);
    }
    if(!m){
      if(n.scene==="opening")return join([screen.body,pieces.case,pieces.beat]);
      if(n.scene==="records")return screen.body;
      if(n.scene==="coworker")return join([screen.body,pieces.major,pieces.case,pieces.beat]);
      if(n.scene==="supervisor")return join([screen.body,pieces.context,pieces.beat]);
      if(n.scene==="judgment")return join([screen.body,pieces.major,pieces.beat]);
      if(n.scene==="ending")return join([screen.body,pieces.beat]);
      return screen.body;
    }
    if(m.scene==="letter")return join([screen.body,pieces.case,pieces.beat]);
    if(m.scene==="maho")return join([screen.body,pieces.major,pieces.beat,
      pieces.case]);
    if(m.scene==="sahara")return join([screen.body,pieces.major,pieces.beat,
      pieces.case]);
    return join([screen.body,pieces.beat]);
  }
  return Object.freeze({compose});
});
