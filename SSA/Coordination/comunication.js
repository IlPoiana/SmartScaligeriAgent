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

  /**  
   * Invia una “domanda” (ask) a un altro agent.  
   * @param {string} targetId   L’ID (o name) dell’altro agent.  
   * @param {string} question   Il testo della domanda.  
   */
  async ask(targetId, question) {
    await this.#client.emitAsk(targetId, { action: "ask", question });
    console.log(`[${this.#agent_id}] Ho inviato ask a ${targetId}: "${question}"`);
  }

  /**  
   * Invia una “risposta” (say) a un altro agent.  
   * @param {string} targetId   L’ID (o name) dell’altro agent.  
   * @param {string} answer     Il testo della risposta.  
   */
  async reply(targetId, answer) {
    await this.#client.emitSay(targetId, { action: "say", answer });
    console.log(`[${this.#agent_id}] Ho inviato say a ${targetId}: "${answer}"`);
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
