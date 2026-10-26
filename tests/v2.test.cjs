"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const first = require("../story.js");
const second = require("../morning.js");
const guard = require("../save-guard.js");

function night(ids) { return ids.reduce((s, id) => first.advance(s, id), first.fresh()); }
function day(n, ids) { return ids.reduce((s, id) => second.advance(s, n, id), second.fresh(n)); }
const careful = night(["listen", "stoppage", "private", "author", "amend"]);
const closed = night(["formal", "wording", "repeat", "author", "approve"]);

test("v2 save round trip is offline and exact", () => {
  const data = { night1: careful, morning: day(careful, ["preserve", "private", "ask"]) };
  assert.equal(guard.validState(data), true);
  assert.deepEqual(guard.parse(guard.serialize(data)), data);
  assert.equal(guard.parse(guard.serialize(guard.blank())).night1.scene, "opening");
});

test("v1 saved game migrates without changing the original chapter", () => {
  const old = JSON.stringify(careful);
  const upgraded = guard.fromLegacy(old);
  assert.deepEqual(upgraded, {night1: careful, morning: null});
  assert.equal(guard.fromLegacy("{invalid json"), null);
});

test("each old chapter outcome continues, and their consequences can differ", () => {
  const a = second.fresh(careful);
  const b = second.fresh(closed);
  assert.notEqual(a.origin, b.origin);
  assert.match(second.view(b, closed).body, /本部へ送られている/);
  assert.doesNotMatch(second.view(a, careful).body, /本部へ送られている/);
  const aEnding = day(careful, ["preserve", "private", "ask", "context"]);
  const bEnding = day(closed, ["preserve", "private", "ask", "context"]);
  assert.equal(aEnding.ending, "layered");
  assert.equal(bEnding.ending, "late");
});

test("six meaningful second-chapter outcomes are reachable", () => {
  const cases = [
    [careful, ["preserve", "private", "ask", "context"], "layered"],
    [careful, ["share", "name", "sign", "context"], "incomplete"],
    [closed, ["preserve", "private", "quote", "context"], "late"],
    [careful, ["examine", "private", "ask", "protect"], "room"],
    [careful, ["share", "private", "ask", "protect"], "waiting"],
    [careful, ["preserve", "why", "ask", "accuse"], "fracture"]
  ];
  for (const [origin, choices, target] of cases)
    assert.equal(day(origin, choices).ending, target);
});

test("a new chapter cannot be forged or attached to an unfinished save", () => {
  const s = day(careful, ["preserve", "private"]);
  assert.equal(second.isValid(s, careful), true);
  assert.equal(second.isValid({ ...s, flags: ["cheat"] }, careful), false);
  assert.equal(second.isValid(s, closed), false);
  assert.equal(guard.validState({night1: first.fresh(), morning: s}), false);
});

test("backup import rejects mismatched scene, forged state and wrong version", () => {
  const base = { night1: careful, morning: second.fresh(careful) };
  const json = JSON.parse(guard.serialize(base));
  json.data.morning.origin = "tampered";
  assert.throws(() => guard.parse(JSON.stringify(json)));
  const altered = JSON.parse(guard.serialize(base));
  altered.data.night1.warmth += 1;
  assert.throws(() => guard.parse(JSON.stringify(altered)));
  assert.throws(() => guard.parse(JSON.stringify({format: guard.FORMAT, version: 99, data: base})));
  assert.throws(() => guard.parse("x".repeat(guard.MAX_BYTES + 1)));
});

test("all 243 first night routes and 81 second chapter routes remain valid", () => {
  let count = 0;
  const allEndings = new Set();
  function traverseFirst(state) {
    if (state.scene === "ending") {
      const start = second.fresh(state);
      function traverseSecond(s) {
        if (s.scene === "epilogue") {
          assert.equal(guard.validState({night1: state, morning: s}), true);
          allEndings.add(s.ending);
          count++;
          return;
        }
        for (const opt of second.view(s, state).choices)
          traverseSecond(second.advance(s, state, opt.id));
      }
      traverseSecond(start);
      return;
    }
    for (const opt of first.view(state).choices) traverseFirst(first.advance(state, opt.id));
  }
  traverseFirst(first.fresh());
  assert.equal(count, 19683);
  assert.deepEqual([...allEndings].sort(), ["fracture", "incomplete", "late", "layered", "room", "waiting"]);
});

test("one main game area and hidden backup tools; no payment screens or network", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const js = fs.readFileSync(path.join(__dirname, "..", "game-v16.js"), "utf8");
  assert.match(html, /src="\.\/game-v16\.js"/);
  assert.match(html, /src="\.\/morning\.js"/);
  assert.match(html, /src="\.\/save-guard\.js"/);
  assert.match(html, /<details class="data-tools">/);
  assert.equal((html.match(/class="story-panel"/g) || []).length, 1);
  assert.equal((html.match(/<nav\\b/g)||[]).length,1,"exactly one buyer navigation");
 assert.match(html,/id="handoverNav"/);
 assert.match(html,/data-handover-view="story"/);
 assert.match(html,/data-handover-view="clues"/);
  assert.equal((html.match(/id="export-save"/g) || []).length, 1);
  assert.doesNotMatch(js, /\bfetch\s*\(/);
  assert.doesNotMatch(js, /https?:\/\//);
  assert.doesNotMatch(html, /stripe|checkout|paypal/i);
});
