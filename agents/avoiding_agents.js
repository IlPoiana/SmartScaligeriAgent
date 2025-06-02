import { DeliverooApi, sleep } from "@unitn-asa/deliveroo-js-client";
import { removeWalls,BFS, removeAgentTiles } from "./lib/algorithms.js"
import { EventEmitter } from "events";
import { default as argsParser } from "args-parser";


//belief-set variables delcaration
// ----
const me = {}
const parcels = new Map();
let accessible_tiles = [];
let original_map = [];
let delivery_map = [];
const settings = {
    x: 0,
    y: 0,
    movement: 0,
    decay: 0,
    max_parcel: 0
}
let idle = false

// -----

const agents = new Map(); // map of sensed agents
/*
FUNCTIONS DECLARATION---------------------------
*/

function getNumber(str) {
  const n = parseInt(str, 10);
  return isNaN(n) ? null : n;
}

/**
 * Updates all the parcels timer 
 */
function updateElapsed() {
    // console.log("updating");
    const now = Date.now();
    parcels.forEach(parcel => {
        parcel.timedata.elapsed = parcel.timedata.elapsed - Number(((now / 1e3) * settings.decay - parcel.timedata.startTime).toFixed(2));
        if(parcel.timedata.elapsed <= 0){
            parcels.delete(parcel.data.id);}
    });
    // parcels.forEach((parcel) => console.log(parcel.data, parcel.timedata.elapsed))
}

function checkIntention(intention){
    const type = intention.predicate[0];
    switch (type) {
        case 'go_pick_up':
            const parcel_id = intention.predicate[3];
            if(!parcels.get(parcel_id) || intention.predicate[4] == 0){
                // console.log(parcels.get(parcel_id), intention.predicate[4]);
                return true;
            }
            return false;
            break;
        default:
            return false;
            break;
    }
}

function destinationTiles(tiles){
    var delivery = [];
    tiles.forEach(elem => {
        if(elem.type == 2)
            delivery.push({
                x: elem.x,
                y: elem.y,
                type: elem.type
            })
    });

    return delivery;
}

function nearestDeliveryTile(x,y, delivery_map,map){
    const delivery_tiles = delivery_map;
    delivery_tiles.sort((a,b) => {
        return distance({x:x, y:y},{x:a.x,y:a.y}) - distance({x:x, y:y},{x:b.x,y:b.y})
    })
    // console.log("sorted delivery: ",delivery_tiles);
    return BFS([x,y], [delivery_tiles[0].x,delivery_tiles[0].y],map);

}

/**
 * 
 * @param {*} tiles 
 * @returns the list of spawining tiles- TO DO statically allocate the map
 */
function spawningTiles(tiles){
    let available = [];
    available = tiles.filter((tile) => {
        return tile.type == 1
    })
    return available;
}

/**
 * 
 * @param {*} map 
 * @returns the furthest spawning tile
 */
function wandering(map){
    const x = me.x;
    const y = me.y;
    const dest = spawningTiles(map);
    dest.sort((a,b) => {
        return distance({x:x, y:y},{x:a.x,y:a.y}) - distance({x:x, y:y},{x:b.x,y:b.y})
    })
    // const near = dest[0];
    
    const target = dest[dest.length -1];
    return [target.x, target.y];
}

/**
 * 
 * @param {*} map 
 * @returns an array of spawining tiles, sorted by distance(nearest to furthest)
 */
function wanderingRoundRobin(map){
    const x = me.x;
    const y = me.y;
    const dest = spawningTiles(map);
    dest.sort((a,b) => {
        return distance({x:x, y:y},{x:a.x,y:a.y}) - distance({x:x, y:y},{x:b.x,y:b.y})
    })
    
    const offset = Math.round(Math.sqrt(dest.length));
    const targets = [];
    
    dest.forEach((tile, index) => {
        if(index % offset == 0)
            targets.push([tile.x,tile.y]);
    })
    return targets;
}

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

function parcelRewardFun(predicate, {x: x1, y:y1}) {
    const id_p = predicate[3]
    let parcel = parcels.get(id_p)
    if(!parcel)
        return 0;
    //quando arriva delivery diventa undefined
    // let computed_reward = reward -  distance({x:x1,y:y1},{ x:parcel.data.x, y:parcel.data.y}) / 2;
    let my_position = {x:x1, y:y1};
    let parcel_position = { x:parcel.data.x, y:parcel.data.y};
    let abs_distance = distance(my_position,parcel_position) > 0 ? distance(my_position,parcel_position) : 1;
    let computed_reward = (1 / (abs_distance * (1000/ settings.movement))) * 1000;
    // console.log("CHECK reward- id:", predicate[3],computed_reward);
    // console.log("CHECK 1",computed_reward, abs_distance, settings.movement);
    return computed_reward < 0 ? 0 : computed_reward;
}

