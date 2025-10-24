import React from 'react';

export const ResumePrompt: React.FC<{ onResume: () => void; onDismiss: () => void; }> = ({ onResume, onDismiss }) => (
    <div className="bg-brand-secondary p-4 rounded-lg shadow-lg flex items-center justify-between mb-6">
        <p className="text-brand-text font-semibold">You have unsaved progress. Would you like to resume?</p>
        <div className="flex space-x-2">
            <button onClick={onResume} className="bg-brand-accent text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm">Resume</button>
            <button onClick={onDismiss} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors text-sm">Dismiss</button>
        </div>
    </div>
);
