import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { removeWalls,BFS } from "./lib/algorithms.js"
import { EventEmitter } from "events";
// When sensing a parcel nearby, go there and pick it up, distance 1

const me = {}
const parcels = new Map();
let accessible_tiles = [];
let delivery_map = [];
const settings = {
    x: 0,
    y: 0,
    movement: 0,
    decay: 0,
    max_parcel: 0
}
/*
FUNCTIONS DECLARATION---------------------------
*/

function getNumber(str) {
  const n = parseInt(str, 10);
  return isNaN(n) ? null : n;
}

/**
 * Updates all the parcels timer 
 */
function updateElapsed() {
    // console.log("updating");
    const now = Date.now();
    parcels.forEach(parcel => {
        parcel.timedata.elapsed = parcel.timedata.elapsed - Number((now / 1e3 - parcel.timedata.startTime).toFixed(2));
        if(parcel.timedata.elapsed <= 0){
            parcels.delete(parcel.data.id);}
    });
    // parcels.forEach((parcel) => console.log(parcel.data, parcel.timedata.elapsed))
}

function checkIntention(intention){
    const type = intention.predicate[0];
    switch (type) {
        case 'go_pick_up':
            const parcel_id = intention.predicate[3];
            if(!parcels.get(parcel_id) || intention.predicate[4] == 0){
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

function destinationTiles(tiles){
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

function nearestDeliveryTile(x,y, delivery_map,map){
    const delivery_tiles = delivery_map;
    delivery_tiles.sort((a,b) => {
        return distance({x:x, y:y},{x:a.x,y:a.y}) - distance({x:x, y:y},{x:b.x,y:b.y})
    })
    // console.log("sorted delivery: ",delivery_tiles);
    return BFS([x,y], [delivery_tiles[0].x,delivery_tiles[0].y],map);

}

function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

function parcelRewardFun(predicate, {x: x1, y:y1}) {
    const id_p = predicate[3]
    let parcel = parcels.get(id_p)
    if(!parcel)
        return 0;
    //quando arriva delivery diventa undefined
    const reward = parcel.data.reward 
    // console.log("parcel id",id_p,"reward",reward)
    //return Math.abs(Number.MAX_VALUE - distance({x:x1,y:y1},{ x:parcels.get(id_p).x, y:parcels.get(id_p).y}));
    
    // let computed_reward = reward -  distance({x:x1,y:y1},{ x:parcel.data.x, y:parcel.data.y}) / 2;
    let computed_reward = distance({x:x1,y:y1},{ x:parcel.data.x, y:parcel.data.y}) / settings.movement;
    // console.log("CHECK reward- id:", predicate[3],computed_reward);
    return computed_reward < 0 ? 0 : computed_reward;
}

function rewardFun(predicate, {x: x1, y:y1}){
    if(predicate[3]){
        const final_reward = parcelRewardFun(predicate, {x1,y1}) + (parcels.get(predicate[3])).timedata.elapsed
        return final_reward > 0 ? final_reward : 1;
    }
    else if(predicate[0] == 'delivery'){
        return predicate[1];//should be the delivery reward
    }
}

//----------------------------------------------


// When sensing a parcel nearby, go there and pick it up, distance 1

// SIUMM token for azure server
const client = new DeliverooApi(
    'http://localhost:8080',
    //Delivery token
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3OWM3ZCIsIm5hbWUiOiJEZWxpdmVyeSIsInRlYW1JZCI6ImJjYTBjMyIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDc4MzI5ODB9.t_AhdFcoHUtbjl-SBM_h1bxhXwMGmVjfk1dhqZ4oICs'
)

const event = new EventEmitter();

const map_promise = new Promise((res,rej) => {
    event.once('map', () => res());
})

const settings_promise = new Promise((res,rej) => {
    event.once('settings', () => res());
})

const me_promise = new Promise((res,rej) => {
    event.once('me', () => res());
})

Promise.all([map_promise, settings_promise, me_promise]).then(() => (console.log(me,settings)))

client.onConfig((conf) => {
    settings.decay = getNumber(conf.PARCEL_DECADING_INTERVAL) // could be null if infinite
    settings.max_parcel = Number(conf.PARCELS_MAX)
    settings.movement = conf.MOVEMENT_DURATION
    event.emit('settings');
})

client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
    event.emit('me');
} )

client.onMap((width, height, tiles) => {
    accessible_tiles = removeWalls(tiles);
    delivery_map = destinationTiles(tiles);
    settings.x = width;
    settings.y = height;
    event.emit('map');
    // console.log(`accessible_tiles ${accessible_tiles}`)
})


