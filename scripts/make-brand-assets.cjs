"use strict";
/* Candidate brand system for Handover Room — no external fonts, dependencies or network.
 * Distinctive door + report-sheet silhouette, antique gold on ink-charcoal.
 * Does not overwrite existing artwork unless --replace is explicitly supplied.
 */
const fs=require("node:fs"),path=require("node:path"),zlib=require("node:zlib");
const root=path.join(__dirname,".."),output=path.join(root,"build","appx");
const overwrite=process.argv.includes("--replace");
const specs={"StoreLogo.png":[50,50],"Square44x44Logo.png":[44,44],
 "Square150x150Logo.png":[150,150],"Wide310x150Logo.png":[310,150]};
const crcTable=Array.from({length:256},(_,n)=>{
 let v=n;for(let i=0;i<8;i++)v=v&1?(0xedb88320^(v>>>1)):v>>>1;return v>>>0;
});
function crc32(b){let c=0xffffffff;for(const v of b)c=crcTable[(c^v)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const id=Buffer.from(type),n=Buffer.alloc(4),c=Buffer.alloc(4);
 n.writeUInt32BE(data.length);c.writeUInt32BE(crc32(Buffer.concat([id,data])));
 return Buffer.concat([n,id,data,c]);}
function paint(width,height){
 const b=Buffer.alloc(height*(width*4+1));const square=height===width;
 const size=square?1:0.68;const cx=square?0.5:0.36,cy=0.5;
 const dist=(x,y,x1,y1,x2,y2)=>{const dx=x2-x1,dy=y2-y1;
  const t=Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-(x1+t*dx),y-(y1+t*dy));};
 const p=(x,y)=>{const u=(x/width-cx)/size+0.5,v=(y/height-cy)/size+0.5;
  let c=[20,27,30,255];const outer=Math.max(Math.abs(x/width-.5)-(square?.43:.46),
   Math.abs(y/height-.5)-.42);
  if(outer>0){const alpha=Math.max(0,1-outer*Math.min(width,height)*7);c=[20,27,30,Math.round(255*alpha)];}
  const rect=u>.22&&u<.78&&v>.12&&v>.88;
  const wall=[dist(u,v,.24,.14,.24,.85),dist(u,v,.24,.14,.76,.14),
   dist(u,v,.76,.14,.76,.85)].some(d=>d<.035);
  const leaf=[dist(u,v,.44,.24,.44,.79),dist(u,v,.44,.24,.7,.24),dist(u,v,.7,.24,.7,.79)].some(d=>d<.026);
  const slant=dist(u,v,.34,.76,.65,.43)<.027;
  const hinge=Math.hypot(u-.67,v-.59)<.022;
  if(rect&&wall)c=[206,173,114,255];
  if(rect&&leaf)c=[214,212,199,255];
  if(rect&&slant)c=[206,173,114,255];
  if(rect&&hinge)c=[206,173,114,255];
  if(!square&&x/width>.61&&x/width<.91){
   if(Math.abs(y/height-.39)<.013||Math.abs(y/height-.60)<.013)c=[206,173,114,255];
  }
  return c;
 };
 for(let y=0;y<height;y++){
  b[y*(width*4+1)]=0;
  for(let x=0;x<width;x++){
   const rgba=[0,0,0,0],scale=3;
   for(let yy=0;yy<scale;yy++)for(let xx=0;xx<scale;xx++){
    const c=p(x+(xx+.5)/scale,y+(yy+.5)/scale);
    for(let i=0;i<4;i++)rgba[i]+=c[i];
   }
   const i=y*(width*4+1)+1+x*4;
   for(let n=0;n<4;n++)b[i+n]=Math.round(rgba[n]/(scale*scale));
  }
 }
 const h=Buffer.alloc(13);h.writeUInt32BE(width,0);h.writeUInt32BE(height,4);
 h[8]=8;h[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
 chunk("IHDR",h),chunk("IDAT",zlib.deflateSync(b,{level:9})),chunk("IEND",Buffer.alloc(0))]);
}
function run(){
fs.mkdirSync(output,{recursive:true});
for(const [name,[w,h]] of Object.entries(specs)){
 const filename=path.join(output,name);
 if(fs.existsSync(filename)&&!overwrite){process.stdout.write("SKIP existing "+name+"\n");continue;}
 const content=paint(w,h);fs.writeFileSync(filename,content,{flag:"w"});
 process.stdout.write("BRAND_CANDIDATE "+name+" "+w+"x"+h+" "+content.length+" bytes\n");
}
process.stdout.write("Created candidate assets ONLY. Store art approval and Package Identity are separate gates.\n");
}
if(require.main===module)run();
module.exports={paint,specs,crc32,run};
