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
        let replay = await this.#client.emitSay();
        console.log('sendMessage: ', replay);
    }
        
        // Ask another agent a question
    async ask(target_id, message) {
        // target_id: the id of the agent you want to ask
        // message: the question to ask
        await this.#client.emitAsk(message, target_id);
        console.log(`Asked agent ${target_id}: "${message}"`);
    }

    // Set a handler for incoming asks
    onAsk(handler) {
        // handler: function(message, from_id)
        this.#client.onAsk((msg, from) => {
            console.log(`Received ask from ${from}: "${msg}"`);
            handler(msg, from);
        });
    }

    // Reply to another agent
    async reply(target_id, message) {
        await this.#client.emitSay(message, target_id);
        console.log(`Replied to agent ${target_id}: "${message}"`);
    }

    // Set a handler for incoming replies (says)
    onReply(handler) {
        // handler: function(message, from_id)
        this.#client.onSay((msg, from) => {
            console.log(`Received reply from ${from}: "${msg}"`);
            handler(msg, from);
        });
    }

}