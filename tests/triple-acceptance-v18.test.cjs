"use strict";
/* Regression guards for the actual Windows GUI / MSIX test harness. */
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const save=require("../save-v14.js");
const root=path.join(__dirname,"..");
const file=x=>fs.readFileSync(path.join(root,x),"utf8");
const smoke=["scripts/windows-edge-smoke.cjs","scripts/windows-edge-accessibility.cjs",
  "scripts/windows-edge-save-transfer.cjs"];
test("all Windows GUI harnesses load one current game and seed the real active save key",()=>{
  assert.equal(save.KEY,"handover-room-prototype-v14");
  for(const p of smoke){
    const s=file(p);
    assert.match(s,/require\("\.\.\/save-v14\.js"\)/,p);
    assert.match(s,/game-v16\.js/,p);
    assert.doesNotMatch(s,/localStorage\.getItem\("handover-room-prototype-v13"\)/,p);
    assert.doesNotMatch(s,/localStorage\.setItem\("handover-room-prototype-v13"/,p);
    assert.match(s,/JSON\.stringify\(KEY\)/,p);
  }
});
test("the real reload check explicitly uses the same active KEY after page reload",()=>{
 const s=file("scripts/windows-edge-accessibility.cjs");
 const pageReload=s.indexOf('await cdp.call("Page.reload"');
 assert.ok(pageReload>0);
 const after=s.slice(pageReload,pageReload+750);
 assert.match(after,/JSON\.stringify\(KEY\)/);
 assert.doesNotMatch(after,/prototype-v13/);
 assert.match(after,/saveAfter!==saveBefore/);
});
test("Windows three-gate runner requires Node regression + GUI + real MSIX manifest",()=>{
 const s=file("scripts/run-triple-acceptance-win.ps1");
 for(const name of ["NODE_FULL_REGRESSION","STORY_VOLUME","EDGE_FULL_STORY",
  "EDGE_KEYBOARD_DPI_RELOAD","EDGE_JSON_SAVE_TRANSFER","MSIX_PREFLIGHT",
  "MSIX_BUILD","MSIX_MANIFEST","WACK","acceptance-summary.json"])
  assert.ok(s.includes(name),name);
 assert.match(s,/if\(\$RunWack -and "WACK" -notin \$passes\)/);
 assert.match(s,/stale package forbidden/);
 assert.match(s,/No automatic npm install/);
 assert.doesNotMatch(s,/Remove-AppxPackage|Uninstall-Package|Import-PfxCertificate|Start-Process\s+-Verb\s+RunAs/);
 assert.match(s,/INCOMPLETE_OR_FAILED/);
 assert.match(s,/Store_release|store_release/);
});
test("MSIX build still checks package identity and artifact rather than accepting zero exit",()=>{
 const s=file("scripts/store-build.cjs");
 for(const k of ["STORE_IDENTITY_NAME","STORE_PUBLISHER","STORE_IDENTITY_CONFIRMED",
  "STORE_BRAND_APPROVED","STORE_PACKAGE_VERSION","MSIX_BUILD_AUDIT.json","verify-msix.ps1"])
   assert.ok(s.includes(k),k);
 assert.match(s,/buildStartedAt/);
 assert.match(s,/MSIXのビルドはWindows実機上で実行してください/);
 const wack=file("scripts/verify-msix.ps1");
 for(const k of ['AppxManifest.xml','GetAttribute("Name")','GetAttribute("Version")',
  'GetAttribute("Publisher")','ProcessorArchitecture','MSIXUPLOAD'])
  assert.ok(wack.toLowerCase().includes(k.toLowerCase()),k);
});
