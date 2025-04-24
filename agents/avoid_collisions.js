import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { log } from "console";
import EventEmitter from "events";
import { type } from "os";

// When sensing a parcel nearby, go there and pick it up, distance 1

// SIUMM token for azure server
const client = new DeliverooApi(
    // 'http://localhost:8080',
    'https://deliveroojs25.azurewebsites.net/',
    //SIUMM
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBmNjE0MiIsIm5hbWUiOiJTSVVNTU0iLCJyb2xlIjoidXNlciIsImlhdCI6MTc0NDExNjg5Nn0.GRbwcATIX9j92vkmedyiVsm1s3Mez93YZiQcWkPHLQU'
)

let tiles_map;
var agent = {}; 

function availableTile(x,y,tiles){
    // console.log("x ",x, "y ", y);
    let res = false;
    tiles.forEach((element,idx) => {
        if(idx == 1)
            console.log(element.x, element.y, element.type, typeof(element.type));
        if(element.x == x && element.y == y && element.type != 0){
            res = true;
        }
    })
    
    return res 
}

function possibleDestinations(x,y, tiles){
    var dest= [];

    if (availableTile(x, y + 1, tiles))
        dest.push("up");

    if (availableTile(x, y - 1, tiles))
        dest.push("down");

    if (availableTile(x - 1, y, tiles))
        dest.push("left");
    if (availableTile(x + 1, y, tiles))
        dest.push("right");

    return dest;
}

client.onMap( (x,y,tiles) => {
    // console.log('Map:', x,y,tiles)
    tiles_map = tiles;
    console.log(tiles_map);
    // tiles_map.forEach((elem) => {
    //     if(elem.x == agent.x && elem.y == agent.y + 1 && elem.type == (1 | 2))
    //         agent.up = true;
    //     if(elem.x == agent.x && elem.y == agent.y - 1 && elem.type == (1 | 2))
    //         agent.down = true;
    //     if(elem.x == agent.x + 1 && elem.y == agent.y && elem.type == (1 | 2))
    //         agent.right = true;
    //     if(elem.x == agent.x - 1 && elem.y == agent.y && elem.type == (1 | 2))
    //         agent.left = true;
    // } );
    client.onYou( me => {
        console.log('You:', me);
        agent = {
            x : me.x, 
            y : me.y,
            id: me.id,
            name : me.name,
            score : me.score
        };
        let moves = possibleDestinations(agent.x, agent.y, tiles_map)
        if (moves.length != 0){
            let index = Math.round(Math.random() * moves.length) - 1;
            client.emitMove(moves[index]).then((res) => {console.log(res);});
        }
            
    }

)}
)


