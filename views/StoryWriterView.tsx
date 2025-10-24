import React, { useState, useEffect } from 'react';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { GenerateButton } from '../components/ui/GenerateButton';
import { BrainCircuitIcon } from '../components/Icons';
import * as GeminiService from '../services';
import { useToast } from '../contexts/ToastContext';
import { useGemini } from '../hooks/useGemini';
import { Select } from '../components/ui/Select';
import { Slider } from '../components/ui/Slider';
import { audienceOptions, storyGenreOptions, storyToneOptions } from '../constants';

const StoryWriterView: React.FC = () => {
    const [storyPrompt, setStoryPrompt] = useState('');
    const [audience, setAudience] = useState(audienceOptions[3].value);
    const [genre, setGenre] = useState(storyGenreOptions[0].value);
    const [tone, setTone] = useState(storyToneOptions[0].value);
    const [length, setLength] = useState(500);
    const [savedStoryId, setSavedStoryId] = useState<string | null>(null);
    const { showToast } = useToast();

    const { data: story, isLoading, execute: generateStory, setData: setStory } = useGemini(
        GeminiService.complexGeneration,
        undefined,
        "Failed to generate story"
    );

    useEffect(() => {
        setSavedStoryId(null);
    }, [story]);

    const handleGenerate = () => {
        if (!storyPrompt || !audience) return;
        let fullPrompt = `For an audience of ${audience}, ${storyPrompt}.`;
        fullPrompt += ` The story should be approximately ${length} words long.`;
        if (genre !== 'Any') fullPrompt += ` The genre should be ${genre}.`;
        if (tone !== 'Any') fullPrompt += ` The tone should be ${tone}.`;
        
        generateStory(fullPrompt).catch(() => setStory("An error occurred while generating the story."));
    };
    
    const handleSaveStory = () => {
        if (!story || !storyPrompt) return;
        const title = window.prompt("Enter a title for your story:", "My New Story");
        if (title) {
            const savedStory = GeminiService.saveStory(title, storyPrompt, story);
            setSavedStoryId(savedStory.id);
            showToast("Story saved successfully!", "success");
        }
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={BrainCircuitIcon} title="Complex Story Generation" description="Brainstorm complex ideas, outlines, or full stories tailored to a specific audience."/>
            
            <Card>
                <h3 className="text-xl font-bold text-brand-text mb-4">1. Your Story Idea</h3>
                <textarea
                    value={storyPrompt}
                    onChange={(e) => setStoryPrompt(e.target.value)}
                    placeholder="e.g., 'Write a short story about a friendly robot exploring the Amazon rainforest, incorporating facts about biodiversity.'"
                    className="w-full h-32 p-4 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                />
            </Card>

            <Card>
                <h3 className="text-xl font-bold text-brand-text mb-4">2. Story Customization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Select label="Target Audience" value={audience} onChange={e => setAudience(e.target.value)} options={audienceOptions} />
                    <Select label="Genre" value={genre} onChange={e => setGenre(e.target.value)} options={storyGenreOptions} />
                    <Select label="Tone" value={tone} onChange={e => setTone(e.target.value)} options={storyToneOptions} />
                    <Slider 
                        label="Approximate Length"
                        value={length}
                        onChange={e => setLength(parseInt(e.target.value, 10))}
                        min="100"
                        max="2000"
                        step="100"
                        displayValue={`${length} words`}
                    />
                </div>
            </Card>

            <GenerateButton
                onClick={handleGenerate}
                isLoading={isLoading}
                disabled={!storyPrompt || !audience}
                loadingText="Generating..."
            >
                Generate Story
            </GenerateButton>

            {isLoading && <Loader text="Crafting your story..."/>}
            
            {story && (
                <Card>
                    <div className="prose prose-invert max-w-none prose-p:text-brand-text prose-headings:text-brand-text">
                        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{story}</pre>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-600 flex justify-end">
                        <button 
                            onClick={handleSaveStory}
                            disabled={!!savedStoryId}
                            className="bg-brand-accent text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-all shadow-md"
                        >
                            {savedStoryId ? 'Saved!' : 'Save Story'}
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default StoryWriterView;
