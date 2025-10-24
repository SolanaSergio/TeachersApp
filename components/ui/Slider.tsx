import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    value: number;
    displayValue?: string;
}

export const Slider: React.FC<SliderProps> = ({ label, value, displayValue, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="flex justify-between text-brand-subtle mb-1">
            <span>{label}</span>
            <span className="font-bold text-brand-text">{displayValue ?? value}</span>
        </label>
        <input
            type="range"
            {...props}
            value={value}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-brand-accent"
        />
    </div>
);