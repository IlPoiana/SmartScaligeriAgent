import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { EventEmitter } from "events";
import { AgentData } from "./AgentData.js";
import { DeliverooMap } from "./mapBeliefs.js";
import { removeAgentTiles } from "../../agents/lib/algorithms.js";
import { getNumber, removeWalls } from "../../agents/lib/algorithms.js";
import { log } from "console";

export class Beliefset {

    //beliefset ha un attrributo che si chiama parcels
    #me
    #settings
    #original_map
    #accessible_tiles
    #delivery_map
    #spawning_map
    #agents // Map of agent id to agent data
    #parcels// Map of parcel id to parcel data

    #client = null;
    #event = new EventEmitter();
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
        this.#spawning_map = [];
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

    get spawning_map() {
        return this.#spawning_map;
    }

    set spawning_map(value) {
        this.#spawning_map = value;
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

    removeAgentTiles(agents) {
        this.#accessible_tiles = removeAgentTiles(agents, this.#original_map);
    }

    /**
     * Removes the tiles that have been seen an agent on, even if I'm not seeing it anymore
     */
    removePermanentlyAgentTiles(){
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

    onParcelSensingOld( pushCallback) {
        this.#client.onParcelsSensing( async ( perceived_parcels ) => {
            let found_new = false
            const now = Date.now(); //initialize all the percieved parcels at the same time
        
            for (const p of perceived_parcels) {
                if(!this.#parcels.has(p.id)){
                    found_new = true
                }   
                //map of parcels id and parcel data and timedata
                this.#parcels.set( p.id, {data:p,timedata:{startTime: now / 1e3,elapsed: p.reward}});
                if(found_new){
                    let predicate = [ 'go_pick_up', p.x, p.y, p.id]
                    await pushCallback(predicate);
                    found_new = false;
              }
            }
        })
    }

    onParcelSensing( pushCallback, checkCallback) {
        this.#client.onParcelsSensing( async ( perceived_parcels ) => {
            let found_new = false
            const now = Date.now(); //initialize all the percieved parcels at the same time
            for (const p of perceived_parcels) {
                    
                if(!this.#parcels.has(p.id) && !p.carriedBy){
                    found_new = true
                }
                //map of parcels id and parcel data and timedata
                this.#parcels.set( p.id, {data:p,timedata:{startTime: now / 1e3,elapsed: p.reward}});
                   
                if(found_new){
                    let predicate = [ 'go_pick_up', p.x, p.y, p.id]
                    await pushCallback(predicate);
                    found_new = false;
                }

                if(!p.carriedBy && p.x == this.#me.x && p.y == this.#me.y){
                    const format_p = {data:p,timedata:{startTime: now / 1e3,elapsed: p.reward}};
                    let response = await checkCallback(format_p);
                    // console.log("response: ",response);
                }
            }
        })
    }

    onYou() {
        this.#client.onYou( ( {id, name, x, y, score} ) => {
            this.#me.id = id
            this.#me.name = name
            this.#me.x = x
            this.#me.y = y
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
            this.#spawning_map = this.#original_map.filter((tile) => {return tile.type == 1});
            this.#settings.x = width;
            this.#settings.y = height
            this.#event.emit('map');
        })
    }

    onAgentsSensing() {
        this.#client.onAgentsSensing( ( sensed_agents ) => {
            if(sensed_agents.length != 0){
                for ( const a of sensed_agents)
                    if(a.id != this.#me.id) this.#agents.set(a.id, a);
                this.removeAgentTiles(sensed_agents);
            }
            else{
                this.#accessible_tiles = this.#original_map;
            }
        })
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

    onDeliveryTile(){
        const x = this.me.x;
        const y = this.me.y;
        return this.delivery_map.filter((tile) => {
            return tile.x == x && tile.y == y
        }).length > 0;
    }

    /**
     * 
     * @returns the number of steps that the agent is able to do after each decay tick or -1 if is infinite
     */
    get steps_per_decay(){
        if(this.#settings.decay){
            return this.#settings.decay / (this.settings.movement / 1e3);    
        }
        else return null;
    }




}

