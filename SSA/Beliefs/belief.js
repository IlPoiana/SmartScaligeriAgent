import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { EventEmitter } from "events";
import { AgentData } from "./AgentData.js";
import { DeliverooMap } from "./mapBeliefs.js";
import { removeAgentTiles } from "../../agents/lib/algorithms.js";
import { getNumber, removeWalls } from "../../agents/lib/algorithms.js";

export class Beliefset {

    //beliefset ha un attrributo che si chiama parcels
    #parcels// Map of parcel id to parcel data
    #me
    #settings
    #original_map
    #accessible_tiles
    #delivery_map
    #client = null;
    #event = new EventEmitter();
    #agents // Map of agent id to agent data
    #idle = false;

    #map_promise = new Promise((res,rej) => {
        this.#event.once('map', () => res());
    })

    #settings_promise = new Promise((res,rej) => {
        this.#event.once('settings', () => res());
    })

    #me_promise = new Promise((res,rej) => {
        this.#event.once('me', () => res());
    })


    constructor(host, token) {
        this.#client = new DeliverooApi(host, token);
        this.#parcels = new Map();
        this.#me = new AgentData();
        this.#settings = new DeliverooMap();
        this.#original_map = [];
        this.#accessible_tiles = [];
        this.#delivery_map = [];
        this.#agents = new Map();
        this.onConfig();
        this.onYou();
        this.onMap();
        this.onAgentsSensing();
    }

    get idle() {
        return this.#idle;
    }

    set idle(value) {
        this.#idle = value; 
    }

    get client() {
        return this.#client;
    }

    set client(value) {
        this.#client = value;
    }


    get parcels() {
        return this.#parcels;
    }

    set parcels(value) {
        this.#parcels = value;
    }

    get me() {
        return this.#me;
    }

    set me(value) {
        this.#me = value;
    }

    get original_map() {
        return this.#original_map;
    }

    set original_map(value) {
        this.#original_map = value;
    }

    get accessible_tiles() {
        return this.#accessible_tiles;
    }

    set accessible_tiles(value) {
        this.#accessible_tiles = value;
    }

    get delivery_map() {
        return this.#delivery_map;
    }

    set delivery_map(value) {
        this.#delivery_map = value;
    }

    get settings() {
        return this.#settings;
    }

    set settings(value) {
        this.#settings = value;
    }

    async onReady(callback){
        Promise.all([this.#map_promise, this.#settings_promise, this.#me_promise])
            .then(() => {
                callback();
            })
            .catch((err) => {
                console.error("Error in Beliefset onReady:", err);
            });
    }

    removeAgentTiles() {
        this.#accessible_tiles = removeAgentTiles(this.#agents, this.#original_map);
    }

    getParcel( p_id ){
        return this.parcels.get(p_id);
    }



    onConfig() {
        this.client.onConfig((conf) => {
            this.#settings.decay = getNumber(conf.PARCEL_DECADING_INTERVAL) // could be null if infinite
            this.#settings.max_parcel = Number(conf.PARCELS_MAX)
            this.#settings.movement = conf.MOVEMENT_DURATION
        this.#event.emit('settings');
        })
    }

    onParcelSensing( pushCallback) {
        this.#client.onParcelsSensing( async ( perceived_parcels ) => {
            let found_new = false
            const now = Date.now(); //initialize all the percieved parcels at the same time
        
            for (const p of perceived_parcels) {
                if(!this.#parcels.has(p.id)){
                    found_new = true
                }   
                //map of parcels id and parcel data and timedata
                this.#parcels.set( p.id, {data:p,timedata:{startTime: now / 1e3,elapsed: p.reward}});
                let safe = true;
                if(found_new && safe){
                    let predicate = [ 'go_pick_up', p.x, p.y, p.id]
                    await pushCallback(predicate);
                    found_new = false;
              }
            }
        })
    }

    onYou() {
        this.#client.onYou( ( {id, name, x, y, score} ) => {
            this.#me.id = id
            this.#me.name = name
            this.#me.pos = { x, y }
            this.#me.score = score
            this.#event.emit('me');
        })
    }

    //refers to the tiles maps: accessible_tiles(modified runtime), original_map, delivery_map
    onMap(){
        this.#client.onMap((width, height, tiles) => {
            this.#accessible_tiles = removeWalls(tiles);
            this.#original_map = this.accessible_tiles.slice();
            this.#delivery_map = this.destinationTiles(tiles);
            this.#settings.x = width;
            this.#settings.y = height
            this.#event.emit('map');
        })
    }

    onAgentsSensing() {
        this.#client.onAgentsSensing( ( sensed_agents ) => {
            for ( const a of sensed_agents)
                if(a.id != this.#me.id) this.#agents.set(a.id, a);
            // console.log("updating tiles");
            this.removeAgentTiles();
        })
    }

    accesibleTiles(tiles){
        tiles.forEach(elem => {
            if(elem.type != 0)
                this.#accessible_tiles.push({
                    x: elem.x,
                    y: elem.y,
                    type: elem.type
                })
        });
    }

    destinationTiles(tiles){
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



}

