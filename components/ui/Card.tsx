import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-brand-secondary/50 p-6 rounded-xl shadow-lg ${className}`}>
        {children}
    </div>
);
