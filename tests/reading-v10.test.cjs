"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const first=require("../story.js"),morning=require("../morning.js");
const cases=require("../case-variants.js"),arcs=require("../immersive-arcs.js");
const beats=require("../scene-beats.js"),reader=require("../reading-v10.js");
const puzzle=require("../deduction.js"),saves=require("../save-v9.js");
const pack={
  prefilled:["wording","space","author","why","ask"],
  "two-moments":["stoppage","private","author","private","ask"],
  "silent-rule":["renewals","space","targets","why","ask"],
  "permission-is-not-consent":["wording","space","author","private","quote"],
  "the-unspoken-objection":["stoppage","private","agreement","private","ask"],
  "protection-that-erases":["renewals","private","author","why","sign"]
};
const night=ids=>ids.reduce((s,id)=>first.advance(s,id),first.fresh());
const day=(n,ids)=>ids.reduce((s,id)=>morning.advance(s,n,id),morning.fresh(n));
function prepared(seed){
  const caseData=cases.create(seed),a=arcs.active(saves.blank(seed)),
    [record,coworker,boss,maho,sahara]=pack[a.id];
  const n=night(["listen",record,coworker,boss,"amend"]);
  const m=day(n,["examine",maho,sahara]);
  return {night1:n,morning:m,case:caseData,deduction:puzzle.start(),arcMode:"immersive"};
}
function end(s){
  const a=arcs.active(s);
  let d=puzzle.advance(s.deduction,s,"focus:"+a.focus);
  const pair=puzzle.options(s,a.focus).find(x=>x.id.includes("arc-support")&&x.id.includes("arc-counter")).id;
  d=puzzle.advance(d,s,"pair:"+pair);
  d=puzzle.advance(d,s,"reading:balanced");
  return {...s,deduction:d,morning:morning.advance(s.morning,s.night1,"context")};
}
function render(s,screen){
  const caseText=beats.safeCaseText(s),
    big=arcs.sceneText(s),beat=beats.line(s);
  const review=s.deduction?.stage==="complete"?puzzle.assessment(s.deduction,s):null;
  return reader.compose(s,screen,{case:caseText,major:big,beat,
    context:"Context repeated in old mode only",verified:arcs.verified(s),review});
}
test("72 mystery seeds keep an earned revelation but no repetitive generic ending",()=>{
  const lengths=[],headings=new Set();
  for(let seed=0;seed<72;seed++){
    const state=prepared(seed),fin=end(state);
    assert.equal(saves.validState(fin),true);
    const screen=morning.view(fin.morning,fin.night1);
    const txt=render(fin,screen);
    assert.equal(txt.includes("【大きな回収"),true);
    assert.ok(txt.includes("【推理の記録】"));
    assert.ok(!txt.includes("その後："));
    assert.ok(!txt.includes("Context repeated"));
    assert.ok(!txt.includes("調査が残したもの。")); // generic duplicated epilogue removed
    assert.ok(txt.length<1700,"overgrown ending seed "+seed+" length "+txt.length);
    headings.add(arcs.active(fin).id);
    lengths.push(txt.length);
  }
  assert.equal(headings.size,6);
  assert.ok(Math.max(...lengths)<1700);
});
test("deduction steps show only their relevant question without repeated background",()=>{
  for(let seed=0;seed<72;seed++){
    const s=prepared(seed),screen=puzzle.display(s.deduction,s);
    const txt=render(s,screen);
    assert.equal(txt,screen.body);
    assert.ok(!txt.includes("Context repeated"));
    assert.ok(!txt.includes("【大きな回収"));
  }
});
test("unfinished stories remain incomplete even with compelling authored echoes",()=>{
  for(let seed=0;seed<72;seed++){
    const s=prepared(seed);
    let d=puzzle.advance(s.deduction,s,"focus:"+arcs.active(s).focus);
    d=puzzle.advance(d,s,"pair:"+puzzle.options(s,d.focus)[0].id);
    d=puzzle.advance(d,s,"reading:dismiss");
    const ended={...s,deduction:d,morning:morning.advance(s.morning,s.night1,"context")};
    assert.equal(arcs.verified(ended),false);
    const txt=render(ended,morning.view(ended.morning,ended.night1));
    assert.ok(!txt.includes("【大きな回収"));
    assert.ok(txt.includes(beats.PACKS[arcs.active(ended).id].missed));
  }
});
test("legacy saves retain exact unedited narration construction",()=>{
  for(const mode of ["legacy","major","verified","expanded"]){
    assert.equal(reader.compose({arcMode:mode}, {body:"Original"},
      {major:"Replacement"}),null);
  }
});
test("intro and questions retain the original game decision meaning",()=>{
  for(let seed=0;seed<72;seed++){
    const start=saves.blank(seed);
    const view=first.view(start.night1);
    const edited=render(start,view);
    assert.ok(edited.startsWith(view.body));
    assert.ok(edited.length<=650);
    const a=arcs.active(start);
    assert.ok(edited.includes(beats.PACKS[a.id].opening));
    assert.equal(start.night1.scene,"opening");
  }
});
test("active browser script and compact CSS add no new navigation or screen",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const js=fs.readFileSync(path.join(__dirname,"..","game-v16.js"),"utf8");
  const style=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
  assert.ok(html.includes('src="./reading-v10.js"'));
  assert.ok(html.includes('src="./game-v16.js"'));
  assert.ok(!html.includes('src="./game-v9.js"'));
  assert.ok(js.includes("reading.compose"));
  assert.ok(style.includes(".started .narrative"));
  assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
  assert.equal((html.match(/<nav\b/g)||[]).length,0);
});
