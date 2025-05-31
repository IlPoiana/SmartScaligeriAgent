

class AgentData {

    name = '';
    id = '';
    teamId = '';
    teamName = '';
    pos = { x: 0, y: 0 };
    role = '';
    score = 0;

    constructor() {
        this.name = "";
        this.id = "";
        this.teamId = "";
        this.teamName = "";
        this.pos = { x: 0, y: 0 };
        this.role = "NONE";
        this.score = 0;
    }

    

}

export { AgentData };