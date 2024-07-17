import { useEffect, useState } from "react";
import Button from "../components/Button";
import ChessBoard from "../components/ChessBoard";
import useSocket from "../hooks/useSocket";
import { Chess } from "chess.js";
// import { Button } from "@repo/ui/button";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const JOIN_GAME = "join_game";
export const OPPONENT_DISCONNECTED = "opponent_disconnected";
export const GAME_JOINED = "game_joined";
export const OPPONENT_JOINED = "opponent_joined";

const Game = () => {
	const socket = useSocket();
	const [text, setText] = useState(false);
	const [count, setCount] = useState(0);
	const [chess, setChess] = useState(new Chess());
	const [chessboard, setChessBoard] = useState(chess.board());
	const [showDialog, setShowDialog] = useState<boolean>(false);
	const [gameId, setGameId] = useState<string>("");
	const [waitingForOtherPlayer, setWaitingForOtherPlayer] =
		useState<boolean>(false);
	const [moves, setMoves] = useState([]);
	const [opponent_disconnected, setOpponentDisconnected] = useState(false);

	useEffect(() => {
		if (socket) {
			socket.onmessage = (event) => {
				const msg = JSON.parse(event.data);

				if (msg.type === INIT_GAME) {
					setWaitingForOtherPlayer(false);
					setGameId(msg.payload.gameId);
					// console.log(msg);
					setText(msg.payload.color);
					// INIT THE GAME
					// setChess(new Chess());
					// setBoard(chess.board());
				} else if (msg.type === MOVE) {
					console.log("Payload is receiving", msg);
					console.log("Chess", chess);
					setCount(count + 1);

					chess.move(msg.payload);
					setChessBoard(chess.board());
					setMoves((prevMoves) => [...prevMoves, msg.payload]);
					console.log("Updated Moves:", [...moves, msg.payload]); // This might still show stale moves due to async nature
				} else if (msg.type === GAME_OVER) {
					// GAME is over
				} else if (msg.type === GAME_JOINED) {
					// get all the data
					setChessBoard(chess.board());
					console.log("Initial board", chessboard);
					console.log("Initial chess", chess);
					const { gameId, board } = msg.payload;
					console.log("after ", board);
					setGameId(gameId);
					// setChess(new Chess(board));
					// setBoard(chess.board());
					const chessBoard = chess;
					chessBoard._board = board._board;
					chessBoard._castling = board._castling;
					chessBoard._comments = board._comments;
					chessBoard._epSquare = board._epSquare;
					chessBoard._halfMoves = board._halfMoves;
					chessBoard._header = board._header;
					chessBoard._history = board._history;
					chessBoard._kings = board._kings;
					chessBoard._moveNumber = board._moveNumber;
					chessBoard._positionCount = board._positionCount;
					chessBoard._turn = board._turn;

					//@ts-ignore
					const fen = chessBoard.fen();
					try {
						// setChess(chess.load(fen));
						// setChessBoard()
						chess.load(fen);
						chess.moveNumber();
						// console.log("Number", chess.moveNumber());
					} catch (e) {
						console.log(e);
					}
					// setChess(new Chess(chessBoard.fen()));
					// setTimeout(() => {
					setChessBoard(chessBoard.board());
					console.log(chessBoard);
					// }, 2000);

					// const boardVal = chessBoard.board();
					// setBoard(chessBoard.board());

					// setBoard(boardVal);
					// setTimeout(() => {
					// 	console.log("value of chess", chess);
					// 	setBoard(chess.board());
					// }, 2000);
					// chess.move(board);
					// setBoard(board._board);
					// console.log("Board", board);
				} else if (msg.type === OPPONENT_DISCONNECTED) {
					setOpponentDisconnected(true);
				} else if (msg.type === OPPONENT_JOINED) {
					setOpponentDisconnected(false);
					console.log(chess);
					console.log(chessboard);
					setChessBoard(chess.board());
					socket.send(
						JSON.stringify({
							type: "update_board",
							payload: {
								msg: chess.fen(),
							},
						})
					);
				} else if (msg.type === "update_board") {
					setChess(new Chess(msg.payload.msg));
					setTimeout(() => {
						setChessBoard(chess.board());
					}, 2000);
				}
			};
		}
	}, [socket]);

	if (!socket) {
		return <div>Connecting....</div>;
	}

	const handleSocket = () => {
		setWaitingForOtherPlayer(true);
		socket.send(JSON.stringify({ type: INIT_GAME }));
	};

	const handleClick = () => {
		setShowDialog(true);
	};

	const sendJoinRequest = () => {
		if (gameId) {
			// send the request to the server
			socket.send(
				JSON.stringify({
					type: JOIN_GAME,
					payload: { gameId },
				})
			);
		}
		setShowDialog(false);
	};

	return (
		<div className="pt-10 relative">
			{gameId && (
				<h1 className="text-white text-2xl w-full text-center">
					Your Game ID : {gameId}
					<br />
					Your color is : {text}
				</h1>
			)}

			<div className="flex gap-10 justify-center pt-6">
				<div className="flex justify-center md:col-span-2">
					<ChessBoard
						board={chessboard}
						socket={socket}
						chess={chess}
						setBoard={setChessBoard}
						setMoves={setMoves}
						moves={moves}
					/>
				</div>
				{gameId ? (
					<div className="bg-[#262522] w-[20rem] h-[32rem] p-4 rounded-lg flex flex-col gap-4 overflow-y-auto">
						<h1 className="text-2xl font-bold">MOVES</h1>
						{moves?.map((move, ind) => (
							<div className="ind flex gap-2 items-center" key={ind}>
								<p className="text-white">{ind + 1}.</p>
								<p className="p-2 bg-black rounded-lg">{move.from}</p>
								<p className="p-2 bg-black rounded-lg">{move.to}</p>
							</div>
						))}
					</div>
				) : (
					<div className="flex flex-col gap-2 justify-start">
						<Button
							className="bg-[#81b64c] hover:bg-[#a1e062]"
							onClick={handleSocket}
						>
							Play Now
						</Button>
						<Button
							className="bg-[#4c7227] hover:bg-[#37531b]"
							onClick={handleClick}
						>
							Join a Game
						</Button>
					</div>
				)}
			</div>
			{showDialog && (
				<div className="absolute top-[45%] left-[33%] px-10 py-10 rounded-md bg-[#ebecd0] flex flex-col items-center gap-6 shadow-md">
					<div className="flex gap-4 items-center">
						<p className="text-[#779556] font-bold">JOIN GAME:</p>
						<input
							type="text"
							placeholder="Enter the Game ID"
							value={gameId}
							className="text-black px-4 py-2 rounded-md"
							onChange={(e) => setGameId(e.target.value)}
						/>
					</div>
					<button
						onClick={sendJoinRequest}
						className="bg-[#779556] text-white rounded-md font-extrabold px-2 py-2"
					>
						Enter the Game
					</button>
				</div>
			)}
			{waitingForOtherPlayer && (
				<div className="absolute top-[45%] left-[33%] px-10 py-10 rounded-md bg-[#779556] flex flex-col items-center gap-6 shadow-md">
					<div className="flex gap-4 items-center">
						<p className=" text-white font-semibold text-2xl">
							Waiting for other player to JOIN...
							<br />
							Please wait for a while.
						</p>
					</div>
				</div>
			)}
			{opponent_disconnected && (
				<div className="absolute top-[45%] left-[33%] px-10 py-10 rounded-md bg-[#779556] flex flex-col items-center gap-6 shadow-md">
					<div className="flex gap-4 items-center">
						<p className=" text-white font-semibold text-2xl">
							Opponent is Disconnected
							<br />
							Please wait for your opponent to Rejoin.
						</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default Game;
