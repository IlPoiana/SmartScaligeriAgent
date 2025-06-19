import { spawn } from 'child_process';

const ssa1 = { id: 'f18a69', name: 'ema',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYxOGE2OSIsIm5hbWUiOiJlbWEiLCJ0ZWFtSWQiOiI2ZTM5Y2UiLCJ0ZWFtTmFtZSI6IlNTQSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ4OTYyNzU1fQ.4Jly20BPBTs30oGwO9vgTR3fCmSoenQA6VF9yXz9jbs'
};

const ssa2 = { id: 'ce777a', name: 'stephany',
token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlNzc3YSIsIm5hbWUiOiJzdGVwaGFueSIsInRlYW1JZCI6IjAxY2IzNCIsInRlYW1OYW1lIjoiU1NBIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDg5NjI3NjR9.wmCvICoQq2a2MSdSdMP6VmQUIWg-_k-EF9ql6BzVK5o'
};

// Start the processes
spawnProcesses( ssa1, ssa2 ); // I am ssa1 and team mate is ssa2
spawnProcesses( ssa2, ssa1 ); // I am ssa2 and team mate is ssa1

// Function to spawn child processes
function spawnProcesses( me, teamMate ) {
    
    // ssa1 e083aa6f59e
    const childProcess = spawn(
        `node ../main_communication \
        host="http://localhost:8080/" \
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