function rewardFun(predicate, {x: x1, y:y1}){
    switch (predicate[0]) {
        case 'go_pick_up':
            let my_position = {x:x1, y:y1};
            let parcel_reward = (parcels.get(predicate[3])).timedata.elapsed;
            const final_reward = parcelRewardFun(predicate, my_position) + parcel_reward
            // console.log("CHECK 2",predicate,parcelRewardFun(predicate, my_position),parcel_reward,final_reward);
            return final_reward > 1 ? final_reward : 2;
            break;
        case 'delivery':
            return predicate[1];
            break;
        case 'wandering':
            return 0;
            break;
        default:
            break;
    }
    
}


//----------------------------------------------

//client definition
const client = new DeliverooApi(
    'http://localhost:8080',
    //Delivery token
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0'
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY4YmIyYSIsIm5hbWUiOiJhbm9ueW1vdXMiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0NzgzNzkyNn0.hbir2KorooVTodjVibOoHLFdZvwvyQbZUAiFgdzUvEw'
)
// const args = argsParser(process.argv);
// const client = new DeliverooApi(args.host,args.token);


/*
EVENTS MANAGEMENT - INITIALIZE CORRECTLY THE BELIEFS
*/

const event = new EventEmitter();

const map_promise = new Promise((res,rej) => {
    event.once('map', () => res());
})

const settings_promise = new Promise((res,rej) => {
    event.once('settings', () => res());
})

const me_promise = new Promise((res,rej) => {
    event.once('me', () => res());
})

/*
---------------------------------------------------------
*/

//refers to `settings` variable
client.onConfig((conf) => {
    settings.decay = getNumber(conf.PARCEL_DECADING_INTERVAL) // could be null if infinite
    settings.max_parcel = Number(conf.PARCELS_MAX)
    settings.movement = conf.MOVEMENT_DURATION
    event.emit('settings');
})

//refers to `me` variable
client.onYou( async ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
    event.emit('me');
} )

//refers to the tiles maps: accessible_tiles(modified runtime), original_map, delivery_map
client.onMap((width, height, tiles) => {
    accessible_tiles = removeWalls(tiles);
    original_map = accessible_tiles.slice();
    delivery_map = destinationTiles(tiles);
    settings.x = width;
    settings.y = height
    event.emit('map');
})

//refers to other Agents beliefs handeling, like updating the map of accessible tiles
client.onAgentsSensing( ( sensed_agents ) => {
    for ( const a of sensed_agents)
        if(a.id != me.id) agents.set(a.id, a);
    // console.log("updating tiles");
    accessible_tiles = removeAgentTiles(sensed_agents,original_map);
})

//initilize correctly the Agent loop
Promise.all([map_promise, settings_promise, me_promise]).then(() => myAgent.loop())

//refers to the parcels beliefs, here there is also the schedule of parcels pickup
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

//Agent loop checks if it is still valid the intention





class Intention {

    // Plan currently used for achieving the intention 
    #current_plan;
    
