import { Beliefset } from "../SSA/Beliefs/belief.js";
import { IntentionRevisionRevise } from "../SSA/Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../SSA/Planner/plans.js";

const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0");
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


