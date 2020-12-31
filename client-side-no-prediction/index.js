const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const { innerWidth: WIDTH, innerHeight: HEIGHT } = window;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const FPS = 60;
const deltatime = 1000 / FPS;
const keys = {};
const square = {
  x: 0,
  y: 0,
  speed: 0.1
};

function update() {
  const speed = square.speed * deltatime;
  if (keys[37]) {
    square.x -= speed;
  } else if (keys[39]) {
    square.x += speed;
  } else if (keys[38]) {
    square.y -= speed;
  } else if (keys[40]) {
    square.y += speed;
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.beginPath();

  ctx.rect(square.x, square.y, 16, 16);
  ctx.fill();
}

function step() {
  setTimeout(() => {
    requestAnimationFrame(step);
  }, deltatime);
  update();
  draw();
}
step();

function handleKeyboard(e) {
  keys[e.which] = e.type === "keydown";
}

document.body.addEventListener("keydown", handleKeyboard);
document.body.addEventListener("keyup", handleKeyboard);
