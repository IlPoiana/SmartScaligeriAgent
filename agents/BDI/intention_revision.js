import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { DFS,BFS } from "../lib/algorithms.js"


const behavior = 2;

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0'
    // 'https://deliveroojs.onrender.com'
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMwNmI5MTZkZWYwIiwibmFtZSI6Im1hcmNvIiwiaWF0IjoxNjk2OTM5OTQyfQ.oILtKDtT-CjZxdnNYOEAB7F_zjstNzUVCxUWphx9Suw'
)

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

// --- Funzione per ottenere i parcels ordinati per utilità (reward - distanza) ---
function getSortedParcels() {
    const list = [];
    parcels.forEach(parcel => {
      if (!parcel.carriedBy) {
        const dist = distance(me, parcel);
        const util = parcel.reward - dist;
        list.push({ id: parcel.id, x: parcel.x, y: parcel.y, reward: parcel.reward, dist, util });
      }
    });
    list.sort((a, b) => b.util - a.util);
    return list;
  }

  function sortIntentin(intentions){

    for(const intention of intentions){        
        if(intention.predicate[0] == "go_pick_up"){
            
        }
    }
    intentions.sort((a,b) => b.utility - a.utility);
    return intentions;
  }

  function parcelUtility(parcel) {
    const dist = distance(me, parcel);
    return parcel.reward - dist;
  }

  

function removeWalls(tiles){
    var available = [];
    tiles.forEach(elem => {
        if(elem.type != 0)
            available.push({
                x: elem.x,
                y: elem.y,
                type: elem.type
            })
    });
    return available;
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

// crea il belief set
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

client.onConfig( (param) => {
    // console.log(param);
} )

let accessible_tiles = [];
client.onMap((width, height, tiles) => {
    accessible_tiles = removeWalls(tiles);
    // console.log(`accessible_tiles ${accessible_tiles}`)
})


/**
 * Options generation and filtering function
 */
client.onParcelsSensing( parcels => {
    //CHECK
    if(generate_options){

        /**
         * Options generation
         */
        const options = []

        //for every parcel that wasn't picked up and is not in my queue to pick up I'll add it
        for (const parcel of parcels.values()){
                if ( ! parcel.carriedBy &&
                    myAgent.intention_queue.filter(intention => {
                        return parcel.id == intention.predicate[3]
                    }).length == 0
                )
                
                    options.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id] );
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

        /**
         * Best option is selected
         */
        // for(let i = options.length - 1;i >= 0; i--)
        //     myAgent.push(options[i]);       
    }
        

} )
// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )



/**
 * Intention revision loop
 */
class IntentionRevision {

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

//first in first out
class IntentionRevisionQueue extends IntentionRevision {

    async push ( predicate ) {
        
        // Check if already queued
        if ( this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) ){
            console.log("intention ", predicate ," is already queued");
            return; // intention is already queued
        }
            

        console.log( 'IntentionRevisionReplace.push', predicate );
        const intention = new Intention( this, predicate );
        this.intention_queue.push( intention );
    }

}

class IntentionRevisionReplace extends IntentionRevision {

    async push ( predicate ) {

        // Check if already queued
        const last = this.intention_queue.at( this.intention_queue.length - 1 );
        if ( last && last.predicate.join(' ') == predicate.join(' ') ) {
            console.log("intention already being achieved")
            return; // intention is already being achieved
        }
        
        console.log( 'IntentionRevisionReplace.push', predicate );
        console.log("parcels", parcels);
        const intention = new Intention( this, predicate );
        this.intention_queue.push( intention );
        
        // Force current intention stop 
        if ( last ) {
            last.stop();
        }
    }

}

class IntentionRevisionRevise extends IntentionRevision {
    //CHANGE
    async push ( predicate ) {

        // Check if already queued
        const last = this.intention_queue.at( this.intention_queue.length - 1 );
        if ( last && last.predicate.join(' ') == predicate.join(' ') ) {
            console.log("intention already being achieved")
            return; // intention is already being achieved
        }

        console.log( '💡 Revising intention queue. Received', ...predicate );
        //const queue = this.intention_queue.map( i => i.predicate );
        //console.log( '👍​ Intention queue:', queue );
        
        // TODO
        // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
        for( const i of this.intention_queue ){
            console.log("intention: ", i.predicate, " distance: ", distance({x:i.predicate[1],y:i.predicate[2]},me), " reward: ", parcels.get(i.predicate[3]).reward);

        }

        // - eventually stop current one
        // - evaluate validity of intention

        if( myAgent.predicate[0] != 'delivery')
        {

        }
        
            console.log( 'IntentionRevisionRevise.push', predicate );
        const list = new Array();
        const newIntention = new Intention( this, predicate );
        list.push( newIntention )
        /*for(const intetion of this.intention_queue){
            if(intetion.predicate[0] == "go_pick_up"){
                list.push(intetion);
                this.intention_queue.shift();
            }
        }*/
        list.sort((a,b) => {
            let [go_pick_up_a,x_a,y_a,id_a,] = a.predicate;
            let [go_pick_up_b,x_b,y_b,id_b] = b.predicate;
            return (distance({x:x_a,y:y_a}, me) - distance({x:x_b,y:y_b}, me));
        })


        //list.sort((a,b)=>parcelUtility(a) - parcelUtility(b))
        //list.forEach(function(entry) {
        //    console.log("intetion: ", entry);
        //  });
            

    }

}

var myAgent;

/**
 * Start intention revision loop
 */
switch (behavior) {
    case 0:
        myAgent = new IntentionRevisionQueue();
        break;
    case 1:
        myAgent = new IntentionRevisionReplace();
        break;
    case 2:
        myAgent = new IntentionRevisionRevise();
        break;
    default:
        console.log("not a valid input passed");
        process.exit();
}

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

class BlindMove extends Plan {

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

// plan classes are added to plan library 
planLibrary.push( GoPickUp )
planLibrary.push( BlindMove )
