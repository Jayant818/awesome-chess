import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../screens/Game";

const ChessBoard = ({
	board,
	socket,
	chess,
	setBoard,
	setMoves,
	moves,
}: {
	board: ({
		square: Square;
		type: PieceSymbol;
		color: Color;
	} | null)[][];
	socket: WebSocket;
	chess: Chess;
	setBoard: any;
	setMoves: any;
	// moves: {
	// 	to: string;
	// 	from: string;
	// }[];
}) => {
	const [from, setFrom] = useState<string | null>(null);
	const [to, setTo] = useState<string | null>(null);
	const handleClick = (i: number, j: number) => {
		if (!from) {
			// from ko set kardo
			// console.log(i, j);
			// console.log(8 - i);
			// console.log(String.fromCharCode(97 + j), 8 - i);

			setFrom(String.fromCharCode(97 + j) + (8 - i));
		} else {
			console.log(i, j);
			console.log(8 - i);
			// console.log(String.fromCharCode(97 + j) + (8 - i));
			// to ko set karo orr data add kardo
			// not giving us value of the square giving us null value
			// 1 point to do to calculate the val on basis of row/col using map
			//
			setTo(String.fromCharCode(97 + j) + (8 - i));
			console.log(from, String.fromCharCode(97 + j) + (8 - i));
			socket.send(
				JSON.stringify({
					type: MOVE,
					move: {
						to: String.fromCharCode(97 + j) + (8 - i),
						from,
					},
				})
			);

			setMoves([
				...moves,
				{
					from,
					to: String.fromCharCode(97 + j) + (8 - i),
				},
			]);
			chess.move({
				from,
				to: String.fromCharCode(97 + j) + (8 - i),
			});
			setBoard(chess.board());

			setFrom(null);
			setTo(null);
		}
	};
	return (
		<div>
			{board.map((row, i) => {
				return (
					<div key={i} className="flex">
						{row.map((square, j) => {
							return (
								<div
									key={j}
									onClick={() => handleClick(i, j)}
									className={`h-[4.5rem] w-[4.5rem] ${
										(i + j) % 2 === 0 ? "bg-[#ebecd0]" : "bg-[#779556]"
									} flex justify-center items-center`}
								>
									{square ? (
										<img
											className="w-[3.5rem]"
											src={`/${
												square?.color === "b"
													? `b${square?.type}`
													: `w${square?.type}`
											}.png`}
										/>
									) : null}
								</div>
							);
						})}
					</div>
				);
			})}
		</div>
	);
};

export default ChessBoard;
