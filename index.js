import express from "express";
import http from "http";
import { Server as Socket } from "socket.io";
import Server from "./public/server.js";

async function main() {
  const app = express();
  app.use(express.static("public"));

  const server = http.createServer(app);
  const io = new Socket(server);

  const srv = new Server(20);
  srv.start();
  io.on("connection", socket => {
    srv.register(socket, io);
    console.log("connected", socket.id);

    socket.on("playerMoved", input => {
      srv.addInput(input);
    });

    socket.on("disconnect", () => {
      console.log("disconnected", socket.id);
      srv.deregister(socket);

      // Tell other clients to drop this entity.
      io.emit("deregister", socket.id);
    });
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () =>
    console.log(`listening to port *:${port}. press ctrl + c to cancel`)
  );
}

main().catch(console.error);
