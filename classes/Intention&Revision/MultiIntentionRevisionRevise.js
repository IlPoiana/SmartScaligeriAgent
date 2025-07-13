import { BFS, distance, move, nearestDeliveryTile } from "../../agents/lib/algorithms.js";
import { Communication } from "../Coordination/Communication.js";
import { PlanLibrary } from "../Plans/plans.js";
import { IntentionRevisionRevise } from "./IntentionRevisionRevise.js";
import { Intention } from "./intention.js";
/*
1. implement multi wandering - delivery - goPickUp
    Put a limit to the tiles to divide to not destroy the net
    1.1 decide if keep delivery with threshold or change with insisting on delivery tiles
    1.2 decide if return subPlan ddelivery because you have to change the predicate!!
2. implement exchange
    2.1 test exhange alone
3. put together

*/

export class MultiIntentionRevisionRevise extends IntentionRevisionRevise {
    
    #friend_believe_set
    #communication
    #delivery_tiles = [];
    #spawning_tiles = [];
    

        /**
         * 
         * @param {PlanLibrary} plan_library 
         * @param {Communication} communication 
         */
    constructor(plan_library,communication){
        super(plan_library);
        this.#friend_believe_set = communication.multi_agent_belief;
        this.#communication = communication;
    }

    get spawning_tiles(){
        return this.#spawning_tiles;
    }

    set spawning_tiles(spawning_tiles){
        this.#spawning_tiles = spawning_tiles;
    }

    get delivery_tiles(){
        return this.#delivery_tiles;
    }

    set delivery_tiles(delivery_tiles) {
        this.#delivery_tiles = delivery_tiles;
    }

    get friend_belive_set (){
        return this.#friend_believe_set
    }

    get communication(){
        return this.#communication
    }

    /**
     * This method if called compute the reachable spawning tiles
     */
    reachable_spawning_tiles(){
        const me = this.belief_set.me;
        const og = this.belief_set.original_map;
        let spawn_map = this.belief_set.spawning_map.slice();
        if(spawn_map.length > 200){
            //Can reach anything?
            const not_island = spawn_map.find((tile) => {
            return BFS([me.x,me.y], [tile.x,tile.y], og) != null;
            })
            if(not_island != undefined){
                spawn_map.sort((a,b) => {
                    return distance(me,a) - distance(me,b)
                })
            }else{
                return [];
            }

        }
        else{
            const cached_paths = []
            //filtering
            spawn_map = spawn_map.filter((tile) => {
                let path = BFS([me.x,me.y], [tile.x,tile.y], og);
                if(path != null)
                {
                    cached_paths.push({l: path.length, tile: tile});
                    return true;
                }
                else{
                    return false;
                }
            })
            //sorting, ensured that everything in spawn_map is not null;
            cached_paths.sort((a,b) => {
                return a.l - b.l
            })
            //populate spawn_map
            spawn_map = [];
            cached_paths.forEach((tile_obj) => {
                spawn_map.push(tile_obj.tile);
            });
        }
        
        return spawn_map//the array of all the reachable spawning tiles(sorted)
    }

    reachable_delivery_tiles(){
        const me = this.belief_set.me;
        const og = this.belief_set.original_map;
        let delivery_map = this.belief_set.delivery_map.slice();
        const cached_paths = [];

        //filtering
        delivery_map = delivery_map.filter((tile) => {
            let path = BFS([me.x,me.y], [tile.x,tile.y], og);
            if(path != null)
            {
                cached_paths.push({l: path.length, tile: tile});
                return true;
            }
            else{
                return false;
            }
        })
        //sorting, ensured that everything in spawn_map is not null;
        cached_paths.sort((a,b) => {
            return a.l - b.l
        })
        //populate spawn_map
        delivery_map = [];
        cached_paths.forEach((tile_obj) => {
            delivery_map.push(tile_obj.tile);
        });
        
        return delivery_map//the array of all the reachable delivery tiles(sorted)
    }

