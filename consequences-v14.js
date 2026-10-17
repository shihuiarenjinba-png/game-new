/* v0.14 – authored consequences, not random new facts.
 * A report is an ACTION the player took, not proof that another person
 * confessed or a manager was guilty. Unobserved evidence is never quoted.
 */
(function(root,factory){
 const arcs=typeof module!=="undefined"&&module.exports?require("./deliberative-arcs-v13.js"):root.HandoverDeliberativeArcs;
 const puzzle=typeof module!=="undefined"&&module.exports?require("./deduction.js"):root.HandoverDeduction;
 const api=factory(arcs,puzzle);
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 root.HandoverConsequencesV14=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(arcs,puzzle){
 "use strict";
 const THEMES=Object.freeze({
  prefilled:{
   known:"そろった文章と、実際に誰がその言葉を用意したかは別の問題だった。",
   gap:"文面を準備した人物と、三人への配布経路はまだ断定できない。",
   context:"あなたは一致した文面の出所と、本人が実際に答えたことを別の項目に記した。",
   protect:"あなたは証言の原文を広めず、誰が文面を用意したかの確認を申し送った。",
   accuse:"あなたは班長が一律に嘘を強制したと記した。しかし、選んだ証拠だけではそこまで示せない。"
  },
  "two-moments":{
   known:"『止めたい』と『続ける』を同じ時刻の発言だと決めつけることはできなかった。",
   gap:"二つの言葉の正確な順番と、その間に何があったかは未確認だ。",
   context:"あなたは二つの発言を別々に残し、前後関係を確認する必要があると記した。",
   protect:"あなたは話した人の名前を伏せ、発言があった時点を追加で確かめるよう申し送った。",
   accuse:"あなたは班長が続行を強制したと記した。しかし、その直接の命令までは確認していない。"
  },
  "silent-rule":{
   known:"停止禁止を命じた記録が見つからないことと、本人が停止できると感じたことは別だ。",
   gap:"正式な規則の有無や、誰が雇用判断を決めたかは確定していない。",
   context:"あなたは掲示と納期の説明、雇用への不安を異なる種類の情報として記録した。",
   protect:"あなたは個別に話せる聞き取りを求め、雇用への不安はまだ事実認定していないと書いた。",
   accuse:"あなたは班長が停止禁止を指示したと提出した。しかし、明確な指示の記録はない。"
  },
  "permission-is-not-consent":{
   known:"同じ報告文に署名したことは、第三者への公開範囲まで一致した証拠ではなかった。",
   gap:"全員が誰に何を公開してよいと言ったかは確かめきれていない。",
   context:"あなたは報告に引用許可の条件を別記し、公開範囲を本人ごとに確かめるよう求めた。",
   protect:"あなたは証言の共有を控え、個別に引用範囲を確認する必要を申し送った。",
   accuse:"あなたは公開を強制した責任を班長に集中させた。しかし誰がどこまで強いたかは不明だ。"
  },
  "the-unspoken-objection":{
   known:"誰も異議を言わなかったという説明は、異議を持つ人がいなかった証明ではなかった。",
   gap:"相談の線を誰が消したか、誰が自由に反対できたかは残された問いだ。",
   context:"あなたは表面上の無言と、別の場所での相談を分けて記した。",
   protect:"あなたは名前を伏せた聞き取りを依頼し、沈黙を一律に賛成と扱わなかった。",
   accuse:"あなたは班長が異論を封じたと断定した。しかし妨害行為を直接確認していない。"
  },
  "protection-that-erases":{
   known:"誰かを守るための沈黙が、結果として本人の言葉だけを記録に残すことがある。",
   gap:"二人が同じ人物を守ろうとしたか、実際に不利益があったかは分からない。",
   context:"あなたは言い控えた理由を断定せず、実際に聞いた発言と心配を区別して残した。",
   protect:"あなたは匿名で話せる機会を申し送った。誰が不利益を受けるかの推測は書かなかった。",
   accuse:"あなたは班長の圧力が全ての沈黙を生んだと断定した。その因果は確かめきれていない。"
  }
 });
 const THEORY=Object.freeze({
  surface:{revise:"最初は見たままの説明に寄りかかったが、聞き取り後に見方を変えた。",
   retain:"あなたは初夜の説明を維持した。たとえ結論に届いても、支えになったのはその直感ではなく証拠だ。",
   suspend:"初夜の説明をいったん脇へ置き、後から得た根拠だけを残した。"},
  system:{revise:"構造に原因があるという予想も、そのまま確定事実にはしなかった。",
   retain:"最初の構造的な疑いを維持した。しかし疑いと、実際に証明した範囲は別だ。",
   suspend:"最初の疑いを保留し、確かめた範囲だけで報告を作り直した。"},
  unknown:{revise:"保留していた問いを、新しく得た情報で絞り込んだ。",
   retain:"判断を急がないという立場を維持しながら、証言を照合した。",
   suspend:"判断を保留したまま、調べきれなかった理由を記録に残した。"}
 });
 function compatible(s){return s?.arcMode==="responsive"?{...s,arcMode:"deliberative"}:s;}
 function active(s){return arcs.active(compatible(s));}
 function proof(s){return !!s?.deduction&&s.deduction.stage==="complete"&&arcs.verified(compatible(s));}
 function failure(s){
  const a=active(s),st=arcs.status(compatible(s));
  if(!st||!st.source)return "最初の中心資料を調べなかったため、この事件について言い切れることは限られた。";
  if(!st.full)return "必要な異なる立場の情報が揃わず、一つの説明だけで結論を出せなかった。";
  if(s.deduction.reading==="dismiss")return "疑問を切り捨てることを選んだため、資料に残った食い違いは解明されなかった。";
  if(s.deduction.focus!==a.focus)return "証言は揃っていたが、中心とは別の問いを検討したため、今回の食い違いを説明できなかった。";
  return "資料は揃っていたが、二つの証言の関係を示す照合を報告に残せなかった。";
 }
 function result(s){
  if(s?.arcMode!=="responsive"||s.morning?.scene!=="epilogue"||
    !s.midpoint||!s.deduction||s.deduction.stage!=="complete")return "";
  const a=active(s),theme=THEMES[a.id],decision=s.morning.history[3];
  if(!theme||!["context","protect","accuse"].includes(decision))return "";
  const earned=proof(s);
  const review=puzzle.assessment(s.deduction,s);
  const path=THEORY[s.midpoint.initial]?.[s.midpoint.revision];
  if(!path)throw Error("仮説と見直しの記録が不正です");
  const causal=earned?theme.known:failure(s);
  const action=earned?theme[decision]:(
    decision==="context"?"あなたは確認できた言葉と未確認の事情を区別して記載した。"+
      "しかし選んだ証拠では、中心の問いを解明できなかった。":
    decision==="protect"?"あなたは名前を伏せて追加の聞き取りを申請した。"+
      "誰が何を知っているかは、まだ断定していない。":
    "あなたは班長の関与を断定して提出した。"+
      "根拠不足のまま責任を集中させたことは、訂正しても消えない。");
  return "【あなたの推理が残したもの】\n"+path+"\n"+causal+
    "\n【報告書の扱い】\n"+action+
    (earned&&decision!=="accuse"?"\n【残る問い】 "+theme.gap:"")+
    (review.reading==="assert"?"\n断定は、得られた証拠の範囲を超えていた。":"");
 }
 function prompt(s){
  if(s?.arcMode!=="responsive"||s.morning?.scene!=="report"||
    s.midpoint?.revision===null||s.deduction?.stage!=="complete")return "";
  const d=s.deduction,review=puzzle.assessment(d,s);
  return "【照合の結果】 "+review.status+"\n"+
    (review.pairGrade===2?
      "関係する二つの記録は選べた。そこから何を言い切れるかは別に考える。":
      "この組み合わせだけでは、中心の疑問に答えるには足りない。");
 }
 return Object.freeze({THEMES,THEORY,compatible,active,proof,failure,result,prompt});
});
