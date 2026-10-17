"use strict";
/* Read-only source/logic audit. No packaging, signing, uploading or Store access.
 * Produces an explicit HOLD if formal Identity/artwork/MSIX/Windows checks are absent.
 */
const fs=require("node:fs"),path=require("node:path"),os=require("node:os");
const {spawnSync}=require("node:child_process");
const root=path.join(__dirname,"..");
const builder=require("./store-build.cjs");
const logos=require("./make-brand-assets.cjs");
const required=["index.html","style.css","game-v16.js","journey-v16.js",
 "desktop/main.cjs","scripts/store-build.cjs","scripts/verify-msix.ps1",
 "scripts/make-brand-assets.cjs","scripts/run-windows-local-qa.ps1",
 "docs/V17_STORE_LISTING_DRAFT_JA.md","docs/V17_OTHER_PRODUCTS_SALES_AUDIT_JA.md"];
const checks=[],blocks=[];
function check(label,ok,detail){checks.push({label,status:ok?"PASS":"FAIL",detail:detail||""});if(!ok)blocks.push(label+": "+detail);}
for(const file of required)check("required "+file,fs.existsSync(path.join(root,file)),"required for planned product");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const active=[...html.matchAll(/<script defer src="\.\/([^"]+)"/g)].map(x=>x[1]);
check("one visible story panel",(html.match(/class="story-panel"/g)||[]).length===1,"avoid additional tabs and screens");
check("one active game engine",active.filter(x=>/^game-v\d+\.js$/.test(x)).join(",")==="game-v16.js",
 "only the current game engine should be loaded");
check("journey loads before game",active.indexOf("journey-v16.js")>=0&&
 active.indexOf("journey-v16.js")<active.indexOf("game-v16.js"),"avoid undefined UI state");
for(const file of active)check("script listed "+file,fs.existsSync(path.join(root,file)),"script file must be present");
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const major=process.versions.node.split(".").map(Number);
const supported=major[0]>22||major[0]===22&&major[1]>=12;
check("Node version >=22.12",supported,process.version);
check("MSIX-only Store build",pkg.scripts["build:msix"]==="node scripts/store-build.cjs",
 "do not publish ZIP/NSIS as the Microsoft Store package");
check("store logo approval gated",fs.readFileSync(path.join(root,"scripts/store-build.cjs"),"utf8")
 .includes("STORE_BRAND_APPROVED"),"owner approval before build");
for(const [file,[w,h]] of Object.entries(logos.specs)){
  const png=logos.paint(w,h);
  check("logo candidate "+file,png.subarray(0,8).toString("hex")==="89504e470d0a1a0a"&&
    png.readUInt32BE(16)===w&&png.readUInt32BE(20)===h,w+"x"+h);
}
const testFiles=fs.readdirSync(path.join(root,"tests")).filter(x=>x.endsWith(".test.cjs"))
 .map(x=>path.join("tests",x));
let testExit=null,auditExit=null;
if(!process.argv.includes("--static-only")){
 const r=spawnSync(process.execPath,["--test",...testFiles],{cwd:root,encoding:"utf8",maxBuffer:32*1024*1024,timeout:180000});
 testExit=r.error?-1:r.status;
 check("complete Node regression",testExit===0,
  "exit="+testExit+"; "+testFiles.length+" test files; "+(r.error?.message||""));
 const story=spawnSync(process.execPath,["scripts/story-volume-audit.cjs"],{
  cwd:root,encoding:"utf8",maxBuffer:16*1024*1024,timeout:60000});
 auditExit=story.error?-1:story.status;
 check("6-route story volume",auditExit===0,"exit="+auditExit+"; "+(story.error?.message||""));
}
const packageBlockers=builder.gate(process.env,process.platform);
const dist=path.join(root,"dist-msix");
const built=fs.existsSync(dist)?fs.readdirSync(dist).filter(x=>/\.(msix|msixupload)$/i.test(x)):[];
const msix=built.filter(x=>/\.msix$/i.test(x)),uploads=built.filter(x=>/\.msixupload$/i.test(x));
const hold=[
 ...packageBlockers,
 ...(!msix.length?["生成済みMSIXなし"]:[]),
 ...(!uploads.length?["生成済みMSIXUPLOADなし"]:[]),
 "正式パッケージの実機インストール/WACK/更新・削除受入ログなし",
 "第三者の6ルート試遊・購入意思・価格検証なし",
 "Microsoft Storeへの提出・認証なし"
];
const out={
 timestamp:new Date().toISOString(),
 project:"引継ぎ室",branch:"feature/handover-v17-brand-store-audit",
 type:"DEVELOPMENT_QA_NOT_STORE_CERTIFICATION",node:process.version,platform:process.platform,
 codeStatus:blocks.length?"FAIL":"PASS",commercialStatus:"HOLD",
 testsRun:!process.argv.includes("--static-only"),testExit,auditExit,
 checks,codeFailures:blocks,storeBlockers:hold,
 artifacts:built,
 explanation:"A PASS in source/Node tests never equals real Windows MSIX installation, WACK, human playtest or Store certification."
};
const folder=path.join(root,"qa-local-output");
fs.mkdirSync(folder,{recursive:true});
const report=path.join(folder,"V17_RELEASE_AUDIT.json");
fs.writeFileSync(report,JSON.stringify(out,null,2)+"\n");
process.stdout.write("Final source audit: "+out.codeStatus+"; store: HOLD\n"+
 "Tests: "+(!out.testsRun?"SKIPPED":testExit)+"; MSIX: "+msix.length+
 "; Uploads: "+uploads.length+"; blockers: "+hold.length+"\n"+
 "Report: "+report+"\n");
if(blocks.length)process.stderr.write(blocks.map(x=>" - "+x).join("\n")+"\n");
process.exitCode=blocks.length?1:0;
