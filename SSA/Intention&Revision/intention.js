import { PlanLibrary } from "../Planner/plans.js";

export class Intention{
    #plans;
    #belief_set;
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

    constructor ( parent, predicate, plans, belief_set) {
        this.#parent = parent;
        this.#predicate = predicate;
        this.#plans = plans;
        this.#belief_set = belief_set;
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
        if ( this.#started){
            console.log("already started");
            return this;
        }
        else
            this.#started = true;

        // Trying all plans in the library
        for (const planClass of this.#plans) {
            // if stopped then quit
            if ( this.stopped ) throw [ 'stopped intention', ...this.predicate ];

            // if plan is 'statically' applicable
            if ( planClass.isApplicableTo( ...this.predicate ) ) {

                // plan is instantiated
                this.#current_plan = new planClass(this.parent,this.#belief_set);
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

    #plans;
    set plans(plans){
        this.#plans = plans;
    };
    get plans() {
        return this.#plans;
    };

    /**
     * 
     * @param {PlanLibrary} plan_library 
     */
    constructor(plan_library) {
        this.#belief_set = plan_library.belief_set;
        this.#plans = plan_library.plans;
    }

    #current_intention = null;
    get current_intention () {
        return this.#current_intention;
    }
    set current_intention ( intention ) {  
        this.#current_intention = intention;
    }

    #intention_queue = [];
    get intention_queue () {
        return this.#intention_queue;
    }

    set intention_queue(intention_q){
        this.#intention_queue = intention_q;
    }

    setIntentionQueueCopy( intention_q ){
        this.#intention_queue = intention_q.slice();
    }

    updateElapsed() {
        // console.log("updating");
        const now = Date.now();
        this.belief_set.parcels.forEach(parcel => {
            parcel.timedata.elapsed = parcel.timedata.elapsed - Number(((now / 1e3) * this.belief_set.settings.decay - parcel.timedata.startTime).toFixed(2));
            if(parcel.timedata.elapsed <= 0){
                this.belief_set.parcels.delete(parcel.data.id);}
        });
        // parcels.forEach((parcel) => console.log(parcel.data, parcel.timedata.elapsed))
    }
    
    async loop ( ) {
        while ( true ) {
            if(!this.#belief_set.idle){
                // Consumes intention_queue if not empty
                if ( this.#intention_queue.length > 0) {
                    console.log( 'intentionRevision.loop', this.#intention_queue.map(i=>i.predicate) );
                
                    // Current intention
                    const intention = this.#intention_queue[0];
                    this.#current_intention = intention;

                    let intention_validity = this.isValid(intention);
                    if(intention_validity){
                        // Start achieving intention
                        this.#intention_queue.shift();
                        console.log("CHECK loop:", this.#current_intention.predicate);
                        await intention.achieve().then((res) => console.log("achieved intention: ", res)).catch( err => console.log("something went wrong in achieving your intention: ", err));
                    }
                    else{
                        console.log( 'Skipping intention because no more valid', intention.predicate )
                        //stop the current intention
                        this.#intention_queue.shift(); //remove it from the queue
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

    /**
     * 
     * @param {*} predicate 
     * Empty cause it has to be override by a subclass
     */
    async push ( predicate ) { }

    isValid( intention ) { }

    log ( ...args ) {
        console.log( ...args )
    }

}

