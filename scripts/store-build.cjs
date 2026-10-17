"use strict";
/* Store submission remains deliberately blocked without the real Partner Center identity. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {spawnSync} = require("node:child_process");
const root = path.join(__dirname, "..");

const LOGOS = Object.freeze({
  "StoreLogo.png": [50,50],
  "Square150x150Logo.png": [150,150],
  "Square44x44Logo.png": [44,44],
  "Wide310x150Logo.png": [310,150]
});
function storeVersion(version) {
  if(typeof version!=="string"||!/^\d+\.\d+\.\d+\.\d+$/.test(version))return false;
  const n=version.split(".").map(Number);
  return n[0]>=1 && n.every(v=>Number.isInteger(v)&&v>=0&&v<=65535) && n[3]===0;
}
function pngDimensions(file) {
  const b=fs.readFileSync(file);
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  if(b.length<33||!b.subarray(0,8).equals(sig)||b.toString("ascii",12,16)!=="IHDR")return null;
  return [b.readUInt32BE(16),b.readUInt32BE(20)];
}
function gate(env, platform = process.platform) {
  const issues = [];
  const fields = ["STORE_IDENTITY_NAME", "STORE_PUBLISHER", "STORE_PUBLISHER_DISPLAY_NAME"];
  for (const field of fields) {
    if (!env[field] || !env[field].trim()) issues.push(field + " が未設定です");
    else if (/\b(?:placeholder|example|dummy|test-only)\b/i.test(env[field]))
      issues.push(field + " が仮の値です");
  }
  if (env.STORE_IDENTITY_NAME && !/^[a-zA-Z0-9.-]{3,50}$/.test(env.STORE_IDENTITY_NAME))
    issues.push("STORE_IDENTITY_NAME の書式が不正です");
  if (env.STORE_PUBLISHER && !/^CN=.+/.test(env.STORE_PUBLISHER))
    issues.push("STORE_PUBLISHER は証明書に一致する CN=... 形式で設定してください");
  if (platform !== "win32") issues.push("MSIXのビルドはWindows実機上で実行してください");
  if (env.STORE_IDENTITY_CONFIRMED !== "YES")
    issues.push("STORE_IDENTITY_CONFIRMED=YES が未設定です（Partner Centerの正式Identity照合が必要）");
  if (!storeVersion(env.STORE_PACKAGE_VERSION))
    issues.push("STORE_PACKAGE_VERSION は1.0.0.0形式（先頭1以上・末尾0）で設定してください");
  if (/^CN=ms$/i.test(env.STORE_PUBLISHER||""))
    issues.push("STORE_PUBLISHER に仮のCN=msは使用できません。Partner Centerの正式発行者を指定してください");
  const required = ["index.html", "style.css", "story.js", "morning.js",
    "save-guard.js", "case-notes.js", "case-variants.js", "case-notes-v5.js", "major-arcs.js", "case-notes-v6.js", "verified-arcs.js", "case-notes-v7.js", "six-arcs.js", "case-notes-v8.js", "immersive-arcs.js", "scene-beats.js", "case-notes-v9.js", "deduction.js", "save-v4.js", "save-v5.js", "save-v6.js", "save-v7.js", "save-v8.js", "save-v9.js", "reading-v10.js", "deliberation-v13.js", "deliberative-arcs-v13.js", "notes-v13.js", "reading-v13.js", "save-v13.js", "game-v13.js", "midpoint-v14.js", "arcs-v14.js", "notes-v14.js", "consequences-v14.js", "save-v14.js", "reading-v14.js", "game-v14.js", "desktop/main.cjs"];
  for (const name of required)
    if (!fs.existsSync(path.join(root, name))) issues.push("不足ファイル: " + name);
  for (const [name,expected] of Object.entries(LOGOS)) {
    const file=path.join(root,"build","appx",name);
    if (!fs.existsSync(file)) {issues.push("正式ロゴ未配置: build/appx/"+name);continue;}
    try {
      const measured=pngDimensions(file);
      if(!measured||measured[0]!==expected[0]||measured[1]!==expected[1])
        issues.push("ロゴ寸法が不一致: "+name+" / 必要 "+expected.join("x")+"px");
    } catch(_error) {
      issues.push("ロゴを読み込めません: "+name);
    }
  }
  return issues;
}

function makeConfig(env) {
  return {
    appId: "jp.handoverroom.game",
    productName: "引継ぎ室",
    buildVersion: env.STORE_PACKAGE_VERSION,
    asar: true,
    files: ["index.html", "style.css", "story.js", "morning.js", "save-guard.js", "case-notes.js", "case-variants.js", "case-notes-v5.js", "major-arcs.js", "case-notes-v6.js", "verified-arcs.js", "case-notes-v7.js", "six-arcs.js", "case-notes-v8.js", "immersive-arcs.js", "scene-beats.js", "case-notes-v9.js", "deduction.js", "save-v4.js", "save-v5.js", "save-v6.js", "save-v7.js", "save-v8.js", "save-v9.js", "reading-v10.js", "deliberation-v13.js", "deliberative-arcs-v13.js", "notes-v13.js", "reading-v13.js", "save-v13.js", "game-v13.js", "midpoint-v14.js", "arcs-v14.js", "notes-v14.js", "consequences-v14.js", "save-v14.js", "reading-v14.js", "game-v14.js", "desktop/main.cjs", "package.json"],
    directories: {output: "dist-msix", buildResources: "build"},
    toolsets: {winCodeSign: "1.1.0"},
    win: {target: [{target:"msix", arch:["x64"]}]},
    msix: {
      applicationId: "HandoverRoom",
      identityName: env.STORE_IDENTITY_NAME,
      publisher: env.STORE_PUBLISHER,
      publisherDisplayName: env.STORE_PUBLISHER_DISPLAY_NAME,
      displayName: "引継ぎ室",
      languages: ["ja-JP"],
      createMsixupload: true,
      setBuildNumber: false,
      capabilities: ["runFullTrust"]
    }
  };
}

function run() {
  const blockers = gate(process.env);
  if (blockers.length) {
    process.stderr.write("MSIX販売用ビルドはHOLDです:\n" + blockers.map(x => " - " + x).join("\n") + "\n");
    process.exitCode = 2;
    return;
  }
  const builder = path.join(root,"node_modules","electron-builder","cli.js");
  if (!fs.existsSync(builder)) {
    process.stderr.write("electron-builder がありません。Windowsで npm install してください。\n");
    process.exitCode = 2;
    return;
  }
  const generated = path.join(root,"electron-builder.store.generated.json");
  fs.writeFileSync(generated, JSON.stringify(makeConfig(process.env), null, 2) + "\n", {flag:"w"});
  const child = spawnSync(process.execPath, [builder, "--win", "msix", "--x64", "--config", generated, "--publish", "never"],
    {cwd:root,stdio:"inherit",shell:false});
  if (child.error || child.status !== 0) {
    process.stderr.write("MSIX生成失敗: "+(child.error?.message||"exit code "+child.status)+"\n");
    process.exitCode=child.status||1;
    return;
  }
  // A zero exit code alone cannot prove the Store submission artifact exists.
  const folder=path.join(root,"dist-msix");
  const artifacts=fs.readdirSync(folder).filter(x=>/\.(msix|msixupload)$/i.test(x));
  const packages=artifacts.filter(x=>/\.msix$/i.test(x));
  const uploads=artifacts.filter(x=>/\.msixupload$/i.test(x));
  const errors=[];
  if(!packages.length)errors.push("MSIXファイルがありません");
  if(!uploads.length)errors.push("Store用MSIXUPLOADファイルがありません");
  const details=artifacts.map(name=>{
    const full=path.join(folder,name),size=fs.statSync(full).size;
    const hash=crypto.createHash("sha256").update(fs.readFileSync(full)).digest("hex");
    if(size<1024)errors.push("パッケージが小さすぎます: "+name);
    return {name,size,sha256:hash};
  });
  const report={
    generatedAt:new Date().toISOString(),identity:process.env.STORE_IDENTITY_NAME,
    publisher:process.env.STORE_PUBLISHER,packageVersion:process.env.STORE_PACKAGE_VERSION,
    packages:details,result:errors.length?"HOLD":"BUILT_NOT_CERTIFIED",
    cautions:["Partner Centerの正式Identityとの一致確認が必要",
      "MSIX内のマニフェストを確認しWACKおよびインストール・更新テストが必要",
      "Store提出・署名・公開は行っていません"]
  };
  fs.writeFileSync(path.join(folder,"MSIX_BUILD_AUDIT.json"),JSON.stringify(report,null,2)+"\n");
  if(errors.length) {
    process.stderr.write("MSIX成果物の検証に失敗:\n"+errors.join("\n")+"\n");
    process.exitCode=2;
    return;
  }
  process.stdout.write("MSIX / MSIXUPLOAD の生成を確認しました（Store審査は未実施）。\n");
  process.exitCode=0;
}
if (require.main === module) run();
module.exports = {gate,makeConfig,storeVersion,pngDimensions,LOGOS};
