import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

class Comunication {

    #agent_team
    #agent_id
    #client
    
    constructor(agent_team, agent_id, host, token) {
        this.#agent_team = agent_team;
        this.#agent_id = agent_id;
        this.#client = new DeliverooApi(host, token);
    }

    set agent_team(value) {
        this.#agent_team = value;
    }   

    get agent_team() {
        return this.#agent_team;
    }
    set agent_id(value) {
        this.#agent_id = value;
    }
    get agent_id() {
        return this.#agent_id;
    }
    get client() {
        return this.#client;
    }
    set client(value) {
        this.#client = value;
    }

    async askMessage() {
        let replay = await this.#client.emitAsk('who are you?')
        console.log('askMessage: ', replay);
    }

    async sendMessage(message) {
        let replay = await this.#client.emitSay("I am: ", this.#agent_team, this.#agent_id, message);
        console.log('sendMessage: ', replay);
    }
        

}