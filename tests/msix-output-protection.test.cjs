"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const script=fs.readFileSync("scripts/store-build.cjs","utf8");
test("previous Store candidate artifacts and generated builder config cannot be overwritten",()=>{
 assert.match(script,/fs\.existsSync\(generated\)/);
 assert.match(script,/fs\.existsSync\(outputFolder\)/);
 assert.match(script,/fs\.readdirSync\(outputFolder\)\.length/);
 assert.match(script,/writeFileSync\(generated,[\s\S]*?\{flag:"wx"\}/);
 assert.doesNotMatch(script,/writeFileSync\(generated,[\s\S]*?\{flag:"w"\}/);
});
test("the real mystery context view is included in the MSIX packaging list",()=>{
 const {makeConfig}=require("../scripts/store-build.cjs");
 const config=makeConfig({STORE_PACKAGE_VERSION:"1.0.0.0",
 STORE_IDENTITY_NAME:"OkinawaDesktopTools.test",STORE_PUBLISHER:"CN=TEST",
 STORE_PUBLISHER_DISPLAY_NAME:"Okinawa Desktop Tools"});
 assert.equal(config.win.target[0].target,"msix");
 assert.ok(config.files.includes("handover-context.css"));
 assert.ok(config.files.includes("handover-tabs.js"));
 assert.ok(config.files.includes("style.css"));
});