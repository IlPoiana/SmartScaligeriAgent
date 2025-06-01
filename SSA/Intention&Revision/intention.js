// 1 write the `planLibrary` constant and export it

import { PlanLibrary } from "../Planner/plans.js";


export class Intention extends PlanLibrary{

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
        super();
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
        for (const planClass of this.plans) {

            // if stopped then quit
            if ( this.stopped ) throw [ 'stopped intention', ...this.predicate ];

            // if plan is 'statically' applicable
            if ( planClass.isApplicableTo( ...this.predicate ) ) {

                // plan is instantiated
                this.#current_plan = new planClass(this.parent,this.belief_set);
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
export class IntentionRevision {

    #belief_set;
    set belief_set(bel_set){
        this.#belief_set = bel_set;
    };
    get belief_set() {
        return this.#belief_set;
    };

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
    
    async loop ( ) {
        while ( true ) {
            if(!this.#belief_set.idle){
                // Consumes intention_queue if not empty
                if ( this.intention_queue.length > 0) {
                    console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) );
                
                    // Current intention
                    const intention = this.intention_queue[0];
                    this.current_intention = intention;


                    let id = intention.predicate[3]
                    let intention_validity = this.isValid(intention);
                    if(intention_validity){
                        // Start achieving intention
                        this.intention_queue.shift();
                        console.log("CHECK loop:", this.#current_intention.predicate);
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
                    await this.push(['wandering']);
                }
            }

            
            // Postpone next iteration at setImmediate
            await new Promise( res => setImmediate( res ) );
        }
    }

    /**
     * 
     * @param {*} predicate 
     * Empty cause it has to be override by a subclass
     */
    async push ( predicate ) { }

    async isValid( intention ) { }

    log ( ...args ) {
        console.log( ...args )
    }

}