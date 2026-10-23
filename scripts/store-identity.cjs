"use strict";
// Read-only identity cross-check against the owner's Partner Center draft screenshot.
const record=require("../store/partner-center-identity.json");
function issues(env,{required=true}={}){
 const errors=[];
 const fields=[
  ["STORE_IDENTITY_NAME","identityName"],
  ["STORE_PUBLISHER","publisher"],
  ["STORE_PUBLISHER_DISPLAY_NAME","publisherDisplayName"],
  ["STORE_DISPLAY_NAME","storeDisplayName"]
 ];
 for(const [variable,key] of fields){
  if(!env[variable]){if(required)errors.push(variable+" を正規のPartner Center値で設定してください");continue;}
  if(env[variable]!==record[key])errors.push(variable+" がこのゲームの商品枠と一致しません（別作品のIdentityは禁止）");
 }
 if(env.STORE_ID && env.STORE_ID!==record.storeId)errors.push("STORE_ID が別作品の商品枠です");
 if(!record.partnerCenterStatus)errors.push("Partner Center状態の記録がありません");
 if(record.storeSubmission!=="HOLD")errors.push("販売承認ゲートが予期せず変更されています");
 if(!record.packageFamilyName.startsWith(record.identityName+"_"))errors.push("Package Family NameがIdentity Nameと整合しません");
 return errors;
}
if(require.main===module){
 const errs=issues(process.env);
 if(errs.length){process.stderr.write("IDENTITY_HOLD\n"+errs.join("\n")+"\n");process.exitCode=2;}
 else process.stdout.write("STORE_IDENTITY_MATCH — 登録情報の照合のみ成功。MSIX生成・WACK・販売提出は未実施です。\n");
}
module.exports={record,issues};
