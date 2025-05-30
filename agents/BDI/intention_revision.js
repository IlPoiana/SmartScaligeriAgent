import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { removeWalls,BFS } from "../lib/algorithms.js"

//Believes declaration
const me = {}
const parcels = new Map();
let accessible_tiles = [];
let delivery_map = [];


/*
FUNCTIONS DECLARATION---------------------------
*/


/**
 * Updates all the parcels timer 
 */
function updateElapsed() {
    console.log("updating");
    const now = Date.now();
    parcels.forEach(parcel => {
        parcel.timedata.elapsed = parcel.timedata.elapsed - Number((now / 1e3 - parcel.timedata.startTime).toFixed(2));
        if(parcel.timedata.elapsed <= 0)
            parcels.delete(parcel.data.id);
    });
    parcels.forEach((parcel) => console.log(parcel.data, parcel.timedata.elapsed))
}
//Believes declaration
const me = {}
const parcels = new Map();
let accessible_tiles = [];
let delivery_map = [];


/*
FUNCTIONS DECLARATION---------------------------
*/


/**
 * Updates all the parcels timer 
 */
function updateElapsed() {
    console.log("updating");
    const now = Date.now();
    parcels.forEach(parcel => {
        parcel.timedata.elapsed = parcel.timedata.elapsed - Number((now / 1e3 - parcel.timedata.startTime).toFixed(2));
        if(parcel.timedata.elapsed <= 0)
            parcels.delete(parcel.data.id);
    });
    parcels.forEach((parcel) => console.log(parcel.data, parcel.timedata.elapsed))
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

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

function rewardFun(predicate, {x: x1, y:y1}){
    if(predicate[3])
        return parcelRewardFun(predicate, {x1,y1}) + (parcels.get(predicate[3])).timedata.elapsed;
    else if(predicate[0] == 'delivery'){
        return predicate[1];//should be the delivery reward
    }
}

function rewardFun(predicate, {x: x1, y:y1}){
    if(predicate[3])
        return parcelRewardFun(predicate, {x1,y1}) + (parcels.get(predicate[3])).timedata.elapsed;
    else if(predicate[0] == 'delivery'){
        return predicate[1];//should be the delivery reward
    }
}

/**
 * 
 * @param {*} predicate in the form of [desire, x, y, p_id]
 * @param {*} param1 
 * @returns 
 */
function parcelRewardFun(predicate, {x: x1, y:y1}) {
function parcelRewardFun(predicate, {x: x1, y:y1}) {
    const id_p = predicate[3]
    let parcel = parcels.get(id_p)
    if(!parcel)
        return 0;
    let parcel = parcels.get(id_p)
    if(!parcel)
        return 0;
    //quando arriva delivery diventa undefined
    const reward = parcel.data.reward 
    console.log("parcel id",id_p,"reward",reward)
    const reward = parcel.data.reward 
    console.log("parcel id",id_p,"reward",reward)
    //return Math.abs(Number.MAX_VALUE - distance({x:x1,y:y1},{ x:parcels.get(id_p).x, y:parcels.get(id_p).y}));
    distance({x:x1,y:y1},{ x:parcel.data.x, y:parcel.data.y})
    let computed_reward = reward -  distance({x:x1,y:y1},{ x:parcel.data.x, y:parcel.data.y});
    console.log("CHECK reward- id:", predicate[3],computed_reward);
    return computed_reward < 0 ? 0 : computed_reward;
}

// -----------------------------------------


const client = new DeliverooApi(
    'http://localhost:8080',
    //Delivery token
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OWM3ZCIsIm5hbWUiOiJEZWxpdmVyeSIsInRlYW1JZCI6ImJjYTBjMyIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDc4MzI5ODB9.t_AhdFcoHUtbjl-SBM_h1bxhXwMGmVjfk1dhqZ4oICs'
)



/**
 * Beliefset revision function
 */
client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
} )


var generate_options = true;

