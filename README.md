# SmartScaligeriAgent
Repository for the 2025 AutonomusSoftwareAgents course project


A simple Node.js agent that connects to a Planning-as-a-Service (PaaS) backend running in Docker and solves PDDL planning problems.

## Table of Contents

- [SmartScaligeriAgent](#smartscaligeriagent)
  - [Table of Contents](#table-of-contents)
  - [Setup](#setup)
    - [1. Prerequisites](#1-prerequisites)
    - [2. Installation](#2-installation)
    - [3. Running the Planning Service (Docker - PDDL agent only)](#3-running-the-planning-service-docker---pddl-agent-only)
      - [Run the Container](#run-the-container)
    - [4. Run the agents](#4-run-the-agents)
      - [API setup](#api-setup)
      - [single agent](#single-agent)
      - [PDDL extension](#pddl-extension)
      - [multi-agent](#multi-agent)

## Setup

### 1. Prerequisites
- **Docker** & **Docker Compose**  
- **Node.js** v14 or newer  
- **npm** (or **yarn**)  
- `planning-as-a-service` [repository](https://github.com/AI-Planning/planning-as-a-service) to run locally the pddl solver instance 
- `Deliveroo.js` [repository](https://github.com/unitn-ASA/Deliveroo.js.git) installed to run the server locally.

### 2. Installation

```bash
git clone https://github.com/IlPoiana/SmartScaligeriAgent.git
npm install @unitn-asa/deliveroo-js-client@latest
```


### 3. Running the Planning Service (Docker - PDDL agent only)

PDDL agent expects a backend (local or online) which exposes the API for solving PDDL problems. You can either pull a ready-made Docker image or build the service yourself.

1. Follow the given `README` file available in their repository to set up the service locally

2. Copy the `.env` file present in the `classes/PDDL/` directory to the `server/` directory in `planning-as-a-server`. This is to set up the solver time limit.

#### Run the Container
To run the container be sure to be in the `server/` directory:

Compile:

```bash
sudo make
```

Run:

```bash
docker compose up -d --scale worker=2
```

To stop and remove:

```bash
docker compose down
```

### 4. Run the agents
#### API setup

> [!Warning]
> Remeber to change the token the before running any agents, the token can be setted in every `main` file.


#### single agent

```bash
cd agents/
node main_local.js #local version
# or
node main_server.js #server version
```
#### PDDL extension

```bash
cd agents/
node --env-file=.env hybrid_pddl_main.js
```

#### multi-agent

```bash
cd agents/multi-agent/
node main_multi_agent.js
```