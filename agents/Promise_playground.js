import { Beliefset } from "../SSA/Beliefs/belief.js";
import { PlanLibrary } from "../SSA/Planner/plans.js";
import { Communication } from "../SSA/Coordination/Communication.js";
import { default as argsParser } from "args-parser";
import { MultiAgentBeliefSet } from "../SSA/Beliefs/MultiAgentBelief.js";
import { MultiIntentionRevisionRevise } from "../SSA/Intention&Revision/MultiIntentionRevisionRevise.js";

const args = argsParser(process.argv)
console.log("args: ", args);
const team_id = args['teamId']

const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlNzc3YSIsIm5hbWUiOiJzdGVwaGFueSIsInRlYW1JZCI6IjAxY2IzNCIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDg5NjI3NjR9.wmCvICoQq2a2MSdSdMP6VmQUIWg-_k-EF9ql6BzVK5o");
const plan_library = new PlanLibrary();
plan_library.belief_set = belief_set;
plan_library.multiAgentPlans();
const multi_agent_belief = new MultiAgentBeliefSet()
const comm = new Communication(belief_set, team_id, multi_agent_belief);
const my_agent = new MultiIntentionRevisionRevise(plan_library, comm);


belief_set.onReady(async () => {

    if(my_agent.belief_set.me.name == 'ema')  {
        my_agent.belief_set.me.role = 'MASTER'
        // for(let i = 0; i < 1e5; i++)
        // {console.log(i)};
        // belief_set.client.onMsg(async(id,name,msg,reply) => {
        //         console.log(msg);
        //         if(my_agent.delivery_tiles.length == 0)    
        //             await my_agent.computeAndSendTiles();
        //         if(my_agent.friend_belive_set.team_data.role == 'NONE')   
        //             my_agent.communication.handShaking();
        //         reply();
        //     }
        // )
        belief_set.client.once('msg',async(id,name,msg,reply) => {
                console.log('msg');
                if(my_agent.delivery_tiles.length == 0)    
                    await my_agent.computeAndSendTiles();
                if(my_agent.friend_belive_set.team_data.role == 'NONE')   
                    my_agent.communication.handShaking();
                reply();
            }
        )
        console.log("master listener set!");
    }
    else{
        my_agent.belief_set.me.role = 'SLAVE'
        const flag_obj = {flag: true}

        const emit_till_the_apocalipse = async function (flag_obj) {
            setTimeout(() => flag_obj.flag = false, 500);
            while(flag_obj.flag && my_agent.delivery_tiles.length == 0){
                // belief_set.client.emit('msg', team_id, 'name', {status: 'slave-ready'});
                await belief_set.client.emitSay(team_id, {status: 'slave-ready'})
                new Promise(r => setTimeout(r,100))
            }
            console.log("stopped emitting");
            return
        }
        
        //set the listener
        my_agent.getTilesFromMaster();
        //if(my_agent.friend_belive_set.team_data.role == 'NONE')
        my_agent.communication.handShaking();
        //send the event for the master to responde
        emit_till_the_apocalipse(flag_obj)
        
        //tell to the master that I'm ready
        // emit_till_the_apocalipse(flag_obj);
        
        
        // console.log(my_agent.friend_belive_set.team_data);
    
    }

    
    
    // my_agent.communication.handShaking().catch((err) => console.log("error in handshaking", err));
    
})




