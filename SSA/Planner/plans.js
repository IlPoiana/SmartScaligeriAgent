import { BFS, nearestDeliveryTile, wandering } from "../../agents/lib/algorithms.js";
// 1 change with the more updated wandering
// 2 fix idle condition
// 3 fix subPlan queue

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

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    /**
     * 
     * @param {*} planClass 
     * @param {*} args 
     * @param {*} belief_set 
     */
    async subPlan ( planClass ,args, belief_set ) {
        // console.log("SubPlan: ", ...args, belief_set.me);
        const sub_plan = new planClass(this, belief_set);
        sub_plan.execute(...args).then(() => console.log("sub plan: ", ...args, "achieved")).catch("something went wrong in achieving sub plan: ", ...args);
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
            await this.subPlan(PickUp,['pick_up'], this.belief_set);
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

                const dx = next_tile.x - me.x;
                const dy = next_tile.y - me.y;
                
                if( dx != 0){
                    if(dx > 0){
                        await this.belief_set.client.emitMove("right").catch((err) => console.log("cannot go right"))
                    } else {
                        await this.belief_set.client.emitMove("left").catch((err) => console.log("cannot go left"))
                    }
                }
                if( dy != 0){
                    if(dy > 0){
                        await this.belief_set.client.emitMove("up").catch((err) => console.log("cannot go up"))
                    } else {
                        await this.belief_set.client.emitMove("down").catch((err) => console.log("cannot go down"))
                    }
                }
            }
        else return false;
        return true;
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

                const dx = next_tile.x - me.x;
                const dy = next_tile.y - me.y;
                
                if( dx != 0){
                    if(dx > 0){
                        await this.belief_set.client.emitMove("right").catch((err) => console.log("cannot go right"))
                    } else {
                        await this.belief_set.client.emitMove("left").catch((err) => console.log("cannot go left"))
                    }
                }
                if( dy != 0){
                    if(dy > 0){
                        await this.belief_set.client.emitMove("up").catch((err) => console.log("cannot go up"))
                    } else {
                        await this.belief_set.client.emitMove("down").catch((err) => console.log("cannot go down"))
                    }
                }
            }
        else{
            return false;
        }
        if ( this.stopped ) {return false;}
        this.subPlan(PutDown,['put_down'], this.belief_set).then(() => {return true}).catch((err) => {console.log(err); return false})
        
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

                const dx = next_tile.x - me.x;
                const dy = next_tile.y - me.y;
                
                if( dx != 0){
                    if(dx > 0){
                        await this.belief_set.client.emitMove("right").catch((err) => console.log("cannot go right"))
                    } else {
                        await this.belief_set.client.emitMove("left").catch((err) => console.log("cannot go left"))
                    }
                }
                if( dy != 0){
                    if(dy > 0){
                        await this.belief_set.client.emitMove("up").catch((err) => console.log("cannot go up"))
                    } else {
                        await this.belief_set.client.emitMove("down").catch((err) => console.log("cannot go down"))
                    }
                }
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
        await this.belief_set.client.emitPickup().then(() => {return true}).catch((err) => {console.log(err); return false})
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
        await this.belief_set.client.emitPutdown().then(() => {return true}).catch((err) => {console.log(err); return false})
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