    // This is used to stop the intention
    #stopped = false;
    get stopped () {
        return this.#stopped;
    }
    stop () {
        // this.log( 'stop intention', ...this.#predicate );
        this.#stopped = true;
        if ( this.#current_plan)
            this.#current_plan.stop();
    }

    /**
     * #parent refers to caller
     */
    #parent;

    /**
     * predicate is in the form ['go_to', x, y]
     */
    get predicate () {
        return this.#predicate;
    }
    #predicate;

    constructor ( parent, predicate ) {
        this.#parent = parent;
        this.#predicate = predicate;
    }

    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    #started = false;
    /**
     * Using the plan library to achieve an intention
     */
    async achieve () {
        // Cannot start twice
        if ( this.#started)
            return this;
        else
            this.#started = true;

        // Trying all plans in the library
        for (const planClass of planLibrary) {

            // if stopped then quit
            if ( this.stopped ) throw [ 'stopped intention', ...this.predicate ];

            // if plan is 'statically' applicable
            if ( planClass.isApplicableTo( ...this.predicate ) ) {

                // plan is instantiated
                this.#current_plan = new planClass(this.parent);
                this.log('achieving intention', ...this.predicate, 'with plan', planClass.name);
                // and plan is executed and result returned
                try {
                    const plan_res = await this.#current_plan.execute( ...this.predicate );
                    this.log( 'succesful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res );
                    return plan_res
                // or errors are caught so to continue with next plan
                } catch (error) {
                    this.log( 'failed intention', ...this.predicate,'with plan', planClass.name, 'with error:', ...error );
                }
            }

        }

        // if stopped then quit
        if ( this.stopped ) throw [ 'stopped intention', ...this.predicate ];

        // no plans have been found to satisfy the intention
        // this.log( 'no plan satisfied the intention ', ...this.predicate );
        throw ['no plan satisfied the intention ', ...this.predicate ]
    }

}

//Agent loop
class IntentionRevision {

    #current_intention = null;
    get current_intention () {
        return this.#current_intention;
    }
    set current_intention ( intention ) {  
        this.#current_intention = intention;
    }
    #intention_queue = new Array(); 
    get intention_queue () {
        return this.#intention_queue;
    }

    set intention_queue(intention_q){
        this.#intention_queue = intention_q.slice();
    }

    cleanIntentions() {
    //iterate over the intention queue and delete the intentions for the deceased parcels
        if(this.current_intention && checkIntention(this.current_intention)){
            this.current_intention.stop();
            this.current_intention = null; //resetting the current intention
            console.log("stopped current intention");
        }
        this.intention_queue.forEach((intention, index) => {
            if(checkIntention(intention)){
                // console.log("CHECK CLEANING: ", intention.predicate,this.current_intention.predicate);
                if(this.current_intention && intention.predicate[3] == this.current_intention.predicate[3]){
                    this.current_intention.stop();
                    console.log("stopping intention: ", intention.predicate);//doesn't work
                }
                    
                this.intention_queue = this.intention_queue.filter((others) => {return others.predicate.join(' ') != intention.predicate.join(' ')});
            }
            //deleting duplicates intentions
            if(index > 0 && intention.predicate[0] == 'delivery' && this.intention_queue[index - 1] && this.intention_queue[index - 1].predicate[0] == 'delivery'){
                this.intention_queue = this.intention_queue.filter((int_to_delete) => {
                    return int_to_delete.predicate.join(' ') != this.intention_queue[index - 1].predicate.join(' ')
                })
            }

        })
    }

    async loop ( ) {
        while ( true ) {
            if(!idle){
                // Consumes intention_queue if not empty
                if ( this.intention_queue.length > 0) {
                    console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) );
                
                    // Current intention
                    const intention = this.intention_queue[0];
                    this.current_intention = intention;


                    let id = intention.predicate[3]
                    let p = parcels.get(id)
                    if ( p && p.carriedBy ) {
                        console.log( 'Skipping intention because no more valid', intention.predicate )
                        //CHECK 2
                        //stop the current intention
                        this.intention_queue.shift(); //remove it from the queue
                        continue;
                    }
                    else{
                        //CHECK 2
                        // Start achieving intention
                        this.intention_queue.shift();
                        console.log("CHECK loop:", this.#current_intention.predicate);
                        await intention.achieve().then((res) => console.log("achieved intention: ", res)).catch( err => console.log("something went wrong in achieving your intention: ", err));
                    }

                    
                }
                else{
                    await myAgent.push(['wandering']);
                }
            }

            
            // Postpone next iteration at setImmediate
            await new Promise( res => setImmediate( res ) );
        }
    }

    async push ( predicate ) { }

    log ( ...args ) {
        console.log( ...args )
    }

}

//when pushing a new pick up intention, check if there it is a delivery already or schedule it
class IntentionRevisionRevise extends IntentionRevision {
    
    constructor() {
        super();
        this.last_delivery_position = null; // salva la posizione x,y
    }

    //CHANGE
    async push ( predicate ) {
        const intention_name = predicate[0];
        // console.log("pushing",intention_name);
        
        // Check if already queued but not delivery(possible > 2)
        if ( intention_name != 'delivery' && this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) )
            return; // intention is already queued
        
        if (settings.decay){
            updateElapsed();
            this.cleanIntentions();
        }

        if(this.intention_queue.length == 0){
            this.intention_queue.push(new Intention( this, predicate ));
            // console.log(parcels.get(predicate[3]));
            if(parcels.get(predicate[3])){
                let reward = rewardFun(predicate,me);
                //leave wandering as soon you detect a parcel
                if(this.current_intention && this.current_intention.predicate[0] == 'wandering'){
                    console.log("switched intention");
                    this.current_intention.stop();
                }
                // console.log("CHECK 0 pushing delivery", reward);
                await this.push(['delivery', Math.round(reward / 2)]);
            }    
            return;
        }

        // console.log("parcels");
        // parcels.forEach((parcel) => console.log(parcel));
        switch (intention_name) {
            case 'delivery':
                //count the delivery in the queue
                let delivery_in_queue = this.intention_queue.filter((intention) => intention.predicate[0] == 'delivery');
                let last_intention = this.intention_queue[this.intention_queue.length - 1];
                if(last_intention.predicate[0] != 'delivery'){
                    console.log( 'IntentionRevisionReplace.push', predicate );
                    const intention = new Intention( this, predicate );
                    this.intention_queue.push( intention );}
                else{
                    console.log("delivery already scheduled");
                }
                break;
            case 'go_pick_up':
                if(parcels.get(predicate[3])){
                    let delivery_reward = rewardFun(predicate,me); // >= 1
                    let new_intention = new Intention(this, predicate);
                    this.intention_queue.push(new_intention);

                    //Change the actual intention if I push something better
                    if(this.current_intention && rewardFun(this.current_intention.predicate, me) < rewardFun(predicate, me)){
                        const rescheduled_intention = this.current_intention
                        this.current_intention.stop();
                        this.intention_queue.push(rescheduled_intention);
                    }

                    this.intention_queue.sort((a, b) =>{
                        // if(a[3] && b[3])
                        return rewardFun(a.predicate, me) - rewardFun(b.predicate, me) 
                        // else return 0;
                    })
                    this.intention_queue.reverse();
                    //leave wandering as soon you detect a parcel or a better parcel than the one that I'm going to pick up
                    if(this.current_intention && this.current_intention.predicate[0] == 'wandering')
                        this.current_intention.stop();

                    const delivery = ['delivery', Math.round(delivery_reward / 2)];
                    await this.push(delivery);
                }
                else
                    console.log("Intention: ", predicate, "no more valid");
                break;
            case 'wandering':
                let wandering_arr = this.intention_queue.filter((intention) => intention.predicate[0] == 'wandering');
                if(wandering_arr.length == 0){
                    console.log("CHECK wandering");
                    let wandering = new Intention(this, ['wandering']);
                    this.intention_queue.push(wandering)
                }
                break;
            default:
                break;
        }
    }
}

var myAgent = new IntentionRevisionRevise();

/**
 * Plan library
 */
const planLibrary = [];

class Plan {

