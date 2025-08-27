"use client";

import { useState } from "react";

interface ToggleProps {
	checked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
	size?: "sm" | "md" | "lg";
	className?: string;
}

export const Toggle = ({ 
	checked = false, 
	onChange, 
	disabled = false, 
	size = "md",
	className = "" 
}: ToggleProps) => {
	const [isChecked, setIsChecked] = useState(checked);

	const handleToggle = () => {
		if (disabled) return;
		
		const newValue = !isChecked;
		setIsChecked(newValue);
		onChange?.(newValue);
	};

	const sizeClasses = {
		sm: "w-10 h-5",
		md: "w-12 h-6", 
		lg: "w-14 h-7"
	};

	const circleSizes = {
		sm: "w-4 h-4",
		md: "w-5 h-5",
		lg: "w-6 h-6"
	};

	const circlePositions = {
		sm: { left: "left-0.5", right: "left-5" },
		md: { left: "left-0.5", right: "left-6" },
		lg: { left: "left-0.5", right: "left-7" }
	};

	return (
		<button
			onClick={handleToggle}
			disabled={disabled}
			className={`
				${sizeClasses[size]} 
				rounded-full relative cursor-pointer transition-all duration-200 
				${disabled ? 'opacity-50 cursor-not-allowed' : ''}
				${isChecked ? 'bg-bc-yellow' : 'bg-gray-300'}
				${className}
			`}
		>
			<div 
				className={`
					${circleSizes[size]} 
					bg-white rounded-full absolute top-0.5 transition-transform duration-200
					${isChecked ? circlePositions[size].right : circlePositions[size].left}
				`}
			/>
		</button>
	);
};
