import { Beliefset } from "../SSA/Beliefs/belief.js";
import { IntentionRevisionRevise } from "../SSA/Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../SSA/Planner/plans.js";

const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ0MGQ1NiIsIm5hbWUiOiJyZWZhY3RvciIsInRlYW1JZCI6ImFkMmI2MSIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDg3NzQ0NTB9.pnl_SztMf3OIvLYDmKTQUl6a53vbtKbm44Ezb4f4Tko");
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

belief_set.onParcelSensing(async (val) => await my_agent.push(val),async (parcel) => await my_agent.pickUpNotScheduledParcel(parcel));
// belief_set.onParcelSensingOld(async (val) => await my_agent.push(val));


