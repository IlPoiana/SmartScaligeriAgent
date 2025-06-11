import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

/**
 * Gestisce la logica di “ask/say” tra due agenti.
 */
export default class Comunication {
  #agent_id;
  #client;

  /**
   * @param {string} agent_id  L’ID (o “name”) con cui questo agent si registra.
   * @param {string} host      URL del server (es. "http://localhost:8080").
   * @param {string} token     JWT o stringa di autenticazione (se prevista).
   */
  constructor(agent_id, host, token) {
    this.#agent_id = agent_id;
    this.#client = new DeliverooApi(host, token);
  }

  /**  
   * Apre la connessione Socket.IO verso il server.  
   */
  connect() {
    this.#client.connect();
  }

  /**  
   * Ritorna il DeliverooApi interno (per registrare altri listener, ecc.).  
   */
  get client() {
    return this.#client;
  }

  onShout(){
    console.log("I am", this.#client.id, "and I am ready to shout");
    this.#client.emitShout('hello mother fuckers')

  }

  /**  
   * Registra un handler che viene chiamato quando arriva un “ask” da un altro agent.  
   * @param {(fromId: string, question: string) => void} handler 
   */
  onAsk(handler) {
    this.#client.onMsg((fromId, fromName, msg, _replyAck) => {
      if (msg?.action === "ask") {
        console.log(
          `[${this.#agent_id}] Ricevuto ask da ${fromName} (${fromId}): "${msg.question}"`
        );
        handler(fromId, msg.question);
      }
    });
  }

  /**  
   * Registra un handler che viene chiamato quando arriva un “say” (risposta).  
   * @param {(fromId: string, answer: string) => void} handler 
   */
  onReply(handler) {
    this.#client.onMsg((fromId, fromName, msg, _replyAck) => {
      if (msg?.action === "say") {
        console.log(
          `[${this.#agent_id}] Ricevuto say da ${fromName} (${fromId}): "${msg.answer}"`
        );
        handler(fromId, msg.answer);
      }
    });
  }

  

  
}
