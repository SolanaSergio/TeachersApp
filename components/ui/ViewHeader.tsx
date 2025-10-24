import React from 'react';

interface ViewHeaderProps {
    icon: React.ElementType;
    title: string;
    description: string;
}
export const ViewHeader: React.FC<ViewHeaderProps> = ({ icon: Icon, title, description }) => (
    <div className="mb-8">
        <div className="flex items-center space-x-3 text-brand-accent mb-2">
            <Icon className="h-8 w-8" />
            <h2 className="text-3xl font-bold tracking-tight text-brand-text">{title}</h2>
        </div>
        <p className="text-brand-subtle text-lg">{description}</p>
    </div>
);
