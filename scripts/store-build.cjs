"use strict";
/* Store submission remains deliberately blocked without the real Partner Center identity. */
const fs = require("node:fs");
const path = require("node:path");
const {spawnSync} = require("node:child_process");
const root = path.join(__dirname, "..");

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
  const required = ["index.html", "style.css", "story.js", "morning.js",
    "save-guard.js", "case-notes.js", "case-variants.js", "case-notes-v5.js", "major-arcs.js", "case-notes-v6.js", "verified-arcs.js", "case-notes-v7.js", "deduction.js", "save-v4.js", "save-v5.js", "save-v6.js", "save-v7.js", "game-v7.js", "desktop/main.cjs"];
  for (const name of required)
    if (!fs.existsSync(path.join(root, name))) issues.push("不足ファイル: " + name);
  const logoFiles = ["StoreLogo.png", "Square150x150Logo.png", "Square44x44Logo.png", "Wide310x150Logo.png"];
  for (const name of logoFiles)
    if (!fs.existsSync(path.join(root, "build", "appx", name))) issues.push("正式ロゴ未配置: build/appx/" + name);
  return issues;
}

function makeConfig(env) {
  return {
    appId: "jp.handoverroom.game",
    productName: "引継ぎ室",
    asar: true,
    files: ["index.html", "style.css", "story.js", "morning.js", "save-guard.js", "case-notes.js", "case-variants.js", "case-notes-v5.js", "major-arcs.js", "case-notes-v6.js", "verified-arcs.js", "case-notes-v7.js", "deduction.js", "save-v4.js", "save-v5.js", "save-v6.js", "save-v7.js", "game-v7.js", "desktop/main.cjs", "package.json"],
    directories: {output: "dist-msix", buildResources: "build"},
    toolsets: {winCodeSign: "1.1.0"},
    win: {target: [{target:"msix", arch:["x64"]}]},
    msix: {
      identityName: env.STORE_IDENTITY_NAME,
      publisher: env.STORE_PUBLISHER,
      publisherDisplayName: env.STORE_PUBLISHER_DISPLAY_NAME,
      displayName: "引継ぎ室",
      languages: ["ja-JP"],
      createMsixupload: true,
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
  process.exitCode = child.status === 0 ? 0 : (child.status || 1);
}
if (require.main === module) run();
module.exports = {gate,makeConfig};
