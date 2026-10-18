"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),css=fs.readFileSync("handover-context.css","utf8");
test("mystery story and clue views have individual styling without fictional new witness facts",()=>{
 assert.match(html,/handover-context\.css/);
 assert.match(css,/\.content-grid\[data-handover-view="clues"\] \.evidence-panel/);
 assert.match(css,/\.story-panel \.narrative/);
 assert.doesNotMatch(css,/黒田|犯人|嘘|localStorage|fetch\(/);
});
