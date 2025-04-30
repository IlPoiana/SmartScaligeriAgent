function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

function BFS(start,target,map){
    const x = Math.round(start[0]);
    const y = Math.round(start[1]);
    const target_x = target[0];
    const target_y = target[1];

    //find the road to the target
    if(x == target_x && y == target_y){
        return []
    }
    let position = {x:x, y:y}
    //queue of next tiles to explore {coming: seq_idx, next_pos: dest}
    let queue = []
    //visited tiles
    let visited = [position]
    //sequence
    let sequence = new Map();
    sequence.set(0,position);
    let id = 1;
    while(true){
        //generate options
        //filter options
        let options = [
            {x: position.x + 1, y: position.y},
            {x: position.x - 1, y: position.y},
            {x: position.x, y: position.y + 1},
            {x: position.x, y: position.y - 1},
        ]

        // console.log(options)
        //walls filtering && visited filtering
        options = options.filter((option) => {
            return (map.filter((elem) => {
                return elem.x == option.x && elem.y == option.y
            }).length != 0  && 
            (visited.filter((elem) => {
                return elem.x == option.x && elem.y == option.y
            }).length == 0))
        })

        if(options.length == 0){
            sequence.pop();
        }

        //forward checking
        let goal = options.filter((elem) => {   
            return elem.x == target_x && elem.y == target_y
        })
        if(goal.length != 0){
            //adding the last 
            sequence.push(goal[0]);
            break;
        }  
        
        //pushing the next steps
        options.forEach((option) => {
            queue.push(option)
        })

        position = queue.shift();
        // seq_idx = next_tile.seq_idx;
        visited.push(position);
        // console.log(`pushing ${position}`);
        sequence.set(id, position);
    }

}

function DFS(start, target, map){
    const x = Math.round(start[0]);
    const y = Math.round(start[1]);
    const target_x = target[0];
    const target_y = target[1];

    //find the road to the target
    if(x == target_x && y == target_y){
        return []
    }
    let position = {x:x, y:y}
    //queue of next tiles to explore {coming: seq_idx, next_pos: dest}
    let queue = []
    //visited tiles
    let visited = [position]
    //sequence
    let sequence = [position]

    while(true){
        // console.log("position: ", position);
        // console.log("generating options");
        //filter options
        let options = [
            {x: position.x + 1, y: position.y},
            {x: position.x - 1, y: position.y},
            {x: position.x, y: position.y + 1},
            {x: position.x, y: position.y - 1},
        ]

        // console.log(options)
        //walls filtering && visited filtering
        options = options.filter((option) => {
            return (map.filter((elem) => {
                return elem.x == option.x && elem.y == option.y
            }).length != 0  && 
            (visited.filter((elem) => {
                return elem.x == option.x && elem.y == option.y
            }).length == 0))
        })
        // console.log("options filtering ", options);

        //forward checking
        let goal = options.filter((elem) => {   
            return elem.x == target_x && elem.y == target_y
        })

        if(goal.length != 0){
            // console.log("finished");
            //adding the last 
            sequence.push(goal[0]);
            break;
        }

        //backtrack to the last thing in the queue
        if(options.length == 0){
            if(queue.length != 0){
                sequence = sequence.slice(0, queue[queue.length - 1])
            }
            else{
                sequence = [];
                console.log("not possible to go in: ",x," ",y);
                break;
            }
        }
        else{
            //add to queue (checking duplicates)
            options.forEach((elem) => {
                if( queue.length == 0 ||
                    queue.filter((q) => {
                        return elem.x == q.dest.x && elem.y == q.dest.y
                    }) == []
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

/**
 * 
 * @param {*} cost 
 * @param {*} x 
 * @param {number} y 
 * @param {*} previous_tile 
 * @param {*} action_from_previous 
 * @param {*} map 
 * @returns 
 */
function DFSsearch(cost, x, y, target_x, target_y, previous_tile, action_from_previous, map) {

    if( ! map.has(x) || ! map.get(x).has(y) )
        return false;
    
    const tile = map.get(x).get(y)
    if( tile.cost_to_here <= cost)
        return false;
    else {
        tile.cost_to_here = cost;
        tile.previous_tile = previous_tile;
        if( action_from_previous )
            tile.action_from_previous = action_from_previous;
    }
    
    if ( target_x == x && target_y == y ) {
        console.log('found with cost', cost)
        // function backward ( tile ) {
        //     console.log( tile.cost_to_here + ' move ' + tile.action_from_previous + ' ' + tile.x + ',' + tile.y );
        //     if ( tile.previous_tile ) backward( tile.previous_tile );
        // }
        // backward( tile )
        return true;
    }

    let options = new Array(
        [cost+1, x+1, y, target_x, target_y,tile, 'right',map],
        [cost+1, x-1, y, target_x, target_y,tile, 'left',map],
        [cost+1, x, y+1,target_x, target_y, tile, 'up',map],
        [cost+1, x, y-1,target_x, target_y, tile, 'down',map]
    );
    options = options.sort( (a, b) => {
        return distance({x: target_x, y: target_y}, {x: a[1], y: a[2]}) - distance({x: target_x, y: target_y}, {x: b[1], y: b[2]})
    } )

    DFSsearch( ...options[0] )
    DFSsearch( ...options[1] )
    DFSsearch( ...options[2] )
    DFSsearch( ...options[3] )
    
}

const _DFS = DFS;
export { _DFS as DFS };