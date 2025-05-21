import { BFS, DFS, removeWalls } from "./algorithms.js"

var tile_list = { 1:"up"};

console.log(Object.keys(tile_list));

const tiles_map = [];
for(let i = 0; i< 10; i++){
    for(let q = 0; q < 10; q++){
        tiles_map.push({x:i,y:q,type:1});
    }
}

const m24c7 = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[2, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0],
	[2, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0],
	[0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 3, 0],
	[0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 3, 0],
	[0, 0, 0, 0, 0, 0, 3, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0],
	[0, 3, 3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 0, 0, 0, 0, 0, 0, 3, 0],
	[0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 3, 3, 3, 3, 0],
	[0, 3, 3, 3, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 3, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 3, 0, 0, 3, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0],
	[0, 0, 0, 3, 3, 3, 3, 0, 0, 3, 3, 3, 0, 0, 3, 3, 3, 3, 0, 0],
	[0, 0, 0, 3, 3, 0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 3, 3, 0, 0],
	[0, 0, 0, 3, 3, 0, 0, 3, 3, 3, 3, 3, 3, 3, 0, 0, 3, 3, 0, 0],
	[1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
	[1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
	[0, 0, 3, 3, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
	[0, 0, 3, 3, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0],
	[0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0]
]

const map_2 = []
for(let i = 0; i< 20; i ++){
    for(let q = 0; q < 20; q++){
        map_2.push({x:q,y:i,type:m24c7[i][q]})
    }
}

const tiles_map2 = removeWalls(map_2);
// console.log(map_2);


// console.log(tiles_map);
// console.log("tiles map 2: ",tiles_map2);

let start = [0,0];
let target = [1,0];
let res = DFS(start,target,tiles_map);
console.log(start, "-->", target);
console.log(res, "\n---\n");
start = [0,0];
target = [1,1];
res = DFS(start,target,tiles_map);
console.log(start, "-->", target);
console.log(res, "\n---\n");
start = [0,0];
target = [2,2];
res = DFS(start,target,tiles_map);
console.log(start, "-->", target);
console.log(res, "\n---\n");

start = [1,8];
target = [3,8];
res = DFS(start,target,tiles_map2);
console.log(start, "-->", target);
console.log(res, "\n---\n");

start = [0,1];
target = [10,12];
// console.log(tiles_map2.filter((elem) => {
//     return elem.x == start[0] && elem.y == start[1]
// }))
// console.log(tiles_map2.filter((elem) => {
//     return elem.x == target[0] && elem.y == target[1]
// }))
res = DFS(start,target,tiles_map2);
console.log(start, "-->", target);
console.log(res, "\n---\n");

start = [18,1];
target = [1,16];
res = DFS(start,target,tiles_map2);
console.log(start, "-->", target);
console.log(res, "\n---\n");
console.log("\n--BFS--\n");
start = [18,1];
target = [1,16];
res = BFS(start,target,tiles_map2);
console.log(start, "-->", target);
console.log(res, "\n---\n");