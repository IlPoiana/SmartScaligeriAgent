function _distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
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



const _rmagenttiles = function removeAgentTiles(agents,map){
    var available = map.slice();
    agents.forEach((agent) => {
            available = available.filter(tile => {
                return tile.x !== Math.round(agent.x)
                || tile.y !== Math.round(agent.y);
            });
    })
    // console.log("accessible_tiles",available, "agents", agents);
    return available;
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

function BFS(start,target,map){
    const x = Math.round(start[0]);
    const y = Math.round(start[1]);
    const target_x = target[0];
    const target_y = target[1];
    
    let position = {x:x, y:y};

    if(x == target_x && y == target_y){
        return [position]
    }

    let queue = [];
    let sequences = new Map();
    let visited = [position];
    let id = 0;
    sequences.set(0,position)

    while(true){
        //Generate the options
        //filter options
        let options = [
            {x: position.x + 1, y: position.y},
            {x: position.x - 1, y: position.y},
            {x: position.x, y: position.y + 1},
            {x: position.x, y: position.y - 1},
        ]

        //walls filtering && visited filtering
        options = options.filter((option) => {
            return (map.filter((elem) => {
                return elem.x == option.x && elem.y == option.y
            }).length != 0  && 
            (visited.filter((elem) => {
                return elem.x == option.x && elem.y == option.y
            }).length == 0))
        })

        //Forward checking
        let goal = options.filter((elem) => {   
            return elem.x == target_x && elem.y == target_y
        })
        if(goal.length != 0){
            //adding the last
            const result = sequences.get(id); 
            return Array.prototype.concat(result,goal[0]);
        }  

        //queue the options, assign the parent id to them
        options.forEach((option) => {
            if(queue.length == 0 ||
                queue.filter((q) => {
                    return option.x == q.dest.x && option.y == q.dest.y
                }).length == 0
            )
            queue.push({parent_id: id,dest: option});
        })

        //add to queue (checking duplicates)
        options.forEach((elem) => {
            if( queue.length == 0 ||
                queue.filter((q) => {
                    return elem.x == q.dest.x && elem.y == q.dest.y
                }).length == 0
            ) {
                queue.push({seq_idx: sequence.length, dest: elem})
            }
        
        })

        id += 1;
        //squeue the next destination
        const next = queue.shift();
        if(next == undefined)
            return null
        position = next.dest;
        visited.push(position);

        const parent_id = next.parent_id;
        //update the sequence
        sequences.set(id,Array.prototype.concat(sequences.get(parent_id),position));
        //repeat
    }
}


function DFS(start, target, map){
    const x = Math.round(start[0]);
    const y = Math.round(start[1]);
    const target_x = target[0];
    const target_y = target[1];

    let position = {x:x, y:y}
    //find the road to the target
    if(x == target_x && y == target_y){
        return [position]
    }
    
    //queue of next tiles to explore {coming: seq_idx, next_pos: dest}
    let queue = []
    //visited tiles
    let visited = [position]
    //sequence
    let sequence = [position]

    while(true){
        //filter options
        let options = [
            {x: position.x + 1, y: position.y},
            {x: position.x - 1, y: position.y},
            {x: position.x, y: position.y + 1},
            {x: position.x, y: position.y - 1},
        ]
        
        //walls filtering && visited filtering
        options = options.filter((option) => {
            return (map.filter((elem) => {
                return elem.x == option.x && elem.y == option.y
            }).length != 0  && 
            (visited.filter((elem) => {
                return elem.x == option.x && elem.y == option.y
            }).length == 0))
        })
        //forward checking
        let goal = options.filter((elem) => {   
            return elem.x == target_x && elem.y == target_y
        })

        if(goal.length != 0){
            //adding the last 
            sequence.push(goal[0]);
            break;
        }

        //backtrack to the last thing in the queue
        if(options.length == 0){
            if(queue.length != 0){
                sequence = sequence.slice(0, sequence.length - 1)
            }
            else{
                sequence = [];
                console.log("not possible to go in: ",target_x," ",target_y);
                break;
            }
        }
        else{
            //add to queue (checking duplicates)
            options.forEach((elem) => {
                if( queue.length == 0 ||
                    queue.filter((q) => {
                        return elem.x == q.dest.x && elem.y == q.dest.y
                    }).length == 0
                ) {
                    queue.push({seq_idx: sequence.length, dest: elem})
                }
            
            })
        }

        if(queue.length != 0){
            //expand
            const next_tile = queue.pop();
            position = next_tile.dest;
            // seq_idx = next_tile.seq_idx;
            visited.push(position);
            // console.log(`pushing ${position}`);
            sequence.push(position);
        }
        else{
            break;
        }

        
        // console.log(`sequence queue ${sequence}`);
    }

    return sequence;
    
}

function getNumber(str) {
  const n = parseInt(str, 10);
  return isNaN(n) ? null : n;
}



/**
 * 
 * @param {*} tiles 
 * @returns the list of spawining tiles- TO DO statically allocate the map
 */
export function spawningTiles(tiles){
    let available = [];
    available = tiles.filter((tile) => {
        return tile.type == 1
    })
    return available;
}

/**
 * 
 * @param {*} map 
 * @returns the furthest spawning tile
 */
export function wandering(me,map){
    const x = me.x;
    const y = me.y;
    const dest = spawningTiles(map);
    dest.sort((a,b) => {
        return _distance({x:x, y:y},{x:a.x,y:a.y}) - _distance({x:x, y:y},{x:b.x,y:b.y})
    })
    // const near = dest[0];
    
    const target = dest[dest.length -1];
    return [target.x, target.y];
}

/**
 * 
 * @param {*} map 
 * @returns an array of spawining tiles, sorted by distance(nearest to furthest)
 */
export function wanderingRoundRobin(me,map){
    const x = me.x;
    const y = me.y;
    const dest = spawningTiles(map);
    dest.sort((a,b) => {
        return _distance({x:x, y:y},{x:a.x,y:a.y}) - _distance({x:x, y:y},{x:b.x,y:b.y})
    })
    
    const offset = Math.round(Math.sqrt(dest.length));
    const targets = [];
    
    dest.forEach((tile, index) => {
        if(index % offset == 0)
            targets.push([tile.x,tile.y]);
    })
    return targets;
}

const _tiles = destinationTiles
const _delivery = nearestDeliveryTile
const _DFS = DFS;
const _BFS = BFS;
const _getNumber = getNumber;
export { _distance as distance }
export { _rmwalls as removeWalls}
export { _rmagenttiles as removeAgentTiles}
export { _DFS as DFS };
export { _BFS as BFS };
export {_tiles as deliveryTilesMap}
export {_delivery as nearestDeliveryTile}
export {_getNumber as getNumber}