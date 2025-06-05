import { distance, move, BFS, nearestDeliveryTile, wandering, wanderingRoundRobin } from "../../agents/lib/algorithms.js";
import { Beliefset } from "../Beliefs/belief.js";
// 1 change with the more updated wandering DONE
// 2 fix idle condition
// 3 fix subPlan queue
// 4 change the delivery, when not able to reach a nearby delivery, tries to all the other delivery tiles, only if they are nearer to a spawning tile, other wise wandering
// 4.1 wtf delivery still goes even if it has no parcels

export class PlanLibrary {
    #plans = [];
    #belief_set;
    constructor(){
        this.#plans.push( GoPickUp )
        this.#plans.push( BFSMove )
        this.#plans.push( Delivery)
        this.#plans.push( Wandering)
        this.#plans.push( PickUp)
        this.#plans.push( PutDown)
        this.#plans.push( Idle)
        this.#plans.push( WanderingFurthest);
    }

    get belief_set(){
        return this.#belief_set;
    }

    set belief_set( belief_set ){
        this.#belief_set = belief_set;
    }

    get plans(){
        return this.#plans;
    }
    //REMOVE
    set plans( plans ){
        this.#plans = plans;
    }

    addPlan( plan ){
        this.#plans.push(plan);
    }
}


class Plan {
    #belief_set;

    //Remove--
    set belief_set( belief_set ){
        this.#belief_set = belief_set
    }

    get belief_set(){
        return this.#belief_set
    }
    //-------


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

    /**
     * 
     * @param {Plan} parent 
     * @param {Beliefset} belief_set 
     */
    constructor ( parent, belief_set ) {
        this.#parent = parent;
        this.#belief_set = belief_set;
    }

    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    async executePath(){

    }

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    /**
     * 
     * @param {*} planClass 
     * @param {*} args 
     * @param {*} belief_set 
     */
    async subPlan(planClass, args, belief_set) {
        const sub_plan = new planClass(this, belief_set);
        this.#sub_intentions.push(sub_plan);

        // Return the promise from sub_plan.execute(...).then(...).catch(...)…
        return sub_plan
            .execute(...args)
            .then(res => {
            console.log("sub plan:", ...args, "achieved", res);
            return res;           // ensure the returned promise resolves to “res”
            })
            .catch(err => {
            console.log("error in sub plan:", ...args, err);
            throw err;             // re‐throw so the caller sees rejection
            })
            .finally(() => {
            this.#sub_intentions.shift();
            });
        }


}

class GoPickUp extends Plan {

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( go_pick_up, x, y, id ) {
        return go_pick_up == 'go_pick_up';
    }

    async execute ( go_pick_up, x, y ) {
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            // console.log("BFSMove: ", this.belief_set.me);
            await this.subPlan( BFSMove, ['go_to', x, y], this.belief_set );
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            await this.subPlan(PickUp, ['pick_up'], this.belief_set);
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            return true;
    }

}

class BFSMove extends Plan {

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( go_to, x, y ) {
        const me = this.belief_set.me;
        // console.log("BFSMove me: ", this.belief_set.me);
        if ( this.stopped ) {return false;};
        let path = BFS([me.x,me.y], [x,y], this.belief_set.accessible_tiles)
        //console.log("finished BFS", path);
        if(path && path.length > 1)
            for ( let i = 0; i < path.length; i++ ) {
                if ( this.stopped ) {return false;};
                const next_tile = path[i];

                if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                    await this.subPlan( BFSMove,['go_to', x, y], this.belief_set);
                    return true
                }

                await move(me, next_tile, this.belief_set.client);
            }
        else return false;
        return true;
    }
}

class DeliveryForgot extends Plan {

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( delivery ) {
        return delivery == 'delivery_forgot';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( delivery) {
        try{
            const me = this.belief_set.me;
            if ( this.stopped ) {return false;}
            let path = nearestDeliveryTile(me.x,me.y, this.belief_set.delivery_map, this.belief_set.accessible_tiles)
            // console.log("delivery", path);
            if(path && path.length > 1)
                for ( let i = 0; i < path.length; i++ ) {
                    if ( this.stopped ) {return false;};
                    const next_tile = path[i];

                    if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                        await this.subPlan( Delivery,['delivery'],this.belief_set);
                        return true
                    }

                    await move(me, next_tile, this.belief_set.client);
                }
            else{
                return false;
            }
            if ( this.stopped ) {return false;}
            return this.subPlan(PutDown,['put_down'], this.belief_set).then((res) => {return res}).catch((err) => {console.log(err); return false})
        }
        catch(err){
            console.log("err: ", err);
        }
    }
}


