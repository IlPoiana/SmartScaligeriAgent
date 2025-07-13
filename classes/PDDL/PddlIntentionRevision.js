import { distance, neighbours } from "../../agents/lib/algorithms.js";
import { Beliefset } from "../Beliefs/belief.js";
import { Intention } from "../Intention&Revision/intention.js";
import { IntentionRevisionRevise } from "../Intention&Revision/IntentionRevisionRevise.js";
import { onlineSolver, PddlProblem} from "@unitn-asa/pddl-client";
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
        if(this.#metric)
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
        else {
                return `\
                    ;; problem file: ${this.name}.pddl
                    (define (problem deliver-parcels-instance)
                        (:domain ${this.#domain})
                        (:objects ${this.objects})
                        (:init ${this.inits})
                        (:goal (${this.goals}))
                    )
                    `
        }
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
     * @return {*} Return an Array of String literals (possibly negated facts) e.g. 'light_on kitchen_light' or 'not (light_on kitchen_light)'
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
        else 
            if ( positive )
                return false;
            else
                return true;
    }

}

class PlanBeliefSet {
    #me;
    #parcels;
    #delivery_map;
    #accessible_tiles;
    #steps_per_decay;
    #distances_map;
    #threshold;

      // ——— Getters ———
    get me() {
        return this.#me;
    }

    get parcels() {
        return this.#parcels;
    }

    get delivery_map() {
        return this.#delivery_map;
    }

    get accessible_tiles() {
        return this.#accessible_tiles;
    }

    get steps_per_decay() {
        return this.#steps_per_decay;
    }

    // ——— Setters ———
    set me(value) {
        this.#me = value;
    }

    set parcels(value) {
        this.#parcels = value;
    }

    set delivery_map(value) {
        this.#delivery_map = value;
    }

    set accessible_tiles(value) {
        this.#accessible_tiles = value;
    }

    set steps_per_decay(value) {
        this.#steps_per_decay = value;
    }


    /**
     * 
     * @param {Beliefset} belief_set 
     */
    constructor(belief_set){
        this.#me = belief_set.me;
        this.#parcels = this.cost(belief_set.parcels);
        this.#delivery_map = belief_set.delivery_map;
        this.#accessible_tiles = belief_set.accessible_tiles;
        this.#distances_map = this.generateCostsMap()
        this.#steps_per_decay = belief_set.steps_per_decay;
    }

