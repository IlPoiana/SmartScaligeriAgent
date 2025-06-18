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

    /**
     * 
     * @param {any} parcel a parcel to be checked if it's already scheduled to pick up
     *  Call this function when you are on a parcel, it's check if my actual intention is pick it up or not
     */
    checkParcel( parcel ){
        if(this.current_intention && this.current_intention.predicate){
            const predicate = this.current_intention.predicate;
            const current_p_id = predicate[3];
            console.log("checkParcel: ", predicate, current_p_id);
            return (predicate[0] == 'go_pick_up' && predicate[3] && parcel.data.id == current_p_id) || predicate[0] == 'wandering'
        }
        else return true;
    } 

    async pickUpNotScheduledParcel( parcel ){
        if(!this.checkParcel(parcel)){
            console.log("picking up parcel on the way");
            console.log("before pickup: ", this.#belief_set.me, parcel)
            await this.#belief_set.client.emitPickup()            
        }
        return;
            
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

    get current_reward() {
        let reward = 0;
        this.#belief_set.parcels.forEach(p => {
            if(p.data.carriedBy && p.data.carriedBy == this.#belief_set.me.id)
                reward += p.timedata.elapsed;
        })
        return reward;
    }

    log ( ...args ) {
        console.log( ...args )
    }

}

/*
missing the carried parcel decay penalty, add as a separate feature
Replan function
form a belief_set -> plan and execute 
a flag will tell me if I should replan, so break the plan and call a new plan
finally set a Timeout for the replan flag

idea rn:
1. start with std. wandering loop, until you want to pick_up more than n parcels(5 ex)
2. when the condition is met, switch to the planner, plan the intention to execute
3. execute the plan
    3.1 replan when a better parcel is encounter(set a timeout before replanning)
    3.2 replan when the parcel has decayed or taken from another agent(set a timeout before replanning)
    3.3 switch back to normal if a plan completely fail(set timeout before replanning)
4. come back to wandering

modify the push function while looping through the plan
- if I spot a better parcel than the one I am going to take -> replan
    - wait at least 2 seconds before replanning
- otherwise ignore everything else

*/
