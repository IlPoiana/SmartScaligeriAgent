import { AgentData } from "./AgentData.js";
import { EventEmitter } from "events";

export class MultiAgentBeliefSet {

    #team_data
    #divide_map

    constructor(){
        this.#team_data = new AgentData()
        this.#divide_map = true
    }

    get team_data(){    return this.#team_data  }
    set team_data(value){this.#team_data = value}

    get divide_map(){   return this.#divide_map     }
    set divide_map(value){ this.#divide_map = value }

    updateMultiAgentBelif(/**@type {{data:AgentData, status:String}}*/message){
        if(message.status != 'NONE'){
            this.team_data = message.data
        }
    }
}