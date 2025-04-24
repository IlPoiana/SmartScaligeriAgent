import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import EventEmitter from "events";
import { type } from "os";

// When sensing a parcel nearby, go there and pick it up, distance 1

// SIUMM token for azure server
const client = new DeliverooApi(
    'http://localhost:8080',
    // 'https://deliveroojs25.azurewebsites.net/',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBmNjE0MiIsIm5hbWUiOiJTSVVNTU0iLCJyb2xlIjoidXNlciIsImlhdCI6MTc0NDExNjg5Nn0.GRbwcATIX9j92vkmedyiVsm1s3Mez93YZiQcWkPHLQU'
)

let range = 1;

//First, retrieve information about yourself and the environment
client.onMap( (x,y,tiles) => {
    console.log('Map:', x,y,tiles);
} )

var agent; 

client.onYou( me => {
    console.log('You:', me);
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
    parcels.forEach((parcel, index) => {
        console.log("parcel ", index,": ", parcel);
        let x = parcel.x;
        let y = parcel.y;
        
            //move towards the parcel
            console.log("moving towards: ",parcel.id, " x: ", parcel.x," y: ", parcel.y);
            //move to the parcel
            // if is negative i'll move to the right otherwise left
            const moves = ["up", "down", "left", "right"];
            client.emitMove(moves[Math.random]).then((result) => {
                if (result) {
                    console.log("moved to: ", parcel.id, " x: ", parcel.x," y: ", parcel.y);
                } else {
                    console.log("can't move to: ", parcel.id, " x: ", parcel.x," y: ", parcel.y);
                }
            }
        
    });
})
