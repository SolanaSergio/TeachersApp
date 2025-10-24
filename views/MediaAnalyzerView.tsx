import React, { useState } from 'react';
import { ImageFile } from '../types';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { FileUploader } from '../components/ui/FileUploader';
import { GenerateButton } from '../components/ui/GenerateButton';
import { SearchIcon } from '../components/Icons';
import * as GeminiService from '../services';
import { useGemini } from '../hooks/useGemini';
import { mediaAnalysisPresets } from '../constants';

const MediaAnalyzerView: React.FC = () => {
    const [prompt, setPrompt] = useState('Describe this image in detail.');
    const [image, setImage] = useState<ImageFile | null>(null);
    const { data: analysis, isLoading, execute: analyzeImage, setData: setAnalysis } = useGemini(
        GeminiService.analyzeImage,
        undefined,
        "Failed to analyze image"
    );
    
    const handleFileSelect = async (file: File) => {
        const base64 = await GeminiService.fileToBase64(file);
        setImage({ base64, mimeType: file.type, name: file.name });
        setAnalysis(null);
    };

    const handleAnalyze = () => {
        if (!prompt || !image) return;
        analyzeImage(prompt, image).catch(() => {});
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={SearchIcon} title="Media Analyzer" description="Upload media and ask Gemini to analyze it, create quiz questions, or provide educational descriptions."/>
            <FileUploader onFileSelect={handleFileSelect} accept="image/*" selectedFile={image} onClear={() => setImage(null)}/>
            {image && (
                 <>
                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt="For analysis" className="rounded-xl w-full max-w-md mx-auto shadow-lg" />
                     <Card>
                        <h3 className="text-xl font-bold text-brand-text mb-4">Analysis Prompt</h3>
                        <p className="text-brand-subtle mb-3">What would you like to know? Select a preset or write a custom prompt.</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {mediaAnalysisPresets.map(preset => (
                                <button
                                    key={preset.name}
                                    onClick={() => setPrompt(preset.prompt)}
                                    className={`p-2 rounded-lg text-sm font-semibold transition-colors ${prompt === preset.prompt ? 'bg-brand-accent text-white' : 'bg-brand-secondary hover:bg-slate-600'}`}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'What kind of animal is this?' or 'Create three quiz questions about this historical photo.'"
                            className="w-full h-24 p-4 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                        />
                    </Card>
                    <GenerateButton
                        onClick={handleAnalyze}
                        isLoading={isLoading}
                        disabled={!prompt}
                        loadingText="Analyzing..."
                    >
                        Analyze Media
                    </GenerateButton>
                </>
            )}
            {isLoading && <Loader text="Analyzing..." />}
            {analysis && (
                <Card>
                    <div className="prose prose-invert max-w-none prose-p:text-brand-text prose-headings:text-brand-text">
                        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{analysis}</pre>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default MediaAnalyzerView;