client.onParcelsSensing( async ( perceived_parcels ) => {
    let found_new = false
    const now = Date.now(); //initialize all the percieved parcels at the same time
  
    for (const p of perceived_parcels) {


        if(!parcels.has(p.id)){
            found_new = true;
        }   
        //map of parcels id and parcel data and timedata
        parcels.set( p.id, {data:p,timedata:{startTime: now / 1e3,elapsed: p.reward}});
    }
    
    if(found_new){
        updateElapsed();
    
    if(found_new){
        updateElapsed();
        generate_options = true
    }
    }
    else
        generate_options = false

} )

const agents = new Map();



client.onMap((width, height, tiles) => {
    accessible_tiles = removeWalls(tiles);
    delivery_map = destinationTiles(tiles);
    // console.log(`accessible_tiles ${accessible_tiles}`)
})

client.onParcelsSensing( detected_parcels => {
    if(generate_options){
        /**
         * Options generation
         */
        const options = []

        for (const parcel of detected_parcels.values()){
                if ( ! parcel.carriedBy &&
                    myAgent.intention_queue.filter(intention => {
                        return parcel.id == intention.predicate[3]
                    }).length == 0
                )
                    options.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id] );
        }
        
        console.log("\n ----- \ngenerating options: ", options);
        /**
         * Options filtering
         * need to add also a utility function
         */


        options.sort((a,b) => {
            let [go_pick_up_a,x_a,y_a,id_a] = a;
            let [go_pick_up_b,x_b,y_b,id_b] = b;
            return (parcelRewardFun(a, me) - parcelRewardFun(b, me));
            return (parcelRewardFun(a, me) - parcelRewardFun(b, me));
        })
        console.log("me: ", me);
        console.log("CHECK 1 sorted options:");
        options.map((option) => console.log(parcels.get(option[3])))
        console.log("me: ", me);
        console.log("CHECK 1 sorted options:");
        options.map((option) => console.log(parcels.get(option[3])))

        options.forEach((option) =>  myAgent.push(option));      

        if(options.length > 0){
            console.log("check options",);
            let last_id = options[options.length - 1][3];
            let last_parcel = parcels.get(last_id);
            myAgent.push(['delivery', last_parcel.data.reward]);
            console.log(last_parcel.data.reward);
            console.log("check options",);
            let last_id = options[options.length - 1][3];
            let last_parcel = parcels.get(last_id);
            myAgent.push(['delivery', last_parcel.data.reward]);
            console.log(last_parcel.data.reward);
        }

        console.log("CHECK 2 intention queue: ", myAgent.intention_queue.map(i=>i.predicate));
        console.log("CHECK 2 intention queue: ", myAgent.intention_queue.map(i=>i.predicate));
    }
        

} )



