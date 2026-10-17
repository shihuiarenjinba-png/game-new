"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("first-time players can understand the three core actions without extra screens", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
  assert.match(html, /<details class="first-play-guide">/);
  for (const phrase of ["<strong>選ぶ</strong>", "<strong>確かめる</strong>", "<strong>報告する</strong>"]) {
    assert.ok(html.includes(phrase), phrase);
  }
  assert.match(html, /判断は自動保存されます/);
  assert.match(css, /\.started \.first-play-guide\{display:none\}/);
  assert.match(css, /first-play-guide>summary:focus-visible/);
  assert.match(html, /id="choices"/);
  assert.match(html, /id="clues"/);
  assert.match(html, /id="export-save"/);
  assert.equal((html.match(/class="first-play-guide"/g)||[]).length,1);
});