    /**
     * This method compute the reachable spawning tiles and delivery tiles and send to the friend the remaining tiles
     */
    async computeAndSendTiles(){
        const reachable_spawn = this.reachable_spawning_tiles();
        const reachable_delivery = this.reachable_delivery_tiles();
        
        const spawn_n = reachable_spawn.length;
        const delivery_n = reachable_delivery.length;
        //Handling bad maps cases 
        if(spawn_n == 0 || delivery_n == 0 || (delivery_n == 1 && spawn_n == 1)){
            console.log("On a Island!");
            this.#communication.onAsk({status:'independent'});
            if(delivery_n == 1 && spawn_n == 1){
                this.#spawning_tiles = reachable_spawn;
                this.#delivery_tiles = reachable_delivery;
                console.log(this.#spawning_tiles, this.#delivery_tiles);
                return
            }
            if(spawn_n == 0 || delivery_n == 0) process.exit();
        }else if(spawn_n == 1){
            console.log("No division for 1 spawn");
            this.#delivery_tiles = reachable_delivery.slice(0, reachable_delivery.length / 2)
            return await this.#communication.onAsk({status:'same-spawn',delivery: reachable_delivery.slice(reachable_delivery.length / 2)});//reply
        }else if ( delivery_n == 1){
            console.log("No division for 1 delivery");
            this.#spawning_tiles = reachable_spawn.slice(0, reachable_spawn.length / 2)
            return await this.#communication.onAsk({status:'same-delivery',spawn:reachable_spawn.slice(reachable_spawn.length / 2)});
        }else{
            //Normal case
            this.#spawning_tiles = reachable_spawn.slice(0, reachable_spawn.length / 2)
            this.#delivery_tiles = reachable_delivery.slice(0, reachable_delivery.length / 2)
            console.log("my spawn and del:", this.#spawning_tiles, this.#delivery_tiles)
            //sending the others half
            return await this.#communication.onAsk({status: 'divide',spawn: reachable_spawn.slice(reachable_spawn.length / 2),delivery: reachable_delivery.slice(reachable_delivery.length / 2)})
        }

    }

    async getTilesFromMaster(){
        // console.log("TO TEST");
        return new Promise((res) => {
            this.belief_set.client.once( "msg", (id, name, msg, reply)=>{
                if(msg && msg.status){
                    let answer;
                    switch(msg.status){
                        case 'independent':
                            answer = {status: 'done'}
                            this.#spawning_tiles = this.reachable_spawning_tiles();
                            this.#delivery_tiles = this.reachable_delivery_tiles();
                            console.log("independent slave:", this.#spawning_tiles, this.delivery_tiles);
                            try{reply(answer);}
                            catch(err){console.log("independent error", err)}
                            break;
                        case 'divide':
                            this.#spawning_tiles = msg.spawn;
                            this.#delivery_tiles = msg.delivery;
                            console.log("my spawn and del:", this.#spawning_tiles, this.#delivery_tiles)
                            answer = {status: 'done'}
                            try{reply(answer)}
                            catch(err){console.log("divide error", err)}
                            break;
                        case 'same-spawn':
                            this.#spawning_tiles = this.reachable_spawning_tiles();
                            this.#delivery_tiles = msg.delivery;
                            answer = {status: 'done'}
                            try{reply(answer)}
                            catch(err){console.log("same-spawn error", err)}
                            break;
                        case 'same-delivery':
                            this.#delivery_tiles = this.reachable_delivery_tiles();
                            this.#spawning_tiles = msg.spawn;
                            answer = {status: 'done'}
                            try{reply(answer)}
                            catch(err){console.log("same-delivery error", err)}
                            break;
                        default:
                            break;
                    }
                }
                res();
            });
        })
        
    }

    async listenerTilesFromMaster(){
        // console.log("TO TEST");
        return this.belief_set.client.once( "msg", (id, name, msg, reply)=>{
                if(msg && msg.status){
                    let answer;
                    switch(msg.status){
                        case 'independent':
                            answer = {status: 'done'}
                            this.#spawning_tiles = this.reachable_spawning_tiles();
                            this.#delivery_tiles = this.reachable_delivery_tiles();
                            console.log("independent slave:", this.#spawning_tiles, this.delivery_tiles);
                            try{reply(answer);}
                            catch(err){console.log("independent error", err)}
                            break;
                        case 'divide':
                            this.#spawning_tiles = msg.spawn;
                            this.#delivery_tiles = msg.delivery;
                            console.log("my spawn and del:", this.#spawning_tiles, this.#delivery_tiles)
                            answer = {status: 'done'}
                            try{reply(answer)}
                            catch(err){console.log("divide error", err)}
                            break;
                        case 'same-spawn':
                            this.#spawning_tiles = this.reachable_spawning_tiles();
                            this.#delivery_tiles = msg.delivery;
                            answer = {status: 'done'}
                            try{reply(answer)}
                            catch(err){console.log("same-spawn error", err)}
                            break;
                        case 'same-delivery':
                            this.#delivery_tiles = this.reachable_delivery_tiles();
                            this.#spawning_tiles = msg.spawn;
                            answer = {status: 'done'}
                            try{reply(answer)}
                            catch(err){console.log("same-delivery error", err)}
                            break;
                        default:
                            break;
                    }
                }
        })
        
    }

    /**
     * Function that activate the meet routine, it stops the intention loop and the current action
     */
    async meetingMsgHandler(){
        this.belief_set.client.onMsg(async (id, name, /** @type {{status:String, position: any}}*/msg, reply)  => {
            if(msg?.status == 'meet')
            {
                this.belief_set.idle = true; // setting Idle to true;
                if(this.current_intention)
                    this.current_intention.stop();
                reply({status: 'ready'});
            }
            if(msg?.status == 'pick_up'){
                const position = msg.position;
                if(!position){
                    console.log("no position sent to friend", msg);
                    process.exit();
                }
                console.log("msg:", msg);
                //use the plan to move to the friend location pickUp and delivery
                for(let PickAndDelivery of this.plans){
                    if ( PickAndDelivery.isApplicableTo( 'pick_up_and_delivery' ) ) {
                        let predicate = ['pick_up_and_delivery', position.x, position.y, () => {reply()}];
                        // plan is instantiated
                        this.current_plan = new PickAndDelivery(this,this.belief_set);
                        this.log('PickUpAndDelivery Intention', predicate);
                        // and plan is executed and result returned
                        try {
                            const plan_res = await this.current_plan.execute( ...predicate );
                            this.log( 'succesful intention', predicate, 'with result:', plan_res );
                        // or errors are caught so to continue with next plan
                        } catch (error) {
                            this.log( 'failed intention', predicate, 'with error:', ...error );
                            reply('error');
                        }
                        break;
                    }

                }
                //restart the intention loop;
                this.belief_set.idle = false;
            }
            if(msg?.status == 'ask_tile'){
                const free_tile = await this.computeFreeTile()
                reply({tile: free_tile});
            }

        })

    }

    async meetRequest(){
        //request to your friend to stop and wait it's response
        console.log("asking to meet!", this.#communication.belief_set);
        // process.exit();
        return await this.#communication.onAsk({status: 'meet'});
    }

    async askFriendPickUpMsg(me){
        console.log("asking to pick up the parcel")
        return await this.#communication.onAsk({status: 'pick_up', position: {x:me.x,y:me.y}});
    }

    async askFreeTile(){
        console.log("asking to the friend if he has free tiles")
        return await this.#communication.onAsk({status: 'ask_tile'});
    }

    async computeFreeTile(){
        let old_pos = {x: this.belief_set.me.x , y:this.belief_set.me.y} 
        let free_tile = this.belief_set.accessible_tiles.find((tile) => {return distance(this.belief_set.me, tile) == 1});
        if(free_tile == undefined)
            return null;
        else{
            //move away
            const move_res = await move(this.belief_set.me, free_tile, this.belief_set.client);
            if(move_res == false){
                console.log("move fallita in compute free tile");
                return null;
            }
            console.log("old_pos:", old_pos);
            return old_pos;
        }
    }

    /**
     * 
     * custom agent loop for handling multi agent
     */
    async loop ( ) {
        while ( true ) {
            if(!this.belief_set.idle){
                // Consumes intention_queue if not empty
                if ( this.intention_queue.length > 0) {
                    console.log( 'intentionRevision.loop', this.intention_queue.map(i=>i.predicate) );
                
                    // Current intention
                    const intention = this.intention_queue[0];
                    this.current_intention = intention;

                    //if it's delivery
                    
                    let intention_validity = this.isValid(intention);
                    if(intention.predicate[0] == 'delivery' && intention_validity){
                        this.intention_queue.shift();
                        const predicate = intention.predicate;
                        for (const planClass of this.plans) {
                            // if plan is 'statically' applicable
                            if ( planClass.isApplicableTo( 'delivery' ) ) {
                                const delivery = new planClass(this,this.#communication,this.belief_set);
                                this.log('achieving intention', predicate, 'with plan', planClass.name);
                                try {
                                    const plan_res = await delivery.execute( ...predicate );
                                    this.log( 'succesful intention', ...predicate, 'with plan', planClass.name, 'with result:', plan_res );
                                } catch (error) {
                                    this.log( 'failed intention', ...predicate,'with plan', planClass.name, 'with error:', ...error );
                                }
                            }

                        }
                    }
                    else if(intention_validity){
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
                    this.pushMulti(['wandering', this.#spawning_tiles]);

                }
            }

            
            // Postpone next iteration at setImmediate
            await new Promise( res => setImmediate( res ) );
        }
    }


    async pushMulti ( predicate ) {
        const intention_name = predicate[0];
        
        if (this.belief_set.settings.decay){
            this.updateElapsed();
            this.cleanIntentions();
        }
        // console.log("here!", this.#delivery_tiles, this.#spawning_tiles);
        // console.log("pushMulti", this.#friend_believe_set.team_data);
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
                await this.pushMulti(['delivery', Math.round(reward / 2), this.#delivery_tiles,[
                    async() =>{return await this.meetRequest()},
                    async(me) => {return await this.askFriendPickUpMsg(me)},
                    async() => {return await this.askFreeTile()}]]);
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

                    const delivery = ['delivery', Math.round(delivery_reward / 2), this.#delivery_tiles,[
                    async() =>{return await this.meetRequest()},
                    async(me) => {return await this.askFriendPickUpMsg(me)},
                    async() => {return await this.askFreeTile}]];
                    await this.pushMulti(delivery);
                }
                else
                    console.log("Intention: ", predicate, "no more valid");
                break;
            case 'wandering':
                let wandering_arr = this.intention_queue.filter((intention) => {return intention.predicate[0] == 'wandering'});
                if(wandering_arr.length == 0){
                    console.log("CHECK wandering");
                    let wandering = new Intention(this, ['wandering', this.#spawning_tiles], this.plans, this.belief_set );
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
        const steps_number = this.belief_set.steps_per_decay | 0;
        let actual_steps;
        const accessible_tiles = this.belief_set.accessible_tiles;
        switch (intention.predicate[0]){
            case 'go_pick_up':
                const parcel = this.belief_set.getParcel(intention.predicate[3]);
                if(!parcel)
                    return false;
            
                if(parcel && !parcel.carriedBy)
                    console.log("valid intention: ", intention.predicate);
                return parcel && !parcel.carriedBy; 
                break;
            case 'delivery':
                //deliver only if you arrive to the delivery tile on time
                let counter = 0;
                // try{
                //     actual_steps = nearestDeliveryTile(me.x,me.y,this.belief_set.delivery_map, accessible_tiles).length;}
                // catch(err){
                //     //here to do the managment of the delivery with comunication
                //     console.log("not able to do BFS in isValid: ", err);
                //     return false;
                // }
                // // console.log("isValid: ",my_id, this.belief_set.parcels);
                this.belief_set.parcels.forEach((parcel) => {
                    // console.log("isValid carriedBy: ", parcel.data.carriedBy);
                    if(parcel.data.carriedBy == my_id) {    
                        counter++;
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

    isValidMulti(intention ){
        const me = this.belief_set.me;
        const my_id = this.belief_set.me.id;
        const steps_number = this.belief_set.steps_per_decay | 0;
        let actual_steps;
        const accessible_tiles = this.belief_set.accessible_tiles;
        switch (intention.predicate[0]){
            case 'wandering':
                //check if a can go to a wandering tile
            case 'delivery':
        }
    }

}