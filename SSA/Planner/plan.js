class Plan {

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

    constructor ( parent ) {
        this.#parent = parent;
    }

    log ( ...args ) {
        if ( this.#parent && this.#parent.log )
            this.#parent.log( '\t', ...args )
        else
            console.log( ...args )
    }

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    async subIntention ( predicate ) {
        const sub_intention = new Intention( this, predicate );
        this.#sub_intentions.push( sub_intention );
        return await sub_intention.achieve();
    }

}

class GoPickUp extends Plan {

    static isApplicableTo ( go_pick_up, x, y, id ) {
        return go_pick_up == 'go_pick_up';
    }

    async execute ( go_pick_up, x, y ) {
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            await this.subIntention( ['go_to', x, y] );
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            await this.subIntention(['pick_up']);
        if ( this.stopped ) throw ['stopped']; // if stopped then quit
            return true;
    }

}

class BFSMove extends Plan {

    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( go_to, x, y ) {
        // console.log(`starting DFS: ${[me.x,me.y]} ${[x,y]}`);
        if ( this.stopped ) {return false;};
        let path = BFS([me.x,me.y], [x,y], accessible_tiles)
        //console.log("finished BFS", path);
        if(path && path.length > 1)
            for ( let i = 0; i < path.length; i++ ) {
                if ( this.stopped ) {return false;};
                const next_tile = path[i];

                if(accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                    await this.subIntention( ['go_to', x, y]);
                    return true
                }

                const dx = next_tile.x - me.x;
                const dy = next_tile.y - me.y;
                
                if( dx != 0){
                    if(dx > 0){
                        await client.emitMove("right").catch((err) => console.log("cannot go right"))
                    } else {
                        await client.emitMove("left").catch((err) => console.log("cannot go left"))
                    }
                }
                if( dy != 0){
                    if(dy > 0){
                        await client.emitMove("up").catch((err) => console.log("cannot go up"))
                    } else {
                        await client.emitMove("down").catch((err) => console.log("cannot go down"))
                    }
                }
            }
        else return false;
        return true;
    }
}

class Delivery extends Plan {

    static isApplicableTo ( delivery ) {
        return delivery == 'delivery';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( delivery) {
        // console.log(`starting DFS: ${[me.x,me.y]} ${[x,y]}`);
        if ( this.stopped ) {return false;}
        let path = nearestDeliveryTile(me.x,me.y, delivery_map, accessible_tiles)
        // console.log("delivery", path);
        if(path && path.length > 1)
            for ( let i = 0; i < path.length; i++ ) {
                if ( this.stopped ) {return false;};
                const next_tile = path[i];

                if(accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                    await this.subIntention( ['delivery']);
                    return true
                }

                const dx = next_tile.x - me.x;
                const dy = next_tile.y - me.y;
                
                if( dx != 0){
                    if(dx > 0){
                        await client.emitMove("right").catch((err) => console.log("cannot go right"))
                    } else {
                        await client.emitMove("left").catch((err) => console.log("cannot go left"))
                    }
                }
                if( dy != 0){
                    if(dy > 0){
                        await client.emitMove("up").catch((err) => console.log("cannot go up"))
                    } else {
                        await client.emitMove("down").catch((err) => console.log("cannot go down"))
                    }
                }
            }
        else{
            return false;
        }
        if ( this.stopped ) {return false;}
        await this.subIntention(['put_down']).then(() => {return true}).catch((err) => {console.log(err); return false})
        
    }
}

class Wandering extends Plan {

    static isApplicableTo ( desire ) {
        return desire == 'wandering';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        let target_x; let target_y;
        let path;
        try{
            [target_x, target_y] = wandering(accessible_tiles); 
            // console.log(me,target_x,target_y, accessible_tiles);
            if ( this.stopped ) {return false;}
        
            path = BFS([me.x,me.y],[target_x, target_y],accessible_tiles);
        }        
        catch(err){
            console.log("broken BFS", err);
        }
        if(path && path.length > 1)
            for ( let i = 0; i < path.length; i++ ) {
                if ( this.stopped ) {return false;}
                const next_tile = path[i];

                if(accessible_tiles.filter((tile) => {return tile.x == next_tile.x && tile.y == next_tile.y}).length == 0){
                    console.log("next tile not available");
                    await this.subIntention( ['wandering']);
                    return true
                }

                const dx = next_tile.x - me.x;
                const dy = next_tile.y - me.y;
                
                if( dx != 0){
                    if(dx > 0){
                        await client.emitMove("right").catch((err) => console.log("cannot go right"))
                    } else {
                        await client.emitMove("left").catch((err) => console.log("cannot go left"))
                    }
                }
                if( dy != 0){
                    if(dy > 0){
                        await client.emitMove("up").catch((err) => console.log("cannot go up"))
                    } else {
                        await client.emitMove("down").catch((err) => console.log("cannot go down"))
                    }
                }
            }
        else{
            // console.log("accessible tiles", accessible_tiles, [target_x, target_y], me, path);
            console.log("not able to go", [target_x, target_y], me, path)
            this.subIntention(['wait']);
            return false;
            
        }
        return true;
    }
}

class PickUp extends Plan{
    static isApplicableTo ( desire ) {
        return desire == 'pick_up';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        await client.emitPickup().then(() => {return true}).catch((err) => {console.log(err); return false})
    }
}

class PutDown extends Plan{
    static isApplicableTo ( desire ) {
        return desire == 'put_down';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        await client.emitPutdown().then(() => {return true}).catch((err) => {console.log(err); return false})
    }
}

class Idle extends Plan{
    static isApplicableTo ( desire ) {
        return desire == 'wait';
    }
    //CHANGE, missing the smarter usage of the generated path
    async execute ( desire ) {
        idle = true;
        setTimeout(() => {console.log("waited 1 second")
            idle = false;
        }, 1000);
    }
}