import * as express from "express";
import * as http from "http";
import * as WebSocket from "ws";
import * as ReactDOMServer from "react-dom/server";
import * as React from "react";
import App from "./app";
import ReactLive from "./lib/live";
import { readFileSync } from "fs";

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws: WebSocket) => {
  ReactLive.render(<App />, ws);
});

app.use(express.static("."));

//start our server
server.listen(3000, () => {
  console.log(`Server started on port 3000 :)`);
});
