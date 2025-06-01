import { Beliefset } from "../SSA/Beliefs/belief.js";

const beliefset = new Beliefset("http://localhost:8080", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0");

beliefset.onParcelSensing((predicate) => {
    console.log("Parcel Sensing:", predicate);
})

beliefset.onReady(() => {
    console.log("battimi: ",beliefset.me)
    console.log("Beliefset is ready with map:", beliefset.original_map);
    console.log("Accessible tiles:", beliefset.accessible_tiles);
})