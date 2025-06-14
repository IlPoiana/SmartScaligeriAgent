import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { Beliefset } from "../Beliefs/belief.js";
import { default as argsParser } from "args-parser";
import { AgentData } from "../Beliefs/AgentData.js";
import { MultiAgentBeliefSet } from "../Beliefs/MultiAgentBelief.js";
import { Intention, IntentionRevision } from "../Intention&Revision/intention.js";
import { distance, nearestDeliveryTile } from "../../agents/lib/algorithms.js";

/**
 * Gestisce la logica di “ask/say” tra due agenti.
 * 
 * 1. fare il heand shaking, io chiedo qualcosa e l'altro deve rispondere giusto per passarmi l'id
 * 1.1 aggiornamento dei beliefset rispettivi ogni volta che si muovono, cosi so gia la posizione dell'altro, e per sapere in che parte
 * della mappa si trova e se puo fare la bfs
 * 2. se non rieco a fare il pickup chiedere se l'altro agente può farlo
 * 3. se non riesco a fare il put down chiedere se l'altro agente può farlo
 */
export class Comunication{

  #companion_id;
  #belief_set;
  #companion_pos;
  #team_id;
  #belief_multi_agent

  /**
   * @param {Beliefset} belief_set - The belief set of the agent.
   * @param {MultiAgentBeliefSet} multi_agent_belief
   */
  constructor(belief_set, team_id, multi_agent_belief) {

    this.#belief_set = belief_set;
    this.#companion_id = null;
    this.#team_id = team_id;
    this.#belief_multi_agent = multi_agent_belief;
  }

  set team_id(value){
    this.#team_id = value;
  }

  get team_id() {
    return this.#team_id;
  }

  set belief_set(value) {
    this.#belief_set = value;
  }

  get belief_set() {
    return this.#belief_set;
  }

  set companion_id(value) {
    this.#companion_id = value;
  }

  get companion_id() {
    return this.#companion_id;
  }

  set companion_pos(value) {
    this.#companion_pos = value;
  }

  get companion_pos() {
    return this.#companion_pos;
  }

  get multi_agent_belief(){
    return this.#belief_multi_agent
  }

  set multi_agent_belief(value){
    this.#belief_multi_agent = value
  }

  
  onShout(){
    console.log("I am", this.belief_set.me.id, "and I am ready to shout");
    this.belief_set.client.emitShout('Hello')
  }

  async onAsk(msg){
    console.log("in ask");
    const client = this.belief_set.client
    const team_id = this.#team_id
    let reply = await client.emitAsk(team_id, msg)
    console.log(reply)
    return reply

  }

  getMessage(client) {
    return new Promise((resolve, reject) => {
        client.onMsg((id, name, msg, reply) => {
            resolve(msg);
        });
    });
  }

  async onSay(msg){
    console.log("in say")
    const client = this.belief_set.client
    const team_id = this.#team_id
    await client.emitSay(team_id, msg)
  }

  async onReply(){
    const client = this.belief_set.client
    const team_id = this.#team_id
    const team_data = new AgentData()
    let ask_msg
    //console.log("team_id: ", team_id);
    
  }

  /**
   * Master will ask for handshaking sending a message of format {data:AgentData, status:String}
   * the Slave will recive the message, if the status is handshaking will save it in its multi_agent_belief,
   * will reply with its information to the Master with status ack_slave
   * the MultiAgentBelief will update the beliefset for the teammate
   */
  async handShaking() {
    //I will stay in hearing to hear the information emited by the other agent,
    // then I will reply with my id and position
    /**
     * 1. master ask for data to the slave with message handshake
     * 2. slave reply with the data
     * 3. slave ask for the data to the master
     * 4. master reply with data
     */
    
    const client = this.belief_set.client;
    const me = this.belief_set.me;
    const team_id = this.#team_id

    //If I'm the master I'll ask for the information first
    // the slave will reply with its information 
    if(me.role === 'MASTER') {
      console.log("I am the MASTER, I'll start the conversation");
      let msg = {
        data: me,
        status: 'handshake'
      }
      const reply = client.emitAsk( team_id, msg).then((res)=>{
        this.#belief_multi_agent.updateMultiAgentBelif(res?.status == 'ack_slave' ? res : 'NONE')
        console.log("reply from asking: ", res)
        console.log("team data: ", this.#belief_multi_agent.team_data)
      })
      //console.log("reply: ", reply)
      //this.#belief_multi_agent.updateMultiAgentBelif(reply?.status == 'ack_slave' ? reply : 'NONE') 

    //if I'm the Slave I'll wait for the asking, I'll save the data from the asker and I'll reply with my information
    } else if(me.role === 'SLAVE') {
      let ask_msg
      console.log("I'm the Slave")
      //await new Promise( resolve => setTimeout(resolve, Math.random()*50) );
      client.onMsg( (id, name, /** @type {{data:AgentData, status:String}}*/msg, reply) =>{
      console.log( "new message received from ", name+':', msg);
        if(msg?.status == 'handshake'){

          //new Promise( resolve => setTimeout(resolve, 100))
          if (reply) {
            let answer = {
              data:this.belief_set.me,
              status:'ack_slave'
            };
            //console.log("my reply: ", answer);
            try { reply(answer) } catch { (error) => console.error(error) }
          }
          this.#belief_multi_agent.updateMultiAgentBelif(msg)
          console.log("team data: ", this.#belief_multi_agent.team_data)
        } 
      })
    }
  }

  askPickUp(){
    const client = this.#belief_set.client
    const me = this.#belief_set.me

    //this will recive message from the other agent 
    client.onMsg( async (id, name, /**@type {{action:string,parcelId:string}}*/msg, reply) =>{
      if(msg?.action == 'delivery')

          if(reply){
            try{
              if(nearestDeliveryTile(me.x, me.y, this.belief_set.delivery_map, this.belief_set.original_map))
                console.log('I can do the delivery')
                //create intention to pickUp the parcel and move to delivery
                reply(true)
            }catch{(error) => console.error(error) }
          }
    })
    
  }

  /**
   * method to be called if sensed a parcel but the BFS return a false because
   * can't deliver, then I'll ask to the companion to do the action
   */
  askToDeliver(){
    const client = this.#belief_set.client
    const team_id = this.#companion_id
    const me = this.#belief_set.me

    let reply = client.emitAsk(team_id, {action: 'delivery'})
    console.log("I'm in askToDeliver")
    if(reply){
      //the reply from the other agent must contain a field type answer:String
      if(reply.answer == 'yes')
        //check if I have room to move from one position to another to leave there the parcels
        if(this.belief_set.accessible_tiles.filter((tiles)=>{
          if( distance(tiles, me)==1 )
            return true
          return false
        }))
        //1.put down
        //2.move to that tile
        console.log("I can move daddy")

    }

  }

  testAskDeliver(){
    const client = this.#belief_set.client
    const team_id = this.#companion_id
    const me = this.#belief_set.me

    console.log("I'm in the testAskDeliver")
    let reply = client.emitSay(team_id, 'cannot deliver')
    console.log(reply)


  }

}
