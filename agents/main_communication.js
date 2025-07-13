import { Beliefset } from "../classes/Beliefs/belief.js";
import { PlanLibrary } from "../classes/Plans/plans.js";
import { Communication } from "../classes/Coordination/Communication.js";
import { default as argsParser } from "args-parser";
import { MultiAgentBeliefSet } from "../classes/Beliefs/MultiAgentBelief.js";
import { MultiIntentionRevisionRevise } from "../classes/Intention&Revision/MultiIntentionRevisionRevise.js";
import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";


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
   
        belief_set.client.once('msg',async(id,name,msg,reply) => {
                console.log('msg');
                if(my_agent.delivery_tiles.length == 0)    
                    await my_agent.computeAndSendTiles();
                if(my_agent.friend_belive_set.team_data.role == 'NONE')   
                    my_agent.communication.handShaking();
                console.log("friend believe set:", my_agent.friend_belive_set.team_data)
                my_agent.meetingMsgHandler()

                belief_set.client.onYou(async() => {
                    const update_slave = await comm.updateTeam()
                })
                
                console.log("starting loop");
                my_agent.loop();


                belief_set.onParcelSensingOld(async (val) => {
                    await my_agent.pushMulti(val)
                });
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
                await belief_set.client.emitSay(team_id, {status: 'slave-ready'})
                await new Promise(r => setTimeout(r,100))
            }
            console.log("stopped emitting");
            return
        }
        
        //set the listener
        my_agent.getTilesFromMaster();
        //if(my_agent.friend_belive_set.team_data.role == 'NONE')
        my_agent.communication.handShaking();
        //send the event for the master to responde
        await emit_till_the_apocalipse(flag_obj)
        console.log("friend believe set:", my_agent.friend_belive_set.team_data)
        my_agent.meetingMsgHandler()

        console.log("starting loop");
        my_agent.loop();


        belief_set.onParcelSensingOld(async (val) => {
            await my_agent.pushMulti(val)
        });
    
    }

    
    
    
})


