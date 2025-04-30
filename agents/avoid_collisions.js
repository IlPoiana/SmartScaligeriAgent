import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { log } from "console";
import EventEmitter from "events";
import { type } from "os";

// When sensing a parcel nearby, go there and pick it up, distance 1

// SIUMM token for azure server
const client = new DeliverooApi(
    'http://localhost:8080',
    // 'https://deliveroojs25.azurewebsites.net/',
    //SIUMM
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBmNjE0MiIsIm5hbWUiOiJTSVVNTU0iLCJyb2xlIjoidXNlciIsImlhdCI6MTc0NDExNjg5Nn0.GRbwcATIX9j92vkmedyiVsm1s3Mez93YZiQcWkPHLQU'
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0'
)

let tiles_map;
var agent = {}; 

function availableTile(x,y,tiles){
    // console.log("x ",x, "y ", y);
    // console.log("tiles ", tiles)
    let res = false;
    tiles.forEach((element,idx) => {
        if(element.x == x && element.y == y && element.type != 0){
            console.log("here!")
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
    client.onYou( me => {
        console.log('You:', me);
        agent = {
            x : me.x, 
            y : me.y,
            id: me.id,
            name : me.name,
            score : me.score
        };
        let moves = possibleDestinations(agent.x, agent.y, tiles_map);
        console.log(moves);
        if (moves.length != 0){
            let index = Math.round(Math.random() * moves.length) - 1;
            client.emitMove(moves[index]).then((res) => {console.log(res);});
        }
            
    }

)}
)


