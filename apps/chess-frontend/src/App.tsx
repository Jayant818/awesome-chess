import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./screens/LandingPage";
import Game from "./screens/Game";

function App() {
	return (
		<div className="h-screen bg-[#302e2b] text-white">
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/game" element={<Game />} />
				</Routes>
			</BrowserRouter>
		</div>
	);
}

export default App;
