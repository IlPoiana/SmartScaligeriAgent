//import distance function
import { distance, BFS, nearestDeliveryTile } from '../../agents/lib/algorithms.js'
import { IntentionRevision, Intention } from './intention.js'

// the actual steps to reach destination should account for a little computation time

/**
 * Class which implements the push method that performs the revise of the intention queue
 */
export class IntentionRevisionRevise extends IntentionRevision {    

    constructor(plan_library) {
        super(plan_library);
        this.last_delivery_position = null; // salva la posizione x,y
    }


    parcelRewardFun(predicate) {
        const id_p = predicate[3]
        let parcel = this.belief_set.getParcel(id_p)
        if(!parcel)
            return 0;
        //quando arriva delivery diventa undefined
        // let computed_reward = reward -  distance({x:x1,y:y1},{ x:parcel.data.x, y:parcel.data.y}) / 2;
        let my_position = this.belief_set.me;
        let parcel_position = { x:parcel.data.x, y:parcel.data.y};
        let abs_distance = distance(my_position,parcel_position) > 0 ? distance(my_position,parcel_position) : 1;
        let computed_reward = (1 / (abs_distance * (1000/ this.belief_set.settings.movement))) * 1000;
        // console.log("CHECK reward- id:", predicate[3],computed_reward);
        // console.log("CHECK 1",computed_reward, abs_distance, settings.movement);
        return computed_reward < 0 ? 0 : computed_reward;
    }


