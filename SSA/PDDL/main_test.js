import { Beliefset } from "../Beliefs/belief.js";
import { IntentionRevisionRevise } from "../Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../Planner/plans.js";
import { onlineSolver, PddlExecutor, PddlProblem} from "@unitn-asa/pddl-client";
import fs from 'fs';

class MetricPddlProblem extends PddlProblem {
    #domain;
    #metric;


    constructor(domain,name, objects, init, goal, metric){
        super(name, objects, init, goal);
        this.#domain = domain;
        this.#metric = metric;
    }

    toPddlString(){
        return `\
;; problem file: ${this.name}.pddl
(define (problem deliver-parcels-instance)
    (:domain ${this.#domain})
    (:objects ${this.objects})
    (:init ${this.inits})
    (:goal (${this.goals}))
    (:metric ${this.#metric})
)
`
    }

}

class PddlBeliefset {
    
    #objects = new Set();
    #facts = new Map();
    
    constructor () {
    }



    addObject (obj) {
        if (!(typeof obj === 'string'))
            throw('String expected, got ' + typeof obj + ': ' + obj)
        this.#objects.add(obj)
    }

    removeObject (obj) {
        if (!(typeof obj === 'string'))
            throw('String expected, got ' + typeof obj + ': ' + obj)
        this.#objects.delete(obj);
    }

