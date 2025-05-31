import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { EventEmitter } from "events";
import { AgentData } from "./AgentData.js";
import { removeWalls, Map } from "./mapBeliefs.js";
import { default as argsParser } from "args-parser.js";


// to put in a separate file
const args = argsParser(process.argv);
const client = new DeliverooApi(args.host,args.token);
// ------------------------------------------------------

const event = new EventEmitter();

const me = new AgentData();

const settings = new Map();

const map_promise = new Promise((res,rej) => {
    event.once('map', () => res());
})

const settings_promise = new Promise((res,rej) => {
    event.once('settings', () => res());
})

const me_promise = new Promise((res,rej) => {
    event.once('me', () => res());
})

client.onConfig((conf) => {
    settings.decay = getNumber(conf.PARCEL_DECADING_INTERVAL) // could be null if infinite
    settings.max_parcel = Number(conf.PARCELS_MAX)
    settings.movement = conf.MOVEMENT_DURATION
    event.emit('settings');
})

client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.pos = { x, y }
    me.score = score
    event.emit('me');
} )

client.onMap((width, height, tiles) => {
    accessible_tiles = removeWalls(tiles);
    delivery_map = destinationTiles(tiles);
    settings.x = width;
    settings.y = height
    event.emit('map');
})

client.onAgentsSensing( ( sensed_agents ) => {
    for ( const a of sensed_agents)
        if(a.id != me.id) agents.set(a.id, a);
    // console.log("updating tiles");
    accessible_tiles = removeAgentTiles(sensed_agents,original_map);
})

Promise.all([map_promise, settings_promise, me_promise]).then(() => myAgent.loop())

client.onParcelsSensing( async ( perceived_parcels ) => {
    let found_new = false
    const now = Date.now(); //initialize all the percieved parcels at the same time
  
    for (const p of perceived_parcels) {
        // console.log("CHECK 1", p);
        if(!parcels.has(p.id)){
            found_new = true
        }   
        //map of parcels id and parcel data and timedata
        parcels.set( p.id, {data:p,timedata:{startTime: now / 1e3,elapsed: p.reward}});
        // let safe = Array.from(agents.values()).every(agent => 
        //             distance(agent, p) >= distance(me, p));
        let safe = true;
        if(found_new && safe){
            let predicate = [ 'go_pick_up', p.x, p.y, p.id]
            let reward = rewardFun(predicate,me);
            if(reward > 0){
                let option = [ 'go_pick_up', p.x, p.y, p.id, reward];
                // console.log("CHECK 2, pushing", option); 
                await myAgent.push(option);
            }
            //reset the found new flag
            found_new = false;
      
        }
    }

})