import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { log } from "console";
import EventEmitter from "events";
import { type } from "os";

// When sensing a parcel nearby, go there and pick it up, distance 1

// SIUMM token for azure server
const client = new DeliverooApi(
    'http://localhost:8080',
    // 'https://deliveroojs25.azurewebsites.net/',
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBmNjE0MiIsIm5hbWUiOiJTSVVNTU0iLCJyb2xlIjoidXNlciIsImlhdCI6MTc0NDExNjg5Nn0.GRbwcATIX9j92vkmedyiVsm1s3Mez93YZiQcWkPHLQU'
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0'
)

function availableTile(x,y,tiles){
    // console.log("x ",x, "y ", y);
    let res = false;
    tiles.forEach((element,idx) => {
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

var tiles_map = [];

//First, retrieve information about yourself and the environment
client.onMap( (x,y,tiles) => {
    console.log('Map:', x,y,tiles);
    tiles_map = tiles;

    var agent; 

    client.onYou( me => {
        // console.log('You:', me);
        agent = {
            x : me.x, 
            y : me.y,
            id: me.id,
            name : me.name,
            score : me.score
        }
    })

    //Then if a parcel is detected in a <=1 range, go there
    client.onParcelsSensing( (parcels) => {
        if(agent){
            // console.log(destinations);
            parcels.forEach((parcel) => {
                // console.log(parcels);
                let destinations = possibleDestinations(agent.x, agent.y, tiles_map);
                // console.log("parcel ", index,": ", parcel);
                let x = parcel.x;
                let y = parcel.y;
                let ax = agent.x;
                let ay = agent.y;
                if(Math.abs(agent.x - x) < 2 && Math.abs(agent.y - y) < 2 && parcel.carriedBy != agent.id){
                    //move towards the parcel
                    console.log("moving towards: ",parcel.id, " x: ", parcel.x," y: ", parcel.y);
                    if(ax - x == 1 && destinations.includes("left"))
                        client.emitMove("left")
                    else if (ax - x == -1 && destinations.includes("right"))
                        client.emitMove("right")
                    else if (ay - y == 1 && destinations.includes("down"))
                        client.emitMove("down")
                    else if (ay - y == -1 && destinations.includes("up"))
                        client.emitMove("up")
                    else if (ax == x && ay == y){
                        console.log("picking up");
                        client.emitPickup()
                    }
                }
                else{
                    //move random
                    let idx = Math.round(destinations.length * Math.random());
                    console.log("index: ",idx);
                    client.emitMove(destinations[idx]).then((res) => console.log(res, " moving randomly")
                    );
                }
            });
        }
        else{
            console.log("waiting for the agent variable population");
        }
    })
} )