    get objects () {
        return Array.from( this.#objects );
    }


    /**
     * call the declare method with false value
     * @param {String} fact A fact is composed by a predicate and arguments e.g. 'person_in_room bob kitchen'
     * @returns changed
     */
    undeclare (fact) {
        return this.declare(fact, false)
    }

    /**
     * 
     * @param {String} fact A fact is composed by a predicate and arguments e.g. 'person_in_room bob kitchen'
     * @param {boolean} value Fact status, true or false. Default value is true
     * @returns {boolean} true if changed otherwise false
     */
    declare (fact, value = true) {

        if (!(typeof fact === 'string'))
            throw('String expected, got ' + typeof fact + ': ' + fact)
        if (fact.split(' ')[0] == 'not')
            throw('Fact expected, got a negative literal: ' + fact)

        if ( !this.#facts.has(fact) || this.#facts.get(fact) != value ) {

            this.#facts.set(fact, value);

            for (let obj of fact.split(' ').splice(1))
                this.addObject(obj);

            return true;

        }
        
        return false;
    }

    addFact(fact){
        this.#facts.set(fact, true);
    }


    /**
     * @type { [fact:string, positive:boolean] [] }
     */
    get entries () {
        return Array.from( this.#facts.entries() );
    }



    /**
     * @return {Array<String>} Return an Array of String literals (possibly negated facts) e.g. 'light_on kitchen_light' or 'not (light_on kitchen_light)'
     */
    toPddlString() {
        return this.entries.map( ([fact, value]) => (value?fact:'not ('+fact+')') ).map( fact => '('+fact+')' ).join(' ')
    }

    

    /**
     * Closed World assumption; if i don't know about something then it is false!
     * 
     * @param {boolean} positive Positive/negated
     * @param {string} fact e.g 'light_on l1'
     * @returns {boolean} true if verified, otherwise false
     */
    check ( positive, fact ) {        
        if ( this.#facts.has(fact) && this.#facts.get(fact) )
            if ( positive )
                return true;
            else
                return false;
        else // Closed World assumption; if i don't know about something then it is false
            if ( positive )
                return false;
            else
                return true;
    }

}


function readFile ( path ) {
    
    return new Promise( (res, rej) => {

        fs.readFile( path, 'utf8', (err, data) => {
            if (err) rej(err)
            else res(data)
        })

    })

}



/**returns an array with the four nearby tiles coordinates*/
function neighbours(tile){
    const t_x = tile.x;
    const t_y = tile.y;
    return [{x:t_x-1, y: t_y},{x:t_x+1, y: t_y},{x:t_x,y: t_y+1},{x:t_x, y: t_y-1}]
}

function pddl_adjacent_map(accessible_tiles){
    let adjacent_map = new Map();
    let nearby_tiles = [];
    let isAccessible;
    belief_set.accessible_tiles.forEach((tile) => {
        nearby_tiles = neighbours(tile);
        nearby_tiles.forEach(n_tile => {
            isAccessible = belief_set.accessible_tiles.filter((inner_tile => {
                return n_tile.x == inner_tile.x && n_tile.y == inner_tile.y
            })).length
            if(isAccessible == 1){
                //add to the map
                adjacent_map.set(`loc-${n_tile.x}-${n_tile.y} loc-${tile.x}-${tile.y}`, `adjacent loc-${n_tile.x}-${n_tile.y} loc-${tile.x}-${tile.y}`)
                adjacent_map.set(`loc-${tile.x}-${tile.y} loc-${n_tile.x}-${n_tile.y}`, `adjacent loc-${tile.x}-${tile.y} loc-${n_tile.x}-${n_tile.y}`)
            }

        }) 
    })
    return adjacent_map;
}


async function plan(belief_set){

    /*problem declaration
    1. belief_set initialization
    2. goal description
    */

    const parcels = belief_set.parcels;
    let accessible_tiles = belief_set.accessible_tiles;
    let delivery_tiles = belief_set.delivery_map;
    const me = belief_set.me;
    const adjcency_map = pddl_adjacent_map(accessible_tiles);


    /* Beliefset delcaration-in my case:
    1. all the accessible tiles
    2. all the parcels not picked up
    3. all the delivery tiles
    */
    // const myBeliefset = new Beliefset();
    // myBeliefset.declare( 'switched-off light1' );
    // myBeliefset.undeclare( 'switched-on light1' );
    // myBeliefset.declare( 'switched-off light2' );

    const myBeliefset = new PddlBeliefset();

    //me
    myBeliefset.addObject('me - agent');
    myBeliefset.declare(`at me loc-${me.x}-${me.y}`);

    //accessible tiles
    accessible_tiles.forEach(tile => {
        myBeliefset.addObject(`loc-${tile.x}-${tile.y}`);
    })
    myBeliefset.addObject('- location');

    //parcels
    let p_count = 0;
    let goals = 'and';
    //un comment for final version
    // parcels.forEach(parcel => {
    //     myBeliefset.declare( `at-parcel ${parcel.id} location-${parcel.data.x}-${parcel.data.y}` );    
    //     p_count++;
    // })
    parcels.forEach(parcel => {
        myBeliefset.declare( `at-parcel ${parcel.id} loc-${parcel.x}-${parcel.y}` );    
        p_count++;
        goals = goals + `(delivered ${parcel.id})`
    })
    myBeliefset.addObject('- parcel');
    let cost = 0;
    //comment for std. domain
    //-----------------------
    parcels.forEach((parcel) => {
        myBeliefset.addFact(`= (cost ${parcel.id}) ${parcel.cost}`)
        cost += parcel.cost;
    })
    myBeliefset.addFact(`= (sum-undelivered-cost) ${cost}`)
    //-----------------------
    //uncomment for std. domain
    // myBeliefset.addFact(`= (num-undelivered) ${p_count}`);

    delivery_tiles.forEach((tile, idx) => {
        myBeliefset.declare(`at-tile t${idx} loc-${tile.x}-${tile.y}`);
    })
    myBeliefset.addObject('- delivery_tile');
    

    //adjacent map
    adjcency_map.forEach((predicate,k) => {
        myBeliefset.addFact(predicate);
    })

    myBeliefset.addFact('= (total-cost) 0');

    // console.log("CHECK 1:",myBeliefset.toPddlString());
    // console.log("CHECK 2, goals: ", goals);
    
    var pddlProblem = new MetricPddlProblem(
        'parcel-delivery',
        'SSA',
        myBeliefset.objects.join(' '),
        myBeliefset.toPddlString(),
        goals,
        'minimize (total-cost)'
    )
    
    let problem = pddlProblem.toPddlString();
    console.log( problem );
    // process.exit(0);
    
    //domain file
    // let domain = await readFile('./domain.pddl' );
    let domain = await readFile('./cost-domain.pddl' );
    console.log(domain);

    var plan = await onlineSolver( domain, problem );
    
    console.log(plan);
    // const pddlExecutor = new PddlExecutor( { name: 'lightOn', executor: (l) => console.log('executor lighton '+l) } );
    // pddlExecutor.exec( plan );

}


const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ0MGQ1NiIsIm5hbWUiOiJyZWZhY3RvciIsInRlYW1JZCI6ImFkMmI2MSIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDg3NzQ0NTB9.pnl_SztMf3OIvLYDmKTQUl6a53vbtKbm44Ezb4f4Tko");

belief_set.onReady(() => {
    belief_set.client.onParcelsSensing((parcels) => {
        const plan_belief_set = {
            me:belief_set.me,
            parcels:parcels,
            delivery_map: belief_set.delivery_map,
            accessible_tiles: belief_set.accessible_tiles
        }
        plan(plan_belief_set)
    })
});