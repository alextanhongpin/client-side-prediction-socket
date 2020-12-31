export default class Game {
  constructor(fps = 60) {
    this.fps = fps;
    this.deltatime = 1000 / fps;
    this.interval = -1;
  }

  update() {
    throw new Error("not implemented");
  }

  start() {
    if (this.interval > 0) return;
    this.interval = setInterval(() => {
      this.update();
    }, this.deltatime);
  }

  stop() {
    if (this.interval < 0) return;
    clearInterval(this.interval);
    this.interval = -1;
  }
}
