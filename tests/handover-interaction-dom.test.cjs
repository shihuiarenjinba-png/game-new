"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs");
const source=fs.readFileSync("handover-tabs.js","utf8");
function el(id){
 return {id,hidden:false,dataset:{},attrs:{},handlers:{},
  setAttribute(name,value){this.attrs[name]=value;},
  addEventListener(type,fn){this.handlers[type]=fn;},
  focus(){this.focused=true;}
 };
}
function fixture(){
 const nav=el("handoverNav"),story=el("storyPanel"),clues=el("evidencePanel"),grid=el("content-grid");
 const jump=el("evidence-jump"),back=el("return-story"),storyBtn=el(""),clueBtn=el("");
 storyBtn.dataset.handoverView="story";clueBtn.dataset.handoverView="clues";
 nav.querySelector=selector=>selector.includes('"story"')?storyBtn:clueBtn;
 nav.querySelectorAll=()=>[storyBtn,clueBtn];
 const elements={handoverNav:nav,"evidence-jump":jump,"return-story":back};
 const document={
  readyState:"complete",
  getElementById(id){return elements[id]||null;},
  querySelector(selector){return {".story-panel":story,".evidence-panel":clues,".content-grid":grid}[selector]||null;}
 };
 const window={};vm.runInNewContext(source,{document,window},{timeout:1000});
 return {nav,story,clues,grid,jump,back,storyBtn,clueBtn,screens:window.HandoverScreens};
}
test("real story/clue tab module hides the other panel and provides correct accessible labels",()=>{
 const f=fixture();
 assert.equal(f.screens.current(),"story");
 assert.equal(f.story.hidden,false);
 assert.equal(f.clues.hidden,true);
 assert.equal(f.story.attrs["aria-labelledby"],"handover-tab-story");
 assert.equal(f.clues.attrs["aria-labelledby"],"handover-tab-clues");
 assert.equal(f.story.attrs.role,"tabpanel");
 assert.equal(f.clues.attrs.role,"tabpanel");
 assert.equal(f.screens.choose("clues"),true);
 assert.equal(f.story.hidden,true);
 assert.equal(f.clues.hidden,false);
 assert.equal(f.clueBtn.attrs["aria-selected"],"true");
 assert.equal(f.screens.choose("missing"),false);
 assert.equal(f.screens.current(),"clues");
});
test("actual module supports arrow keys, evidence jump and back without writing save state",()=>{
 const f=fixture();
 f.nav.handlers.keydown({key:"ArrowRight",preventDefault(){}});
 assert.equal(f.screens.current(),"clues");
 f.nav.handlers.keydown({key:"ArrowUp",preventDefault(){}});
 assert.equal(f.screens.current(),"story");
 assert.equal(f.storyBtn.focused,true);
 f.jump.handlers.click();
 assert.equal(f.screens.current(),"clues");
 f.back.handlers.click();
 assert.equal(f.screens.current(),"story");
 assert.equal(f.grid.dataset.handoverView,"story");
});