    // This is used to stop the plan
    #stopped = false;
    stop () {
        // this.log( 'stop plan' );
        this.#stopped = true;
        for ( const i of this.#sub_intentions ) {
            i.stop();
        }
    }
    get stopped () {
        return this.#stopped;
    }

    /**
     * #parent refers to caller
     */
    #parent;

    constructor ( parent ) {
        this.#parent = parent;
    }

    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    async subIntention ( predicate ) {
        const sub_intention = new Intention( this, predicate );
        this.#sub_intentions.push( sub_intention );
        await sub_intention.achieve();
        await new Promise( res => setImmediate( res ) );
        return true;
    }

}

class GoPickUp extends Plan {

    static isApplicableTo ( go_pick_up, x, y, id ) {
        return go_pick_up == 'go_pick_up';
    }

    async execute ( go_pick_up, x, y ) {
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            await this.subIntention( ['go_to', x, y] );
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            await this.subIntention(['pick_up']);
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            return true;
    }

}

class BFSMove extends Plan {

    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( go_to, x, y ) {
        // console.log(`starting DFS: ${[me.x,me.y]} ${[x,y]}`);
        if ( this.stopped ) {return false;};
        let path;
        try{
            path = BFS([me.x,me.y], [x,y], accessible_tiles)
            // console.log(me,target_x,target_y, accessible_tiles);
            if ( this.stopped ) {return false;}
        }        
        catch(err){
            console.log("BFS not able to return a path", err);
        }
        //console.log("finished BFS", path);
        if(path && path.length > 1)
            for ( let i = 0; i < path.length; i++ ) {
                if ( this.stopped ) {return false;};
                const next_tile = path[i];

                if(accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                    await this.subIntention( ['go_to', x, y]);
                    return true
                }

                const dx = next_tile.x - me.x;
                const dy = next_tile.y - me.y;
                
                if( dx != 0){
                    if(dx > 0){
                        await client.emitMove("right").catch((err) => console.log("cannot go right"))
                    } else {
                        await client.emitMove("left").catch((err) => console.log("cannot go left"))
                    }
                }
                if( dy != 0){
                    if(dy > 0){
                        await client.emitMove("up").catch((err) => console.log("cannot go up"))
                    } else {
                        await client.emitMove("down").catch((err) => console.log("cannot go down"))
                    }
                }
            }
        else return false;
        return true;
    }
}

class Delivery extends Plan {