/**
 * Intention revision loop
 */
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

    async loop ( ) {
        while ( true ) {
            // Consumes intention_queue if not empty
            if ( this.intention_queue.length > 0 ) {
                //console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) );
            
                // Current intention
                const intention = this.intention_queue[0];
                this.current_intention = intention;

                //CHANGE
                // Is queued intention still valid? Do I still want to achieve it?
                // TODO this hard-coded implementation is an example

                let id = intention.predicate[3]
                let p = parcels.get(id)
                if ( p && p.carriedBy ) {
                    console.log( 'Skipping intention because no more valid', intention.predicate )
                    //CHECK 2
                    // Remove from the queue
                    this.intention_queue.shift();
                    continue;
                }
                else{
                    //CHECK 2
                    // Start achieving intention
                    await intention.achieve().then(() => this.intention_queue.shift()).catch( err => console.log("something went wrong in achieving your intention: ", err));
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

class IntentionRevisionRevise extends IntentionRevision {
    
    constructor() {
        super();
        this.last_delivery_position = null; // salva la posizione x,y
    }

    //CHANGE
    async push ( predicate ) {
        const intention_name = predicate[0];
        // Check if already queued but not delivery(possible > 2)
        if ( intention_name != 'delivery' && this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) )
            return; // intention is already queued
        
        updateElapsed();

        let flag = true;
        let predicate_x; 
        let predicate_y; 
        let predicate_parcel_id; 
        let predicate_desire;
        [predicate_desire, predicate_x, predicate_y, predicate_parcel_id] = predicate;
        if(this.intention_queue.length == 0){
            this.intention_queue.push(new Intention( this, predicate ));
            return;
        }
        if(this.intention_queue.length == 0){
            this.intention_queue.push(new Intention( this, predicate ));
            return;
        }
        //checking if there exist a current intention
        if(this.current_intention && this.current_intention.predicate && this.current_intention.predicate[0]){


            //take the option to schedule, if it is a parcel schedule based on rw f
            //if it is a delivery-> no other delivery put at the bottom, one delivery, put after only if it is after
            console.log("CHECK 3",intention_name);
            switch (intention_name) {
                case 'delivery':
                    //count the delivery in the queue
                    let delivery_in_queue = this.intention_queue.filter((intention) => intention[0] == 'delivery');
                    let last_intention = this.intention_queue[this.intention_queue.length - 1];
                    if(delivery_in_queue.length < 1 && last_intention[0] != 'delivery'){
                        console.log( 'IntentionRevisionReplace.push', predicate );
                        const intention = new Intention( this, predicate );
                        this.intention_queue.push( intention );}
                    break;
                case 'go_pick_up':
                    let new_intention = new Intention(this, predicate);
                    //if not delivery is go_pick_up
                    let utility_new = rewardFun(predicate, me); 
                    console.log("current intention is: ", this.current_intention.predicate)
                    let utility_curr = rewardFun(this.current_intention,me);
                    if(utility_new > utility_curr)
                    {   
                        console.log(utility_new, "current", utility_curr);
                        this.current_intention.stop();
                        this.intention_queue.unshift(new_intention)}
                    else
                    {
                        console.log("pushing new intention in the queue", new_intention);
                        this.intention_queue.push(new_intention);
                        let sorted_array = this.intention_queue.sort((a, b) =>{
                            if(a.predicate[3] && b.predicate[3])
                            return rewardFun(b.predicate, me) - rewardFun(a.predicate, me) 
                            else return 0;
                        })
                        sorted_array.reverse();
                        console.log("CHECK 4");
                        sorted_array.map((intention) => console.log(intention.predicate));
                    }

                    break;
                case 'wandering':
                    console.log("to do");
                    break;
                default:
                    break;
            }
        }

        // TODO
        // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
        // - eventually stop current one
        // - evaluate validity of intention
        // - adding a timer for the parcel that 
        // - ordering of the queue by nearest parcel

    }

}


var myAgent = new IntentionRevisionRevise();

myAgent.loop();



/**
 * Intention
 */
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
                //this.log('achieving intention', ...this.predicate, 'with plan', planClass.name);
                // and plan is executed and result returned
                try {
                    const plan_res = await this.#current_plan.execute( ...this.predicate );
                    //this.log( 'succesful intention', ...this.predicate, 'with plan', planClass.name, 'with result:', plan_res );
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
        return await sub_intention.achieve();
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
            await client.emitPickup()
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            await this.subIntention( ['delivery']);
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            await this.subIntention( ['delivery']);
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
        if ( this.stopped ) throw ['stopped'];
        if ( this.stopped ) throw ['stopped'];
        let path = BFS([me.x,me.y], [x,y], accessible_tiles)
        //console.log("finished BFS", path);
        for ( let i = 0; i < path.length; i++ ) {
            if ( this.stopped ) throw ['stopped'];
            if ( this.stopped ) throw ['stopped'];
            const next_tile = path[i];

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
        if ( this.stopped ) throw ['stopped'];
        if ( this.stopped ) throw ['stopped'];
        let path = nearestDeliveryTile(me.x,me.y, delivery_map, accessible_tiles)
        // console.log("delivery", path);
        for ( let i = 0; i < path.length; i++ ) {
            if ( this.stopped ) throw ['stopped'];
            if ( this.stopped ) throw ['stopped'];
            const next_tile = path[i];

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
        console.log("putting down");
        await client.emitPutdown();



        return true;
    }
}

// plan classes are added to plan library 
planLibrary.push( GoPickUp )
planLibrary.push( BFSMove )
planLibrary.push( Delivery)
