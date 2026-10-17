/* 引継ぎ室 v0.4 — 独立した証拠照合・仮説検証パート。
 * 客観的に確認できる記録と、断定できない人間の動機を区別する。
 * 外部サービス、AI、乱数、個人データ送信なし。
 */
(function(root, factory) {
  const notes = typeof module !== "undefined" && module.exports ? require("./notes-v14.js") : root.HandoverNotesV14;
  const arcs = typeof module !== "undefined" && module.exports
    ? require("./arcs-v14.js") : root.HandoverArcsV14;
  const api = factory(notes,arcs);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HandoverDeduction = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(notes,arcs) {
  "use strict";

  const FOCI = Object.freeze({
    records: {
      label: "なぜ、三人の報告書が似ていたのか",
      intro: "文面を揃えること自体は、必ずしも虚偽の証拠ではない。誰が書いたか、何が抜け落ちたかを考える。",
      assert: "班長が全員に嘘を強制したと断定する",
      balanced: "文面の一致と編集経緯を記し、虚偽の指示は未確認とする",
      dismiss: "文面の一致は調べる必要がないとする",
      needed: [["wording","draft"],["case-record","case-witness"]]
    },
    agency: {
      label: "佐原は、本当に自由に続行を選べたのか",
      intro: "『続けると言った』と『止めたいと言った』は、別の時点の話かもしれない。本人の発言と自由な意思決定を分けて調べる。",
      assert: "本人は無理やり続行させられたと断定する",
      balanced: "本人の発言を記し、断る自由があったかは未確認とする",
      dismiss: "本人が続けると言った以上、問題はないとする",
      needed: [["voice","stoppage"], ["voice","confession"],["case-letter","case-witness"]]
    },
    pressure: {
      label: "誰も命令しないのに、なぜ止められなかったのか",
      intro: "雇用条件や納期への不安が、人の判断に影響した可能性はある。ただし命令が存在したとは限らない。",
      assert: "班長の停止禁止命令があったと断定する",
      balanced: "職場の圧力を検討事項とし、明確な命令の有無は未確認とする",
      dismiss: "命令が見つからない以上、職場の圧力もないとする",
      needed: [["renewals","quota"],["renewals","distance2"],["quota","distance2"],["case-record","case-side"]]
    }
  });
  const READINGS = ["assert","balanced","dismiss"];

  function facts(state) {
    return notes.observed(state);
  }
  function score(focus, pair, state) {
    const arc=arcs.active(state);
    if (arc && arc.focus===focus && ["verified","expanded","immersive","deliberative","responsive"].includes(state.arcMode) &&
        pair.includes("arc-support") && pair.includes("arc-counter"))return 2;
    if (arc && arc.focus===focus && state.arcMode==="major" &&
        pair.includes("arc-primary") &&
        (pair.includes("arc-support") || pair.includes("arc-counter")))return 2;
    const related = FOCI[focus].needed;
    if (related.some(group => group.every(id => pair.includes(id)))) return 2;
    const relevant = new Set(related.flat());
    return pair.reduce((n,id) => n + Number(relevant.has(id)),0) ? 1 : 0;
  }
  function options(state, focus) {
    if (!FOCI[focus]) throw new Error("未知の推理テーマ");
    const evidence = facts(state);
    const pairs = [];
    for(let i=0;i<evidence.length;i++) {
      for(let j=i+1;j<evidence.length;j++) {
        const ids = [evidence[i].id,evidence[j].id];
        pairs.push({id:ids.join("|"),items:ids,score:score(focus,ids,state),label:evidence[i].fact+" ／ "+evidence[j].fact});
      }
    }
    if (pairs.length<3) throw new Error("証拠が不足しています");
    const strong = pairs.find(x => x.score===2 && x.items.includes("arc-support") && x.items.includes("arc-counter")) ||
      pairs.find(x => x.score===2 && x.items.includes("arc-proof")) ||
      pairs.find(x => x.score===2 && x.items.includes("arc-counter")) ||
      pairs.find(x => x.score===2 && x.items.includes("case-witness")) ||
      pairs.find(x => x.score===2 && x.items.includes("case-side")) ||
      pairs.find(x => x.score===2) || pairs.find(x=>x.score===1) || pairs[0];
    const weak = pairs.find(x => x.score===0 && x.id!==strong.id) ||
      pairs.find(x => x.id!==strong.id);
    const rest = pairs.find(x => x.id!==weak.id && x.id!==strong.id && x.score===1) ||
      pairs.find(x => x.id!==weak.id && x.id!==strong.id);
    // Explicitly avoid always putting the strongest match first.
    return [weak,strong,rest].map(({id,label})=>({id,label}));
  }
  function start() {return {stage:"focus",focus:null,pair:null,reading:null};}
  function validate(d,state) {
    if (!d || typeof d!=="object" || Array.isArray(d) ||
      Object.keys(d).sort().join(",")!=="focus,pair,reading,stage") return false;
    if (!["focus","pair","reading","complete"].includes(d.stage)) return false;
    if (d.stage==="focus") return d.focus===null && d.pair===null && d.reading===null;
    if (!Object.hasOwn(FOCI,d.focus)) return false;
    if (d.stage==="pair") return d.pair===null && d.reading===null;
    if (typeof d.pair!=="string" || !options(state,d.focus).some(x=>x.id===d.pair)) return false;
    if (d.stage==="reading") return d.reading===null;
    return READINGS.includes(d.reading);
  }
  function advance(d,state,id) {
    if (!validate(d,state)) throw new Error("推理記録が無効です");
    if (d.stage==="focus") {
      const focus=id.startsWith("focus:")?id.slice(6):"";
      if (!Object.hasOwn(FOCI,focus)) throw new Error("選べないテーマです");
      return {stage:"pair",focus,pair:null,reading:null};
    }
    if (d.stage==="pair") {
      const pair=id.startsWith("pair:")?id.slice(5):"";
      if (!options(state,d.focus).some(x=>x.id===pair)) throw new Error("確認していない証拠です");
      return {stage:"reading",focus:d.focus,pair,reading:null};
    }
    if (d.stage==="reading") {
      const reading=id.startsWith("reading:")?id.slice(8):"";
      if (!READINGS.includes(reading)) throw new Error("選べない解釈です");
      return {stage:"complete",focus:d.focus,pair:d.pair,reading};
    }
    throw new Error("推理パートは完了しています");
  }
  function assessment(d,state) {
    if (!validate(d,state) || d.stage!=="complete") throw new Error("推理はまだ完了していません");
    const pair=d.pair.split("|");
    const weight=score(d.focus,pair,state);
    const labels = facts(state).filter(x => pair.includes(x.id)).map(x=>x.fact);
    let status,detail,consequence;
    if (d.reading==="assert") {
      status="証拠を超えた断定";
      detail="選んだ記録は、誰が強制したか、なぜ黙ったかを確定できない。筋の通る疑いを、立証済みの事実として書いてしまった。";
      consequence="報告を読んだ人は一人の責任者を求めた。訂正されても、疑いの視線は簡単には消えなかった。";
    } else if (d.reading==="dismiss") {
      status="未解決の疑問を切り捨てた";
      detail="証拠だけでは犯人を決められない。しかし疑問そのものを消してよい根拠にもならない。";
      consequence="報告書の文章は短くなった。それでも現場の誰かは、言えなかったことが記録から消えたと感じた。";
    } else if(weight===2) {
      status="根拠を示した慎重な推理";
      detail="この二つの記録を照合すると、少なくとも調べ直すべき具体的な争点が生まれる。動機や責任の確定とは区別して記録できる。";
      consequence="誰かを犯人に決める前に、調査すべき問いとその根拠が記録に残った。人によっては、それを不十分と感じた。";
    } else if(weight===1) {
      status="筋はあるが、照合は不十分";
      detail="選んだ二つの記録のうち、争点に直接結びつく情報は限られる。仮説を保つことはできるが、裏付けはまだ足りない。";
      consequence="報告は断定を避けたが、次に何を確かめるべきかが曖昧なままだった。";
    } else {
      status="証拠との結びつきが弱い";
      detail="その仮説と選んだ二つの記録の関係はまだ示せない。疑うことはできても、報告書の根拠にはならない。";
      consequence="報告書には推測が残ったが、読み手はその推測を裏付ける記録を見つけられなかった。";
    }
    return {status,detail,consequence,
      sources:labels,
      caveats:facts(state).filter(x=>pair.includes(x.id)).map(x=>x.caveat),
      focus:FOCI[d.focus].label,
      pairGrade:weight,reading:d.reading};
  }
  function display(d,state) {
    if (!validate(d,state)) throw new Error("不正な推理記録です");
    if(d.stage==="focus") {
      return {label:"最終報告 / 推理 1・3",title:"なぜ、皆が同じ説明をしたのか",
        body:"最後の報告に進む前に、調べた記録から一つの疑問を深く検討する。\n何を疑うかは、あなたが決める。ただし、見ていない証拠を見たことにはできない。",
        question:"どの疑問を検証しますか？",choices:Object.entries(FOCI).map(([id,x])=>({
          id:"focus:"+id,label:x.label,hint:"この疑問に関係する記録を照合する"
        }))};
    }
    if(d.stage==="pair") {
      return {label:"最終報告 / 推理 2・3",title:FOCI[d.focus].label,
        body:FOCI[d.focus].intro+"\nどの二つを並べて考えるかによって、言えることの範囲が変わる。",
        question:"根拠にする2つの記録を選びます。",choices:options(state,d.focus).map(x=>({
          id:"pair:"+x.id,label:x.label,hint:"この組み合わせから、どこまで言えるかを考える"
        }))};
    }
    if(d.stage==="reading") {
      const sources=facts(state).filter(x=>d.pair.split("|").includes(x.id));
      return {label:"最終報告 / 推理 3・3",title:"それは、証明されたことなのか",
        body:"あなたが照合した記録。\n・"+sources.map(x=>x.fact).join("\n・")+
          "\n\nしかし、そこから導ける結論には限界がある。",
        question:"最終報告に、どの解釈を残しますか？",
        choices:READINGS.map(id=>({id:"reading:"+id,
          label:FOCI[d.focus][id],
          hint:id==="assert"?"原因を断定して書く":id==="balanced"?"確認したことと未確認のことを分ける":"疑問を取り上げずに終える"}))};
    }
    const result=assessment(d,state);
    return {label:"最終報告 / 推理完了",title:result.status,
      body:result.detail+"\n\nここで終わりではない。誰を守り、どう記録するかは、あなたの判断に残されている。",
      question:"この推理を踏まえて、最終報告を決めます。",choices:[]};
  }
  function rewind(d,state) {
    if (!validate(d,state)) throw new Error("推理記録の整合性を確認できません");
    if (d.stage === "focus") return d;
    if (d.stage === "pair") return start();
    if (d.stage === "reading") return {stage:"pair",focus:d.focus,pair:null,reading:null};
    return {stage:"reading",focus:d.focus,pair:d.pair,reading:null};
  }
  return Object.freeze({FOCI,start,validate,advance,rewind,assessment,display,options});
});
