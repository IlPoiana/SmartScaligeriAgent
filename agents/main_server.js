import { Beliefset } from "../SSA/Beliefs/belief.js";
import { IntentionRevisionRevise } from "../SSA/Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../SSA/Planner/plans.js";

const belief_set = new Beliefset("https://deliveroojs2.rtibdi.disi.unitn.it/", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZWVjNSIsIm5hbWUiOiJCcm8iLCJ0ZWFtSWQiOiJhMTNhMGIiLCJ0ZWFtTmFtZSI6IlNTQSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ4ODg2OTEzfQ.x4hNsiC9AC7fo7ja63qHN8mM3_KYBZTRkTe0hXS7bYQ");
const plan_library = new PlanLibrary();
plan_library.belief_set = belief_set;
// console.log("CHECK1: ", plan_library.belief_set.me);
const my_agent = new IntentionRevisionRevise(plan_library);

belief_set.onReady(() => {
    // console.log("battimi: ",belief_set.me)
    // console.log("Beliefset is ready with map:", belief_set.original_map);
    // console.log("Accessible tiles:", belief_set.accessible_tiles);
    console.log("my_agent: ",my_agent.belief_set.me);
    my_agent.loop();
})

belief_set.onParcelSensing(async (val) => await my_agent.push(val));


// 1. stop the delivery if my parcels will decay
// 2. don't push the intention to pick up a parcel if you will not be able to deliver it, minimum time to get there + minimum time to go to a delivery tile
// 2.1 if there are no possibilities to go to a delivery tile, for now ignore it.

/*
if I see different parcels, the ones that I already picked up are gonna elapsed?

The ideal check, I check if I can pick up and delivery in time => then check if picking up that parcel(abs score) will value more than the value lost ti pick it up

decay time / movement time / 1000
*/