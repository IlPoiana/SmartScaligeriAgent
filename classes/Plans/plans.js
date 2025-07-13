import { distance, move, BFS, nearestDeliveryTile, wandering, wanderingRoundRobin, nearestSpawningTile} from "../../agents/lib/algorithms.js";
import { Beliefset } from "../Beliefs/belief.js";

export class PlanLibrary {
    #plans = [];
    #belief_set;
    constructor(){

        this.#plans.push( BFSMove )

        this.#plans.push( PickUp)
        this.#plans.push( PutDown)
        this.#plans.push( Idle)
        this.#plans.push( WanderingFurthest);
    }

    singleAgentPlans(){
        this.addPlan(Delivery);
        this.addPlan(Wandering)
        this.addPlan(GoPickUp);
    }

    multiAgentPlans(){
        this.addPlan( TunnelDelivery )
        this.addPlan( OnlyDelivery )
        this.addPlan( MultiWandering )
        this.addPlan( GoPickUp )
        this.addPlan( Exchange )
        this.addPlan( FriendPickUpAndDelivery )
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

    set belief_set( belief_set ){
        this.#belief_set = belief_set
    }

    get belief_set(){
        return this.#belief_set
    }



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
     * @param {*} args args passed in the execute function of the plan(predicate)
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
            let at_destination = await this.subPlan( BFSMove, ['go_to', x, y], this.belief_set );
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            if(at_destination)
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

    async execute ( go_to, x, y ) {
        const me = this.belief_set.me;
        if ( this.stopped ) {return false;};
        let path = BFS([me.x,me.y], [x,y], this.belief_set.accessible_tiles)
        if(path){
            if(path.length > 1){
                for ( let i = 1; i < path.length; i++ ) {
                    if ( this.stopped ) {return false;};
                    const next_tile = path[i];
                    if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                        return this.subPlan( BFSMove,['go_to', x, y], this.belief_set);
                    }

                    let result = await move(me, next_tile, this.belief_set.client);
                    if(result == false){


                        console.log("tile probably blocked, removing it from the accessible tiles", me.x, me.y, [x,y]);
                        this.belief_set.accessible_tiles = this.belief_set.accessible_tiles.filter((tile) => {return tile.x !== next_tile.x || tile.y !== next_tile.y})
                        //wait half a second to have an updated belief_set
                        console.log("waiting");
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        console.log("waited 1 second");
                        return this.subPlan(BFSMove, ['go_to', x, y], this.belief_set);

                    }
                }
                return true
            }
            else{
                console.log("on the tile!");
                return true;
            }
        }
        else {
            console.log("not able to do the BFS");
            return false;
        }
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

    nearestSpawningTile(){
        const path = nearestSpawningTile(this.belief_set.me.x, this.belief_set.me.y, this.belief_set.spawning_map, this.belief_set.accessible_tiles);
        const spawn_tile = {x:path[0].x, y:path[0].y};
        const tile_distance = distance(this.belief_set.me,spawn_tile);
        return {path: path, distance: tile_distance};
    }

    static isApplicableTo ( delivery ) {
        return delivery == 'delivery';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( delivery) {
        const me = this.belief_set.me;
        let target_x; let target_y;
        let path;
        let spawn_tile_data;
        let threshold_distance;

        if ( this.stopped ) {return false;}
        const target_array = this.belief_set.delivery_map.slice();
        target_array.sort((a,b) => {
            return distance(a, me) - distance(b,me);
        })
        
        for(let [idx, delivery_tile] of target_array.entries()){
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

                        let result = await move(me, next_tile, this.belief_set.client);
                        if(result == false){
                            put_down = false;
                            break;
                        }
                    }
            }
            else {
                spawn_tile_data = this.nearestSpawningTile();
                threshold_distance = spawn_tile_data.distance;
                if(distance(me,delivery_tile) > threshold_distance){
                    return await this.subPlan(Wandering, ['wandering'], this.belief_set);
                }
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
            if(path){
                if(path.length >1)
                    for ( let i = 0; i < path.length; i++ ) {
                        if ( this.stopped ) {return false;}
                        const next_tile = path[i];

                        if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                            console.log("next tile not available");
                            break;
                        }

                        let result = await move(me, next_tile, this.belief_set.client);
                        if(result == false)
                            break;
                    } 
                continue;
            }
            else {
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
        const me = this.belief_set.me;
        let target_x; let target_y;
        let path;
        try{
            [target_x, target_y] = wandering(me,this.belief_set.accessible_tiles); 
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

/*
MULTI AGENT
----------------------------------------------------------------------
*/

/**
 * here we will introduce subclasses dedicated for multi agents plans
 */
class MultiDelivery extends Plan {

    nearestSpawningTile(){
        const path = nearestSpawningTile(this.belief_set.me.x, this.belief_set.me.y, this.belief_set.spawning_map, this.belief_set.accessible_tiles);
        const spawn_tile = {x:path[0].x, y:path[0].y};
        const tile_distance = distance(this.belief_set.me,spawn_tile);
        return {path: path, distance: tile_distance};
    }

    static isApplicableTo ( delivery ) {
        return delivery == 'delivery';
    }

    /**
     * 
     * @param {*} delivery the standard string indicating the intention
     * @param {Array} tile_list the array of my delivery tiles 
     * @returns 
     */
    async execute ( delivery, reward ,tile_list) {

        const me = this.belief_set.me;
        let target_x; let target_y;
        let path;
        let spawn_tile_data;
        let threshold_distance;

        if ( this.stopped ) {return false;}
        try{const target_array = tile_list.slice();
        target_array.sort((a,b) => {
            return distance(a, me) - distance(b,me);
        })
        
        for(let [idx, delivery_tile] of target_array.entries()){
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
                            // return await this.subPlan(Delivery, ['delivery'], this.belief_set);
                        }

                        let result = await move(me, next_tile, this.belief_set.client);
                        if(result == false){
                            put_down = false;
                            break;
                        }
                    }
            }
            else {
                spawn_tile_data = this.nearestSpawningTile();
                threshold_distance = spawn_tile_data.distance;
                if(distance(me,delivery_tile) > threshold_distance){
                    return await this.subPlan(Wandering, ['wandering'], this.belief_set);
                }
                console.log("not able to go", [target_x, target_y], me, path);
                put_down = false;
            }
            if(put_down)
                return await this.subPlan(PutDown,['put_down'], this.belief_set).then((res) => {return res}).catch((err) => {console.log(err); return false})

        }}catch(err){console.log(err); process.exit()}
    }
    
}

class TunnelDelivery extends Plan {

    #communication

    /**
     * returns the updated position of my friend
     */
    get team_position(){
        return this.#communication.multi_agent_belief.team_data
    }


    constructor(parent, communication,belief){
        super(parent, belief);
        this.#communication = communication;
    }

    nearestSpawningTile(){
        const path = nearestSpawningTile(this.belief_set.me.x, this.belief_set.me.y, this.belief_set.spawning_map, this.belief_set.accessible_tiles);
        const spawn_tile = {x:path[0].x, y:path[0].y};
        const tile_distance = distance(this.belief_set.me,spawn_tile);
        return {path: path, distance: tile_distance};
    }

    static isApplicableTo ( delivery ) {
        return delivery == 'delivery';
    }

    /**
     * 
     * @param {*} delivery the standard string indicating the intention
     * @param {Array} tile_list the array of my delivery tiles 
     * @param {Array} callbacks an array of callbacks used for the exchange plan
     * @returns 
     */
    async execute ( delivery, reward ,tile_list, callbacks) {

        console.log("in Tunnel delivery: ", this.team_position);
        const me = this.belief_set.me;
        let target_x; let target_y;
        let path;
        let spawn_tile_data;
        let threshold_distance;

        if ( this.stopped ) {return false;}
        try{const target_array = tile_list.slice();
        target_array.sort((a,b) => {
            return distance(a, me) - distance(b,me);
        })
        
        for(let [idx, delivery_tile] of target_array.entries()){
            target_x = delivery_tile.x;
            target_y = delivery_tile.y;
        
            let put_down = true;
            try{
                let friend_x = Math.round(this.team_position.x);
                let friend_y = Math.round(this.team_position.y);
                let accessible_tiles = this.belief_set.accessible_tiles.filter((tile) => {
                    return (tile.x != friend_x  || tile.y != friend_y) 
                })
                path = BFS([me.x,me.y],[target_x, target_y],accessible_tiles);
                //checking for bottlenecks
                let original_path = BFS([me.x,me.y],[target_x, target_y],this.belief_set.original_map);
                console.log("done BFS in delivery",path, original_path, [target_x, target_y], this.team_position);
                
                if(
                    path == null &&
                    original_path &&
                    original_path.filter((tile) =>{return tile.x == friend_x && tile.y == friend_y}).length == 1//my team is in the path to my obj
                ){
                    console.log("partner in my path!");
                    //exchange procedure
                    return await this.subPlan(Exchange, ['exchange', this.team_position,callbacks] , this.belief_set);
                    
                }
            }
            catch(err){
                console.log("broken BFS", err);
                return false;
            }
            if(path){
                if(path.length > 1)
                    for ( let i = 0; i < path.length; i++ ) {
                        if ( this.stopped ) {return false;}
                        const next_tile = path[i];

                        if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                            console.log("next tile not available, switching delivery tile", " team position",this.team_position, next_tile);
                            put_down = false;
                            if(
                                next_tile.x == Math.round(this.team_position.x) && next_tile.y == Math.round(this.team_position.y)//my team is in the path to my obj
                            ){
                                console.log("partner in my path!");
                                //exchange procedure
                                return await this.subPlan(Exchange, ['exchange', this.team_position,callbacks] , this.belief_set);
                                
                            }
                            
                            break;
                            // return await this.subPlan(Delivery, ['delivery'], this.belief_set);
                        }

                        let result = await move(me, next_tile, this.belief_set.client);
                        if(result == false){
                            if(
                                next_tile.x == Math.round(this.team_position.x) && next_tile.y == Math.round(this.team_position.y)//my team is in the path to my obj
                            ){
                                console.log("partner in my path!");
                                //exchange procedure
                                return await this.subPlan(Exchange,['exchange',this.team_position,callbacks], this.belief_set);
                            }
                            put_down = false;
                            break;
                        }
                    }

            }
            else {
                //first case

                spawn_tile_data = this.nearestSpawningTile();
                threshold_distance = spawn_tile_data.distance;
                if(distance(me,delivery_tile) > threshold_distance){
                    return await this.subPlan(Wandering, ['wandering'], this.belief_set);
                }
                console.log("not able to go", [target_x, target_y], me, path);
                put_down = false;
            }
            if(put_down)
                return await this.subPlan(PutDown,['put_down'], this.belief_set).then((res) => {return res}).catch((err) => {console.log(err); return false})

        }}catch(err){console.log(err); return false}
    }
    
}

class MultiWandering extends Plan{

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( wandering ) {
        return wandering == 'wandering';
    }
   
