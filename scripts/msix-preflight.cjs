"use strict";
/* Non-destructive MSIX preflight. Builds nothing, signs nothing. */
const {gate,makeConfig}=require("./store-build.cjs");
const issues=gate(process.env);
if(issues.length){
  process.stderr.write("MSIX準備: HOLD（不足・不一致）\n"+
    issues.map(s=>" - "+s).join("\n")+"\n"+
    "実ファイルの生成はしていません。Partner Center情報と正式PNGを揃えて再検査してください。\n");
  process.exitCode=2;
}else{
  const config=makeConfig(process.env);
  process.stdout.write("MSIX_PRECHECK_PASS\n"+
    "Identity.Name: "+config.msix.identityName+"\n"+
    "Publisher: "+config.msix.publisher+"\n"+
    "Version: "+config.buildVersion+"\n"+
    "Target: MSIX x64 / MSIXUPLOAD\n"+
    "ここではビルドしていません。実際の作成は npm run build:msix です。\n");
}
