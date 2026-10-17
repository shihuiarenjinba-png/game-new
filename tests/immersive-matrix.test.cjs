"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const first=require("../story.js");
const morning=require("../morning.js");
const cases=require("../case-variants.js");
const arcs=require("../immersive-arcs.js");
const beats=require("../scene-beats.js");
const notes=require("../case-notes-v9.js");
const puzzle=require("../deduction.js");
const save=require("../save-v9.js");

const recordOptions=["wording","stoppage","renewals"];
const colleagueOptions=["private","repeat","space"];
const supervisorOptions=["author","targets","agreement"];
const letterOptions=["preserve","share","examine"];
const mahoOptions=["private","why","name"];
const saharaOptions=["ask","quote","sign"];
const night=ids=>ids.reduce((s,id)=>first.advance(s,id),first.fresh());
const day=(n,ids)=>ids.reduce((s,id)=>morning.advance(s,n,id),morning.fresh(n));

test("every 52,488 seeded player-history combination has guarded scene knowledge",()=>{
  let count=0;
  const mainCounts=new Map();
  for(let seed=0;seed<72;seed++){
    const caseData=cases.create(seed),profile=cases.profile(caseData);
    const main=arcs.active(save.blank(seed)).id;
    mainCounts.set(main,(mainCounts.get(main)||0)+1);
    for(const record of recordOptions)
    for(const colleague of colleagueOptions)
    for(const supervisor of supervisorOptions) {
      const n=night(["formal",record,colleague,supervisor,"amend"]);
      const entry={night1:n,morning:null,case:caseData,deduction:null,arcMode:"immersive"};
      const nightSentence=beats.line(entry); // Actual completed first-night history.
      assert.ok(nightSentence.length>=0);
      for(const letter of letterOptions)
      for(const maho of mahoOptions)
      for(const sahara of saharaOptions) {
        const m=day(n,[letter,maho,sahara]);
        const s={night1:n,morning:m,case:caseData,deduction:puzzle.start(),arcMode:"immersive"};
        const flags=arcs.status(s),clues=beats.safeCaseNotes(s);
        const ids=new Set(clues.map(x=>x.id));
        assert.equal(ids.has("case-record"),n.clues.includes(profile.author.trigger));
        assert.equal(ids.has("case-letter"),letter==="examine");
        assert.equal(ids.has("case-side"),maho==="why");
        assert.equal(ids.has("case-witness"),false);
        assert.equal(notes.observed(s).some(x=>x.id==="case-witness"),false);
        const caseText=beats.safeCaseText(s);
        assert.ok(!caseText.includes(profile.author.reveal));
        assert.ok(!caseText.includes(profile.motive.why));
        assert.ok(!caseText.includes("書き置きは"+profile.author.name+"が残した"));
        assert.equal(arcs.verified(s),false);
        assert.equal(beats.line(s).includes(beats.PACKS[main].callback),false);
        assert.equal(flags.full,flags.source&&flags.support&&flags.counter);
        if(count%197===0){
          assert.equal(save.validState(s),true);
          const proofIds=new Set(notes.observed(s).map(x=>x.id));
          for(const possible of puzzle.options(s,arcs.active(s).focus)){
            const pair=possible.id.split("|");
            assert.equal(pair.length,2);
            pair.forEach(id=>assert.ok(proofIds.has(id),"unearned "+id));
          }
          assert.deepEqual(save.parse(save.serialize(s)),s);
        }
        count++;
      }
    }
  }
  assert.equal(count,52488);
  assert.equal(mainCounts.size,6);
  for(const n of mainCounts.values())assert.equal(n,12);
});