    /**
     * 
     * @param {*} wandering standard string desire 
     * @param {*} tile_list the list of allowed tile for me sorted by distance
     * @returns 
     */
    async execute ( wandering, tile_list ) {

        const me = this.belief_set.me;
        let target_x; let target_y;
        let target_array = [];
        let path;
        let fail_counter;

        try{target_array = tile_list;
        fail_counter = target_array.length;

        if ( this.stopped ) {return false;}
        
        for(let spawn_tile of target_array){
            target_x = spawn_tile.x;
            target_y = spawn_tile.y;
            try{
                path = BFS([me.x,me.y],[target_x, target_y],this.belief_set.accessible_tiles);
        
            }catch(err){
                console.log("broken BFS", err);
                return false;
            }
            if(path ){
                if(path.length > 1){
                    for ( let i = 0; i < path.length; i++ ) {
                        if ( this.stopped ) {return false;}
                        const next_tile = path[i];

                        if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                            console.log("next tile not available");
                            fail_counter--;
                            break;
                        }

                        let result = await move(me, next_tile, this.belief_set.client);
                        if(result == false){
                            fail_counter--;
                            break;
                        }
                    }
                }
                continue;       
            }
            else {
                console.log("not able to go", [target_x, target_y], me, path);
                fail_counter--;
            }
        }    
        await this.subPlan(Idle,['wait'],this.belief_set);
        return fail_counter > 0;}catch(err){console.log(err)}
    }
}


