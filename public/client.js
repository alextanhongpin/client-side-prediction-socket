import Game from "./game.js";
import Entity from "./entity.js";

export default class Client extends Game {
  constructor(fps = 60, canvas) {
    super(fps);

    // Server.
    this.socket = null;

    // Entity.
    this.entityId = null; // Set by server.
    this.entities = {};

    // Controls.
    this.keys = {};

    this.inputSequenceNumber = 0;

    // Inputs from the clients that has not yet been acknowledged.
    // Processed during update cycle.
    this.pendingInputs = [];

    // Messages from the server that has not yet been processed.
    // Processed during update cycle.
    this.pendingChanges = [];

    // UI.
    this.canvas = null;

    // Feature flags.
    this.entityInterpolation = true;
    this.serverReconciliation = true;
    this.clientSidePrediction = true;

    this.bindHandlers();
  }

  setupCanvas(elementId) {
    const canvas = document.getElementById(elementId);
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.canvas = canvas;
    this.ctx = ctx;
  }

  deregister(entityId) {
    delete this.entities[entityId];
  }
  register(socket) {
    this.socket = socket;
    this.entityId = socket.id;
    // Receive the state of all the entities.
    this.socket.on("update", messages => {
      this.pendingChanges.push(...messages);
    });
    this.socket.on("deregister", clientId => this.deregister(clientId));
    this.socket.on("handshake", serverFps => {
      this.serverFps = serverFps ?? 20;
    });
  }

  bindHandlers() {
    const handleKeyboard = e => {
      this.keys[e.which] = e.type === "keydown";
    };

    document.body.addEventListener("keydown", handleKeyboard);
    document.body.addEventListener("keyup", handleKeyboard);
  }

  update() {
    this.processServerMessages();
    if (this.entityId === null) return;
    this.processInputs();

    if (this.entityInterpolation) {
      this.interpolateEntities();
    }
    this.draw();
  }

  processServerMessages() {
    while (this.pendingChanges.length) {
      const change = this.pendingChanges.shift();
      const { entityId, x, y, lastProcessedInput } = change;

      if (!this.entities[entityId]) {
        this.entities[entityId] = new Entity(entityId, x, y);
      }
      const entity = this.entities[entityId];

      if (this.entityId === entityId) {
        entity.x = x;
        entity.y = y;
        if (this.serverReconciliation) {
          this.pendingInputs = this.pendingInputs.filter(
            input => input.inputSequenceNumber > lastProcessedInput
          );
          this.pendingInputs.forEach(input => entity.applyInput(input));
        } else {
          this.pendingInputs = [];
        }
      } else {
        if (this.entityInterpolation) {
          entity.positionBuffer.push({ ts: Date.now(), x, y });
        } else {
          entity.x = x;
          entity.y = y;
        }
      }
    }
  }

  processInputs() {
    const currMs = Date.now();
    const lastMs = this.lastMs || currMs;
    const deltatime = (currMs - lastMs) / 1000;
    this.lastMs = currMs;

    const input = { dir: 1 };
    if (this.keys[37]) {
      input.move = "x";
      input.dir = -1;
    } else if (this.keys[38]) {
      input.move = "y";
      input.dir = -1;
    } else if (this.keys[39]) {
      input.move = "x";
    } else if (this.keys[40]) {
      input.move = "y";
    } else {
      return;
    }
    input.pressTime = input.dir * deltatime;

    input.entityId = this.entityId;
    input.inputSequenceNumber = this.inputSequenceNumber++;

    this.socket.emit("playerMoved", input);

    if (this.clientSidePrediction) {
      this.entities[this.entityId].applyInput(input);
    }

    this.pendingInputs.push(input);
  }

  interpolateEntities() {
    const renderTimestamp = Date.now() - 1000.0 / this.serverFps; // Server FPS.
    for (let id in this.entities) {
      if (id === this.entityId) continue;

      const entity = this.entities[id];
      const buffer = entity.positionBuffer;
      while (buffer.length >= 2 && buffer[1].ts <= renderTimestamp) {
        buffer.shift();
      }

      if (
        buffer.length >= 2 &&
        buffer[0].ts <= renderTimestamp &&
        renderTimestamp <= buffer[1].ts
      ) {
        const { ts: t0, x: x0, y: y0 } = buffer[0];
        const { ts: t1, x: x1, y: y1 } = buffer[1];
        entity.x = x0 + ((x1 - x0) * (renderTimestamp - t0)) / (t1 - t0);
        entity.y = y0 + ((y1 - y0) * (renderTimestamp - t0)) / (t1 - t0);
      }
    }
  }

  getColor(entityId) {
    const ids = Object.keys(this.entities).sort();
    const idx = ids.indexOf(entityId);
    return ["red", "green", "blue"][idx % 3];
  }

  draw() {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let entityId in this.entities) {
      const entity = this.entities[entityId];
      ctx.beginPath();
      ctx.fillStyle = this.getColor(entityId);
      ctx.rect(entity.x, entity.y, 16, 16);
      ctx.fill();
    }
  }
}
