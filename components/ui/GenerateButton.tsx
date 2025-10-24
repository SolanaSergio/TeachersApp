import React from 'react';

interface GenerateButtonProps {
    onClick: () => void;
    isLoading: boolean;
    disabled?: boolean;
    loadingText?: string;
    children: React.ReactNode;
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, isLoading, disabled = false, loadingText = "Generating...", children }) => (
    <button
        onClick={onClick}
        disabled={isLoading || disabled}
        className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
    >
        {isLoading ? loadingText : children}
    </button>
);