    static isApplicableTo ( delivery ) {
        return delivery == 'delivery';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( delivery) {
        // console.log(`starting DFS: ${[me.x,me.y]} ${[x,y]}`);
        if ( this.stopped ) {return false;}
        let path = nearestDeliveryTile(me.x,me.y, delivery_map, accessible_tiles)
        // console.log("delivery", path);
        if(path)
            for ( let i = 0; i < path.length; i++ ) {
                if ( this.stopped ) {return false;};
                const next_tile = path[i];

                if(accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                    await this.subIntention( ['delivery']);
                    return true
                }

                const dx = next_tile.x - me.x;
                const dy = next_tile.y - me.y;
                
                if( dx != 0){
                    if(dx > 0){
                        await client.emitMove("right").catch((err) => console.log("cannot go right"))
                    } else {
                        await client.emitMove("left").catch((err) => console.log("cannot go left"))
                    }
                }
                if( dy != 0){
                    if(dy > 0){
                        await client.emitMove("up").catch((err) => console.log("cannot go up"))
                    } else {
                        await client.emitMove("down").catch((err) => console.log("cannot go down"))
                    }
                }
            }
        else{
            await this.subIntention(['wait']);
            myAgent.push(['wandering']);
            myAgent.push(['delivery', 2]);
            return false;
        }
        if ( this.stopped ) {return false;}
        await this.subIntention(['put_down']).then(() => {return true}).catch((err) => {console.log(err); return false})
        
    }
}

class Wandering extends Plan {

    static isApplicableTo ( desire ) {
        return desire == 'wandering';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        let target_x; let target_y;
        let path;

        let tiles_array = wanderingRoundRobin(accessible_tiles);
        // console.log("tiles_array: ", tiles_array);
        let counter = tiles_array.length;
        for([target_x, target_y] of tiles_array){
            try{
                // console.log(me,target_x,target_y, accessible_tiles);
                if ( this.stopped ) {return false;}
            
                path = BFS([me.x,me.y],[target_x, target_y],accessible_tiles);
            }        
            catch(err){
                console.log("broken BFS", err);
            }
            if(path && path.length > 1)
                for ( let i = 0; i < path.length; i++ ) {
                    if ( this.stopped ) {return false;}
                    const next_tile = path[i];

                    if(accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                        console.log("next tile not available");
                        await this.subIntention( ['wandering']);
                        return true
                    }

                    const dx = next_tile.x - me.x;
                    const dy = next_tile.y - me.y;
                    
                    if( dx != 0){
                        if(dx > 0){
                            await client.emitMove("right").catch((err) => console.log("cannot go right"))
                        } else {
                            await client.emitMove("left").catch((err) => console.log("cannot go left"))
                        }
                    }
                    if( dy != 0){
                        if(dy > 0){
                            await client.emitMove("up").catch((err) => console.log("cannot go up"))
                        } else {
                            await client.emitMove("down").catch((err) => console.log("cannot go down"))
                        }
                    }
                }
            else
                --counter;
        }
        if(counter != 0)
            return true;
        else
            await this.subIntention(['wait'])
            return false;

    }
        
}


class PickUp extends Plan{
    static isApplicableTo ( desire ) {
        return desire == 'pick_up';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        await client.emitPickup().then(() => {return true}).catch((err) => {console.log(err); return false})
    }
}

class PutDown extends Plan{
    static isApplicableTo ( desire ) {
        return desire == 'put_down';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        if(delivery_map.filter((delivery_tile) => {
            return delivery_tile.x == me.x && delivery_tile.y == me.y
        }).length != 0)
            await client.emitPutdown().then(() => {return true}).catch((err) => {console.log(err); return false})
        else{
            console.log("not possible to deliver");
        }    
    }
}

class Idle extends Plan{
    static isApplicableTo ( desire ) {
        return desire == 'wait';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        idle = true;
        setTimeout(() => {console.log("waited 1 second")
            idle = false;
        }, 1000);
    }
}

// plan classes are added to plan library 
planLibrary.push( GoPickUp )
planLibrary.push( BFSMove )
planLibrary.push( Delivery)
planLibrary.push( Wandering)
planLibrary.push( PickUp)
planLibrary.push( PutDown)
planLibrary.push( Idle)