
import { Beliefset } from "../Beliefs/belief.js";
import { AgentData } from "../Beliefs/AgentData.js";
import { MultiAgentBeliefSet } from "../Beliefs/MultiAgentBelief.js";
import { distance, nearestDeliveryTile } from "../../agents/lib/algorithms.js";
import { EventEmitter } from 'events'


export class Communication{

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
    const client = this.belief_set.client
    const team_id = this.#team_id
    let reply = await client.emitAsk(team_id, msg)
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
   * 
   * @returns the response to the SLAVE onMsg 
   */
  async updateTeam(){
    const client = this.belief_set.client;
    const me = this.belief_set.me;
    const team_id = this.#team_id

    if(me.role === 'MASTER') {
      // console.log("I am the MASTER, I'll start the conversation");
      let msg = {
        data: me,
        status: 'handshake'
      }
      // console.log("updating")
      const slave_res = await client.emitAsk( team_id, msg);
      this.#belief_multi_agent.updateMultiAgentBelif(slave_res?.status == 'ack_slave' ? slave_res : 'NONE')
      return;

    }
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
    console.log("handshaking");
    
    const client = this.belief_set.client;
    const me = this.belief_set.me;
    const team_id = this.#team_id

    //If I'm the master I'll ask for the information first
    // the slave will reply with its information 
    if(me.role === 'MASTER') {

      let msg = {
        data: me,
        status: 'handshake'
      }
      const reply = client.emitAsk( team_id, msg).then((res)=>{
        this.#belief_multi_agent.updateMultiAgentBelif(res?.status == 'ack_slave' ? res : 'NONE')
        
      })

    //if I'm the Slave I'll wait for the asking, I'll save the data from the asker and I'll reply with my information
    } else if(me.role === 'SLAVE') {

      client.onMsg( (id, name, /** @type {{data:AgentData, status:String}}*/msg, reply) =>{
        if(msg?.status == 'handshake'){

          
            let answer = {
              data:this.belief_set.me,
              status:'ack_slave'
            };
            this.#belief_multi_agent.updateMultiAgentBelif(msg)
            try { reply(answer) } catch { (error) => console.error(error) }
          
        } 
      })
    }
    //tell to the master that we have set the onMsg listener

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

  testAskDeliver(){
    const client = this.#belief_set.client
    const team_id = this.#companion_id
    const me = this.#belief_set.me

    console.log("I'm in the testAskDeliver")
    let reply = client.emitSay(team_id, 'cannot deliver')
    console.log(reply)


  }

}
