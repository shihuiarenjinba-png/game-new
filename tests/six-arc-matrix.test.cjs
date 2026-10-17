"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const first=require("../story.js");
const morning=require("../morning.js");
const cases=require("../case-variants.js");
const six=require("../six-arcs.js");
const puzzle=require("../deduction.js");
const save=require("../save-v8.js");

const sourceOptions=["wording","stoppage","renewals"];
const coworkerOptions=["private","repeat","space"];
const supervisorOptions=["author","targets","agreement"];
const letterOptions=["preserve","share","examine"];
const mahoOptions=["private","why","name"];
const saharaOptions=["ask","quote","sign"];
function night(ids){return ids.reduce((s,id)=>first.advance(s,id),first.fresh());}
function day(n,ids){return ids.reduce((s,id)=>morning.advance(s,n,id),morning.fresh(n));}
function expected(id,{record,coworker,supervisor,maho,sahara},entry){
  const source=record===entry;
  const support=source&&({
    prefilled:supervisor==="author",
    "two-moments":coworker==="private",
    "silent-rule":supervisor==="targets",
    "permission-is-not-consent":coworker==="space",
    "the-unspoken-objection":supervisor==="agreement",
    "protection-that-erases":coworker==="private"
  }[id]);
  const counter=source&&({
    prefilled:maho==="why",
    "two-moments":sahara==="ask",
    "silent-rule":maho==="why",
    "permission-is-not-consent":sahara==="quote",
    "the-unspoken-objection":maho==="private",
    "protection-that-erases":sahara==="sign"
  }[id]);
  return {source,support,counter,full:source&&support&&counter};
}

test("72 seeds × 729 player choice sequences never generate unearned grand-arc evidence",()=>{
  const tally=Object.fromEntries(six.ARCS.map(x=>[x.id,{seen:0,full:0,partial:0}]));
  let total=0;
  for(let seed=0;seed<72;seed++){
    const plot=six.active(save.blank(seed));
    for(const record of sourceOptions)
    for(const coworker of coworkerOptions)
    for(const supervisor of supervisorOptions){
      const n=night(["formal",record,coworker,supervisor,"amend"]);
      for(const letter of letterOptions)
      for(const maho of mahoOptions)
      for(const sahara of saharaOptions){
        const m=day(n,[letter,maho,sahara]);
        const state={night1:n,morning:m,case:cases.create(seed),
          deduction:puzzle.start(),arcMode:"expanded"};
        const pred=expected(plot.id,{record,coworker,supervisor,letter,maho,sahara},plot.entry);
        const actual=six.status(state),proof=six.observed(state);
        assert.equal(actual.source,pred.source,seed+" source");
        assert.equal(actual.support,pred.support,seed+" support");
        assert.equal(actual.counter,pred.counter,seed+" counter");
        assert.equal(actual.full,pred.full,seed+" full");
        assert.equal(proof.some(x=>x.id==="arc-primary"),pred.source);
        assert.equal(proof.some(x=>x.id==="arc-support"),pred.support);
        assert.equal(proof.some(x=>x.id==="arc-counter"),pred.counter);
        assert.equal(proof.some(x=>x.id==="arc-proof"),false);
        assert.equal(six.verified(state),false);
        assert.doesNotMatch(six.sceneText(state),/【大きな回収|【今回の事件で確かめられたこと】/);
        if(total%157===0){
          assert.equal(save.validState(state),true);
          const available=puzzle.options(state,plot.focus);
          assert.equal(available.length,3);
          for(const p of available){
            const ids=p.id.split("|");
            const recorded=new Set([
              ...n.clues,
              ...m.findings.map(id=>id==="distance"?"distance2":id),
              ...cases.observed(state.case,state).map(x=>x.id),
              ...proof.map(x=>x.id)
            ]);
            ids.forEach(id=>assert.equal(recorded.has(id),true,
              "unseen evidence "+id+" in seed "+seed));
          }
        }
        const stat=tally[plot.id];
        stat.seen++;
        if(actual.full)stat.full++;else stat.partial++;
        total++;
      }
    }
  }
  assert.equal(total,52488);
  for(const [id,stat] of Object.entries(tally)){
    assert.equal(stat.seen,8748,"arc population "+id);
    assert.ok(stat.full>0,id+" has no discoverable case");
    assert.ok(stat.partial>stat.full,id+" has no mystery left");
  }
});
