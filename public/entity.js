export default class Entity {
  constructor(id, x = 0, y = 0) {
    this.id = id; // This should be assigned by the server.
    this.x = x;
    this.y = y;
    this.speed = 200;
    this.positionBuffer = [];
  }

  // move is `x` or `y`
  applyInput({ move, pressTime }) {
    this[move] += this.speed * pressTime;
  }
}
