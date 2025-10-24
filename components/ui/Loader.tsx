import React from 'react';

export const Loader: React.FC<{ text?: string }> = ({ text = "Thinking..." }) => (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-brand-secondary/30 rounded-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-accent"></div>
        <p className="text-brand-text font-semibold text-lg">{text}</p>
    </div>
);
