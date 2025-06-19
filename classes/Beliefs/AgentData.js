

class AgentData {
    name = '';
    id = '';
    teamId = '';
    teamName = '';
    x;
    y;
    role = '';
    score = 0;

    constructor() {
        this.name = "";
        this.id = "";
        this.teamId = "";
        this.teamName = "";
        this.x = 0;
        this.y = 0;
        this.role = "NONE";
        this.score = 0;
    }

    // Getter and setter for `name`
    getName() {
        return this.name;
    }
    setName(newName) {
        this.name = newName;
    }

    // Getter and setter for `id`
    getId() {
        return this.id;
    }
    setId(newId) {
        this.id = newId;
    }

    // Getter and setter for `teamId`
    getTeamId() {
        return this.teamId;
    }
    setTeamId(newTeamId) {
        this.teamId = newTeamId;
    }

    // Getter and setter for `teamName`
    getTeamName() {
        return this.teamName;
    }
    setTeamName(newTeamName) {
        this.teamName = newTeamName;
    }

    // Getter and setter for `x`
    getX() {
        return this.x;
    }
    setX(newX) {
        this.x = newX;
    }

    // Getter and setter for `y`
    getY() {
        return this.y;
    }
    setY(newY) {
        this.y = newY;
    }

    // Getter and setter for `role`
    getRole() {
        return this.role;
    }
    setRole(newRole) {
        this.role = newRole;
    }

    // Getter and setter for `score`
    getScore() {
        return this.score;
    }
    setScore(newScore) {
        this.score = newScore;
    }
}


export { AgentData };