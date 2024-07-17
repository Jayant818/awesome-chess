import express from "express";
import { WebSocketServer } from "ws";
import { GameManager } from "./GameManager";

const app = express();

app.get("/", (req, res) => {
	res.send("Hi There");
});

let httpServer = app.listen("8080", () => {
	console.log("Listening on Port 8080");
});

const wss = new WebSocketServer({ server: httpServer });

const gameManager = new GameManager();

wss.on("connection", (ws) => {
	gameManager.addPlayer(ws);
	ws.on("close", () => {
		gameManager.removePlayer(ws);
	});
});
