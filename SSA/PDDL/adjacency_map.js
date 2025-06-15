import { Beliefset } from "../Beliefs/belief.js";
import { IntentionRevisionRevise } from "../Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../Planner/plans.js";

/**returns an array with the four nearby tiles coordinates*/
function neighbours(tile){
    const t_x = tile.x;
    const t_y = tile.y;
    return [{x:t_x-1, y: t_y},{x:t_x+1, y: t_y},{x:t_x,y: t_y+1},{x:t_x, y: t_y-1}]
}

function pddl_adjacent_map(accessible_tiles){
    let adjacent_map = new Map();
    let nearby_tiles = [];
    let isAccessible;
    belief_set.accessible_tiles.forEach((tile) => {
        nearby_tiles = neighbours(tile);
        nearby_tiles.forEach(n_tile => {
            isAccessible = belief_set.accessible_tiles.filter((inner_tile => {
                return n_tile.x == inner_tile.x && n_tile.y == inner_tile.y
            })).length
            if(isAccessible == 1){
                //add to the map
                adjacent_map.set(`loc-${n_tile.x}-${n_tile.y} loc-${tile.x}-${tile.y}`, `adjacent loc-${n_tile.x}-${n_tile.y} loc-${tile.x}-${tile.y}`)
                adjacent_map.set(`loc-${tile.x}-${tile.y} loc-${n_tile.x}-${n_tile.y}`, `adjacent loc-${tile.x}-${tile.y} loc-${n_tile.x}-${n_tile.y}`)
            }

        }) 
    })
    return adjacent_map;
}

const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ0MGQ1NiIsIm5hbWUiOiJyZWZhY3RvciIsInRlYW1JZCI6ImFkMmI2MSIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDg3NzQ0NTB9.pnl_SztMf3OIvLYDmKTQUl6a53vbtKbm44Ezb4f4Tko");
belief_set.onReady(() => {
    let adjacent_map = new Map();
    let nearby_tiles = [];
    let isAccessible;
    belief_set.accessible_tiles.forEach((tile) => {
        nearby_tiles = neighbours(tile);
        nearby_tiles.forEach(n_tile => {
            isAccessible = belief_set.accessible_tiles.filter((inner_tile => {
                return n_tile.x == inner_tile.x && n_tile.y == inner_tile.y
            })).length
            if(isAccessible == 1){
                //add to the map
                adjacent_map.set(`loc-${n_tile.x}-${n_tile.y} loc-${tile.x}-${tile.y}`, `adjacent loc-${n_tile.x}-${n_tile.y} loc-${tile.x}-${tile.y}`)
                adjacent_map.set(`loc-${tile.x}-${tile.y} loc-${n_tile.x}-${n_tile.y}`, `adjacent loc-${tile.x}-${tile.y} loc-${n_tile.x}-${n_tile.y}`)
            }

        }) 
    })
    adjacent_map.forEach((v,k) => {console.log(v);})

})
