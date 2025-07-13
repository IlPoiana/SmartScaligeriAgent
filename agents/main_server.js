import { Beliefset } from "../classes/Beliefs/belief.js";
import { IntentionRevisionRevise } from "../classes/Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../classes/Plans/plans.js";

const belief_set = new Beliefset("https://deliveroojs2.rtibdi.disi.unitn.it/", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZWVjNSIsIm5hbWUiOiJCcm8iLCJ0ZWFtSWQiOiJhMTNhMGIiLCJ0ZWFtTmFtZSI6IlNTQSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ4ODg2OTEzfQ.x4hNsiC9AC7fo7ja63qHN8mM3_KYBZTRkTe0hXS7bYQ");
const plan_library = new PlanLibrary();
plan_library.belief_set = belief_set;
// console.log("CHECK1: ", plan_library.belief_set.me);
const my_agent = new IntentionRevisionRevise(plan_library);

belief_set.onReady(() => {

    console.log("my_agent: ",my_agent.belief_set.me);
    my_agent.loop();
})

belief_set.onParcelSensing(async (val) => await my_agent.push(val));