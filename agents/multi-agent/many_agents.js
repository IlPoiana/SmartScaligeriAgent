import { spawn } from 'child_process';

const massive_1 = {name: 'massive_1',token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ5OTExOSIsIm5hbWUiOiJtYXNzaXZlMSIsInRlYW1JZCI6ImVlZTBhOCIsInRlYW1OYW1lIjoid2lueCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5MDI5MDY4fQ.QQZoBjb8YFlHT2_yAOk15jLnuTUZJi_OJjbBpSMP2C4'}
const massive_2 = {name: 'massive_2',token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU0NmI4MyIsIm5hbWUiOiJtYXNzaXZlMiIsInRlYW1JZCI6IjhhMTVmOCIsInRlYW1OYW1lIjoid2lueCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5MDI5MDczfQ.7smmkwRKzLuTTdV_u8JSGLAVAkaMgOsTWfI-2WuLyKQ'}
const massive_3 = {name: 'massive_3',token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNlOTdiOCIsIm5hbWUiOiJtYXNzaXZlMyIsInRlYW1JZCI6ImM4OTJiOSIsInRlYW1OYW1lIjoid2lueCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5MDI5MDc3fQ.4QiNrBVmzYpWwwSjUr4IXySYwmwH5V4QGdBFbQ3sNHo'}
const massive_4 = {name: 'massive_4',token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkxYWUyYSIsIm5hbWUiOiJtYXNzaXZlNCIsInRlYW1JZCI6ImZkOTdmMSIsInRlYW1OYW1lIjoid2lueCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ5MDI5MDgwfQ.ip5nCpSnLBM1oDTsEtsQOT-md814JzT09jNXxD55vVc'}
// Function to spawn child processes
function spawnProcesses( me, teamMate ) {
    
    // ssa1 e083aa6f59e
    const childProcess = spawn(
        `node ../main_local \
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

spawnProcesses(massive_1, massive_2);
spawnProcesses(massive_2, massive_1);
spawnProcesses(massive_3, massive_1);
spawnProcesses(massive_4, massive_1);