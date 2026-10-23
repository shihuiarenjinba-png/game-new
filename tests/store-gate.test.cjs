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
  const env = {STORE_IDENTITY_NAME:"Publisher.HandoverRoom",STORE_PUBLISHER:"CN=Official Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Official Publisher",STORE_DISPLAY_NAME:"引継ぎ室"};
  const conf = makeConfig(env);
  assert.equal(conf.msix.identityName, env.STORE_IDENTITY_NAME);
  assert.equal(conf.msix.publisher, env.STORE_PUBLISHER);
  assert.deepEqual(conf.win.target, [{target:"msix",arch:["x64"]}]);
  assert.deepEqual(conf.msix.capabilities, ["runFullTrust"]);
  assert.equal(conf.msix.createMsixupload, true);
  assert.ok(!conf.files.some(f => /market|strategy|economics/i.test(f)));
});

test("candidate build can package owner-approved recorded identity without claiming live verification or brand approval",()=>{
 const record=require("../store/partner-center-identity.json");
 const env={STORE_ID:record.storeId,STORE_IDENTITY_NAME:record.identityName,
  STORE_PUBLISHER:record.publisher,STORE_PUBLISHER_DISPLAY_NAME:record.publisherDisplayName,
  STORE_DISPLAY_NAME:record.storeDisplayName,SOURCE_GIT_COMMIT:"0123456789abcdef0123456789abcdef01234567",
  STORE_IDENTITY_CONFIRMED:"OWNER_APPROVED",STORE_BUILD_MODE:"CANDIDATE",
  STORE_PACKAGE_VERSION:"1.0.0.0"};
 const issues=gate(env,"win32");
 assert.ok(!issues.some(x=>/STORE_BRAND_APPROVED/.test(x)));
 assert.ok(!issues.some(x=>/STORE_IDENTITY_CONFIRMED/.test(x)));
 assert.ok(!issues.some(x=>/STORE_IDENTITY_NAME.*一致しません/.test(x)));
 assert.ok(!issues.some(x=>/STORE_ID.*別作品/.test(x)));
 const standard=gate({...env,STORE_BUILD_MODE:undefined},"win32");
 assert.ok(standard.some(x=>/STORE_BRAND_APPROVED/.test(x)));
 assert.ok(standard.some(x=>/STORE_IDENTITY_CONFIRMED/.test(x)));
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

test("Partner Center's EKIDEN identity cannot pass Handover Room MSIX gate",()=>{
 const record=require("../store/partner-center-identity.json");
 const env={STORE_IDENTITY_NAME:record.identityName,STORE_PUBLISHER:record.publisher,
  STORE_PUBLISHER_DISPLAY_NAME:record.publisherDisplayName,STORE_DISPLAY_NAME:record.storeDisplayName,
  STORE_ID:record.storeId,SOURCE_GIT_COMMIT:"0123456789abcdef0123456789abcdef01234567",
  STORE_IDENTITY_CONFIRMED:"YES",STORE_BRAND_APPROVED:"YES",STORE_PACKAGE_VERSION:"1.0.0.0"};
 const correct=gate(env,"win32");
 assert.ok(!correct.some(x=>/別作品のIdentity/.test(x)));
 const wrong=gate({...env,STORE_IDENTITY_NAME:"OkinawaDesktopTools.EKIDENMANAGER",STORE_ID:"9NL1HLJRFQ39"},"win32");
 assert.ok(wrong.some(x=>/STORE_IDENTITY_NAME/.test(x)&&/一致しません/.test(x)));
 assert.ok(wrong.some(x=>/STORE_ID/.test(x)&&/別作品/.test(x)));
});

test("Store MSIX config uses reserved display name, Japanese resource and source commit evidence",()=>{
 const record=require("../store/partner-center-identity.json");
 const conf=makeConfig({STORE_IDENTITY_NAME:record.identityName,STORE_PUBLISHER:record.publisher,
  STORE_PUBLISHER_DISPLAY_NAME:record.publisherDisplayName,STORE_DISPLAY_NAME:record.storeDisplayName,
  STORE_PACKAGE_VERSION:"1.0.0.0"});
 assert.equal(conf.msix.displayName,"引継ぎ室");
 assert.deepEqual(conf.msix.languages,["ja-JP"]);
 assert.deepEqual(conf.extraResources,[{from:"build/store-build-meta/SOURCE_GIT_COMMIT.txt",to:"SOURCE_GIT_COMMIT.txt"}]);
});

test("PowerShell MSIX verifier parses successfully on Windows",()=>{
 if(process.platform!=="win32")return;
 const {spawnSync}=require("node:child_process");
 const file=path.join(__dirname,"../scripts/verify-msix.ps1");
 const command="$tokens=$null;$errors=$null;[System.Management.Automation.Language.Parser]::ParseFile('"+file.replace(/'/g,"''")+"',[ref]$tokens,[ref]$errors)|Out-Null;if($errors.Count){$errors|ForEach-Object{Write-Error $_};exit 1}";
 const r=spawnSync("powershell.exe",["-NoProfile","-Command",command],{encoding:"utf8"});
 assert.equal(r.status,0,(r.stderr||r.stdout||"PowerShell parser failed"));
});

test("customer UI and package metadata expose no development or sale-HOLD status",()=>{
 const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
 const pkg=require("../package.json");
 assert.doesNotMatch(html,/開発版|販売品・完成品ではありません|短編心理ミステリー試作|release HOLD|QA candidate/i);
 assert.doesNotMatch(pkg.description,/development|candidate|HOLD|prototype|試作/i);
});
