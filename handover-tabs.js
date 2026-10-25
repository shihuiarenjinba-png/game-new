/* Optional focus view; original mystery state, character choices and saves are untouched. */
(() => {"use strict";
 function start(){
  const nav=document.getElementById("handoverNav"),story=document.querySelector(".story-panel"),
   clues=document.querySelector(".evidence-panel"),grid=document.querySelector(".content-grid");
  if(!nav||!story||!clues||!grid)return;
  let active="story";
  for(const [name,panel] of [["story",story],["clues",clues]]){
   const button=nav.querySelector('[data-handover-view="'+name+'"]');
   if(!button)return;
   if(!button.id)button.id="handover-tab-"+name;
   panel.setAttribute("role","tabpanel");
   panel.setAttribute("aria-labelledby",button.id);
   button.setAttribute("aria-controls",panel.id);
  }
  function choose(target){
   if(target!=="story"&&target!=="clues")return false;
   active=target;
   story.hidden=target==="clues";clues.hidden=target==="story";
   grid.dataset.handoverView=target;
   for(const btn of nav.querySelectorAll("[data-handover-view]")){
    const selected=btn.dataset.handoverView===target;
    btn.setAttribute("aria-selected",String(selected));btn.tabIndex=selected?0:-1;
   }
   return true;
  }
  nav.addEventListener("click",event=>{
   const button=event.target.closest("[data-handover-view]");
   if(button)choose(button.dataset.handoverView);
  });
  nav.addEventListener("keydown",event=>{
   if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key))return;
   event.preventDefault();
   const to=event.key==="Home"||event.key==="ArrowLeft"||event.key==="ArrowUp"?"story":"clues";
   choose(to);nav.querySelector('[data-handover-view="'+to+'"]')?.focus();
  });
  document.getElementById("evidence-jump")?.addEventListener("click",()=>choose("clues"));
  document.getElementById("return-story")?.addEventListener("click",()=>choose("story"));
  window.HandoverScreens=Object.freeze({choose,current:()=>active});
  choose("story");
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();