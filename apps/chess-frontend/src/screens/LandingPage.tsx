import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

const LandingPage = () => {
	const navigate = useNavigate();
	return (
		<div className="pt-10 flex justify-center">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<div className="flex justify-center">
					<img
						src="https://www.chess.com/bundles/web/images/offline-play/standardboard.1d6f9426.png"
						className="max-w-[30rem]"
					/>
				</div>
				<div>
					<h1 className="text-5xl  font-bold">
						Play Chess
						<br />
						Online
						<br />
						on the #1 Site!
					</h1>
					<Button
						className="bg-[#81b64c] hover:bg-[#a1e062]"
						onClick={() => {
							navigate("/game");
						}}
					>
						Play Online
					</Button>
					<Button
						className="bg-[#454341] hover:bg-[#484744]"
						onClick={() => {
							navigate("/game");
						}}
					>
						Play Computer
					</Button>
				</div>
			</div>
		</div>
	);
};

export default LandingPage;
