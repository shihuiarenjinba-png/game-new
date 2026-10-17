/* v0.13 — a provisional theory, then a deliberate reconsideration.
 * These are INTERPRETATIONS, never manufactured evidence. The player must
 * still prove the actual central inference from earned primary testimony.
 */
(function(root,factory){
 const arcs=typeof module!=="undefined"&&module.exports?require("./immersive-arcs.js"):root.HandoverImmersiveArcs;
 const api=factory(arcs);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverDeliberation=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(arcs){
 "use strict";
 const INITIAL=["surface","system","unknown"];
 const REVISION=["revise","retain","suspend"];
 const PLOTS=Object.freeze({
  prefilled:{
   surface:"三人が同じ説明を考えたのかもしれない",
   system:"誰かが使う文面を用意したのかもしれない",
   unknown:"文章の一致だけでは、誰が考えたか分からない",
   question:"同じ文章を最初に用意した人は誰なのか"
  },
  "two-moments":{
   surface:"『続ける』という本人の言葉が最終的な意思だったのかもしれない",
   system:"『止めたい』という相談が途中で消されたのかもしれない",
   unknown:"二つの発言の時点を確かめないと判断できない",
   question:"二つの言葉は本当に同じ場面を表しているのか"
  },
  "silent-rule":{
   surface:"正式な命令が見つからないなら、強制はなかったのかもしれない",
   system:"書かれない慣行が意思決定を縛ったのかもしれない",
   unknown:"誰が何を規則だと信じていたのか、まだ不明だ",
   question:"命令の有無と、実際に感じていた圧力を分けられるか"
  },
  "permission-is-not-consent":{
   surface:"署名があるなら、文面を使うことも許されたのかもしれない",
   system:"言葉の引用には本人の条件があるのかもしれない",
   unknown:"誰がどの公開範囲を許したか、まだ分からない",
   question:"報告内容の一致と、公開への同意は同じことなのか"
  },
  "the-unspoken-objection":{
   surface:"反対が記録されていないなら、異議はなかったのかもしれない",
   system:"異論を表明しにくい状況があったのかもしれない",
   unknown:"発言の機会があったか、記録だけでは分からない",
   question:"沈黙を賛成とみなす前に、何を確かめるべきか"
  },
  "protection-that-erases":{
   surface:"証言しないのは、事故の詳細を隠したいからかもしれない",
   system:"誰かへの不利益を心配して言葉を控えたのかもしれない",
   unknown:"沈黙の理由は一人ずつ聞かなければ分からない",
   question:"相手を守ろうとする沈黙で、どの事実が消えたのか"
  }
 });
 function compatible(s){return s?.arcMode==="deliberative"?{...s,arcMode:"immersive"}:s;}
 function active(s){return arcs.active(compatible(s));}
 function hasSource(s){const a=active(s);return !!a && s.night1.clues.includes(a.entry);}
 function blank(){return {initial:null,revision:null};}
 function valid(h){
  return !!h&&typeof h==="object"&&!Array.isArray(h)&&
   Object.keys(h).sort().join(",")==="initial,revision"&&
   (h.initial===null||INITIAL.includes(h.initial))&&
   (h.revision===null||REVISION.includes(h.revision));
 }
 function firstOptions(s){
  const arc=active(s),p=arc&&PLOTS[arc.id];
  if(!p)throw Error("事件の中心が不明です");
  const labels=hasSource(s)?[p.surface,p.system,p.unknown]:[
   "今ある記録の文章の扱いを、もう一度調べる",
   "人物が話せる状況を、先に確かめる",
   "まだ根拠が足りないと考え、結論を保留する"];
  return INITIAL.map((id,i)=>({id:"hypothesis:"+id,label:labels[i],
   hint:"現時点の仮説。翌朝の新しい証言で考え直せる"}));
 }
 function beginning(s){
  const a=active(s),p=PLOTS[a.id];
  return {label:"第一夜 / 仮説を記録",title:"今の情報で、どう考えるか",
   body:(hasSource(s)?"【確認済み】 "+a.first+"\n\n":"この夜には、事件の中心に触れる記録を十分に調べていない。\n\n")+
    "これは結論ではない。今の考えを一つ残し、翌朝の証言で検証する。"+
    (hasSource(s)?"\n問い： "+p.question:""),
   question:"今の暫定的な見方を選ぶ",choices:firstOptions(s)};
 }
 function second(s){
  const a=active(s),p=PLOTS[a.id],st=arcs.status(compatible(s));
  const initial=hasSource(s)?p[s.midpoint.initial]:
   ["記録の文章の扱いを再確認する","人物が話せる状況を確認する","いったん保留する"][INITIAL.indexOf(s.midpoint.initial)];
  const observations=[];
  if(st?.source)observations.push("初夜の記録： "+a.first);
  if(st?.support)observations.push("その後の説明： "+a.second);
  if(st?.counter)observations.push("別の立場の証言： "+a.turn);
  return {label:"翌朝 / 仮説の見直し",title:"最初の推理は変わったか",
   body:"【第一夜に立てた仮説】\n"+initial+
    "\n\n【ここまでに確認したこと】\n"+
    (observations.length?observations.map(x=>"・"+x).join("\n"):
     "・この事件の中心を照合できる情報はまだ揃っていない")+
    "\n\n証拠が増えたことと、それだけで犯人や動機が証明されたことは違う。",
   question:"最終報告の前に、今の立場を選び直す",
   choices:[
    {id:"revision:revise",label:"最初の見方を見直し、反対の証言も検討する",
     hint:"仮説を修正してから証拠を照合する"},
    {id:"revision:retain",label:"最初の見方を維持しつつ、証拠と照合する",
     hint:"維持しても根拠が足りなければ断定はできない"},
    {id:"revision:suspend",label:"今の仮説は保留し、確認した記録から考え直す",
     hint:"未確定のまま進むこともできる"}
   ]};
 }
 function chooseInitial(s,id){
  if(!valid(s.midpoint)||s.midpoint.initial!==null||s.morning!==null||s.night1.scene!=="ending")
   throw Error("仮説を記録できない段階です");
  const choice=id.startsWith("hypothesis:")?id.slice(11):"";
  if(!INITIAL.includes(choice))throw Error("不正な初期仮説");
  return {...s,midpoint:{initial:choice,revision:null}};
 }
 function chooseRevision(s,id){
  if(!valid(s.midpoint)||s.midpoint.initial===null||s.midpoint.revision!==null||
     s.morning?.scene!=="report"||s.deduction?.stage!=="focus")
   throw Error("仮説を更新できない段階です");
  const choice=id.startsWith("revision:")?id.slice(9):"";
  if(!REVISION.includes(choice))throw Error("不正な更新");
  return {...s,midpoint:{...s.midpoint,revision:choice}};
 }
 function reflection(s){
  if(s.arcMode!=="deliberative"||!valid(s.midpoint)||s.midpoint.initial===null)return "";
  const a=active(s),p=PLOTS[a.id],st=arcs.status(compatible(s));
  if(!s.morning){
   if(s.night1.scene==="ending")return "【残した仮説】 "+(hasSource(s)?p[s.midpoint.initial]:
     "見落とした記録があることを意識して、答えを保留した。")+
     "\nこの判断は確定ではない。翌朝、新しい証言を聞き直すことができる。";
   return "";
  }
  if(s.morning.scene==="maho"||s.morning.scene==="sahara"){
   if(st?.counter && s.morning.scene==="sahara")
    return "初夜に立てた仮説と、この証言は同じことを説明しているだろうか。発言そのものと解釈を分けて記録した。";
   if(st?.support && s.morning.scene==="maho")
    return "新しく聞いた説明が、最初の見方を支えるのか、別の可能性を示すのか。あなたは判断を保留した。";
   return "初夜の推測だけで相手の言葉を決めつけず、実際の答えを待った。";
  }
  if(s.morning.scene==="report" && s.midpoint.revision!==null)
   return "【仮説の経過】 "+p.question+"\n"+
    (s.midpoint.revision==="revise"?"最初の見方を見直す選択をした。":
      s.midpoint.revision==="retain"?"最初の見方を維持して検証する選択をした。":
      "確定できない点を残して推理する選択をした。");
  if(s.morning.scene==="epilogue"){
   const earned=arcs.verified(compatible(s));
   const change=s.midpoint.revision;
   if(!earned)return "【仮説の行方】 "+(
    change==="revise"?"見方を変えると決めても、必要な証拠を選ばなければ結論には届かない。":
    change==="retain"?"最初の仮説を守ったが、裏付ける照合が足りなかった。":
    "断定を避けたまま、なお確かめるべき問いが残った。");
   return "【仮説の行方】 "+(
    change==="revise"?"新しい証言を踏まえて解釈を更新した。最初の見方だけでは見えない問題が残っていた。":
    change==="retain"?"最初の見方を維持したとしても、結末を支えたのは初夜の勘ではなく実際の証拠の照合だった。":
    "仮説を保留していたからこそ、証拠が示す範囲を最終報告で明確に分けられた。");
  }
  return "";
 }
 return Object.freeze({INITIAL,REVISION,PLOTS,blank,valid,active,firstOptions,beginning,second,
   chooseInitial,chooseRevision,reflection,compatible});
});
