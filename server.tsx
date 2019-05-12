import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import * as React from "react";
import ReactLive from "./lib/live";

import Counter from "./examples/counter";
import DragBox from "./examples/drag-box";

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws: WebSocket) => {
  ReactLive.render(<DragBox />, ws);
});

app.use(express.static("."));

//start our server
server.listen(3000, () => {
  console.log(`Server started on port 3000 :)`);
});
