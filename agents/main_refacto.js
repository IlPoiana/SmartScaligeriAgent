import { Beliefset } from "../SSA/Beliefs/belief.js";
import { Comunication } from "../SSA/Coordination/comunication.js";

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