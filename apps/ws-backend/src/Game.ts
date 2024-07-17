import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";
import prisma from "@repo/db/prisma";
// import Button from "@repo/ui/button";
// import db from "@repo/db";

export class Game {
	public player1: WebSocket | null;
	public player2: WebSocket | null;
	public gameId: string | null = null;
	public startTime: Date;
	public board: Chess;
	// tells ki bari kisi ki hai
	private gameCount: number;
	private failedDbMoves: {
		moveNumber: number;
		from: string;
		to: string;
		playedAt: Date;
	}[] = [];

	constructor(player1: WebSocket, player2: WebSocket | null) {
		this.player1 = player1;
		this.player2 = player2;
		this.startTime = new Date();
		this.board = new Chess();
		// this.player1.send(
		// 	JSON.stringify({
		// 		type: INIT_GAME,
		// 		payload: {
		// 			color: "white",
		// 		},
		// 	})
		// );
		// this.player2.send(
		// 	JSON.stringify({
		// 		type: INIT_GAME,
		// 		payload: {
		// 			color: "black",
		// 		},
		// 	})
		// );
		this.gameCount = 0;
	}

	async createGameHandler() {
		console.log("Game Handler called");
		await this.createGameInDb();
		// console.log("Player 1", this.player1);
		this.player1?.send(
			JSON.stringify({
				type: INIT_GAME,
				payload: {
					color: "white",
					gameId: this.gameId,
				},
			})
		);
		this.player2?.send(
			JSON.stringify({
				type: INIT_GAME,
				payload: {
					color: "black",
					gameId: this.gameId,
				},
			})
		);
	}

	async createGameInDb() {
		try {
			const game = await prisma.game.create({
				// TODO: Add user detials when auth is complete
				data: {
					playerWhite: {
						create: {},
					},
					playerBlack: {
						create: {},
					},
				},
				include: {
					playerWhite: true,
					playerBlack: true,
				},
			});
			this.gameId = game.id;
			console.log("Game created in db");
		} catch (e) {
			console.error("Error creating game in database:", e);
		}
	}

	async addMoveToDb(move: { from: string; to: string }) {
		if (this.gameId) {
			try {
				await prisma.move.create({
					data: {
						gameId: this.gameId,
						moveNumber: this.gameCount + 1,
						from: move.from,
						to: move.to,
						playedAt: new Date(Date.now()),
					},
				});
				console.log("Move Added");
			} catch (e) {
				this.failedDbMoves.push({
					moveNumber: this.gameCount + 1,
					from: move.from,
					to: move.to,
					playedAt: new Date(Date.now()),
				});
			}
		}
	}

	async makeMove(
		socket: WebSocket,
		move: {
			from: string;
			to: string;
		}
	) {
		console.log("Move is maked");
		// 1) validate that user can make the move or that

		if (this.gameCount % 2 === 0 && this.player1 !== socket) {
			console.log("early return ho gaya");
			return;
		}
		if (this.gameCount % 2 === 1 && this.player2 !== socket) {
			console.log("early return ho gaya");
			return;
		}
		// 2) make the move
		console.log("ye rahi move ki value", move);

		try {
			this.board.move(move);
		} catch (e) {
			console.log("Bhai yaha atke");
			console.log(e);
			// our logic
			// however the lib take care of any error if it came
			return;
		}

		await this.addMoveToDb(move);
		// 3) Check if the game is over and who won?
		if (this.board.isGameOver()) {
			// send kardo
			if (this.player1) {
				this.player1.send(
					JSON.stringify({
						type: GAME_OVER,
						payload: {
							winner: this.board.turn() == "w" ? "black" : "white",
						},
					})
				);
			}
			if (this.player2) {
				this.player2.send(
					JSON.stringify({
						type: GAME_OVER,
						payload: {
							winner: this.board.turn() == "w" ? "black" : "white",
						},
					})
				);
			}

			if (this.failedDbMoves.length > 0 && this.gameId) {
				try {
					await prisma.move.createMany({
						data: this.failedDbMoves.map((move) => ({
							gameId: this.gameId!,
							...move,
						})),
					});
				} catch (e) {
					console.error("Error saving failed moves to db:", e);
				}
			}

			return;
		}

		// 2) update the board - automatically done by the lIB

		// 3) send the event to others
		if (this.gameCount % 2 === 0) {
			// hame player 2 ko event send karna hai
			if (this.player2) {
				this.player2.send(
					JSON.stringify({
						type: MOVE,
						payload: move,
					})
				);
			}
		} else {
			if (this.player1) {
				this.player1.send(
					JSON.stringify({
						type: MOVE,
						payload: move,
					})
				);
			}
		}
		this.gameCount++;
	}
}
