import { WebSocket } from "ws";
import { Game } from "./Game";
import {
	GAME_JOINED,
	INIT_GAME,
	JOIN_GAME,
	MOVE,
	OPPONENT_DISCONNECTED,
	OPPONENT_JOINED,
} from "./messages";
import prisma from "@repo/db/prisma";

export class GameManager {
	private game: Game[];
	// It should be a Class User with a property of WebSocket
	private pendingUser: WebSocket | null;
	// Array of online users
	private users: WebSocket[];
	constructor() {
		this.game = [];
		this.pendingUser = null;
		this.users = [];
	}

	addPlayer(socket: WebSocket) {
		this.users.push(socket);
		this.addHandler(socket);
	}

	removePlayer(socket: WebSocket) {
		this.users = this.users.filter((user) => user !== socket);
		// Stop the game cuz the user left

		const gameIndex = this.game.findIndex(
			(game) => game.player1 === socket || game.player1 === socket
		);
		if (gameIndex !== -1) {
			const game = this.game[gameIndex];

			if (game.player1 === socket) {
				// means 1 nai choda hai
				game.player1 = null;
				if (game.player2) {
					game.player2.send(
						JSON.stringify({
							type: OPPONENT_DISCONNECTED,
						})
					);
				} else {
					// nhi hai koi player2
					this.game.splice(gameIndex, 1);
				}
			} else if (game.player2 === socket) {
				// means 2 nai choda hai
				game.player2 = null;

				if (game.player1) {
					game.player1.send(
						JSON.stringify({
							type: OPPONENT_DISCONNECTED,
						})
					);
				} else {
					this.game.splice(gameIndex, 1);
				}
			}
		}
	}

	private addHandler(socket: WebSocket) {
		socket.on("message", async (data) => {
			const msg = JSON.parse(data.toString());
			if (msg.type === INIT_GAME) {
				if (this.pendingUser) {
					// start the game
					const game = new Game(this.pendingUser, socket);
					await game.createGameHandler();
					this.game.push(game);
					this.pendingUser = null;
				} else {
					this.pendingUser = socket;
				}
			}
			if (msg.type === MOVE) {
				// find the right game

				const game = this.game.find(
					(game) => game.player1 === socket || game.player2 === socket
				);

				if (game) {
					game.makeMove(socket, msg.move);
				}
				// add the method in the Game class to do so
			}
			if (msg.type === JOIN_GAME) {
				if (msg.payload?.gameId) {
					// means user wants to join a game with specific id
					// find that game , either in DB or in memory
					// connect both the users
					// render the board
					const {
						payload: { gameId },
					} = msg;

					const availableGame = this.game.find(
						(game) => game.gameId === gameId
					);

					if (availableGame) {
						console.log(availableGame);
						const { player1, player2, gameId, board } = availableGame;
						if (player1 && player2) {
							socket.send(JSON.stringify({ type: "GAME_FULL" }));
							return;
						}
						if (!player1) {
							availableGame.player1 = socket;
							console.log("Player 1 joined", availableGame);
							player2?.send(JSON.stringify({ type: OPPONENT_JOINED }));
						} else if (!player2) {
							availableGame.player2 = socket;
							player1?.send(JSON.stringify({ type: OPPONENT_JOINED }));
						}
						socket.send(
							JSON.stringify({
								type: GAME_JOINED,
								payload: {
									gameId,
									board,
								},
							})
						);
						return;
					} else {
						const gameFromDb = await prisma.game.findUnique({
							where: {
								id: gameId,
							},
							include: {
								moves: {
									orderBy: {
										moveNumber: "asc",
									},
								},
							},
						});
						const game = new Game(socket, null);

						gameFromDb?.moves.forEach((move: any) => {
							game.board.move(move);
						});

						this.game.push(game);
						socket.send(
							JSON.stringify({
								type: GAME_JOINED,
								payload: { gameId, board: game.board },
							})
						);
					}
				}
			}
		});
	}
}
