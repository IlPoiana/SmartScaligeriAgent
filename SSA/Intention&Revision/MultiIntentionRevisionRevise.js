import { IntentionRevisionRevise } from "./IntentionRevisionRevise.js";
import { Intention } from "./intention.js";

export class MultiIntentionRevisionRevise extends IntentionRevisionRevise {
    
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
}