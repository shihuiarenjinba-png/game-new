"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const first = require("../story.js");
const morning = require("../morning.js");
const guard = require("../save-guard.js");
const notes = require("../case-notes.js");
const {makeConfig, gate} = require("../scripts/store-build.cjs");

function playNight(choices) {
  return choices.reduce((s, id) => first.advance(s, id), first.fresh());
}
function playMorning(night, choices) {
  return choices.reduce((s,id) => morning.advance(s,night,id),morning.fresh(night));
}

test("evidence notes do not speculate about clues the player did not inspect", () => {
  const state = { night1: first.advance(first.advance(first.fresh(),"listen"),"wording"), morning: null };
  const evidence = notes.observed(state);
  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].id, "wording");
  assert.match(evidence[0].fact, /報告書三通/);
  assert.match(evidence[0].caveat, /書式統一/);
  assert.doesNotMatch(notes.emphasis(state), /消された/);
});

test("state-specific remarks respect selected evidence", () => {
  const a = {night1: first.advance(first.advance(first.fresh(),"listen"),"stoppage"),morning:null};
  const b = {night1: first.advance(first.advance(first.fresh(),"listen"),"renewals"),morning:null};
  a.night1 = first.advance(a.night1,"private");
  b.night1 = first.advance(b.night1,"private");
  assert.match(notes.emphasis(a), /消された/);
  assert.match(notes.emphasis(b), /生産停止/);
  assert.notEqual(notes.emphasis(a),notes.emphasis(b));
});

test("two different sources with similar labels stay separate", () => {
  const n=playNight(["listen","wording","space","author","amend"]);
  const m=playMorning(n,["preserve","why"]);
  const all=notes.observed({night1:n,morning:m});
  assert.ok(all.some(x=>x.id==="distance"));
  assert.ok(all.some(x=>x.id==="distance2"));
  assert.ok(all.some(x=>x.id==="draft"));
  assert.equal(new Set(all.map(x=>x.id)).size,all.length);
});

test("morning feedback changes with exposed vs preserved envelope", () => {
  const n=playNight(["listen","stoppage","private","author","amend"]);
  const exposed={night1:n,morning:morning.advance(morning.fresh(n), n, "share")};
  const protectedState={night1:n,morning:morning.advance(morning.fresh(n),n,"preserve")};
  assert.match(notes.emphasis(exposed), /封筒を見せた/);
  assert.match(notes.emphasis(protectedState), /申し送り/);
  assert.doesNotMatch(notes.emphasis(protectedState), /封筒を見せた/);
});

test("endgame context acknowledges incompatible testimony without asserting guilt", () => {
  const n=playNight(["listen","stoppage","private","author","amend"]);
  const m=playMorning(n,["examine","why","ask","context"]);
  const c=notes.emphasis({night1:n,morning:m});
  assert.match(c,/停止の相談/);
  assert.match(c,/同じ瞬間の発言だったと決まったわけではない/);
});

test("no new navigation and evidence card displays only its title until opened", () => {
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const code=fs.readFileSync(path.join(__dirname,"..","game-v2.js"),"utf8");
  const styles=fs.readFileSync(path.join(__dirname,"..","style.css"),"utf8");
  assert.match(html,/src="\.\/case-notes\.js"/);
  assert.equal((html.match(/<nav\b/g)||[]).length,1,"exactly one buyer navigation");
 assert.match(html,/id="handoverNav"/);
 assert.match(html,/data-handover-view="story"/);
 assert.match(html,/data-handover-view="clues"/);
  assert.equal((html.match(/class="story-panel"/g)||[]).length,1);
  assert.match(code,/element\("details", "clue"\)/);
  assert.match(code,/element\("summary", "clue-title"/);
  assert.match(styles,/\.clue-list \.clue\[open\]/);
});

test("Store file manifest includes added module while identity gate remains closed", () => {
  const conf=makeConfig({STORE_IDENTITY_NAME:"Publisher.HandoverRoom", STORE_PUBLISHER:"CN=Vendor",STORE_PUBLISHER_DISPLAY_NAME:"Vendor"});
  assert.ok(conf.files.includes("case-notes.js"));
  const blocks=gate({},"win32");
  assert.ok(blocks.some(x=>x.includes("STORE_IDENTITY_NAME")));
  assert.ok(blocks.some(x=>x.includes("正式ロゴ未配置")));
});

test("v0.2 save format remains valid without migration", () => {
  const n=playNight(["listen","stoppage","private","author","amend"]);
  const m=playMorning(n,["preserve","private","ask","context"]);
  const state={night1:n,morning:m};
  assert.equal(guard.validState(state),true);
  assert.deepEqual(guard.parse(guard.serialize(state)),state);
  assert.ok(notes.observed(state).length>0);
});
