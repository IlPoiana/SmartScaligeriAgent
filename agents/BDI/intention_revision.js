import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { removeWalls,BFS } from "../lib/algorithms.js"



const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0'
    // 'https://deliveroojs.onrender.com'
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwNmI5MTZkZWYwIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjk2OTM5OTQyfQ.oILtKDtT-CjZxdnNYOEAB7F_zjstNzUVCxUWphx9Suw'
)

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

/**
 * 
 * @param {*} predicate in the form of [desire, x, y, p_id]
 * @param {*} param1 
 * @returns 
 */
function rewardFun(predicate, {x: x1, y:y1}) {
    const id_p = predicate[3]
    console.log("id parcel", id_p)
    console.log("parcels", parcels)
    console.log("parcel get", parcels.get(id_p))

    const reward = (parcels.get(id_p)).reward   //capire perchè è undefined
    return reward - distance({x:x1,y:y1},{ x:parcels.get(id_p).x, y:parcels.get(id_p).y});
  }

/**
 * Beliefset revision function
 */
const me = {};
client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
} )
const parcels = new Map();
var generate_options = true;
client.onParcelsSensing( async ( perceived_parcels ) => {
    let found_new = false
    
    for (const p of perceived_parcels) {
        if(!parcels.has(p.id)){
            found_new = true;
        }   
        parcels.set( p.id, p);
    }
    if(found_new)
        generate_options = true
    else
        generate_options = false

} )


let accessible_tiles = [];
let delivery_map = [];
client.onMap((width, height, tiles) => {
    accessible_tiles = removeWalls(tiles);
    delivery_map = destinationTiles(tiles);
    // console.log(`accessible_tiles ${accessible_tiles}`)
})

client.onParcelsSensing( parcels => {
    if(generate_options){
        /**
         * Options generation
         */
        const options = []

        for (const parcel of parcels.values()){
                if ( ! parcel.carriedBy &&
                    myAgent.intention_queue.filter(intention => {
                        return parcel.id == intention.predicate[3]
                    }).length == 0
                )
                    options.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] );
            }
        
        console.log("\n ----- \nCHECK generating options", options);
        /**
         * Options filtering
         */
    
        options.sort((a,b) => {
            let [go_pick_up_a,x_a,y_a,id_a] = a;
            let [go_pick_up_b,x_b,y_b,id_b] = b;
            return (distance({x:x_a,y:y_a}, me) - distance({x:x_b,y:y_b}, me));
        })
        console.log("CHECK 1 sorted options: ", options, "\nme: ", me);

        options.forEach((option) =>  myAgent.push(option));      

        if(options.length > 0){
            myAgent.push(['delivery']);
        }
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
                console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) );
            
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
    //CHANGE
    async push ( predicate ) {
        
        // Check if already queued
        if ( this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) )
            return; // intention is already queued


        let predicate_x; let predicate_y; let predicate_parcel_id; let predicate_desire;
        [predicate_desire, predicate_x, predicate_y, predicate_parcel_id] = predicate;

        if(this.current_intention && this.current_intention.predicate && this.current_intention.predicate[0]){

            if(this.current_intention.predicate[0] != 'delivery' && predicate[0] != 'delivery'){
                
                console.log("current intention is delivery")
                //if not delivery is go_pick_up
                console.log("predicate: ",predicate)
                let utility_0 = rewardFun(predicate, me);
                console.log(this.current_intention.predicate)
                let utility_curr = rewardFun(this.current_intention.predicate, me)
                if(utility_0 > utility_curr){
                    this.current_intention.stop();
                    const intention = new Intention( this, predicate );
                    this.intention_queue.unshift(intention);
                    this.intention_queue.push(this.current_intention);  //fix this is not the best insertion in the array
                }
                else{
                    console.log("predicate: ", predicate);
                    console.log( 'IntentionRevisionRevise.push', predicate );
                    const intention = new Intention( this, predicate );
                    this.intention_queue.push( intention );
                }

            }
            else{
                console.log("predicate: ", predicate);
                console.log( 'IntentionRevisionReplace.push', predicate );
                const intention = new Intention( this, predicate );
                this.intention_queue.push( intention );
            }

            
        }else{
            console.log("predicate: ", predicate);
            console.log( 'IntentionRevisionReplace.push', predicate );
            const intention = new Intention( this, predicate );
            this.intention_queue.push( intention );
        }

    
        

        


        // TODO
        // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)

        // - eventually stop current one
        // - evaluate validity of intention


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
        let path = BFS([me.x,me.y], [x,y], accessible_tiles)
        console.log("finished BFS", path);
        for ( let i = 0; i < path.length; i++ ) {
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
        let path = nearestDeliveryTile(me.x,me.y, delivery_map, accessible_tiles)
        console.log("delivery", path);
        for ( let i = 0; i < path.length; i++ ) {
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
