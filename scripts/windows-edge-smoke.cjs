"use strict";
/* Windows hosted CI: Edge-rendered end-to-end smoke, not real-human or MSIX QA. */
const fs=require("node:fs"), os=require("node:os"), path=require("node:path");
const {createHash}=require("node:crypto");
const {spawnSync}=require("node:child_process");
const root=path.join(__dirname,"..");
const {blank,serialize,KEY}=require("../save-v9.js");
const {active}=require("../immersive-arcs.js");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),"handover-edge-smoke-"));
const output=path.join(root,"browser-smoke-output");
fs.mkdirSync(output,{recursive:true});
const edgePaths=[
  process.env["ProgramFiles(x86)"]&&path.join(process.env["ProgramFiles(x86)"],"Microsoft","Edge","Application","msedge.exe"),
  process.env.ProgramFiles&&path.join(process.env.ProgramFiles,"Microsoft","Edge","Application","msedge.exe")
].filter(Boolean);
const edge=edgePaths.find(p=>fs.existsSync(p));
if(process.platform!=="win32"||!edge){process.stderr.write("Windows and Microsoft Edge are required.\n");process.exit(2);}
const choiceIndex={
  wording:0,stoppage:1,renewals:2,private:0,repeat:1,space:2,
  author:0,targets:1,agreement:2,why:1,name:2,ask:0,quote:1,sign:2,
  records:0,agency:1,pressure:2
};
const paths={
  prefilled:["wording","space","author","why","ask"],
  "two-moments":["stoppage","private","author","private","ask"],
  "silent-rule":["renewals","space","targets","why","ask"],
  "permission-is-not-consent":["wording","space","author","private","quote"],
  "the-unspoken-objection":["stoppage","private","agreement","private","ask"],
  "protection-that-erases":["renewals","private","author","why","sign"]
};
const seeds=new Map();
for(let i=0;i<72;i++){const id=active(blank(i)).id;if(!seeds.has(id))seeds.set(id,i);}
const samples=[...seeds.values()].map((seed,i)=>({seed,width:1366,height:850,image:i===0})).concat([
  {seed:seeds.get("prefilled"),width:390,height:844,image:true},
  {seed:seeds.get("protection-that-erases"),width:390,height:844,image:true}
]);
function fixtureFor(seed){
  const arc=active(blank(seed)),arr=paths[arc.id];
  const seq=[0,choiceIndex[arr[0]],choiceIndex[arr[1]],choiceIndex[arr[2]],0,
    0,2,choiceIndex[arr[3]],choiceIndex[arr[4]],choiceIndex[arc.focus],1,1,0];
  const initial=serialize(blank(seed));
  const injected='<script>localStorage.setItem('+JSON.stringify(KEY)+','+
    JSON.stringify(initial)+');</script>';
  const driver='<script>document.addEventListener("DOMContentLoaded",function(){try{'+
    'const seq='+JSON.stringify(seq)+';'+
    'for(let i=0;i<seq.length;i++){'+
      'const opts=Array.from(document.querySelectorAll("#choices > button.option"));'+
      'const b=opts[seq[i]];'+
      'if(!b)throw Error("step "+i+" missing option "+seq[i]+", found "+opts.length);'+
      'b.click();'+
      'if(document.querySelector("#notice").textContent.includes("進行に問題"))throw Error("invalid progress step "+i);'+
    '}'+
    'const final=JSON.parse(localStorage.getItem('+JSON.stringify(KEY)+')).data;'+
    'if(final.morning?.scene!=="epilogue")throw Error("not finished");'+
    'if(final.case.seed!=='+seed+')throw Error("seed changed");'+
    'if(!document.querySelector("#narrative").textContent.includes("【大きな回収"))throw Error("no earned payoff");'+
    'if(document.documentElement.scrollWidth>innerWidth+4)throw Error("horizontal overflow "+document.documentElement.scrollWidth+"/"+innerWidth);'+
    'if(!document.querySelector("#clues details"))throw Error("no evidence notes");'+
    'if(!document.querySelector("#choices").textContent.includes("別の事件"))throw Error("missing replay");'+
    'document.body.dataset.smokeResult="SMOKE_PASS_'+seed+'";'+
  '}catch(e){document.body.dataset.smokeResult="SMOKE_FAIL_"+String(e.message||e);}});</script>';
  const replaced=html.replace('<script defer src="./game-v10.js"></script>',
    injected+'\n  <script defer src="./game-v10.js"></script>');
  if(replaced===html)throw Error("Active game script not found in fixture");
  return replaced.replace("</body>",driver+"\n</body>");
}
let allPassed=true;
try {
  for(const sample of samples){
    const tag="seed-"+sample.seed+"-"+sample.width;
    const fixture=path.join(root,".ui-smoke-"+tag+".html");
    const profile=path.join(temporary,tag);
    fs.writeFileSync(fixture,fixtureFor(sample.seed),"utf8");
    const uri="file:///"+fixture.replace(/\\/g,"/");
    const common=["--headless=new","--disable-gpu","--no-first-run",
      "--no-default-browser-check","--disable-extensions",
      "--user-data-dir="+profile,"--window-size="+sample.width+","+sample.height,
      "--virtual-time-budget=3500"];
    try{
      const result=spawnSync(edge,[...common,"--dump-dom",uri],{
        encoding:"utf8",timeout:45000,maxBuffer:12*1024*1024});
      const okay=!result.error&&result.status===0&&result.stdout.includes("SMOKE_PASS_"+sample.seed);
      if(!okay){
        allPassed=false;
        process.stderr.write(tag+" FAILED: "+(result.error?.message||result.status)+
          "\n"+(result.stdout.match(/SMOKE_FAIL_[^"<>]*/)?.[0]||result.stdout.slice(-450))+
          "\n"+result.stderr.slice(-450)+"\n");
      }else process.stdout.write(tag+" PASS: completed mystery and inference in rendered Edge\n");
      if(okay&&sample.image){
        const png=path.join(output,tag+".png");
        const cap=spawnSync(edge,[...common,"--screenshot="+png,uri],{
          encoding:"utf8",timeout:45000,maxBuffer:512*1024});
        if(cap.error||cap.status!==0||!fs.existsSync(png)){
          allPassed=false;
          process.stderr.write(tag+" capture FAILED "+(cap.error?.message||cap.status)+"\n");
        }else{
          const bytes=fs.readFileSync(png);
          const valid=bytes.length>2048&&bytes.subarray(0,8).equals(
            Buffer.from([137,80,78,71,13,10,26,10]));
          if(!valid){allPassed=false;process.stderr.write(tag+" capture contains invalid PNG\n");}
          else{
            const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
            const sha=createHash("sha256").update(bytes).digest("hex");
            process.stdout.write(tag+" capture validated "+width+"x"+height+
              " png="+bytes.length+" bytes sha256="+sha+" (CI-local only)\n");
          }
        }
      }
    }finally{fs.rmSync(fixture,{force:true});}
  }
}finally{fs.rmSync(temporary,{recursive:true,force:true});}
if(!allPassed)process.exitCode=1;
