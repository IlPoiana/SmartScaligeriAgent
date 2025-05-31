// import child_process in ES module
import { spawn } from 'child_process';

const marco = { id: 'e083aa6f59e', name: 'SSA1',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBkYjEyYSIsIm5hbWUiOiJTU0ExIiwidGVhbUlkIjoiOTk1NDIwIiwidGVhbU5hbWUiOiJTU0EiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0ODQxODE1Mn0.JyFj-LWuMfouaiK3xrkvmOV14ucnqGE4xPXc1HIl60E'
};

const paolo = { id: '1d74b61b883', name: 'SSA2',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE0ZmQzNSIsIm5hbWUiOiJTU0EyIiwidGVhbUlkIjoiOWFiM2JkIiwidGVhbU5hbWUiOiJTU0EiLCJyb2xlIjoidXNlciIsImlhdCI6MTc0ODQxODE2NH0.fpRzt3-Ed_76DkJgLGGUraZoHfXjLdd43Aok9nvXv2o'
};

// Start the processes
spawnProcesses( marco, paolo ); // I am marco and team mate is paolo
spawnProcesses( paolo, marco ); // I am paolo and team mate is marco

// Function to spawn child processes
function spawnProcesses( me, teamMate ) {
    
    // marco e083aa6f59e
    const childProcess = spawn(
        `node ../avoiding_agents \
        host="https://deliveroojs.rtibdi.disi.unitn.it/" \
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