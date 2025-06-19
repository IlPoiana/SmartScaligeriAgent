import { Beliefset } from "../classes/Beliefs/belief.js";
import { IntentionRevisionRevise } from "../classes/Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../classes/Plans/plans.js";

const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYxOGE2OSIsIm5hbWUiOiJlbWEiLCJ0ZWFtSWQiOiI2ZTM5Y2UiLCJ0ZWFtTmFtZSI6IlNTQSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ4OTYyNzU1fQ.4Jly20BPBTs30oGwO9vgTR3fCmSoenQA6VF9yXz9jbs");
const plan_library = new PlanLibrary();
plan_library.singleAgentPlans();
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

// belief_set.onParcelSensing(async (val) => await my_agent.push(val),async (parcel) => await my_agent.pickUpNotScheduledParcel(parcel));
belief_set.onParcelSensingOld(async (val) => await my_agent.push(val));


