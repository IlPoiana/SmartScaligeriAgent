import { Beliefset } from "@unitn-asa/pddl-client";

class Map {

    pos = { x: 0, y: 0 };
    movement = 0;
    decay = 0;
    max_parcel = 0;

    constructor() {
        this.pos = { x: 0, y: 0 };
        this.movement = 0;
        this.decay = 0;
        this.max_parcel = 0;
    }

    destinationTiles(tiles){
    var delivery = [];
    tiles.forEach(elem => {
        if(elem.type == 2)
            delivery.push({
                x: elem.x,
                y: elem.y,
                type: elem.type
            })
    });

    return delivery;
}

}

const _rmwalls = function removeWalls(tiles){
    var available = [];
    tiles.forEach(elem => {
        if(elem.type != 0)
            available.push({
                x: elem.x,
                y: elem.y,
                type: elem.type
            })
    });
    return available;
}




export { _rmwalls as removeWalls }
export { Map }