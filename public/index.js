import Client from "./client.js";

const client = new Client();
client.setupCanvas("canvas");

const socket = io(window.location.origin);
socket.on("connect", () => {
  console.log("connected", socket.id);
  client.register(socket);
  client.start();
});
