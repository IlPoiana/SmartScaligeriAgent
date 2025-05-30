import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { EventEmitter } from "events";
import { AgentData } from "./AgentData.js";

const event = new EventEmitter();

const map_promise = new Promise((res,rej) => {
    event.once('map', () => res());
})

const settings_promise = new Promise((res,rej) => {
    event.once('settings', () => res());
})

const me_promise = new Promise((res,rej) => {
    event.once('me', () => res());
})

client.onConfig((conf) => {
    settings.decay = getNumber(conf.PARCEL_DECADING_INTERVAL) // could be null if infinite
    settings.max_parcel = Number(conf.PARCELS_MAX)
    settings.movement = conf.MOVEMENT_DURATION
    event.emit('settings');
})

client.onYou( ( {id, name, x, y, score} ) => {
    me.id = id
    me.name = name
    me.x = x
    me.y = y
    me.score = score
    event.emit('me');
} )

client.onMap((width, height, tiles) => {
    accessible_tiles = removeWalls(tiles);
    delivery_map = destinationTiles(tiles);
    settings.x = width;
    settings.y = height
    event.emit('map');
})