interface ButtonProps {
	children: React.ReactNode;
	onClick?: () => void;
	className: string;
}

const Button = ({ children, onClick, className }: ButtonProps) => {
	return (
		<div className="mt-10">
			<button
				className={`px-10 py-6 text-xl rounded-md font-bold w-[18rem] ${className} `}
				onClick={onClick}
			>
				{children}
			</button>
		</div>
	);
};

export default Button;
