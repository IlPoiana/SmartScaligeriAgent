import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    // 'http://localhost:8080/?name=ddos', ''
    // 'https://deliveroojs.onrender.com/?name=ddos', ''
    // 'http://rtibdi.disi.unitn.it:8080/?name=ddos', ''

    'http://rtibdi.disi.unitn.it:8080',
    // god a7de10b05d1 @ http://rtibdi.disi.unitn.it:8080
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE3ZGUxMGIwNWQxIiwibmFtZSI6ImdvZCIsImlhdCI6MTcxNTA3ODg2MX0.fB4OowVYwujN3miDWrPgvD35iY7QQW3cy6I8xLkK-ps'
)

/**
 * @type {Map<string,[{id,name,x,y,score}]}
 */
const agents = new Map();
/**
 * @type {Map<string,{teamName,score,pti:number}}
 */
const teams = new Map();

client.onAgentsSensing( ( sensed ) => {

    for ( let a of sensed ) {
        agents.set( a.id, a );
    }

    // update leaderboard
    teams.clear();
    for ( let a of agents.values() ) {
        let teamName = a.name.split( '_' )[ 0 ];

        if ( ! teams.has( teamName ) ) {
            teams.set( teamName, { teamName, score: a.score } );
        } else {
            teams.get( teamName ).score += a.score;
        }
    }

    const sortedTeams = Array.from( teams.values() )
    .sort( (a,b) => b.score - a.score ) // sort by score, higher to lower 
    .map( (team,index,teams) => {
        team.pti = teams.length - index;               // pti from n down to 1
        return team;
    } );

    console.log( 'Leaderboard:\n' + sortedTeams.map( (t,index) => `${index+1}°\t${t.pti} pti\t${t.teamName} (${t.score})` ).join( '\n' ) );
    
} )


