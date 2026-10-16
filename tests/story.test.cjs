"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const game = require("../story.js");

function play(ids) {
  return ids.reduce((state, id) => game.advance(state, id), game.fresh());
}

test("fresh save is valid and opening view is accessible", () => {
  const s = game.fresh();
  assert.equal(game.isValid(s), true);
  assert.equal(s.scene, "opening");
  assert.equal(game.view(s).choices.length, 3);
  assert.equal(game.progress(s).step, 0);
});

test("each decision advances once without mutating prior save", () => {
  const old = game.fresh();
  const next = game.advance(old, "listen");
  assert.equal(old.scene, "opening");
  assert.equal(old.history.length, 0);
  assert.equal(next.scene, "records");
  assert.equal(next.warmth, 1);
  assert.equal(next.history.length, 1);
  assert.equal(game.isValid(next), true);
});

test("investigation only reveals selected evidence, not inferred guilt", () => {
  const s = play(["formal", "stoppage"]);
  assert.deepEqual(s.clues, ["stoppage"]);
  assert.match(game.clueList(s)[0].detail, /誰が消したかは分からない/);
  assert.equal(s.scene, "coworker");
});

test("invalid choices and corrupted saves are rejected", () => {
  assert.throws(() => game.advance(game.fresh(), "secret_route"));
  assert.equal(game.isValid({ ...game.fresh(), scene: "ending" }), false);
  assert.equal(game.isValid({ ...game.fresh(), clues: ["not_a_clue"] }), false);
  assert.equal(game.isValid({ ...game.fresh(), history: [{}] }), false);
  assert.equal(game.isValid(null), false);
});

test("careful listening can produce a supported correction", () => {
  const s = play(["listen", "stoppage", "private", "author", "amend"]);
  assert.equal(s.ending, "correction");
  assert.equal(s.scene, "ending");
  assert.match(game.view(s).body, /真帆/);
});

test("accusatory questioning can make an accurate amendment lonely", () => {
  const s = play(["confront", "wording", "repeat", "agreement", "amend"]);
  assert.equal(s.ending, "isolated");
});

test("a respectful pause can create room for future testimony", () => {
  const s = play(["formal", "renewals", "private", "targets", "hold"]);
  assert.equal(s.ending, "continuation");
});

test("a pressured pause can fail to open the conversation", () => {
  const s = play(["confront", "wording", "repeat", "targets", "hold"]);
  assert.equal(s.ending, "stalled");
});

test("accepting the record can close the case on any route", () => {
  const s = play(["listen", "renewals", "private", "author", "approve"]);
  assert.equal(s.ending, "closed");
  assert.equal(game.view(s).choices.length, 0);
  assert.throws(() => game.advance(s, "amend"));
});

test("all first-night choices lead to a valid, terminal state", () => {
  let count = 0;
  const endings = new Set();
  for (const a of game.view(game.fresh()).choices) {
    const s1 = game.advance(game.fresh(), a.id);
    for (const b of game.view(s1).choices) {
      const s2 = game.advance(s1, b.id);
      for (const c of game.view(s2).choices) {
        const s3 = game.advance(s2, c.id);
        for (const d of game.view(s3).choices) {
          const s4 = game.advance(s3, d.id);
          for (const e of game.view(s4).choices) {
            const s5 = game.advance(s4, e.id);
            assert.equal(game.isValid(s5), true);
            assert.equal(s5.scene, "ending");
            assert.equal(s5.history.length, 5);
            assert.equal(game.clueList(s5).length, 3);
            endings.add(s5.ending);
            count++;
          }
        }
      }
    }
  }
  assert.equal(count, 243);
  assert.deepEqual([...endings].sort(), ["closed", "continuation", "correction", "isolated", "stalled"]);
});

test("save and restore keeps the same narrative state", () => {
  const original = play(["listen", "wording", "space"]);
  const restored = JSON.parse(JSON.stringify(original));
  assert.equal(game.isValid(restored), true);
  assert.deepEqual(game.view(restored), game.view(original));
});