class OnlyDelivery extends Plan{

    constructor(parent, belief_set){
        super(parent, belief_set);
    }
    
    static isApplicableTo ( del ) {
        return del == 'only_delivery';
    }

    async execute ( delivery) {
        const me = this.belief_set.me;
        let target_x; let target_y;
        let path;
        let spawn_tile_data;
        let threshold_distance;

        if ( this.stopped ) {return false;}
        const target_array = this.belief_set.delivery_map.slice();
        target_array.sort((a,b) => {
            return distance(a, me) - distance(b,me);
        })
        
        for(let [idx, delivery_tile] of target_array.entries()){
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
                            // return await this.subPlan(Delivery, ['delivery'], this.belief_set);
                        }

                        let result = await move(me, next_tile, this.belief_set.client);
                        if(result == false){
                            put_down = false;
                            break;
                        }
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

class BFSToFriend extends Plan{
     constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( go_pick_up ) {
        return go_pick_up == 'go_to_friend';
    }

    async execute ( go_pick_up, x, y) {
        const me = this.belief_set.me;
            if ( this.stopped ) {return false;};
            let path = BFS([me.x,me.y], [x,y], this.belief_set.original_map)
            console.log("path to friend", path);
            path = path.slice(0,path.length - 1);
            console.log("finished BFSToFriend", me,path);
            if(path){
                if(path.length > 1){
                    for ( let i = 1; i < path.length; i++ ) {
                        if ( this.stopped ) {return false;};
                        const next_tile = path[i];
                        if(this.belief_set.accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                            return this.subPlan( BFSMove,['go_to', x, y], this.belief_set);
                        }

                        let result = await move(me, next_tile, this.belief_set.client);
                        if(result == false){


                            console.log("tile probably blocked, removing it from the accessible tiles", me.x, me.y, [x,y]);
                            this.belief_set.accessible_tiles = this.belief_set.accessible_tiles.filter((tile) => {return tile.x !== next_tile.x || tile.y !== next_tile.y})
                            //wait half a second to have an updated belief_set
                            console.log("waiting");
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            console.log("waited 1 second");
                            return this.subPlan(BFSMove, ['go_to', x, y], this.belief_set);

                        }
                    }
                    return true
                }
                else{
                    console.log("on the tile!");
                    return true;
                }
            }
            else {
                console.log("not able to do the BFS");
                return false;
            }
    }

}

class FriendPickUpAndDelivery extends Plan {

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( go_pick_up ) {
        return go_pick_up == 'pick_up_and_delivery';
    }
/**
 * 
 * @param {*} go_pick_up 
 * @param {*} x x coordinate of friend
 * @param {*} y y coordinate of friend
 * @param {*} reply 
 * @returns 
 */
    async execute ( go_pick_up, x, y, reply ) {
        console.log("FriendPickUpAndDelivery: ", go_pick_up,x,y);
        let at_destination = await this.subPlan( BFSMove, ['go_to', x, y], this.belief_set );
        if(at_destination)
                await this.subPlan(PickUp, ['pick_up'], this.belief_set);
        reply();
        await this.subPlan( OnlyDelivery, ['only_delivery'],this.belief_set);
        this.belief_set.idle = false;
        return true;
    }
}


/**
 * This is the Plan to Exchange, it should handle the case of bringing and waiting
 * Put here everything you need yo do the exchange, like a callback to call where I can communicate
*/
class Exchange extends Plan{
    static isApplicableTo ( exchange ) {
        return exchange == 'exchange';
    }


    checkFreeTile(){
        const me = this.belief_set.me;
        const accessible_tiles = this.belief_set.accessible_tiles;
        let elem = accessible_tiles.find((tile) => {
            return distance(me, tile) == 1; 
        })
        if(!elem)
            return null
        else return elem;
    }

    async execute(exchange, team_position,[meetRequest, askFriendPickUpMsg,askFreeTile]){
        console.log("in Exchange", team_position);
        const me = this.belief_set.me;
        const client = this.belief_set.client;

        console.log("stopping the intention loop");
        this.belief_set.idle = true;
        //callback should meetRequest
        await meetRequest();
        console.log("friend position before: ", team_position);
        //go to the friend
        await this.subPlan(BFSToFriend, ['go_to_friend', Math.round(team_position.x),Math.round(team_position.y)], this.belief_set);
        //check if I have a free tile
        const next_tile = this.checkFreeTile();
        //if I have a free tile, put down,move and ask to the friend to take it and reply;
        if(next_tile != null){
            console.log("put down the parcel");
            await client.emitPutdown();
            let old_pos = {x:me.x,y:me.y};
            console.log("moving away");
            await move(me,next_tile,client);
            console.log("my old position: ", old_pos, me);
            await askFriendPickUpMsg(old_pos);
        }else{
            //ask if friend can move
            let response = await askFreeTile()//tile to go or null
            console.log("tile response", response);
            if(response && response.tile != null){
                let old_pos = {x:me.x,y:me.y};
                await move(me,response.tile,client);
                await client.emitPutdown();
                
                console.log("my old position: ", old_pos, me);
                await move(me,old_pos,client);
                await askFriendPickUpMsg(response.tile)
            }
                
            else{
                //something went wrong, wait and restart
                await this.subPlan(Idle, ['wait'], this.belief_set);
            }
        }
        console.log("finished exchange");
        this.belief_set.idle = false;
        console.log("loop restarted");
        return;
        
    }
}


class MultiGoPickUp extends Plan{

    constructor(parent, belief_set){
        super(parent, belief_set);
    }

    static isApplicableTo ( go_pick_up ) {
        return go_pick_up == 'go_pick_up';
    }

    async execute ( go_pick_up, x, y ) {
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            let at_destination = await this.subPlan( BFSMove, ['go_to', x, y], this.belief_set );
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            if(at_destination)
                await this.subPlan(PickUp, ['pick_up'], this.belief_set);
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            return true;
    }

}