"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const html=fs.readFileSync("index.html","utf8"),code=fs.readFileSync("handover-tabs.js","utf8"),store=fs.readFileSync("scripts/store-build.cjs","utf8");
test("story and evidence navigation links to original live mystery panels",()=>{
 for(const id of ["handoverNav","heading","clues","return-story","evidence-jump"])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/data-handover-view="story"/);
 assert.match(html,/data-handover-view="clues"/);
 assert.match(html,/src="\.\/handover-tabs\.js"/);
 assert.match(code,/story\.hidden=target==="clues"/);
 assert.match(code,/grid\.dataset\.handoverView=target/);
});
test("new notebook navigation is packaged without changing the story-save or identity gate",()=>{
 assert.match(store,/handover-tabs\.js/);
 assert.doesNotMatch(code,/localStorage|sessionStorage|save\.state|fetch\(/);
 assert.doesNotThrow(()=>new vm.Script(code));
});
