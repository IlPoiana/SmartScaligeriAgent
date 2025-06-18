import { Beliefset } from "../SSA/Beliefs/belief.js";
import { PlanLibrary } from "../SSA/Planner/plans.js";
import { Communication } from "../SSA/Coordination/Communication.js";
import { default as argsParser } from "args-parser";
import { MultiAgentBeliefSet } from "../SSA/Beliefs/MultiAgentBelief.js";
import { MultiIntentionRevisionRevise } from "../SSA/Intention&Revision/MultiIntentionRevisionRevise.js";
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
// console.log("CHECK1: ", plan_library.belief_set.me);
const my_agent = new MultiIntentionRevisionRevise(plan_library, comm);
// const reachable_spawning_tiles = [];
// const reachable_delivery_tiles = [];

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
                    // console.log("my companion: ", multi_agent_belief.team_data)
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
                // belief_set.client.emit('msg', team_id, 'name', {status: 'slave-ready'});
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
        
        // belief_set.client.onYou(async() => {
        //     const update_slave = await comm.updateTeam()
        // })

        console.log("starting loop");
        my_agent.loop();


        belief_set.onParcelSensingOld(async (val) => {
            await my_agent.pushMulti(val)
            // console.log("my companion: ", multi_agent_belief.team_data)
        });
    
    }

    
    
    // my_agent.communication.handShaking().catch((err) => console.log("error in handshaking", err));
    
})


// belief_set.onReady(async () => {
    
//     //send the array(possibly a decorator of handshaking)
//     if(my_agent.belief_set.me.name == 'ema')  {
//         my_agent.belief_set.me.role = 'MASTER'
//         await my_agent.computeAndSendTiles();//assign to the master the tiles and send to the slave it's tiles
//         my_agent.communication.emitter.once('listener-ready', () => {
//             //master handshake
//             console.log("here!");
//             my_agent.communication.handShaking().catch((err) => console.log("error in handshaking", err));

//         })
//         // my_agent.communication.emitter.emit('listener-ready');

//         console.log("set the listener to master");
//         my_agent.communication.emitter.once('master-handshake',() => {
//             belief_set.client.onYou(async() => {
//                 const update_slave = await comm.updateTeam()
//                 // console.log("slave res", update_slave);
//                 // console.log("update result:",await comm.updateTeam());
//             })

        
//             console.log("friend believe set:", my_agent.friend_belive_set.team_data)
//             my_agent.meetingMsgHandler()
            
//             console.log("starting loop");
//             my_agent.loop();


//             belief_set.onParcelSensingOld(async (val) => {
//                 await my_agent.pushMulti(val)
//                 // console.log("my companion: ", multi_agent_belief.team_data)
//             });
//         })
//     }
//     else{
//         my_agent.belief_set.me.role = 'SLAVE'
//         await my_agent.getTilesFromMaster();
//         console.log("set the listener to slave");
//         my_agent.communication.emitter.once('slave-handshake',() => {
//             belief_set.client.onYou(async() => {
//                 const update_slave = await comm.updateTeam()
//                 // console.log("slave res", update_slave);
//                 // console.log("update result:",await comm.updateTeam());
//             })

        
//             console.log("friend believe set:", my_agent.friend_belive_set.team_data)
//             my_agent.meetingMsgHandler()
            
//             console.log("starting loop");
//             my_agent.loop();


//             belief_set.onParcelSensingOld(async (val) => {
//                 await my_agent.pushMulti(val)
//                 // console.log("my companion: ", multi_agent_belief.team_data)
//             });
//         })

//         my_agent.communication.handShaking().catch((err) => console.log("error in handshaking", err));

//     }
    
// })

