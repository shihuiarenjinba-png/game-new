"use strict";
/* Offline Windows Edge CDP QA: real browser keyboard navigation + mid-run reload.
 * No Playwright installation, external API, account, or game runtime change.
 * This is Windows-hosted automation, NOT human playtesting or MSIX validation.
 */
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const {spawn}=require("node:child_process");
const root=path.join(__dirname,"..");
const {blank,serialize,KEY}=require("../save-v9.js");
const arcs=require("../immersive-arcs.js");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
if(process.platform!=="win32"){process.stderr.write("Windows-only Edge QA\n");process.exit(2);}
const paths=[
  process.env["ProgramFiles(x86)"]&&path.join(process.env["ProgramFiles(x86)"],"Microsoft","Edge","Application","msedge.exe"),
  process.env.ProgramFiles&&path.join(process.env.ProgramFiles,"Microsoft","Edge","Application","msedge.exe")
].filter(Boolean);
const edge=paths.find(p=>fs.existsSync(p));
if(!edge){process.stderr.write("Microsoft Edge required\n");process.exit(2);}
const indexes={wording:0,stoppage:1,renewals:2,private:0,repeat:1,space:2,
 author:0,targets:1,agreement:2,why:1,name:2,ask:0,quote:1,sign:2,records:0,agency:1,pressure:2};