    rewardFun(predicate){

        switch (predicate[0]) {
            case 'go_pick_up':
                let parcel_reward = (this.belief_set.getParcel(predicate[3])).timedata.elapsed;
                const final_reward = this.parcelRewardFun(predicate) + parcel_reward
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

    /**
     * 
     * @param {*} intention 
     * @returns true, if the intention is no more valid
     */
    checkIntention(intention){
        const type = intention.predicate[0];
        switch (type) {
            case 'go_pick_up':
                const parcel_id = intention.predicate[3];
                if(!this.belief_set.getParcel( parcel_id ) || this.rewardFun(intention.predicate) < 1){
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

    cleanIntentions() {
        //iterate over the intention queue and delete the intentions for the deceased parcels
        if(this.current_intention && this.checkIntention(this.current_intention)){
            this.current_intention.stop();
            this.current_intention = null; //resetting the current intention
            console.log("stopped current intention");
        }
        this.intention_queue.forEach((intention, index) => {
            if(this.checkIntention(intention)){
                // console.log("CHECK CLEANING: ", intention.predicate,this.current_intention.predicate);
                if(this.current_intention && intention.predicate[3] == this.current_intention.predicate[3]){
                    this.current_intention.stop();
                    console.log("stopping intention: ", intention.predicate);//doesn't work
                }
                    
                this.intention_queue = this.intention_queue.filter((others) => {return others.predicate.join(' ') != intention.predicate.join(' ')});
            }

            //deleting duplicates delivery intentions
            if(index > 0 && intention.predicate[0] == 'delivery' && this.intention_queue[index - 1] && this.intention_queue[index - 1].predicate[0] == 'delivery'){
                this.intention_queue = this.intention_queue.filter((int_to_delete) => {
                    return int_to_delete.predicate.join(' ') != this.intention_queue[index - 1].predicate.join(' ')
                })
            }

        })
    }

    /**
     * 
     * @param {Array<any>} predicate 
     * Method to push agent intentions, it handles the correct insertion in the intention queue through a reward function
     */
    async push ( predicate ) {
        const intention_name = predicate[0];
        
        if (this.belief_set.settings.decay){
            this.updateElapsed();
            this.cleanIntentions();
        }
        
        if(this.intention_queue.length == 0){
            // console.log("queue 0: ", predicate, this.belief_set.parcels)
            this.intention_queue.push(new Intention( this, predicate, this.plans, this.belief_set ));
            
            if(this.belief_set.getParcel(predicate[3])){
                let reward = this.rewardFun(predicate);
                //leave wandering as soon you detect a parcel
                if(this.current_intention && this.current_intention.predicate[0] == 'wandering'){
                    console.log("switched wandering");
                    this.current_intention.stop();
                }
                else if(this.current_intention && this.rewardFun(this.current_intention.predicate) < this.rewardFun(predicate)){
                    console.log("switched intention");
                    this.intention_queue.push(new Intention( this, this.current_intention.predicate, this.plans, this.belief_set));
                    this.current_intention.stop();                    
                }
                // console.log("CHECK 0 pushing delivery", reward);
                await this.push(['delivery', Math.round(reward / 2)]);
            }    
            return;
        }
        // Check if already queued but not delivery(possible > 2)
        else if ( intention_name != 'delivery' && this.intention_queue.find( (i) => i.predicate.join(' ') == predicate.join(' ') ) )
            return; // intention is already queued


        switch (intention_name) {
            case 'delivery':
                //count the delivery in the queue
                let last_intention = this.intention_queue[this.intention_queue.length - 1];
                if(last_intention.predicate[0] != 'delivery'){
                    console.log( 'IntentionRevisionReplace.push', predicate );
                    const intention = new Intention( this, predicate, this.plans, this.belief_set );
                    this.intention_queue.push( intention );}
                else{
                    console.log("delivery already scheduled");
                }
                break;
            case 'go_pick_up':
                // console.log("go_pick_up: ",this.belief_set.parcels);
                if(this.belief_set.getParcel(predicate[3])){
                    let delivery_reward = this.rewardFun(predicate); // >= 1
                    let new_intention = new Intention(this, predicate, this.plans, this.belief_set );
                    this.intention_queue.push(new_intention);
                    //Change if is wandering
                    if(this.current_intention && this.current_intention.predicate[0] == 'wandering'){
                        console.log("switched wandering");
                        this.current_intention.stop();
                    }
                    //Change the actual intention if I push something better
                    else if(this.current_intention && this.rewardFun(this.current_intention.predicate) < this.rewardFun(predicate)){
                        const rescheduled_intention = new Intention(this, this.current_intention.predicate,this.plans, this.belief_set)
                        this.intention_queue.push(rescheduled_intention);
                        this.current_intention.stop();
                        console.log("switched intention");
                    }

                    this.intention_queue.sort((a, b) =>{
                        // if(a[3] && b[3])
                        return this.rewardFun(a.predicate) - this.rewardFun(b.predicate) 
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
                let wandering_arr = this.intention_queue.filter((intention) => {return intention.predicate[0] == 'wandering'});
                if(wandering_arr.length == 0){
                    console.log("CHECK wandering");
                    let wandering = new Intention(this, ['wandering'], this.plans, this.belief_set );
                    this.intention_queue.push(wandering)
                }
                break;
            default:
                break;
        }
    }

    isValid ( intention ) {
        const me = this.belief_set.me;
        const my_id = this.belief_set.me.id;
        const steps_number = this.belief_set.steps_per_decay;
        let actual_steps;
        const accessible_tiles = this.belief_set.accessible_tiles;
        switch (intention.predicate[0]){
            case 'go_pick_up':
                const parcel = this.belief_set.getParcel(intention.predicate[3]);
                if(!parcel)
                    return false;
                let reachable = true;
                try {
                    actual_steps = (
                    BFS([me.x,me.y],[parcel.data.x,parcel.data.y],accessible_tiles).length 
                    + 
                    nearestDeliveryTile(parcel.data.x,parcel.data.y,this.belief_set.delivery_map, accessible_tiles).length
                    );
                } catch(err){
                    // console.log("not possible to do BFS in validating the intention: ", err);
                    // console.log("maps",this.belief_set.accessible_tiles,this.belief_set.agents);
                    // console.log("how many tiles are removed?: ",this.belief_set.original_map.length -  this.belief_set.accessible_tiles.length )
                    // process.exit()//REMOVE
                    return false;
                }
                console.log("steps_number: ", steps_number, "actual steps: ", actual_steps);
                if(steps_number){
                    if(parcel.timedata.elapsed * steps_number < actual_steps){
                        console.log(parcel, "not reachable");
                        reachable = false;
                    }
                }
                if(parcel && !parcel.carriedBy && reachable)
                    console.log("valid intention: ", intention.predicate);
                return parcel && !parcel.carriedBy && reachable; 
                break;
            case 'delivery':
                //deliver only if you arrive to the delivery tile on time
                let counter = 0;
                try{
                    actual_steps = nearestDeliveryTile(me.x,me.y,this.belief_set.delivery_map, accessible_tiles).length;}
                catch(err){
                    //here to do the managment of the delivery with comunication
                    console.log("not able to do BFS in isValid: ", err);
                    return false;
                }
                // console.log("isValid: ",my_id, this.belief_set.parcels);
                this.belief_set.parcels.forEach((parcel) => {
                    // console.log("isValid carriedBy: ", parcel.data.carriedBy);
                    if(parcel.data.carriedBy == my_id) {
                        //if i have a decay not infinite
                        if(steps_number){
                                if(parcel.timedata.elapsed * steps_number > actual_steps){
                                counter++;
                            }
                        }
                        else{
                            counter++;
                        }
                    }
                })
                if(counter > 0)
                    console.log("valid intention", intention.predicate);
                return counter > 0;
                break;
            case 'wandering':
                return true;
                break;
        }
    }
}