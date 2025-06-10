import { Beliefset } from "../SSA/Beliefs/belief.js";
import Comunication from "../SSA/Coordination/comunication.js";
import { IntentionRevisionRevise } from "../SSA/Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../SSA/Planner/plans.js";

(async () => {
  const HOST = "http://localhost:8080";

  // Supponiamo di avere due token distinti (o nomi) per i due agent:
  // Qui li chiamiamo “agentA” e “agentB” per semplicità.
  // Se invece usi veri JWT, sostituisci con la stringa di token corrispondente.
  const TOKEN_A = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY4YmIyYSIsIm5hbWUiOiJhbm9ueW1vdXMiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0NzgzNzkyNn0.hbir2KorooVTodjVibOoHLFdZvwvyQbZUAiFgdzUvEw"; // token di A
  const TOKEN_B = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0"; // token di B



  const belief_set = new Beliefset(HOST, TOKEN_A)
  const plan_library = new PlanLibrary();
  plan_library.belief_set = belief_set;

  const my_agent = new IntentionRevisionRevise(plan_library);

  belief_set.onReady(() => {
    // console.log("battimi: ",belief_set.me)
    // console.log("Beliefset is ready with map:", belief_set.original_map);
    // console.log("Accessible tiles:", belief_set.accessible_tiles);
    console.log("my_agent: ",my_agent.belief_set.me);
    my_agent.loop();
  })

  belief_set.onParcelSensing(async (val) => await my_agent.push(val));

  // ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
  // 1) Creo le due istanze di “Comunication”

  // AgentA
  const commA = new Comunication("agentA", HOST, TOKEN_A);
  // AgentB
  const commB = new Comunication("agentB", HOST, TOKEN_B);

  // 2) Apro le connessioni verso il server
  commA.connect();
  commB.connect();


  
  // 3) Attendo che ognuno riceva l’evento “you” (dato con cui il server comunica id e name)
  //    Le promise .client.me esistono perché DeliverooApi espone già:
  //        client.me = new Promise(res => this.once("you", res))
  const [meA, meB] = await Promise.all([
    commA.client.me,
    commB.client.me
  ]);

  const idA = meA.id;
  const idB = meB.id;
  console.log(`➤ AgentA ha id=${idA}, name="${meA.name}"`);
  console.log(`➤ AgentB ha id=${idB}, name="${meB.name}"`);

  commA.onShout();

  // 4) Configuro i listener per “ask” e “say”

  // 4.1) Quando AgentB riceve una “ask”, risponde col proprio nome e id
  commB.onAsk(async (fromId, question) => {
    // Costruisco la risposta
    const risposta = `Ciao ${fromId}, io sono ${meB.name} (${idB})`;
    // Invio la risposta (say) al mittente
    await commB.reply(fromId, risposta);
  });

  // 4.2) Quando AgentA riceve una “say” (risposta), la stampa in console
  commA.onReply((fromId, answer) => {
    console.log(`[AgentA] Ho ricevuto risposta da ${fromId}: "${answer}"`);
  });

  // 5) Dopo 2 secondi AgentA invia una “ask” verso AgentB
  setTimeout(async () => {
    const domanda = "Chi sei tu?";
    console.log(`[AgentA] Invio ask a ${idB}: "${domanda}"`);
    await commA.ask(idB, domanda);
  }, 2000);

})();
