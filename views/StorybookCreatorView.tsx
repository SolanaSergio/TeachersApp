import React, { useState, useEffect, useCallback } from 'react';
import { View, SavedStorybookPage, AspectRatio } from '../types';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Loader } from '../components/ui/Loader';
import { ResumePrompt } from '../components/ui/ResumePrompt';
import { StorybookViewer } from '../components/StorybookViewer';
import { GenerateButton } from '../components/ui/GenerateButton';
import { BookOpenIcon, DownloadIcon } from '../components/Icons';
import * as GeminiService from '../services';
import { useToast } from '../contexts/ToastContext';
import { useAutoSave } from '../hooks/useAutoSave';
import { useGemini } from '../hooks/useGemini';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { audienceOptions, storyGenreOptions, storyToneOptions, storybookIllustrationStyleOptions } from '../constants';

// Add a sleep helper function to pause between API calls.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const StorybookCreatorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [audience, setAudience] = useState(audienceOptions[2].value);
    const [genre, setGenre] = useState(storyGenreOptions[0].value);
    const [tone, setTone] = useState(storyToneOptions[0].value);
    const [illustrationStyle, setIllustrationStyle] = useState(storybookIllustrationStyleOptions[0].prompt);

    const [pages, setPages] = useState<SavedStorybookPage[]>([]);
    const [imageGenProgress, setImageGenProgress] = useState('');
    const [savedStorybookId, setSavedStorybookId] = useState<string | null>(null);
    const { showToast } = useToast();

    const { data: storybookContent, isLoading: isGeneratingText, execute: generateText } = useGemini(
        GeminiService.generateStorybookContent
    );
    const { isLoading: isGeneratingImage, execute: generateImage } = useGemini(
        GeminiService.generateImage
    );

    const generateImageWithRetry = useCallback(async (prompt: string, aspectRatio: AspectRatio, maxRetries = 4): Promise<string> => {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const imageUrl = await generateImage(prompt, aspectRatio);
                if (!imageUrl) throw new Error("API returned an empty image URL.");
                return imageUrl;
            } catch (error: any) {
                attempt++;
                if (attempt >= maxRetries) {
                    throw error;
                }
                const delay = 20000;
                const waitTime = Math.ceil(delay / 1000);
                console.warn(`Image generation attempt ${attempt} failed. Retrying in ${waitTime} seconds...`);
                setImageGenProgress(`Rate limit hit. Retrying in ${waitTime}s (attempt ${attempt}/${maxRetries - 1})...`);
                await sleep(delay);
            }
        }
        throw new Error("Image generation failed after all retry attempts.");
    }, [generateImage]);


    useEffect(() => {
        const generateAllImages = async () => {
            if (!storybookContent || pages.length > 0) return;

            let newPages: SavedStorybookPage[] = [];
            
            try {
                // --- Cover Page ---
                setImageGenProgress(`Designing the cover...`);
                const coverImagePrompt = `A beautiful book cover illustration. Style Guide: "${storybookContent.illustrationStyleGuide}". Theme: "${storybookContent.title}". ${illustrationStyle}. Do not include any text.`;
                const coverImageUrl = await generateImageWithRetry(coverImagePrompt, '3:4');
                const coverPage = { text: `${storybookContent.title.trim()}\n\nby ${storybookContent.authorName.trim()}`, imageUrl: coverImageUrl };
                newPages.push(coverPage);
                setPages([...newPages]);

                // --- Content Pages ---
                for (let i = 0; i < storybookContent.storyPages.length; i++) {
                    setImageGenProgress(`Creating illustration ${i + 1} of ${storybookContent.storyPages.length}...`);
                    const paragraph = storybookContent.storyPages[i];
                    const imagePrompt = `A book illustration. Style Guide: "${storybookContent.illustrationStyleGuide}". Scene: "${paragraph}". ${illustrationStyle}.`;
                    
                    const imageUrl = await generateImageWithRetry(imagePrompt, '4:3');
                    newPages.push({ text: paragraph, imageUrl });
                    setPages([...newPages]); // Update UI after each success
                }
                setImageGenProgress('');
                showToast("All illustrations have been created!", "success");
            } catch (error: any) {
                console.error("Failed to generate an image for the storybook after retries:", error);
                showToast(`Image generation failed: ${error.message}. The process has been stopped.`, 'error');
                setImageGenProgress(''); // Stop the loading indicator
            }
        };

        if (storybookContent) {
            generateAllImages();
        }
    }, [storybookContent, illustrationStyle, showToast, pages.length, generateImageWithRetry]);


    const { showResumePrompt, setShowResumePrompt, loadSavedProgress, clearSavedProgress } = useAutoSave(
        View.STORYBOOK_CREATOR,
        { prompt, audience, genre, tone, illustrationStyle, pages: pages.map(p => ({ text: p.text, imageUrl: '' })) },
        !!(prompt || pages.length > 0)
    );

    const handleResume = () => {
        const savedProgress = loadSavedProgress();
        if (savedProgress) {
            setPrompt(savedProgress.prompt || '');
            setAudience(savedProgress.audience || audienceOptions[2].value);
            setGenre(savedProgress.genre || storyGenreOptions[0].value);
            setTone(savedProgress.tone || storyToneOptions[0].value);
            setIllustrationStyle(savedProgress.illustrationStyle || storybookIllustrationStyleOptions[0].prompt);
            setPages(savedProgress.pages || []);
        }
        setShowResumePrompt(false);
    };

    const handleGenerate = () => {
        if (!prompt || !audience) return;
        clearSavedProgress();
        setPages([]);
        setSavedStorybookId(null);
        generateText(prompt, audience, genre, tone).catch(() => {});
    };

    const handleSaveStorybook = () => {
        if (pages.length === 0 || !prompt) return;
        const defaultTitle = pages[0]?.text.split('\n')[0] || "My New Storybook";
        const title = window.prompt("Enter a title for your storybook:", defaultTitle);
        if (title) {
            const saved = GeminiService.saveStorybook(title, prompt, pages);
            setSavedStorybookId(saved.id);
            clearSavedProgress();
            showToast("Storybook saved!", 'success');
        }
    };

    const handleExportToPdf = () => {
        if (pages.length === 0) return;
        const title = pages[0]?.text.split('\n')[0] || "My Storybook";
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast("Please allow popups to export the storybook.", 'error');
            return;
        }

        const coverPageHtml = pages.map((page, index) => {
            if (index === 0) {
                const [titleText, author] = page.text.split('\n\nby ');
                return `<div class="page cover"><img src="${page.imageUrl}" alt="Cover Image"><h1>${titleText || ''}</h1>${author ? `<h2>by ${author}</h2>` : ''}</div>`;
            }
            return null;
        }).join('');

        const contentPagesHtml = pages.slice(1).reduce((acc: string[], page, index) => {
            if (index % 2 === 0) {
                const rightPage = pages.slice(1)[index + 1];
                acc.push(`<div class="page content-page"><div class="page-half"><img src="${page.imageUrl}" alt="Page ${index + 1} illustration"><p>${page.text}</p></div>${rightPage ? `<div class="page-half"><img src="${rightPage.imageUrl}" alt="Page ${index + 2} illustration"><p>${rightPage.text}</p></div>` : '<div class="page-half"></div>'}</div>`);
            }
            return acc;
        }, []).join('');

        const content = `<html><head><title>Export: ${title}</title><style>@import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');body{font-family:'Merriweather',serif;margin:0;padding:0;background-color:#f0f0f0;}@page{size:A4 landscape;margin:1cm;}.page{background-color:white;width:29.7cm;height:21cm;box-sizing:border-box;padding:1.5cm;page-break-after:always;display:flex;flex-direction:column;justify-content:center;align-items:center;border:1px solid #ccc;margin:1cm auto;}.page.cover{text-align:center;}.page.content-page{flex-direction:row;gap:2cm;align-items:stretch;}.page-half{width:50%;display:flex;flex-direction:column;}img{max-width:100%;max-height:50%;object-fit:contain;border-radius:8px;margin-bottom:1em;}.page.content-page img{max-height:60%;}.page.content-page p{font-size:14pt;line-height:1.6;overflow-y:auto;flex-grow:1;}h1{font-size:28pt;margin-bottom:0.5em;}h2{font-size:18pt;font-style:italic;color:#555;margin-top:0;}p{font-size:16pt;line-height:1.5;}@media print{body{background-color:white;}.page{margin:0;border:none;}}</style></head><body>${coverPageHtml}${contentPagesHtml}</body></html>`;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => printWindow.print();
    };

    const isLoading = isGeneratingText || !!imageGenProgress || isGeneratingImage;
    
    return (
        <div className="space-y-6">
            <ViewHeader icon={BookOpenIcon} title="Storybook Creator" description="Enter a topic and target audience to create a fully illustrated, high-quality storybook." />
            {showResumePrompt && <ResumePrompt onResume={handleResume} onDismiss={clearSavedProgress} />}
            
            <Card>
                <h3 className="text-xl font-bold text-brand-text mb-4">1. Your Story Idea</h3>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'A curious squirrel who learns to fly with the help of a wise old owl.'"
                    className="w-full h-24 p-4 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                />
            </Card>

            <Card>
                <h3 className="text-xl font-bold text-brand-text mb-4">2. Customization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Select label="Target Audience" value={audience} onChange={e => setAudience(e.target.value)} options={audienceOptions} />
                    <Select label="Genre" value={genre} onChange={e => setGenre(e.target.value)} options={storyGenreOptions} />
                    <Select label="Tone" value={tone} onChange={e => setTone(e.target.value)} options={storyToneOptions} />
                    <div className="md:col-span-2 lg:col-span-4">
                        <label className="block text-brand-subtle mb-2">Illustration Style</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {storybookIllustrationStyleOptions.map(style => (
                                <button
                                    key={style.name}
                                    onClick={() => setIllustrationStyle(style.prompt)}
                                    className={`p-2 rounded-lg text-sm font-semibold transition-colors ${illustrationStyle === style.prompt ? 'bg-brand-accent text-white' : 'bg-brand-secondary hover:bg-slate-600'}`}
                                >
                                    {style.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>


            <GenerateButton
                onClick={handleGenerate}
                isLoading={isLoading}
                disabled={!prompt || !audience}
                loadingText="Creating..."
            >
                Create Storybook
            </GenerateButton>
            
            {isLoading && <Loader text={isGeneratingText ? "Writing your story..." : imageGenProgress || "Generating images..."} />}
            
            {pages.length > 0 && (
                <div className="space-y-8 mt-8">
                     <div className="flex justify-between items-center border-b border-slate-600 pb-2 mb-8">
                        <h3 className="text-2xl font-bold text-brand-text">Your Storybook</h3>
                        <div className="flex items-center space-x-2">
                             <button
                                onClick={handleExportToPdf}
                                className="flex items-center space-x-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-all shadow-md"
                            >
                                <DownloadIcon className="h-5 w-5"/>
                                <span>Export to PDF</span>
                            </button>
                            <button
                                onClick={handleSaveStorybook}
                                disabled={!!savedStorybookId}
                                className="bg-brand-accent text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-all shadow-md"
                            >
                                {savedStorybookId ? 'Saved!' : 'Save Storybook'}
                            </button>
                        </div>
                    </div>
                    <div className="w-full p-4 sm:p-8 bg-slate-800/50 rounded-xl" style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100" 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M22.5 25.414l-2.828-2.828L17.5 20.414l2.828 2.828L22.5 25.414zM20.414 17.5l2.828-2.828L25.414 12.5l-2.828 2.828L20.414 17.5zM12.5 25.414L9.672 22.586 7.5 20.414l2.828-2.828L12.5 19.586l-2.828 2.828L12.5 25.414z" fill="%232c3e50" fill-opacity="0.1" fill-rule="evenodd"/%3E%3C/svg%3E')`}}>
                      <StorybookViewer pages={pages} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorybookCreatorView;