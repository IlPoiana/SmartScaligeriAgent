import { Beliefset } from "../classes/Beliefs/belief.js";
import { PddlIntentionRevision } from "../classes/PDDL/PddlIntentionRevision.js";
import { PlanLibrary } from "../classes/Plans/plans.js";


const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImEzMGI4MiIsIm5hbWUiOiJQRERMIiwidGVhbUlkIjoiYWRmNmYyIiwidGVhbU5hbWUiOiJTU0EiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0OTkyNzM5Mn0.OAd89gOnc2G2jBWhZnoM38t2nw-shnm5a7zGaebLl0E");
const plan_library = new PlanLibrary();
plan_library.belief_set = belief_set;
plan_library.singleAgentPlans();
const my_agent = new PddlIntentionRevision(plan_library);

belief_set.onReady(() => {
    console.log("my_agent: ",my_agent.belief_set.me);
    my_agent.loop();
})

belief_set.onParcelSensingOld(async (val) => await my_agent.push(val));