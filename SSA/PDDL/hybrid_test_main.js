// 'https://https://planner.cavic-fam.it';
// 'http://localhost:5001';

// process.env.PAAS_HOST = 'https://planner.cavic-fam.it';
// process.env.PAAS_PATH = '/package/dual-bfws-ffparser/solve';

import { Beliefset } from "../Beliefs/belief.js";
import { PddlIntentionRevision } from "./PddlIntentionRevision.js";
import { PlanLibrary } from "../Planner/plans.js";


const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ0MGQ1NiIsIm5hbWUiOiJyZWZhY3RvciIsInRlYW1JZCI6ImFkMmI2MSIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDg3NzQ0NTB9.pnl_SztMf3OIvLYDmKTQUl6a53vbtKbm44Ezb4f4Tko");
const plan_library = new PlanLibrary();
plan_library.belief_set = belief_set;
// console.log("CHECK1: ", plan_library.belief_set.me);
const my_agent = new PddlIntentionRevision(plan_library);

belief_set.onReady(() => {
    console.log("my_agent: ",my_agent.belief_set.me);
    my_agent.loop();
})

belief_set.onParcelSensing(async (val) => await my_agent.push(val));
