function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}

/**
 * 
 * @param {*} tiles tiles map
 * @returns the `tiles` map without the walls
 */
function removeWalls(tiles){
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

const _DFS = DFS;
const _BFS = BFS;
const _removeWalls = removeWalls    //per rimuovere i muri
export { _DFS as DFS };
export { _BFS as BFS };
export { _removeWalls as removeWalls}