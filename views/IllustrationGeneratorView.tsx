import React, { useState } from 'react';
import { AspectRatio } from '../types';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Loader } from '../components/ui/Loader';
import { GenerateButton } from '../components/ui/GenerateButton';
import { ImageIcon } from '../components/Icons';
import * as GeminiService from '../services';
import { useGemini } from '../hooks/useGemini';
import { Select } from '../components/ui/Select';
import { illustrationStylePresets, illustrationAspectRatioOptions } from '../constants';

const IllustrationGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState(illustrationStylePresets[0].prompt);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

    const { data: image, isLoading, execute: generateImage } = useGemini(
        GeminiService.generateImage,
        undefined,
        "Failed to generate image"
    );

    const handleGenerate = () => {
        if (!prompt) return;
        const fullPrompt = `${prompt} ${selectedStyle}`.trim();
        generateImage(fullPrompt, aspectRatio).catch(() => {});
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={ImageIcon} title="Illustration Generator" description="Create high-quality, custom illustrations for worksheets, presentations, or storybooks."/>
            
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A cute cartoon capybara reading a book under a tree'"
                className="w-full h-24 p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-brand-subtle mb-2">Style Preset</label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {illustrationStylePresets.map(style => (
                            <button
                                key={style.name}
                                onClick={() => setSelectedStyle(style.prompt)}
                                className={`p-2 rounded-lg text-sm font-semibold transition-colors ${selectedStyle === style.prompt ? 'bg-brand-accent text-white' : 'bg-brand-secondary hover:bg-slate-600'}`}
                            >
                                {style.name}
                            </button>
                        ))}
                    </div>
                </div>
                <Select
                    label="Aspect Ratio"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    options={illustrationAspectRatioOptions}
                />
            </div>

            <GenerateButton
                onClick={handleGenerate}
                isLoading={isLoading}
                disabled={!prompt}
                loadingText="Generating..."
            >
                Generate Illustration
            </GenerateButton>
            
            {isLoading && <Loader text="Creating your masterpiece..."/>}
            {image && <img src={image} alt="Generated illustration" className="rounded-xl w-full max-w-xl mx-auto shadow-lg" />}
        </div>
    );
};

export default IllustrationGeneratorView;
