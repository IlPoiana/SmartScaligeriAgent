import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { BFS,DFS } from "./lib/algorithms.js"

const client = new DeliverooApi(
    'http://localhost:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRiNTVlYyIsIm5hbWUiOiJBZ2VudCIsInRlYW1JZCI6IjkwZjRmNCIsInRlYW1OYW1lIjoiZGlzaSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ0MTIxOTAzfQ.8O31Xu-BwQidn2da1NfhJ_haK1GmscbzB5N_iZTXfW0'
);

const me = {};
const parcels = new Map();
let tiles = [];
let accessible_tiles = [];

client.onYou(({id, name, x, y, score}) => {
    me.id = id;
    me.name = name;
    me.x = x;
    me.y = y;
    me.score = score;
});

// Riceve informazioni sui parcels percepiti e aggiorna il belief set
client.onParcelsSensing((perceived_parcels) => {
    const perceivedIds = new Set(perceived_parcels.map(p => p.id));

    // Aggiunge o aggiorna parcels percepiti
    for (const p of perceived_parcels) {
        parcels.set(p.id, p);
    }

    // Rimuove parcels non più percepiti
    for (const id of parcels.keys()) {
        if (!perceivedIds.has(id)) {
            parcels.delete(id);
        }
    }
});

// Funzione per rimuovere i muri
function removeWalls(tiles){
    return tiles.filter(elem => elem.type !== 0);
}


// Riceve informazioni sulla mappa
client.onMap((width, height, receivedTiles) => {
    tiles = receivedTiles;
    accessible_tiles = removeWalls(receivedTiles);
});

function printBeliefSet() {
    console.log("===== Belief Set =====");
    console.log(`📍 Agente: ${me.name || "unknown"} (ID: ${me.id || "unknown"})`);
    console.log(`   Posizione: (${me.x || "?"}, ${me.y || "?"})`);
    console.log(`   Punteggio: ${me.score || 0}`);

    console.log(" \n parcel percepiti:");
    parcels.forEach((parcel, id) => {
        const carried = parcel.carriedBy ? `Portato da ${parcel.carriedBy}` : "Disponibile";
        console.log(`- ID: ${id} | Pos: (${parcel.x}, ${parcel.y}) | Reward: ${parcel.reward} | ${carried}`);
    });

    console.log("\n📬 Zone di consegna:");
    tiles.filter(tile => tile.type === 2).forEach(tile => {
        console.log(` - Posizione: (${tile.x}, ${tile.y})`);
    });

    /*console.log("\n🧱 Muri:");
    tiles.filter(tile => tile.type === 0).forEach(tile => {
        console.log(` - Posizione: (${tile.x}, ${tile.y})`);
    });*/

    console.log("======================\n");
}

// Calcola la distanza Manhattan
function distance({x:x1, y:y1}, {x:x2, y:y2}) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// Funzione per selezionare il miglior parcel da prendere
function selectBestParcel() {
    const list = [];
    let bestParcel = null;
    let bestScore = -Infinity;

    parcels.forEach((parcel) => {
        if (!parcel.carriedBy) {
            const dist = distance(me, parcel);
            const score = parcel.reward - dist; // Può usare qualsiasi logica (qui reward - distanza)
            list.push({id: parcel.id, x: parcel.x, y: parcel.y, reward: parcel.reward, dist, score});
        }
    });

    list.sort((a,b)=>b.score - a.score)

    console.log("\n Parcels ordinati per utilità (reward - distanza):");
    if (list.length === 0) {
        console.log("⚠️ Nessun parcel disponibile.");
    } else {
        list.forEach(p => {
            console.log(`- ID: ${p.id} | Pos: (${p.x}, ${p.y}) | Reward: ${p.reward} | Dist: ${p.dist} | Utilità: ${p.score}`);
        });
    }
}

// Richiama la funzione di stampa ogni 3 secondi
setInterval(() => {
    printBeliefSet();
    selectBestParcel();
}, 3000);