import React, { useState, useCallback, useEffect } from 'react';
import { ImageFile } from '../types';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { FileUploader } from '../components/ui/FileUploader';
import { GenerateButton } from '../components/ui/GenerateButton';
import { VideoIcon } from '../components/Icons';
import * as GeminiService from '../services';
import { useToast } from '../contexts/ToastContext';
import { Select } from '../components/ui/Select';
import { videoStylePresets } from '../constants';

type VideoStatus = 'idle' | 'loading' | 'success' | 'error';

const VideoGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [styleSuffix, setStyleSuffix] = useState('');
    const [image, setImage] = useState<ImageFile | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [status, setStatus] = useState<VideoStatus>('idle');
    const [apiKeySelected, setApiKeySelected] = useState(true);
    const { showToast } = useToast();

    const checkApiKey = useCallback(async () => {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
      return hasKey;
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true); // Assume success to avoid race conditions
    };

    const handleFileSelect = async (file: File) => {
        const base64 = await GeminiService.fileToBase64(file);
        setImage({ base64, mimeType: file.type, name: file.name });
    };

    const handleGenerate = async () => {
        const fullPrompt = `${prompt}${styleSuffix}`.trim();
        if (!fullPrompt && !image) return;

        if (!(await checkApiKey())) return;

        setStatus('loading');
        setVideoUrl('');
        try {
            const result = await GeminiService.generateVideoVeo(fullPrompt, aspectRatio, image);
            setVideoUrl(result);
            setStatus('success');
        } catch (error: any) {
            console.error(error);
            setStatus('error');
            if (error?.message?.includes('Requested entity was not found')) {
                setApiKeySelected(false);
                showToast("Video generation failed. Your API key might be invalid. Please select a valid key.", 'error');
            } else {
                showToast("Failed to generate video.", 'error');
            }
        }
    };

    const isLoading = status === 'loading';

    if (!apiKeySelected) {
        return (
            <div className="text-center">
                <ViewHeader icon={VideoIcon} title="Video Trailer Maker" description="Generate short, engaging video clips from a text prompt or an image to introduce new topics."/>
                <Card className="max-w-md mx-auto">
                    <h3 className="text-xl font-bold text-brand-text mb-4">API Key Required</h3>
                    <p className="text-brand-subtle mb-4">
                        Video generation with Veo requires a dedicated API key with billing enabled. Please select your key to continue. 
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-accent underline ml-1">Learn more about billing</a>.
                    </p>
                    <button onClick={handleSelectKey} className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                        Select API Key
                    </button>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ViewHeader icon={VideoIcon} title="Video Trailer Maker" description="Generate short, engaging video clips from a text prompt or an image to introduce new topics."/>
            
            <Card>
                <h3 className="text-xl font-bold text-brand-text mb-4">Video Prompt & Settings</h3>
                <div className="space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'A majestic eagle soaring over a mountain range at sunrise'"
                        className="w-full h-24 p-4 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                    />
                    
                    <div>
                        <label className="block text-brand-subtle mb-2">Video Style</label>
                        <div className="flex flex-wrap gap-2">
                            {videoStylePresets.map(style => (
                                <button
                                    key={style.name}
                                    onClick={() => setStyleSuffix(style.suffix)}
                                    className={`p-2 rounded-lg text-sm font-semibold transition-colors ${styleSuffix === style.suffix ? 'bg-brand-accent text-white' : 'bg-brand-secondary hover:bg-slate-600'}`}
                                >
                                    {style.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Aspect Ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                            options={[
                                { value: '16:9', label: 'Landscape (16:9)' },
                                { value: '9:16', label: 'Portrait (9:16)' },
                            ]}
                        />
                        <div>
                            <label className="block text-brand-subtle mb-1">Starting Image (Optional)</label>
                            <FileUploader onFileSelect={handleFileSelect} accept="image/*" selectedFile={image} onClear={() => setImage(null)}/>
                        </div>
                    </div>
                </div>
            </Card>

            <GenerateButton
                onClick={handleGenerate}
                isLoading={isLoading}
                disabled={!prompt && !image}
                loadingText="Generating..."
            >
                Generate Video
            </GenerateButton>
            
            {isLoading && <Loader text="Generating video, this may take a few minutes..."/>}
            {status === 'success' && videoUrl && <video src={videoUrl} controls className="rounded-xl w-full max-w-xl mx-auto shadow-lg" />}
        </div>
    );
};

export default VideoGeneratorView;
