
function getMessage(client){
    return new Promise((resolve, reject) => {
        client.onMsg((id, name, msg, reply) => {
            resolve(msg);
        })
    })
}

async function sendMessage(data) {
    await client.say(CollaboratorData.id, {
        hello: "[INFORM]",
        data: data,
        time: Date.now()
    });
}