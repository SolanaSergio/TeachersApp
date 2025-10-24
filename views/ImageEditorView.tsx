import React, { useState } from 'react';
import { ImageFile } from '../types';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Loader } from '../components/ui/Loader';
import { FileUploader } from '../components/ui/FileUploader';
import { GenerateButton } from '../components/ui/GenerateButton';
import { EditIcon } from '../components/Icons';
import * as GeminiService from '../services';
import { useGemini } from '../hooks/useGemini';
import { Card } from '../components/ui/Card';
import { imageEditPresets } from '../constants';

const ImageEditorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
    const { data: editedImage, isLoading, execute: editImage, setData: setEditedImage } = useGemini(
        GeminiService.editImage,
        undefined,
        "Failed to edit image"
    );

    const handleFileSelect = async (file: File) => {
        const base64 = await GeminiService.fileToBase64(file);
        setOriginalImage({ base64, mimeType: file.type, name: file.name });
        setEditedImage(null);
    };
    
    const handleClearFile = () => {
        setOriginalImage(null);
        setEditedImage(null);
    }

    const handleGenerate = () => {
        if (!prompt || !originalImage) return;
        editImage(prompt, originalImage).catch(() => {});
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={EditIcon} title="Illustration Editor" description="Upload an image and use simple text prompts to make powerful edits." />
            <FileUploader onFileSelect={handleFileSelect} accept="image/*" selectedFile={originalImage} onClear={handleClearFile} />
            {originalImage && (
                <>
                    <Card>
                        <h3 className="text-xl font-bold text-brand-text mb-4">Editing Prompt</h3>
                        <p className="text-brand-subtle mb-3">Select a preset or write your own custom prompt.</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {imageEditPresets.map(preset => (
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
                            placeholder="e.g., 'Add a retro filter' or 'Make the sky purple'"
                            className="w-full h-24 p-4 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                        />
                    </Card>
                    <GenerateButton
                        onClick={handleGenerate}
                        isLoading={isLoading}
                        disabled={!prompt}
                        loadingText="Editing..."
                    >
                        Edit Illustration
                    </GenerateButton>
                </>
            )}
            {isLoading && <Loader text="Applying your edits..." />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {originalImage && (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-center text-brand-text">Original</h3>
                        <img src={`data:${originalImage.mimeType};base64,${originalImage.base64}`} alt="Original" className="rounded-xl w-full shadow-lg" />
                    </div>
                )}
                {editedImage && (
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-center text-brand-text">Edited</h3>
                        <img src={editedImage} alt="Edited" className="rounded-xl w-full shadow-lg" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageEditorView;
