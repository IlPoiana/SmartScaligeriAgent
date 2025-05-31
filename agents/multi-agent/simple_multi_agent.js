// import child_process in ES module
import { spawn } from 'child_process';

const marco = { id: 'e083aa6f59e', name: 'marco',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk4ZjExZCIsIm5hbWUiOiJyb21waWJhbGxlIiwidGVhbUlkIjoiNjQ0OTRmIiwidGVhbU5hbWUiOiJnYXkiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0ODM1Mzg3NX0.K15dNEa3F7Sdop8Gf1i615gxawDlXrLZoCzcO9JbGes'
};

const paolo = { id: '1d74b61b883', name: 'paolo',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmOTFkMiIsIm5hbWUiOiJzY2Fzc2FtYXJvbmkiLCJ0ZWFtSWQiOiIzZjNlYjkiLCJ0ZWFtTmFtZSI6ImdheSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ4MzU0MDc0fQ.hTkox77yGPaoOFwhzL9gR3N0ia3vtw7ZWLrAmbsvUP4'
};

// Start the processes
spawnProcesses( marco, paolo ); // I am marco and team mate is paolo
spawnProcesses( paolo, marco ); // I am paolo and team mate is marco

// Function to spawn child processes
function spawnProcesses( me, teamMate ) {
    
    // marco e083aa6f59e
    const childProcess = spawn(
        `node ../avoiding_agents \
        host="http://localhost:8080" \
        token="${me.token}" \
        teamId="${teamMate.id}" `,
        { shell: true }
    );

    childProcess.stdout.on('data', data => {
        console.log(me.name, '>', data.toString());
    });

    childProcess.stderr.on('data', data => {
        console.error(me.name, '>', data.toString());
    });

    childProcess.on('close', code => {
        console.log(`${me.name}: exited with code ${code}`);
    });

};