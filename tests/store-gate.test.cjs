"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {gate, makeConfig} = require("../scripts/store-build.cjs");

test("sales MSIX packaging refuses missing real identity and logos", () => {
  const errors = gate({}, "win32");
  assert.ok(errors.some(x => /STORE_IDENTITY_NAME/.test(x)));
  assert.ok(errors.some(x => /STORE_PUBLISHER/.test(x)));
  assert.ok(errors.some(x => /正式ロゴ未配置/.test(x)));
});

test("proper MSIX config is Japan-only language, Windows MSIX-only, no background purchase", () => {
  const env = {STORE_IDENTITY_NAME:"Publisher.HandoverRoom",STORE_PUBLISHER:"CN=Official Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Official Publisher"};
  const conf = makeConfig(env);
  assert.equal(conf.msix.identityName, env.STORE_IDENTITY_NAME);
  assert.equal(conf.msix.publisher, env.STORE_PUBLISHER);
  assert.deepEqual(conf.win.target, [{target:"msix",arch:["x64"]}]);
  assert.deepEqual(conf.msix.capabilities, ["runFullTrust"]);
  assert.equal(conf.msix.createMsixupload, true);
  assert.ok(!conf.files.some(f => /market|strategy|economics/i.test(f)));
});

test("standalone Electron shell denies external navigation, windows and permissions", () => {
  const s = fs.readFileSync(path.join(__dirname, "..", "desktop", "main.cjs"), "utf8");
  assert.match(s, /setWindowOpenHandler/);
  assert.match(s, /will-navigate/);
  assert.match(s, /setPermissionRequestHandler/);
  assert.match(s, /nodeIntegration:\s*false/);
  assert.match(s, /contextIsolation:\s*true/);
  assert.match(s, /sandbox:\s*true/);
});
