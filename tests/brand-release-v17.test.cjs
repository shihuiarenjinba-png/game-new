"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const zlib=require("node:zlib"),fs=require("node:fs"),path=require("node:path");
const brand=require("../scripts/make-brand-assets.cjs");
const msix=require("../scripts/store-build.cjs");
const packageJson=require("../package.json");
function inspectPng(data){
 assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 const width=data.readUInt32BE(16),height=data.readUInt32BE(20);
 assert.equal(data.toString("ascii",12,16),"IHDR");
 assert.equal(data[24],8);assert.equal(data[25],6);
 let off=8,idat=[];
 while(off+12<=data.length){
  const length=data.readUInt32BE(off),type=data.toString("ascii",off+4,off+8);
  const payload=data.subarray(off+8,off+8+length);
  const recorded=data.readUInt32BE(off+8+length);
  assert.equal(brand.crc32(Buffer.concat([Buffer.from(type),payload])),recorded);
  if(type==="IDAT")idat.push(payload);
  off+=12+length;
  if(type==="IEND")break;
 }
 const expanded=zlib.inflateSync(Buffer.concat(idat));
 assert.equal(expanded.length,(width*4+1)*height);
 assert.ok(expanded.every((v,i)=>i%(width*4+1)!==0||v===0),"unexpected PNG scanline filter");
 return {width,height};
}
test("four Store icon candidates are valid PNG byte streams with exact dimensions",()=>{
 assert.equal(Object.keys(brand.specs).length,4);
 for(const [name,[w,h]] of Object.entries(brand.specs)){
  const bytes=brand.paint(w,h);
  assert.deepEqual(inspectPng(bytes),{width:w,height:h},name);
  assert.ok(bytes.length>100);
  assert.ok(bytes.equals(brand.paint(w,h)),"non-deterministic PNG: "+name);
 }
});
test("icon generation never overwrites existing art unless explicit replace flag is given",()=>{
 const source=fs.readFileSync(path.join(__dirname,"../scripts/make-brand-assets.cjs"),"utf8");
 assert.match(source,/fs\.existsSync\(filename\)&&!overwrite/);
 assert.match(source,/process\.argv\.includes\("--replace"\)/);
 assert.match(source,/if\(require\.main===module\)run/);
});
test("Store package build remains blocked until formally registered identity and approved brand",()=>{
 const issues=msix.gate({STORE_IDENTITY_NAME:"Fictional.Publisher",
   STORE_PUBLISHER:"CN=Unknown Publisher",STORE_PUBLISHER_DISPLAY_NAME:"Unknown",
   STORE_PACKAGE_VERSION:"1.0.0.0",STORE_IDENTITY_CONFIRMED:"YES"},"win32").join("\n");
 assert.match(issues,/STORE_BRAND_APPROVED/);
 assert.equal(packageJson.scripts["make:logos"],"node scripts/make-brand-assets.cjs");
 assert.equal(packageJson.scripts["build:msix"],"node scripts/store-build.cjs");
 assert.ok(msix.makeConfig({STORE_IDENTITY_NAME:"Some.Company",
  STORE_PUBLISHER:"CN=Test",STORE_PUBLISHER_DISPLAY_NAME:"Test",
  STORE_PACKAGE_VERSION:"1.0.0.0"}).files.includes("game-v16.js"));
});
test("Store product description does not promise third-party QA or published app",()=>{
 const doc=fs.readFileSync(path.join(__dirname,"../docs/V17_STORE_LISTING_DRAFT_JA.md"),"utf8");
 assert.match(doc,/HOLD/);
 assert.match(doc,/72本の独立した長編を意味するわけではありません/);
 const catalog=fs.readFileSync(path.join(__dirname,"../docs/V17_OTHER_PRODUCTS_SALES_AUDIT_JA.md"),"utf8");
 assert.match(catalog,/既存.*変更しない/);
 assert.match(catalog,/無料公開候補は1～2本/);
});
