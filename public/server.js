import Entity from "./entity.js";
import Game from "./game.js";

export default class Server extends Game {
  constructor(fps = 20) {
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
    this.io.emit("handshake", this.fps);
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

    const messages = Object.values(this.entities).map(entity => {
      const { id, x, y } = entity;
      const message = {
        entityId: id,
        x,
        y,
        lastProcessedInput: this.lastProcessedInputs[id]
      };
      return message;
    });
    this.io.emit("update", messages);
  }
}
