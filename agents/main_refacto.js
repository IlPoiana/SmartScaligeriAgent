import { Beliefset } from "../SSA/Beliefs/belief.js";
import { IntentionRevisionRevise } from "../SSA/Intention&Revision/IntentionRevisionRevise.js";
import { PlanLibrary } from "../SSA/Planner/plans.js";
import { Comunication } from "../SSA/Coordination/comunication.js";

const belief_set = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ0MGQ1NiIsIm5hbWUiOiJyZWZhY3RvciIsInRlYW1JZCI6ImFkMmI2MSIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDg3NzQ0NTB9.pnl_SztMf3OIvLYDmKTQUl6a53vbtKbm44Ezb4f4Tko");
const plan_library = new PlanLibrary();
plan_library.belief_set = belief_set;
// console.log("CHECK1: ", plan_library.belief_set.me);
const my_agent = new IntentionRevisionRevise(plan_library);

belief_set.onReady(() => {
    // console.log("battimi: ",belief_set.me)
    // console.log("Beliefset is ready with map:", belief_set.original_map);
    // console.log("Accessible tiles:", belief_set.accessible_tiles);
    console.log("my_agent: ",my_agent.belief_set.me);
    my_agent.loop();
})

belief_set.onParcelSensing(async (val) => await my_agent.push(val));



const beliefset = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0");

beliefset.onParcelSensing((predicate) => {
    console.log("Parcel Sensing:", predicate);
})

beliefset.onReady(() => {
    console.log("Beliefset is ready with settings:", beliefset.settings.x, beliefset.settings.y, beliefset.settings.movement, beliefset.settings.decay, beliefset.settings.max_parcel);
    console.log("battimi: ",beliefset.me)
    console.log("Beliefset is ready with map:", beliefset.original_map);
    console.log("Accessible tiles:", beliefset.accessible_tiles);
})

const comunication1 = new Comunication("team1", "agent1", "http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0");
comunication1.askMessage()
    .then(() => {
        console.log("Message sent successfully.");
    })
    .catch((error) => {
        console.error("Error sending message:", error);
    });

const comunication2 = new Comunication("team2", "agent2", "http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0");
comunication2.sendMessage("Hello from agent2")
    .then(() => {
        console.log("Message sent successfully.");
    })
    .catch((error) => {
        console.error("Error sending message:", error);
    });