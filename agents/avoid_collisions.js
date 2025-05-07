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

const eventEmitter = new EventEmitter()

const me = {}
const me_ready = new Promise((resolve, reject) => {
    eventEmitter.once('me', ()=> {resolve()});
})
const map_ready = new Promise((resolve, reject) => {
    eventEmitter.once('map', ()=> {resolve()});
})

Promise.all([me_ready,map_ready]).then(() => console.log(me));

setTimeout(() => {console.log("waiting")}, 1000);

client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
    eventEmitter.emit("me");
} )
 
client.onMap((tiles) => {
    eventEmitter.emit("map");
});