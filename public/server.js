import Entity from "./entity.js";
import Game from "./game.js";

export default class Server extends Game {
  constructor(fps = 10) {
    super(fps);

    this.clients = {};
    // Maps the client id to the entity state.
    this.entities = {};

    // Maps the client id to last processed inputSequenceNumber
    this.lastProcessedInputs = {};

    // Input buffer.
    this.inputs = [];
  }

  register(socket, io) {
    this.io = io;
    this.clients[socket.id] = socket;
    this.entities[socket.id] = new Entity(socket.id);

    // Send once.
    this.sendWorldState();
  }

  deregister(socket) {
    delete this.clients[socket.id];
    delete this.entities[socket.id];
  }

  update() {
    if (!this.inputs.length) return;
    this.processInputs();
    this.sendWorldState();
  }

  addInput(input) {
    this.inputs.push(input);
  }

  processInputs() {
    let input;
    while ((input = this.inputs.shift())) {
      const entity = this.entities[input.entityId];
      entity.applyInput(input);
      this.lastProcessedInputs[input.entityId] = entity.inputSequenceNumber;
    }
  }

  sendWorldState() {
    const now = Date.now();

    for (let entityId in this.entities) {
      const entity = this.entities[entityId];
      const message = {
        entityId,
        lastProcessedInput: this.lastProcessedInputs[entityId],
        x: entity.x,
        y: entity.y,
        timestamp: now
      };
      this.io.emit("update", message);
    }
  }
}
