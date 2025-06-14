import { Beliefset } from "../SSA/Beliefs/belief.js";
import { IntentionRevisionRevise } from "../SSA/Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../SSA/Planner/plans.js";
import { Comunication } from "../SSA/Coordination/comunication.js";
import { default as argsParser } from "args-parser";
import { MultiAgentBeliefSet } from "../SSA/Beliefs/MultiAgentBelief.js";

const args = argsParser(process.argv)
console.log("args: ", args);

const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlNzc3YSIsIm5hbWUiOiJzdGVwaGFueSIsInRlYW1JZCI6IjAxY2IzNCIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDg5NjI3NjR9.wmCvICoQq2a2MSdSdMP6VmQUIWg-_k-EF9ql6BzVK5o");
const plan_library = new PlanLibrary();
plan_library.belief_set = belief_set;
const multi_agent_belief = new MultiAgentBeliefSet()
// console.log("CHECK1: ", plan_library.belief_set.me);
const my_agent = new IntentionRevisionRevise(plan_library);
const team_id = args['teamId']


belief_set.onReady(async () => {
    const comm = new Comunication(belief_set, team_id, multi_agent_belief);
    // console.log("battimi: ",belief_set.me)
    // console.log("Beliefset is ready with map:", belief_set.original_map);
    // console.log("Accessible tiles:", belief_set.accessible_tiles);
    
    //comm.onShout();
    //if(my_agent.belief_set.me.name == 'ema')  
    if(my_agent.belief_set.me.name == 'ema')  
        belief_set.me.role = 'MASTER'
    else
        belief_set.me.role = 'SLAVE'

    //console.log("my_agent: ",my_agent.belief_set.me);

    const comunication_promise = new Promise((res)=>{comm.handShaking()})

    //console.log(" I am ", belief_set.me.name, " with role: ", belief_set.me.role);
    //comm.mapDivision(); 
    my_agent.loop();
})
belief_set.onParcelSensing(async (val) => {
    await my_agent.push(val)
    console.log("my companion: ", multi_agent_belief.team_data)
});