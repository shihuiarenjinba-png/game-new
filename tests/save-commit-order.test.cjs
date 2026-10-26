"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const script=fs.readFileSync("game-v16.js","utf8");
test("player choices commit validated saves before updating in-memory story",()=>{
 assert.equal((script.match(/if\s*\(!write\(next\)\)/g)||[]).length,5,
  "choice, rewind, next chapter, new case and ordinary reset must fail closed");
 assert.doesNotMatch(script,/state\s*=\s*next;\s*write\(state\)/,
  "the UI must not advance unsaved story state");
 assert.doesNotMatch(script,/state\s*=\s*next;[\s\S]{0,90}write\(next\)/,
  "new case and resets must persist first");
 assert.match(script,/if\s*\(recoveryRaw\s*!==\s*null\)/);
 assert.doesNotThrow(()=>new vm.Script(script));
});
test("buyer-facing ending text never calls this a prototype",()=>{
 assert.doesNotMatch(script,/試作版の終幕/);
 assert.match(script,/今夜の調査はここまで/);
});
