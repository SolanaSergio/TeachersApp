import React, { useState } from 'react';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { GlobeIcon } from '../components/Icons';
import * as GeminiService from '../services';
import { useGemini } from '../hooks/useGemini';

const FactCheckerView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const { data: result, isLoading, execute: performSearch } = useGemini(
        GeminiService.groundedSearch,
        undefined,
        "Failed to perform search"
    );

    const handleSearch = () => {
        if (!prompt) return;
        performSearch(prompt).catch(() => {});
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={GlobeIcon} title="Fact Checker" description="Ask questions and get up-to-date answers grounded in Google Search results." />
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="e.g., 'What is the largest volcano in the solar system?'"
                    className="flex-grow p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading || !prompt}
                    className="bg-brand-accent text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>
            {isLoading && <Loader text="Searching the web..." />}
            {result && (
                <Card>
                    <div className="prose prose-invert max-w-none prose-p:text-brand-text prose-headings:text-brand-text">
                        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{result.text}</pre>
                    </div>
                     {result.sources.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-600">
                            <h4 className="text-lg font-bold text-brand-text mb-2">Sources:</h4>
                            <ul className="space-y-2">
                                {/* FIX: Add check for source.web.uri and provide a fallback for optional title to prevent runtime errors. */}
                                {result.sources.map((source, index) => (
                                    source.web && source.web.uri ? (
                                    <li key={index} className="truncate">
                                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">
                                           {index + 1}. {source.web.title || source.web.uri}
                                        </a>
                                    </li>
                                    ) : null
                                ))}
                            </ul>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default FactCheckerView;