class Delivery extends Plan {

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( delivery ) {
        return delivery == 'delivery';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( delivery) {
        const me = this.belief_set.me;
        let target_x; let target_y;
        let path;

        if ( this.stopped ) {return false;}
        const target_array = this.belief_set.delivery_map.slice();
        target_array.sort((a,b) => {
            return distance(a, me) - distance(b,me);
        })
        
        for(let delivery_tile of target_array){
            target_x = delivery_tile.x;
            target_y = delivery_tile.y;
            let put_down = true;
            try{
                path = BFS([me.x,me.y],[target_x, target_y],this.belief_set.accessible_tiles);
        
            }catch(err){
                console.log("broken BFS", err);
                return false;
            }
            if(path){
                if(path.length > 1)
                    for ( let i = 0; i < path.length; i++ ) {
                        if ( this.stopped ) {return false;}
                        const next_tile = path[i];

                        if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                            console.log("next tile not available, switching delivery tile");
                            put_down = false;
                            break;
                        }

                        await move(me, next_tile, this.belief_set.client);
                    }
            }
            else {
                console.log("not able to go", [target_x, target_y], me, path);
                put_down = false;
            }
            if(put_down)
                return await this.subPlan(PutDown,['put_down'], this.belief_set).then((res) => {return res}).catch((err) => {console.log(err); return false})

        }
    }
    
}

class Wandering extends Plan {

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( desire ) {
        return desire == 'wandering';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        // console.log("in wandering",this.belief_set.me);
        const me = this.belief_set.me;
        let target_x; let target_y;
        let target_array = [];
        let path;
        let fail_counter;
        
        target_array = wanderingRoundRobin(me,this.belief_set.accessible_tiles);
        fail_counter = target_array.length;

        if ( this.stopped ) {return false;}
        
        for([target_x, target_y] of target_array){
            try{
                path = BFS([me.x,me.y],[target_x, target_y],this.belief_set.accessible_tiles);
        
            }catch(err){
                console.log("broken BFS", err);
                return false;
            }
            if(path && path.length > 1){
                for ( let i = 0; i < path.length; i++ ) {
                    if ( this.stopped ) {return false;}
                    const next_tile = path[i];

                    if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                        console.log("next tile not available");
                        break;
                    }

                    await move(me, next_tile, this.belief_set.client);
                }       
            }
            else if(path.length != 1){
                // console.log("accessible tiles", this.belief_set.accessible_tiles, [target_x, target_y], me, path);
                console.log("not able to go", [target_x, target_y], me, path);
                fail_counter--;
            }
        }    
        await this.subPlan(Idle,['wait'],this.belief_set);
        return fail_counter > 0;
    }
}

class WanderingFurthest extends Plan {

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( desire ) {
        return desire == 'wandering_furthest';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        // console.log("in wandering",this.belief_set.me);
        const me = this.belief_set.me;
        let target_x; let target_y;
        let path;
        try{
            [target_x, target_y] = wandering(me,this.belief_set.accessible_tiles); 
            // console.log(me,target_x,target_y, this.belief_set.accessible_tiles);
            if ( this.stopped ) {return false;}
        
            path = BFS([me.x,me.y],[target_x, target_y],this.belief_set.accessible_tiles);
        }        
        catch(err){
            console.log("broken BFS", err);
        }
        if(path && path.length > 1)
            for ( let i = 0; i < path.length; i++ ) {
                if ( this.stopped ) {return false;}
                const next_tile = path[i];

                if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                    console.log("next tile not available");
                    await this.subPlan( Wandering,['wandering'],this.belief_set);
                    return true
                }

                await move(me, next_tile, this.belief_set.client);
            }
        else{
            // console.log("accessible tiles", this.belief_set.accessible_tiles, [target_x, target_y], me, path);
            console.log("not able to go", [target_x, target_y], me, path)
            await this.subPlan(Idle,['wait'],this.belief_set);

            return false;
            
        }
        console.log("finished wandering");
        return true;
    }
}

class PickUp extends Plan{

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( desire ) {
        return desire == 'pick_up';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        return this.belief_set.client.emitPickup().then((res) => {return true}).catch((err) => {console.log(err); return false})
    }
}

class PutDown extends Plan{

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( desire ) {
        return desire == 'put_down';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        if(this.belief_set.onDeliveryTile()){
            const my_id = this.belief_set.me.id;
            const parcels_array = [...this.belief_set.parcels];
            return this.belief_set.client.emitPutdown().then((res) => {
                parcels_array.forEach((elem) => {
                    let key; let parcel; [key,parcel] = elem;
                    if(parcel.data.carriedBy == my_id) this.belief_set.parcels.delete(key);
                })
                return true
            }).catch((err) => {console.log(err); return false});
        }
        else{
            return false;
        }
    }
}

class Idle extends Plan{

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( desire ) {
        return desire == 'wait';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        this.belief_set.idle = true;
        setTimeout(() => {console.log("waited 1 second")
            this.belief_set.idle = false;
        }, 1000);
    }
}