    generateCostsMap(){
        const costs_map = [];
        const me = this.#me;
        
        let me_parcels_avg = 0;
        let parcels_parcels_avg = 0;
        let parcels_dtile_avg = 0;
        
        let parcel_n = 0;
        let parcel_parcel_value = 0;
        let single_p_array = []
        //parcels
        this.#parcels.forEach(parcel => {
            if(parcel.data && parcel.data.x && parcel.data.y){
                parcel_n++;
                //me
                costs_map.push(`= (cost-of-move loc-${me.x}-${me.y} loc-${parcel.data.x}-${parcel.data.y}) ${distance(me,parcel.data)}`);
                costs_map.push(`= (cost-of-move loc-${parcel.data.x}-${parcel.data.y} loc-${me.x}-${me.y}) ${distance(me,parcel.data)}`);
                me_parcels_avg += distance(me,parcel.data);
                let n2 = 0;
                this.#parcels.forEach(p_int => {
                    if(p_int.data && p_int.data.x && p_int.data.y){
                        //parcels
                        costs_map.push(`= (cost-of-move loc-${p_int.data.x}-${p_int.data.y} loc-${parcel.data.x}-${parcel.data.y}) ${distance(p_int.data,parcel.data)}`)
                        costs_map.push(`= (cost-of-move loc-${parcel.data.x}-${parcel.data.y} loc-${p_int.data.x}-${p_int.data.y}) ${distance(p_int.data,parcel.data)}`)
                        parcel_parcel_value += distance(p_int.data,parcel.data);
                        n2++;
                    }
                if(n2 > 0)
                    single_p_array.push(parcel_parcel_value/n2);
                parcel_parcel_value = 0;
                })
                //delivery
                this.#delivery_map.forEach(d_tile => {
                    costs_map.push(`= (cost-of-move loc-${d_tile.x}-${d_tile.y} loc-${parcel.data.x}-${parcel.data.y}) ${distance(d_tile,parcel.data)}`)
                    costs_map.push(`= (cost-of-move loc-${parcel.data.x}-${parcel.data.y} loc-${d_tile.x}-${d_tile.y}) ${distance(d_tile,parcel.data)}`)
                    parcels_dtile_avg += distance(d_tile,parcel.data)/ this.#delivery_map.length;
                })
            }
            
        }) 

        this.#delivery_map.forEach(d_tile => {
            //me
            costs_map.push(`= (cost-of-move loc-${me.x}-${me.y} loc-${d_tile.x}-${d_tile.y}) ${distance(me,d_tile)}`);
            costs_map.push(`= (cost-of-move loc-${d_tile.x}-${d_tile.y} loc-${me.x}-${me.y}) ${distance(me,d_tile)}`);
            //delivery
            this.#delivery_map.forEach(i_tile => {
                costs_map.push(`= (cost-of-move loc-${d_tile.x}-${d_tile.y} loc-${i_tile.x}-${i_tile.y}) ${distance(d_tile,i_tile)}`)
                costs_map.push(`= (cost-of-move loc-${i_tile.x}-${i_tile.y} loc-${d_tile.x}-${d_tile.y}) ${distance(d_tile,i_tile)}`)
            })
        })
        // average distance from my position and every parcel
        me_parcels_avg = Math.round(me_parcels_avg / parcel_n);
        // average distance between every pair of parcels
        parcels_parcels_avg = Math.ceil(single_p_array.reduce((prev,curr) =>  {return prev + curr}));
        // average distance between every parcel and delivery tile
        parcels_dtile_avg /= Math.round(parcel_n + 1);

        console.log("me: ", me_parcels_avg,"array: ",single_p_array,"parcels: ",parcels_parcels_avg ,"tile: ",parcels_dtile_avg);
        this.#threshold = me_parcels_avg + parcels_parcels_avg + parcels_dtile_avg;
        return costs_map;
    }

    /**
     * 
     * @param {Map} parcels 
     */
    cost(parcels){
        let copy = new Map(parcels);
        parcels.forEach((parcel, key) => {
            if(parcel.data.carriedBy){
                copy.delete(key)
            }
            else{
                copy.get(key).cost = parcel.timedata.elapsed;
            }
        })
        return copy;
    }


    pddl_adjacent_map(){
        let adjacent_map = new Map();
        let nearby_tiles = [];
        let isAccessible;
        this. accessible_tiles.forEach((tile) => {
            nearby_tiles = neighbours(tile);
            nearby_tiles.forEach(n_tile => {
                isAccessible = this.accessible_tiles.filter((inner_tile => {
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


    async oldplan(){
    
    
        const parcels = this.parcels;
        let accessible_tiles = this.accessible_tiles;
        let delivery_tiles = this.delivery_map;
        const me = this.me;
        const adjcency_map = this.pddl_adjacent_map();
    
    
        const myBeliefset = new PddlBeliefset();
    
        //me
        myBeliefset.addObject('me - agent');
        myBeliefset.addFact(`at me loc-${me.x}-${me.y}`);
    
        //accessible tiles
        accessible_tiles.forEach(tile => {
            myBeliefset.addObject(`loc-${tile.x}-${tile.y}`);
        })
        myBeliefset.addObject('- location');
    
        //parcels
        let p_count = 0;
        let goals = 'and';

        parcels.forEach(parcel => {
            if(parcel.data && parcel.data.id && parcel.data.x && parcel.data.y)
            {myBeliefset.declare( `at-parcel ${parcel.data.id} loc-${parcel.data.x}-${parcel.data.y}` );    
            p_count++;
            goals = goals + `(delivered ${parcel.data.id})`}
            else{
                console.log("parcel not found: ", parcel);
            }
        })
        myBeliefset.addObject('- parcel');
        let cost = 0;

        parcels.forEach((parcel) => {
            myBeliefset.addFact(`= (cost ${parcel.data.id}) ${parcel.cost}`)
            cost += parcel.cost;
        })
        myBeliefset.addFact(`= (sum-undelivered-cost) ${cost}`)

    
        delivery_tiles.forEach((tile, idx) => {
            myBeliefset.declare(`at-tile t${idx} loc-${tile.x}-${tile.y}`);
        })
        myBeliefset.addObject('- delivery_tile');
        
    
        //adjacent map
        adjcency_map.forEach((predicate,k) => {
            myBeliefset.addFact(predicate);
        })


        var pddlProblem = new MetricPddlProblem(
            'parcel-delivery',
            'SSA',
            myBeliefset.objects.join(' '),
            myBeliefset.toPddlString(),
            goals,
            null
        )
        
        
        let problem = pddlProblem.toPddlString();
        console.log( problem );
        
        //domain file
        let domain = await readFile('./cost-domain.pddl' );
        console.log(domain);

        
        var plan = await onlineSolver( domain, problem );
        console.log(plan);
        return plan;

    
    }

    async plan(){

    
        const parcels = this.parcels;
        let delivery_tiles = this.delivery_map;
        const me = this.me;

    
        const myBeliefset = new PddlBeliefset();
        const location_array = [];

        //me
        myBeliefset.addObject('me - agent');
        location_array.push(`loc-${me.x}-${me.y}`);
        myBeliefset.addFact(`at me loc-${me.x}-${me.y}`);
    
        //parcels
        let goals = 'and';
        
        parcels.forEach(parcel => {
            if(parcel.data && parcel.data.id && parcel.data.x && parcel.data.y){
                myBeliefset.addObject(`${parcel.data.id}`)
                location_array.push(`loc-${parcel.data.x}-${parcel.data.y}`)
                myBeliefset.addFact( `at-parcel ${parcel.data.id} loc-${parcel.data.x}-${parcel.data.y}` );    
                goals = goals + `(delivered ${parcel.data.id})`
            }
            else{
                console.log("parcel not found: ", parcel);
            }
        })
        myBeliefset.addObject('- parcel');
        
        delivery_tiles.forEach((tile, idx) => {
            myBeliefset.addObject(`t${idx}`);
            location_array.push(`loc-${tile.x}-${tile.y}`);
            myBeliefset.addFact(`at-tile t${idx} loc-${tile.x}-${tile.y}`);
        })
        myBeliefset.addObject('- delivery_tile');
        
    
        //locations
        location_array.forEach( loc =>
           myBeliefset.addObject(loc)
        )
        myBeliefset.addObject('- location');


        this.#distances_map.forEach(elem => {
            myBeliefset.addFact(elem);
        })

    
        myBeliefset.addFact('= (total-cost) 0');
        myBeliefset.addFact(`= (threshold) ${this.#threshold}`)
    

        var pddlProblem = new MetricPddlProblem(
            'parcel-delivery',
            'SSA',
            myBeliefset.objects.join(' '),
            myBeliefset.toPddlString(),
            goals,
            null
        )
        
        
        let problem = pddlProblem.toPddlString();
        
        //domain file
        let domain = await readFile('../classes/PDDL/fluents-domain.pddl' );

        try{
        var plan = await onlineSolver( domain, problem );
        // console.log(plan);
        return plan;}
        catch(err){
            console.log("Not able to find a plan: ", err);
            return false;
        }

    }


}

export class PddlIntentionRevision extends IntentionRevisionRevise{
    N = 3;
    #replan_time = 30;
    #Pddl = false;
    #Replan = false;
    #canReplan = true;
    
    constructor(plan_library){
        super(plan_library)
    }

    /**
     * 
     * Call this method to replan the actual plan, this ensures that it's possible to replan only after `replan_time` seconds
     */
    Replan() {
        if (!this.#canReplan) return;

        this.#canReplan = false;

        this.#Replan = true;
        console.log("Replan to true");

        // Reset the flag after 2 seconds, allowing the function to be called again
        setTimeout(() => {
            this.#canReplan = true;
        }, this.#replan_time * 1000);
    }

    async getAndExecutePlan(){
        let plan = await this.getPlan();

        console.log("before executing");
        if(plan && plan.length && plan.length != 0)
            return await this.executePlan(plan);
        else{
            console.log("no plan found! switching back to normal agent");
            return false;
        }
    }

    async getPlan(){

        this.intention_queue = [];
        this.current_intention = null;
        
        //prepare the data
        const plan_belief_set = new PlanBeliefSet(this.belief_set);
        
    
        //call the planner
        return plan_belief_set.plan();
    }

    async executePlan(plan){
        if (this.#Replan) {this.#Replan = false; console.log("replanning");await this.getAndExecutePlan();return false}

        let GoPickUpClass = this.plans.filter((PlanClass) => {return PlanClass.isApplicableTo('go_pick_up')})[0];
        let GoToClass = this.plans.filter((PlanClass) => {return PlanClass.isApplicableTo('go_to')})[0];
        let PutDownClass = this.plans.filter((PlanClass) => {return PlanClass.isApplicableTo('put_down')})[0];
        
        for(let action_obj of plan){
            if (this.#Replan) {this.#Replan = false; console.log("replanning");await this.getAndExecutePlan();return false}
            
            
            if(action_obj.action){
                const action_name = action_obj.action;
                const action_arr = action_obj.args;
                //pick_up
                if(action_name == 'pick_up'){
                    //set the current intention
                    let [_,x,y] = action_arr[2].split('-');
                    const p_id = action_arr[1];
                    this.current_intention = new Intention(this,['go_pick_up', x, y,p_id],this.plans,this.belief_set);
                    const GoPickUp = new GoPickUpClass(this, this.belief_set);
                    await GoPickUp.execute('go_pick_up',Number(x),Number(y))
                }
                
                //deliver
                if(action_name == 'deliver'){
                    const GoTo = new GoToClass(this, this.belief_set);
                    const PutDown = new PutDownClass(this, this.belief_set);
                    let [_,x,y] = action_arr[3].split('-');
                    this.current_intention = new Intention(this,['delivery'],this.plans,this.belief_set);
                    await GoTo.execute('go_to',Number(x),Number(y));
                    await PutDown.execute(['put_down']);
                }

            }
        }
        return true;
    }

    async loop ( ) {
        while ( true ) {
            if(!this.belief_set.idle){
                let n_pick_up = this.intention_queue.filter((intention) => {
                    return intention.predicate[0] == 'go_pick_up'
                }).length
                
                if ( n_pick_up && n_pick_up >= this.N){
                    //change the Pddl flag to deactivate the standard push
                    this.#Pddl = true;
                                    
                    let pddl_result = await this.getAndExecutePlan();
                    console.log("pddl result: ", pddl_result);
                    //go back to standard agent
                    this.#Pddl = false;
                }


                // Consumes intention_queue if not empty
                if ( this.intention_queue.length > 0) {
                    console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) );
                
                    // Current intention
                    const intention = this.intention_queue[0];
                    this.current_intention = intention;

                    let intention_validity = this.isValid(intention);
                    if(intention_validity){
                        // Start achieving intention
                        this.intention_queue.shift();
                        console.log("CHECK loop:", this.current_intention.predicate);
                        await intention.achieve().then((res) => console.log("achieved intention: ", res)).catch( err => console.log("something went wrong in achieving your intention: ", err));
                    }
                    else{
                        console.log( 'Skipping intention because no more valid', intention.predicate )
                        //stop the current intention
                        this.intention_queue.shift(); //remove it from the queue
                        continue;
                    }
                }
                else{
                    this.push(['wandering']);

                }
            }

            
            // Postpone next iteration at setImmediate
            await new Promise( res => setImmediate( res ) );
        }
    }

    async push( predicate ){
        //Pddl mode? yes deactivate classical push
        if(this.#Pddl){
            // check the reward function
            const intention_name = predicate[0];
            switch (intention_name){
                case 'go_pick_up':
                    const parcel = this.belief_set.getParcel(predicate[3]);
                    if(parcel && parcel.data && !parcel.data.carriedBy && this.current_intention){
                        let reward = this.rewardFun(predicate);
                        if (this.current_reward < reward) this.Replan();   
                    }
                    return;
                default:
                    return;
            }
        }
        else{
            super.push( predicate )
        }  
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