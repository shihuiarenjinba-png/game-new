"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8");
const tabs=fs.readFileSync("handover-tabs.js","utf8");
test("tabs reference real story and evidence panels and story remains unmodified",()=>{
 for(const [name,id] of [["story","storyPanel"],["clues","evidencePanel"]]){
  assert.match(html,new RegExp('data-handover-view="'+name+'" aria-controls="'+id+'"'));
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(tabs,/story\.hidden=target==="clues"/);
 assert.match(tabs,/clues\.hidden=target==="story"/);
 assert.match(html,/id="evidence-jump"[^>]+aria-controls="evidencePanel"/);
 const styles=fs.readFileSync("handover-context.css","utf8");
 assert.match(styles,/\.evidence-panel\[hidden\]\{display:none!important\}/);
 assert.match(styles,/\.content-grid\[data-handover-view="story"\]\{display:block/);
 assert.match(tabs,/grid\.dataset\.handoverView=target/);
 assert.doesNotMatch(tabs,/localStorage|\.warmth\s*=|\.clues\s*=/);
});