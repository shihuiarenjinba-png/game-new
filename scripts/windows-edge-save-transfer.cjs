"use strict";
/* Windows Edge, end-to-end local backup QA.
 * Exercises actual browser download, File input, invalid/cancelled import,
 * accepted import, full reload, and case isolation. Never touches real saves.
 */
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawn}=require("node:child_process");
const {blank,serialize,KEY}=require("../save-v13.js");
const arcs=require("../deliberative-arcs-v13.js");
const base=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(base,"index.html"),"utf8");
const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
async function until(fn,limit=18000){
 const start=Date.now();let error;
 while(Date.now()-start<limit){
  try{const v=await fn();if(v)return v;}catch(e){error=e;}
  await wait(150);
 }
 throw Error("Timed out"+(error?": "+error.message:""));
}
class CDP{
 constructor(socket){
  this.socket=socket;this.sequence=0;this.pending=new Map();
  socket.addEventListener("message",evt=>{
   let data;try{data=JSON.parse(evt.data)}catch(_){return}
   if(data.id!==undefined&&this.pending.has(data.id)){
    const p=this.pending.get(data.id);this.pending.delete(data.id);
    data.error?p.reject(Error(JSON.stringify(data.error))):p.resolve(data.result);
   }
  });
 }
 send(method,params={}){
  const id=++this.sequence;
  return new Promise((resolve,reject)=>{
   this.pending.set(id,{resolve,reject});
   this.socket.send(JSON.stringify({id,method,params}));
  });
 }
 async js(expression){
  const r=await this.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error("JavaScript: "+JSON.stringify(r.exceptionDetails));
  return r.result.value;
 }
 close(){this.socket.close();}
}
async function connect(url){
 const socket=new WebSocket(url);
 await new Promise((ok,fail)=>{
  const deadline=setTimeout(()=>fail(Error("Cannot connect to Edge")),10000);
  socket.addEventListener("open",()=>{clearTimeout(deadline);ok();},{once:true});
  socket.addEventListener("error",()=>{clearTimeout(deadline);fail(Error("Socket failed"));},{once:true});
 });
 return new CDP(socket);
}
async function testCase(seed){
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),"handover-save-qa-"));
 const profile=path.join(scratch,"browser"),downloads=path.join(scratch,"downloads");
 fs.mkdirSync(downloads);
 const fixture=path.join(base,".qa-save-"+seed+".html");
 const initial=serialize(blank(seed));
 const injected="<script>if(!localStorage.getItem("+JSON.stringify(KEY)+"))localStorage.setItem("+
   JSON.stringify(KEY)+","+JSON.stringify(initial)+");</script>";
 const content=html.replace('<script defer src="./game-v13.js"></script>',
   injected+'\n<script defer src="./game-v13.js"></script>');
 if(content===html)throw Error("Entrypoint changed");
 fs.writeFileSync(fixture,content);
 const uri="file:///"+fixture.replace(/\\/g,"/");
 const edgePaths=[
  process.env["ProgramFiles(x86)"]&&path.join(process.env["ProgramFiles(x86)"],"Microsoft","Edge","Application","msedge.exe"),
  process.env.ProgramFiles&&path.join(process.env.ProgramFiles,"Microsoft","Edge","Application","msedge.exe")
 ].filter(Boolean);
 const edge=edgePaths.find(x=>fs.existsSync(x));
 if(process.platform!=="win32"||!edge)throw Error("Windows Edge required");
 const browser=spawn(edge,[
  "--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
  "--disable-extensions","--remote-debugging-port=0",
  "--user-data-dir="+profile,uri
 ],{stdio:"ignore",windowsHide:true});
 let tab;
 try{
  const file=path.join(profile,"DevToolsActivePort");
  const port=await until(()=>fs.existsSync(file)?Number(fs.readFileSync(file,"utf8").split("\n")[0]):null);
  const info=await until(async()=>{
   try{const items=await (await fetch("http://127.0.0.1:"+port+"/json/list")).json();
   return items.find(x=>x.type==="page"&&x.url.startsWith("file:"));}
   catch(_){return null;}
  });
  tab=await connect(info.webSocketDebuggerUrl);
  await tab.send("Page.enable");await tab.send("Runtime.enable");
  await tab.send("Page.setDownloadBehavior",{behavior:"allow",downloadPath:downloads});
  const js=expr=>tab.js(expr);
  const ready=()=>until(()=>js('document.readyState==="complete" && !!document.querySelector("#choices button.option")'));
  await ready();
  const click=async(selector)=>js('(()=>{const n=document.querySelector('+JSON.stringify(selector)+');if(!n)return false;n.click();return true;})()');
  const step=async(i)=>js('(()=>{const o=document.querySelectorAll("#choices button.option")['+i+'];if(!o)return false;o.click();return true;})()');
  if(!await step(0)||!await step(1))throw Error("Could not advance initial investigation");
  const original=await js("localStorage.getItem("+JSON.stringify(KEY)+")");
  const before=JSON.parse(original).data;
  if(before.night1.history.length!==2)throw Error("Not at a 2-step checkpoint");
  await click(".data-tools summary");
  if(!await click("#export-save"))throw Error("Export control missing");
  const filename="handover-room-save-v13.json";
  const fileOut=path.join(downloads,filename);
  await until(()=>{
   if(!fs.existsSync(fileOut))return false;
   const size=fs.statSync(fileOut).size;
   return size>20&&!fs.readdirSync(downloads).some(x=>x.endsWith(".crdownload"));
  },18000);
  const onDisk=fs.readFileSync(fileOut,"utf8");
  if(onDisk!==original)throw Error("Downloaded bytes do not match current save");
  process.stdout.write("SAVE_EXPORT_PASS seed="+seed+" bytes="+Buffer.byteLength(onDisk)+"\n");
  const staged={raw:onDisk,KEY};
  // File input takes an actual File instance; drag-and-drop equivalent without OS dialog.
  const inject=async(raw,name)=>{
   const data=JSON.stringify(raw),fileName=JSON.stringify(name);
   const action='(()=>{const d=new DataTransfer();d.items.add(new File(['+data+'],'+fileName+', {type:"application/json"}));'+
     'const input=document.querySelector("#import-file");input.files=d.files;input.dispatchEvent(new Event("change",{bubbles:true}));return true;})()';
   return js(action);
  };
  const checkpoint=await js("localStorage.getItem("+JSON.stringify(KEY)+")");
  if(!await inject("{not a valid JSON","corrupt.json"))throw Error("Invalid import test not triggered");
  await until(()=>js('document.querySelector("#storage-status").textContent.includes("読み込みを中止")'));
  if(await js("localStorage.getItem("+JSON.stringify(KEY)+")")!==checkpoint)
   throw Error("Corrupted import overwrote existing save");
  process.stdout.write("SAVE_CORRUPT_REJECT_PASS seed="+seed+"\n");
  // Correct JSON for another seeded case must not override the current game when cancelled.
  const replacement=serialize(blank((seed+1)%72));
  await js("window.confirm=()=>false");
  if(!await inject(replacement,"other-case.json"))throw Error("Cancellation test not triggered");
  await until(()=>js('document.querySelector("#import-file").value===""'));
  if(await js("localStorage.getItem("+JSON.stringify(KEY)+")")!==checkpoint)
   throw Error("Cancelled import mutated saved progress");
  process.stdout.write("SAVE_CANCEL_PASS seed="+seed+"\n");
  // Change the checkpoint, then actually import the previously downloaded JSON.
  await js("window.confirm=()=>true");
  if(!await step(2))throw Error("Couldn't move past backup checkpoint");
  const modified=await js("localStorage.getItem("+JSON.stringify(KEY)+")");
  if(modified===checkpoint)throw Error("Progress did not change");
  await inject(onDisk,filename);
  await until(()=>js('document.querySelector("#notice").textContent.includes("保存ファイルから調査を復元")'));
  const restored=await js("localStorage.getItem("+JSON.stringify(KEY)+")");
  if(JSON.stringify(JSON.parse(restored).data)!==JSON.stringify(before))
   throw Error("Accepted import did not restore saved story or findings");
  const notes=await js("document.querySelectorAll('#clues details').length");
  if(notes<1)throw Error("Clues missing after import");
  await tab.send("Page.reload",{ignoreCache:true});
  await ready();
  const afterReload=await js("localStorage.getItem("+JSON.stringify(KEY)+")");
  if(JSON.stringify(JSON.parse(afterReload).data)!==JSON.stringify(before))
   throw Error("Reload after accepted import lost story");
  process.stdout.write("SAVE_IMPORT_RELOAD_PASS seed="+seed+" clues="+notes+"\n");
  // Import another seed, verify the UI displays its original blank chapter and no prior clues.
  await js("window.confirm=()=>true");
  await click(".data-tools summary");
  await inject(replacement,"other-case.json");
  await until(()=>js('JSON.parse(localStorage.getItem('+JSON.stringify(KEY)+')).data.case.seed==='+((seed+1)%72)));
  if(await js('document.querySelectorAll("#clues details").length')!==0)
   throw Error("Old case leaked its evidence after import");
  if(!await js('document.querySelector("#heading").textContent.length>0'))
   throw Error("Blank imported case did not render");
  process.stdout.write("SAVE_CROSS_CASE_ISOLATION_PASS seed="+seed+"\n");
 }finally{
  if(tab)tab.close();
  browser.kill();await wait(350);
  fs.rmSync(fixture,{force:true});
  try{fs.rmSync(scratch,{recursive:true,force:true,maxRetries:4,retryDelay:300})}catch(_){/* Edge exiting */}
 }
}
(async()=>{
 for(const seed of [0,7,24])await testCase(seed);
})().catch(e=>{process.stderr.write("SAVE_E2E_FAIL "+(e?.stack||e)+"\n");process.exitCode=1;});
