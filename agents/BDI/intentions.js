import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { removeWalls,BFS } from "../lib/algorithms.js"


// costanti per entrare
const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0'
)

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


/**
 * Finds the nearest delivery tile to the given (x, y) coordinates and returns the path to it using BFS.
 *
 * @param {number} x - The x-coordinate of the starting position.
 * @param {number} y - The y-coordinate of the starting position.
 * @param {Array<{x: number, y: number}>} delivery_map - An array of delivery tile objects with x and y properties.
 * @param {Array<Array<any>>} map - The map representation used for BFS pathfinding.
 * @returns {Array<[number, number]> | null} The path from the starting position to the nearest delivery tile as an array of [x, y] coordinates, or null if no path is found.
 */
function nearestDeliveryTile(x,y, delivery_map,map){
    const delivery_tiles = delivery_map;
    delivery_tiles.sort((a,b) => {
        return distance({x:x, y:y},{x:a.x,y:a.y}) - distance({x:x, y:y},{x:b.x,y:b.y})
    })
    return BFS([x,y], [delivery_tiles[0].x,delivery_tiles[0].y],map);

}

/**
 * Calculates the Manhattan distance between two points.
 *
 * @param {{x: number, y: number}} point1 - The first point with x and y coordinates.
 * @param {{x: number, y: number}} point2 - The second point with x and y coordinates.
 * @returns {number} The Manhattan distance between the two points.
 */
function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

/**
 * Calculates a reward-based distance metric for a given predicate and position.
 *
 * @param {Array} predicate - An array where the fourth element (index 3) is the parcel ID.
 * @param {{x: number, y: number}} position - The current position with x and y coordinates.
 * @returns {number} The absolute difference between the parcel's reward and the distance from the current position to the parcel's position.
 */
function rewardFun(predicate, {x: x1, y:y1}) {
    const id_p = predicate[3]

    //quando arriva delivery diventa undefined
    const reward = (parcels.get(id_p)).reward 
    return Math.abs(reward - distance({x:x1,y:y1},{ x:parcels.get(id_p).x, y:parcels.get(id_p).y}));
  }

/**
 * Beliefset revision function
 */
const me = {};
client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
} )


const parcels = new Map();
var generate_options = true;

// sento i pacchi
client.onParcelsSensing( async ( percived_parcels) => {

  let found_new = false

  for (const p of percived_parcels){

    if(!parcels.has(p.id))
      found_new = true;

    parcels.set(p.id, p)
  }

  if(found_new)
    generate_options = true;
  else
    generate_options = false;
})

let accessible_tiles = [];
let delivery_map = [];

client.onMap((width, height, tiles) =>{
  accessible_tiles = removeWalls(tiles);
  delivery_map = destinationTiles(tiles);
})

client.onParcelsSensing( parcels => {

  if(generate_options){
    /**
     * option generation
     */
    const options = [];

    for (const parcel of parcels.values()){

      //verify if not already carried by another agent
      if (parcel.carriedBy)
        continue;

      //verify if not already in the beliefset
      const already_queued = myAgent.intention_queue.some((i) => i.predicate[3] == parcel.id)
    }
  }
})