const routes={
 prefilled:["wording","space","author","why","ask"],
 "two-moments":["stoppage","private","author","private","ask"],
 "silent-rule":["renewals","space","targets","why","ask"],
 "permission-is-not-consent":["wording","space","author","private","quote"],
 "the-unspoken-objection":["stoppage","private","agreement","private","ask"],
 "protection-that-erases":["renewals","private","author","why","sign"]
};
const firstOf=new Map();
for(let seed=0;seed<72;seed++){const a=arcs.active(blank(seed)).id;if(!firstOf.has(a))firstOf.set(a,seed);}
const selected=[
 {seed:firstOf.get("permission-is-not-consent"),width:1366,height:900,scale:"1.25"},
 {seed:firstOf.get("protection-that-erases"),width:390,height:844,scale:"1.5"},
 {seed:firstOf.get("two-moments"),width:768,height:900,scale:"1"}
];
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
async function until(fn,limit=15000){
 const begin=Date.now();
 while(Date.now()-begin<limit){let v=null;try{v=await fn();}catch(_){/* execution context may reload */}if(v)return v;await pause(125);}
 throw Error("Browser response timed out");
}
class CDP{
 constructor(socket){this.socket=socket;this.id=0;this.pending=new Map();
  socket.addEventListener("message",evt=>{
    let data;try{data=JSON.parse(evt.data);}catch(_){return;}
    if(data.id!==undefined&&this.pending.has(data.id)){
      const p=this.pending.get(data.id);this.pending.delete(data.id);
      data.error?p.reject(Error(JSON.stringify(data.error))):p.resolve(data.result);
    }
  });
 }
 call(method,params={}){
  const id=++this.id;
  return new Promise((resolve,reject)=>{
   this.pending.set(id,{resolve,reject});
   this.socket.send(JSON.stringify({id,method,params}));
  });
 }
 async js(expression){
  const r=await this.call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error("JS exception: "+JSON.stringify(r.exceptionDetails).slice(0,600));
  return r.result.value;
 }
 close(){this.socket.close();}
}
async function connect(url){
 const ws=new WebSocket(url);
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error("CDP socket connection timeout")),10000);
  ws.addEventListener("open",()=>{clearTimeout(timeout);resolve();},{once:true});
  ws.addEventListener("error",()=>{clearTimeout(timeout);reject(Error("CDP WebSocket connection error"));},{once:true});
 });
 return new CDP(ws);
}
function fixture(seed){
 const begin=JSON.stringify(serialize(blank(seed)));
 const script='<script>if(!localStorage.getItem('+JSON.stringify(KEY)+'))'+
   'localStorage.setItem('+JSON.stringify(KEY)+','+begin+');</script>';
 return html.replace('<script defer src="./game-v10.js"></script>',
   script+'\n<script defer src="./game-v10.js"></script>');
}
async function run(x){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),"handover-keyboard-"));
 const filepath=path.join(root,".edge-cdp-"+x.seed+"-"+x.width+".html");
 const uri="file:///"+filepath.replace(/\\/g,"/");
 fs.writeFileSync(filepath,fixture(x.seed),"utf8");
 const profile=path.join(temp,"user");
 const child=spawn(edge,[
  "--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check",
  "--disable-extensions","--remote-debugging-port=0","--user-data-dir="+profile,
  "--window-size="+x.width+","+x.height,"--force-device-scale-factor="+x.scale,uri
 ],{stdio:"ignore",windowsHide:true});
 let cdp;
 try{
  const portFile=path.join(profile,"DevToolsActivePort");
  const port=await until(()=>fs.existsSync(portFile)?Number(fs.readFileSync(portFile,"utf8").split("\n")[0]):null,20000);
  const target=await until(async ()=>{
    try{
      const items=await (await fetch("http://127.0.0.1:"+port+"/json/list")).json();
      return items.find(p=>p.type==="page"&&p.url.startsWith("file:"));
    }catch(_){return null;}
  },12000);
  cdp=await connect(target.webSocketDebuggerUrl);
  await cdp.call("Page.enable");await cdp.call("Runtime.enable");
  async function ready(){
   return until(async()=>await cdp.js('document.readyState==="complete" && !!document.querySelector("#choices .option")'),12000);
  }
  await ready();
  const a=arcs.active(blank(x.seed)),ids=routes[a.id];
  const seq=[0,indexes[ids[0]],indexes[ids[1]],indexes[ids[2]],0,
    0,2,indexes[ids[3]],indexes[ids[4]],indexes[a.focus],1,1,0];
  // Native browser keyboard: heading -> Tab -> first choice -> Enter.
  await cdp.js('document.querySelector("#heading").focus()');
  await cdp.call("Input.dispatchKeyEvent",{type:"rawKeyDown",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
  await cdp.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Tab",code:"Tab",windowsVirtualKeyCode:9,nativeVirtualKeyCode:9});
  const isChoice=await cdp.js('document.activeElement?.matches("#choices > button.option")');
  if(!isChoice)throw Error("Tab did not reach the first actual choice");
  await cdp.call("Input.dispatchKeyEvent",{type:"rawKeyDown",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
  await cdp.call("Input.dispatchKeyEvent",{type:"char",text:"\r",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
  await cdp.call("Input.dispatchKeyEvent",{type:"keyUp",key:"Enter",code:"Enter",windowsVirtualKeyCode:13,nativeVirtualKeyCode:13});
  if(!await cdp.js('JSON.parse(localStorage.getItem('+JSON.stringify(KEY)+')).data.night1.history.length===1'))
    throw Error("Native keyboard Enter did not advance the game");
  // Proceed into morning until the witness stage, then force a real page reload.
  for(let step=1;step<7;step++){
    const idx=seq[step];
    const outcome=await cdp.js('(()=>{const b=document.querySelectorAll("#choices > button.option")['+idx+'];if(!b)return "NO_OPTION";b.click();return "OK";})()');
    if(outcome!=="OK")throw Error("Missing option "+idx+" at step "+step);
  }
  const saveBefore=await cdp.js('localStorage.getItem('+JSON.stringify(KEY)+')');
  const stateBefore=JSON.parse(saveBefore).data;
  if(!stateBefore.morning||stateBefore.morning.history.length!==1)
    throw Error("Unexpected state before reload");
  await cdp.call("Page.reload",{ignoreCache:true});
  await until(async()=>await cdp.js('document.readyState==="complete" && document.querySelector("#stage")?.textContent.includes("控室") && !!document.querySelectorAll("#choices > button.option").length'),15000);
  const saveAfter=await cdp.js('localStorage.getItem('+JSON.stringify(KEY)+')');
  if(saveAfter!==saveBefore)throw Error("Reload changed saved choice history or identity");
  for(let step=7;step<seq.length;step++){
    const outcome=await cdp.js('(()=>{const b=document.querySelectorAll("#choices > button.option")['+seq[step]+'];if(!b)return "NO_OPTION";b.click();return "OK";})()');
    if(outcome!=="OK")throw Error("Missing option after reload at step "+step);
  }
  const review=await cdp.js('(()=>({saved:JSON.parse(localStorage.getItem('+JSON.stringify(KEY)+')).data,heading:document.querySelector("#heading").textContent,story:document.querySelector("#narrative").textContent,bodyWidth:document.documentElement.scrollWidth,viewport:window.innerWidth,font:Number.parseFloat(getComputedStyle(document.querySelector("#narrative")).fontSize),buttons:[...document.querySelectorAll("#choices button.option")].length,focusable:[...document.querySelectorAll("#choices button.option")].every(e=>e.tabIndex>=0),files:[...document.querySelectorAll("#clues details")].length}))()');
  if(review.saved.morning?.scene!=="epilogue"||!review.story.includes("【大きな回収"))
    throw Error("Earned finale lost during real page reload");
  if(review.saved.case.seed!==x.seed)throw Error("Random seed changed across reload");
  if(review.bodyWidth>review.viewport+4)throw Error("Horizontal overflow "+review.bodyWidth+"/"+review.viewport);
  if(review.font<13.5)throw Error("Narrative became too small "+review.font);
  if(!review.focusable||review.buttons<2||review.files<1)throw Error("Missing navigable buttons or evidence");
  process.stdout.write("EDGE_A11Y_PASS seed="+x.seed+" route="+a.id+" width="+x.width+
    " scale="+x.scale+" saveReload=identical keyboardTabEnter=ok scrollWidth="+review.bodyWidth+
    " fontPx="+review.font+" notes="+review.files+"\n");
 }finally{
  if(cdp)cdp.close();
  child.kill();
  await pause(250);
  fs.rmSync(filepath,{force:true});
  try{fs.rmSync(temp,{force:true,recursive:true,maxRetries:4,retryDelay:250})}catch(_){/* Edge may still be exiting */}
 }
}
(async()=>{
 for(const x of selected)await run(x);
})().catch(e=>{process.stderr.write("EDGE_A11Y_FAIL: "+(e?.stack||e)+"\n");process.exitCode=1;});
