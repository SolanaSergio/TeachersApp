import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, AspectRatio, ImageFile, GroundingChunk, SavedContent } from './types';
import { BookIcon, ImageIcon, EditIcon, SearchIcon, MicIcon, VideoIcon, GlobeIcon, BrainCircuitIcon, MenuIcon, BookOpenIcon, HomeIcon, UploadCloudIcon, XIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon, BookmarkIcon, ClipboardListIcon, TrashIcon, DownloadIcon } from './components/Icons';
import * as GeminiService from './services';
import type { Session } from '@google/genai';

// --- HELPER & LAYOUT COMPONENTS ---

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-brand-secondary/50 p-6 rounded-xl shadow-lg ${className}`}>
        {children}
    </div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-brand-secondary rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-600">
                    <h3 id="modal-title" className="text-xl font-bold text-brand-text truncate">{title}</h3>
                    <button onClick={onClose} className="p-1 text-brand-subtle hover:text-white rounded-full hover:bg-slate-600" aria-label="Close">
                        <XIcon className="h-6 w-6"/>
                    </button>
                </header>
                <div className="p-2 sm:p-6 overflow-y-auto bg-slate-800/50 flex-grow" style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100" 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M22.5 25.414l-2.828-2.828L17.5 20.414l2.828 2.828L22.5 25.414zM20.414 17.5l2.828-2.828L25.414 12.5l-2.828 2.828L20.414 17.5zM12.5 25.414L9.672 22.586 7.5 20.414l2.828-2.828L12.5 19.586l-2.828 2.828L12.5 25.414z" fill="%232c3e50" fill-opacity="0.1" fill-rule="evenodd"/%3E%3C/svg%3E')`}}>
                    {children}
                </div>
            </div>
        </div>
    );
};

interface ViewHeaderProps {
    icon: React.ElementType;
    title: string;
    description: string;
}
const ViewHeader: React.FC<ViewHeaderProps> = ({ icon: Icon, title, description }) => (
    <div className="mb-8">
        <div className="flex items-center space-x-3 text-brand-accent mb-2">
            <Icon className="h-8 w-8" />
            <h2 className="text-3xl font-bold tracking-tight text-brand-text">{title}</h2>
        </div>
        <p className="text-brand-subtle text-lg">{description}</p>
    </div>
);

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onNavigate: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onNavigate }) => {
  const navItems = [
    { view: View.DASHBOARD, icon: HomeIcon, label: 'Dashboard' },
    { view: View.STORY_WRITER, icon: BrainCircuitIcon, label: 'Story Writer' },
    { view: View.STORYBOOK_CREATOR, icon: BookOpenIcon, label: 'Storybook Creator' },
    { view: View.LESSON_PLAN_GENERATOR, icon: ClipboardListIcon, label: 'Lesson Plan Generator' },
    { view: View.ILLUSTRATION_GENERATOR, icon: ImageIcon, label: 'Illustration Kit' },
    { view: View.IMAGE_EDITOR, icon: EditIcon, label: 'Image Editor' },
    { view: View.MEDIA_ANALYZER, icon: SearchIcon, label: 'Media Analyzer' },
    { view: View.AUDIOBOOK_STUDIO, icon: MicIcon, label: 'Audiobook Studio' },
    { view: View.VIDEO_GENERATOR, icon: VideoIcon, label: 'Video Trailer Maker' },
    { view: View.FACT_CHECKER, icon: GlobeIcon, label: 'Fact Checker' },
  ];

  const handleNavigation = (view: View) => {
    setActiveView(view);
    onNavigate();
  }

  return (
    <nav className="bg-brand-secondary p-4 flex flex-col space-y-2 h-full w-64 md:w-72">
      <div className="flex items-center space-x-2.5 px-3 mb-6">
        <SparklesIcon className="h-8 w-8 text-brand-accent"/>
        <h1 className="text-2xl font-bold text-brand-text">Teacher's App</h1>
      </div>
      {navItems.map(({ view, icon: Icon, label }) => (
        <button
          key={view}
          onClick={() => handleNavigation(view)}
          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 w-full text-left ${
            activeView === view ? 'bg-brand-accent text-white shadow-md' : 'hover:bg-slate-600 text-brand-subtle'
          }`}
        >
          <Icon className="h-6 w-6" />
          <span className="font-semibold text-md">{label}</span>
        </button>
      ))}
    </nav>
  );
};

const Loader: React.FC<{ text?: string }> = ({ text = "Thinking..." }) => (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-brand-secondary/30 rounded-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-accent"></div>
        <p className="text-brand-text font-semibold text-lg">{text}</p>
    </div>
);

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    accept: string;
    selectedFile: ImageFile | null;
    onClear: () => void;
}
const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, accept, selectedFile, onClear }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    if (selectedFile) {
        return (
            <div className="w-full p-4 bg-brand-secondary rounded-lg flex items-center justify-between">
                <span className="text-brand-text font-medium truncate">{selectedFile.name}</span>
                <button onClick={onClear} className="p-1 text-brand-subtle hover:text-white rounded-full hover:bg-slate-600">
                    <XIcon className="h-5 w-5"/>
                </button>
            </div>
        )
    }

    return (
        <div className="w-full">
            <label className="flex flex-col items-center px-4 py-8 bg-brand-secondary rounded-lg shadow-md tracking-wide uppercase border-2 border-dashed border-brand-subtle cursor-pointer hover:bg-slate-600 hover:border-brand-accent transition-all duration-200">
                <UploadCloudIcon className="w-10 h-10 text-brand-accent" />
                <span className="mt-2 text-base leading-normal text-brand-subtle">Select a file</span>
                <input type='file' className="hidden" onChange={handleFileChange} accept={accept} />
            </label>
        </div>
    );
};

const ResumePrompt: React.FC<{ onResume: () => void; onDismiss: () => void; }> = ({ onResume, onDismiss }) => (
    <div className="bg-brand-secondary p-4 rounded-lg shadow-lg flex items-center justify-between mb-6">
        <p className="text-brand-text font-semibold">You have unsaved progress. Would you like to resume?</p>
        <div className="flex space-x-2">
            <button onClick={onResume} className="bg-brand-accent text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm">Resume</button>
            <button onClick={onDismiss} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-colors text-sm">Dismiss</button>
        </div>
    </div>
);


// --- VIEW COMPONENTS ---

const StorybookViewer: React.FC<{ pages: { text: string; imageUrl: string }[], contentId?: string, initialPageIndex?: number }> = ({ pages, contentId, initialPageIndex = 0 }) => {
    const [page, setPage] = useState(initialPageIndex || 0);
    const [bookmarkedPageIndex, setBookmarkedPageIndex] = useState(initialPageIndex);
    
    const totalPages = pages.length;
    if (totalPages === 0) return null;

    const isCover = page === 0;
    // The last page is single if it has no right-hand partner.
    // Content pages start at index 1. If total content pages (totalPages - 1) is odd, the last one is single.
    const isLastPageSingle = (totalPages > 1) && ((totalPages - 1) % 2 !== 0);
    const isViewingLastPage = page === totalPages - 1;
    const isSinglePageView = isCover || (isLastPageSingle && isViewingLastPage);
    
    const goToNext = () => setPage(p => p === 0 ? 1 : p + 2);
    const goToPrev = () => setPage(p => p === 1 ? 0 : p - 2);

    const canGoNext = page === 0 ? totalPages > 1 : page + 2 < totalPages;
    const canGoPrev = page > 0;

    const handleToggleBookmark = () => {
        if (!contentId) return;
        const newBookmarkIndex = page === bookmarkedPageIndex ? 0 : page;
        if (GeminiService.saveBookmark(contentId, newBookmarkIndex)) {
            setBookmarkedPageIndex(newBookmarkIndex);
        }
    };
    
    const isBookmarked = bookmarkedPageIndex === page;

    const PageDisplay = ({ pageData, pageNumber, isCoverPage }: { pageData: { text: string, imageUrl: string }, pageNumber: number | null, isCoverPage: boolean }) => (
        <div className={`flex flex-col h-full ${isCoverPage ? 'justify-center items-center text-center' : ''}`}>
            {pageData.imageUrl && 
              <img src={pageData.imageUrl} alt="" 
                className={`w-full object-cover rounded-md bg-slate-200 ${isCoverPage ? 'h-3/5' : 'h-3/5'} mb-4`} 
              />
            }
            <div className={`overflow-y-auto flex-grow ${isCoverPage ? 'flex flex-col justify-center' : ''}`}>
                <p className={`whitespace-pre-wrap ${isCoverPage ? 'text-2xl font-bold' : 'text-xl'}`}>{pageData.text}</p>
            </div>
            {pageNumber && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-slate-500">{pageNumber}</div>}
        </div>
    );
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center font-serif relative p-4">
             <style>{`
                .book-viewport {
                    width: 100%;
                    max-width: 1200px;
                    aspect-ratio: 2 / 1.3;
                    max-height: 90vh;
                    position: relative;
                }
                .book-layout {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .book-page {
                    height: 100%;
                    background-color: #fdfaf4;
                    color: #333;
                    padding: 2rem;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .book-page.single {
                    width: 50%;
                    border-radius: 8px;
                }
                .book-spread {
                    display: flex;
                    width: 100%;
                    height: 100%;
                    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3));
                }
                .book-page.left {
                    width: 50%;
                    border-top-left-radius: 8px;
                    border-bottom-left-radius: 8px;
                    box-shadow: inset 3px 0px 8px -3px rgba(0,0,0,0.2);
                }
                .book-page.right {
                    width: 50%;
                    border-top-right-radius: 8px;
                    border-bottom-right-radius: 8px;
                    box-shadow: inset -3px 0px 8px -3px rgba(0,0,0,0.2);
                }
                .book-spine {
                    width: 12px;
                    height: 100%;
                    background: linear-gradient(to right, #00000020, #00000000 30%, #00000000 70%, #00000020);
                    flex-shrink: 0;
                }
            `}</style>
            
            <div className="book-viewport">
                <div className="book-layout">
                    {isSinglePageView ? (
                        <div className="book-page single">
                            <PageDisplay pageData={pages[page]} pageNumber={null} isCoverPage={isCover} />
                        </div>
                    ) : (
                        <div className="book-spread">
                             <div className="book-page left">
                                <PageDisplay pageData={pages[page]} pageNumber={page} isCoverPage={false} />
                            </div>
                            <div className="book-spine"></div>
                             <div className="book-page right">
                                <PageDisplay pageData={pages[page+1]} pageNumber={page+1} isCoverPage={false} />
                            </div>
                        </div>
                    )}
                </div>

                <button onClick={goToPrev} disabled={!canGoPrev} className="absolute left-[-20px] top-1/2 -translate-y-1/2 p-2 bg-brand-accent/80 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent transition-all shadow-lg z-10">
                    <ChevronLeftIcon className="h-8 w-8"/>
                </button>
                 <button onClick={goToNext} disabled={!canGoNext} className="absolute right-[-20px] top-1/2 -translate-y-1/2 p-2 bg-brand-accent/80 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-accent transition-all shadow-lg z-10">
                    <ChevronRightIcon className="h-8 w-8"/>
                </button>
            </div>
            
             <div className="w-full max-w-[1000px] mt-4 flex items-center justify-center space-x-4">
                 <span className="text-brand-subtle text-sm font-sans">
                  {isCover ? 'Cover' : (isSinglePageView ? `Page ${page}`: `Pages ${page}-${page+1}`)}
                </span>
                {contentId && (
                   <button onClick={handleToggleBookmark} className="p-2 text-brand-subtle hover:text-brand-accent transition-colors" title="Bookmark this page">
                      <BookmarkIcon className={`w-6 h-6 ${isBookmarked ? 'fill-brand-accent text-brand-accent' : ''}`} />
                   </button>
                )}
            </div>
        </div>
    );
};

const DashboardView: React.FC<{ setActiveView: (view: View) => void }> = ({ setActiveView }) => {
    const features = [
      { view: View.LESSON_PLAN_GENERATOR, icon: ClipboardListIcon, title: 'Generate a Lesson Plan', description: 'Quickly create a structured plan for any topic, complete with activities.' },
      { view: View.STORYBOOK_CREATOR, icon: BookOpenIcon, title: 'Create a Storybook', description: 'Generate a complete, illustrated story from a simple prompt.' },
      { view: View.ILLUSTRATION_GENERATOR, icon: ImageIcon, title: 'Design Illustrations', description: 'Create custom images and art for your classroom materials.' },
      { view: View.VIDEO_GENERATOR, icon: VideoIcon, title: 'Make a Video Trailer', description: 'Produce a short video to introduce a new topic or story.' },
      { view: View.FACT_CHECKER, icon: GlobeIcon, title: 'Fact-Check a Topic', description: 'Get up-to-date, sourced answers for your lesson plans.' },
    ];
    
    const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
    const [viewingContent, setViewingContent] = useState<SavedContent | null>(null);

    useEffect(() => {
        setSavedContent(GeminiService.getSavedContent());
    }, []);

    const handleDelete = (contentId: string, contentTitle: string) => {
        if (window.confirm(`Are you sure you want to delete "${contentTitle}"?`)) {
            GeminiService.deleteContent(contentId);
            setSavedContent(currentContent => currentContent.filter(item => item.id !== contentId));
        }
    };

    const ICONS_BY_TYPE: { [key: string]: React.ElementType } = {
      'Story': BookIcon,
      'Storybook': BookOpenIcon,
    };

    return (
        <div className="space-y-8">
             <div>
                <h1 className="text-4xl font-bold tracking-tight text-brand-text">Welcome, Teacher!</h1>
                <p className="text-brand-subtle text-xl mt-2">What would you like to create today?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map(feature => (
                    <button key={feature.view} onClick={() => setActiveView(feature.view)} className="text-left">
                        <Card className="hover:bg-brand-secondary hover:ring-2 hover:ring-brand-accent transition-all duration-200 h-full">
                            <div className="flex items-center space-x-4">
                                <feature.icon className="h-8 w-8 text-brand-accent"/>
                                <div>
                                    <h3 className="text-xl font-bold text-brand-text">{feature.title}</h3>
                                    <p className="text-brand-subtle">{feature.description}</p>
                                </div>
                            </div>
                        </Card>
                    </button>
                ))}
            </div>

            {savedContent.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-brand-text mb-4 border-b border-slate-700 pb-2">Your Saved Creations</h2>
                    <Card className="space-y-4">
                        {savedContent.map(item => {
                          const Icon = ICONS_BY_TYPE[item.type] || BookIcon;
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-brand-primary/50 rounded-lg gap-4">
                                <div className="flex items-center space-x-4 overflow-hidden">
                                  <Icon className="h-6 w-6 text-brand-accent flex-shrink-0" />
                                  <div className="overflow-hidden">
                                      <p className="font-bold text-brand-text truncate">{item.title}</p>
                                      <p className="text-sm text-brand-subtle">{item.type} - Created {new Date(item.createdAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button onClick={() => setViewingContent(item)} className="bg-brand-accent text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm">
                                        View
                                    </button>
                                     <button 
                                        onClick={() => handleDelete(item.id, item.title)} 
                                        className="p-2 text-brand-subtle hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                                        aria-label={`Delete ${item.title}`}
                                    >
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>
                          )
                        })}
                    </Card>
                </div>
            )}

            <Modal isOpen={!!viewingContent} onClose={() => setViewingContent(null)} title={viewingContent?.title || ''}>
                {viewingContent && (
                    viewingContent.type === 'Story' ? (
                        <div className="prose prose-invert max-w-none prose-p:text-brand-text font-serif p-4">
                            <p className="whitespace-pre-wrap">{viewingContent.content}</p>
                        </div>
                    ) : viewingContent.type === 'Storybook' && viewingContent.pages ? (
                        <StorybookViewer 
                            pages={viewingContent.pages} 
                            contentId={viewingContent.id} 
                            initialPageIndex={viewingContent.bookmarkPageIndex} 
                        />
                    ) : null
                )}
            </Modal>
        </div>
    )
}

const StoryWriterView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [story, setStory] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [savedStoryId, setSavedStoryId] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setStory('');
        setSavedStoryId(null);
        try {
            const result = await GeminiService.complexGeneration(prompt);
            setStory(result);
        } catch (error) {
            console.error(error);
            setStory("An error occurred while generating the story.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveStory = () => {
        if (!story || !prompt) return;
        const title = window.prompt("Enter a title for your story:", "My New Story");
        if (title) {
            const savedStory = GeminiService.saveStory(title, prompt, story);
            setSavedStoryId(savedStory.id);
        }
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={BrainCircuitIcon} title="Complex Story Generation" description="Use Gemini Pro's maximum thinking budget to brainstorm complex ideas, outlines, or full stories for your class."/>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'Write a short story for 5th graders about a friendly robot exploring the Amazon rainforest, incorporating facts about biodiversity.'"
                className="w-full h-40 p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
                className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
            >
                {isLoading ? 'Generating...' : 'Generate Story'}
            </button>
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

const StorybookCreatorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [pages, setPages] = useState<{ text: string, imageUrl: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [savedStorybookId, setSavedStorybookId] = useState<string | null>(null);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    // Auto-save logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (prompt || pages.length > 0) {
                // To avoid localStorage quota errors, only save text content, not the large image data URLs.
                const pagesForAutosave = pages.map(page => ({
                    text: page.text,
                    imageUrl: '', // Exclude image data from auto-save
                }));
                GeminiService.saveInProgress(View.STORYBOOK_CREATOR, { prompt, pages: pagesForAutosave });
            }
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [prompt, pages]);

    // Resume logic on mount
    useEffect(() => {
        const savedProgress = GeminiService.loadInProgress(View.STORYBOOK_CREATOR);
        if (savedProgress && (savedProgress.prompt || savedProgress.pages?.length > 0)) {
            setShowResumePrompt(true);
        }
    }, []);

    const handleResume = () => {
        const savedProgress = GeminiService.loadInProgress(View.STORYBOOK_CREATOR);
        if (savedProgress) {
            setPrompt(savedProgress.prompt || '');
            setPages(savedProgress.pages || []);
        }
        setShowResumePrompt(false);
    };

    const handleDismissResume = () => {
        GeminiService.clearInProgress(View.STORYBOOK_CREATOR);
        setShowResumePrompt(false);
    };

    const handleGenerate = async () => {
        if (!prompt) return;
        GeminiService.clearInProgress(View.STORYBOOK_CREATOR);
        setIsLoading(true);
        setPages([]);
        setSavedStorybookId(null);
        let newPages: { text: string; imageUrl: string }[] = [];

        try {
            // Step 1: Generate Story
            setLoadingMessage("Writing your story...");
            const storyPrompt = `Write a short, high-quality children's story for the topic: "${prompt}". Divide it into several short paragraphs, each on a new line.`;
            const storyText = await GeminiService.complexGeneration(storyPrompt);
            const paragraphs = storyText.split('\n').filter(p => p.trim() !== '');
            if (paragraphs.length === 0) throw new Error("Generated story was empty.");

            // Step 2: Generate Title
            setLoadingMessage("Creating a title...");
            const titlePrompt = `Read the following children's story. Create a short, magical, and catchy title for it that would appeal to a child. The title should be perfect for a book cover. Respond with ONLY the title and nothing else. Story: "${storyText}"`;
            const bookTitle = await GeminiService.complexGeneration(titlePrompt);

            // Step 3: Generate Style Guide
            setLoadingMessage("Creating a consistent art style...");
            const styleGuidePrompt = `Describe the main character(s) and illustration style for a children's book about "${prompt}". Be detailed about appearance and mood for an AI illustrator. Be concise. Example: 'A small squirrel named Squeaky with fluffy brown fur and big eyes. The style is whimsical and vibrant, with soft shapes and a warm, sunny color palette.'`;
            const styleGuide = await GeminiService.complexGeneration(styleGuidePrompt);
            
            // Step 4: Generate Author
            setLoadingMessage("Inventing an author...");
            const authorPrompt = `Based on a children's story about "${prompt}", invent a creative-sounding children's book author name. Provide only the name.`;
            const authorName = await GeminiService.complexGeneration(authorPrompt);

            // Step 5: Generate Cover
            setLoadingMessage("Designing the cover...");
            const coverImagePrompt = `A beautiful children's book cover illustration. Style Guide: "${styleGuide}". Theme: "${bookTitle}". Do not include any text.`;
            const coverImageUrl = await GeminiService.generateImage(coverImagePrompt);
            const coverPage = {
                text: `${bookTitle.trim()}\n\nby ${authorName.trim()}`,
                imageUrl: coverImageUrl
            };
            newPages.push(coverPage);
            setPages([...newPages]);

            // Step 6: Generate Content Pages
            for (let i = 0; i < paragraphs.length; i++) {
                setLoadingMessage(`Creating illustration ${i + 1} of ${paragraphs.length}...`);
                const paragraph = paragraphs[i];
                const imagePrompt = `A children's book illustration. Style Guide: "${styleGuide}". Scene: "${paragraph}".`;
                try {
                    const imageUrl = await GeminiService.generateImage(imagePrompt);
                    newPages.push({ text: paragraph, imageUrl });
                    setPages([...newPages]);
                } catch (imgError) {
                    console.error(`Failed to generate image for paragraph ${i + 1}:`, imgError);
                    newPages.push({ text: paragraph, imageUrl: '' }); // Add page even if image fails
                    setPages([...newPages]);
                }
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while generating the storybook.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleSaveStorybook = () => {
        if (pages.length === 0 || !prompt) return;
        const defaultTitle = pages[0]?.text.split('\n')[0] || "My New Storybook";
        const title = window.prompt("Enter a title for your storybook:", defaultTitle);
        if (title) {
            const saved = GeminiService.saveStorybook(title, prompt, pages);
            setSavedStorybookId(saved.id);
            GeminiService.clearInProgress(View.STORYBOOK_CREATOR);
        }
    };

    const handleExportToPdf = () => {
        if (pages.length === 0) return;

        const title = pages[0]?.text.split('\n')[0] || "My Storybook";
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow popups to export the storybook.");
            return;
        }

        const coverPageHtml = pages.map((page, index) => {
            if (index === 0) { // Cover page
                const [titleText, author] = page.text.split('\n\nby ');
                return `
                    <div class="page cover">
                        <img src="${page.imageUrl}" alt="Cover Image">
                        <h1>${titleText || ''}</h1>
                        ${author ? `<h2>by ${author}</h2>` : ''}
                    </div>
                `;
            }
            return null;
        }).join('');

        const contentPagesHtml = pages.slice(1).reduce((acc: string[], page, index) => {
            if (index % 2 === 0) { // This is a left page
                const rightPage = pages.slice(1)[index + 1];
                acc.push(`
                    <div class="page content-page">
                        <div class="page-half">
                            <img src="${page.imageUrl}" alt="Page ${index + 1} illustration">
                            <p>${page.text}</p>
                        </div>
                        ${rightPage ? `
                        <div class="page-half">
                            <img src="${rightPage.imageUrl}" alt="Page ${index + 2} illustration">
                            <p>${rightPage.text}</p>
                        </div>
                        ` : '<div class="page-half"></div>'}
                    </div>
                `);
            }
            return acc;
        }, []).join('');

        const content = `
            <html>
            <head>
                <title>Export: ${title}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');
                    body { font-family: 'Merriweather', serif; margin: 0; padding: 0; background-color: #f0f0f0; }
                    @page { size: A4 landscape; margin: 1cm; }
                    .page {
                        background-color: white; width: 29.7cm; height: 21cm;
                        box-sizing: border-box; padding: 1.5cm; page-break-after: always;
                        display: flex; flex-direction: column; justify-content: center; align-items: center;
                        border: 1px solid #ccc; margin: 1cm auto;
                    }
                    .page.cover { text-align: center; }
                    .page.content-page { flex-direction: row; gap: 2cm; align-items: stretch; }
                    .page-half { width: 50%; display: flex; flex-direction: column; }
                    img { max-width: 100%; max-height: 50%; object-fit: contain; border-radius: 8px; margin-bottom: 1em; }
                    .page.content-page img { max-height: 60%; }
                    .page.content-page p { font-size: 14pt; line-height: 1.6; overflow-y: auto; flex-grow: 1; }
                    h1 { font-size: 28pt; margin-bottom: 0.5em; }
                    h2 { font-size: 18pt; font-style: italic; color: #555; margin-top: 0; }
                    p { font-size: 16pt; line-height: 1.5; }
                    @media print {
                        body { background-color: white; }
                        .page { margin: 0; border: none; }
                    }
                </style>
            </head>
            <body>
                ${coverPageHtml}
                ${contentPagesHtml}
            </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
            printWindow.print();
        };
    };
    
    return (
        <div className="space-y-6">
            <ViewHeader icon={BookOpenIcon} title="Storybook Creator" description="Enter a topic and watch Gemini create a fully illustrated, high-quality storybook from start to finish." />
            {showResumePrompt && <ResumePrompt onResume={handleResume} onDismiss={handleDismissResume} />}
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A curious squirrel who learns to fly with the help of a wise old owl.'"
                className="w-full h-24 p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
                className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
            >
                {isLoading ? 'Creating...' : 'Create Storybook'}
            </button>
            {isLoading && <Loader text={loadingMessage}/>}
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

const IllustrationGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setImage('');
        try {
            const result = await GeminiService.generateImage(prompt);
            setImage(result);
        } catch (error) {
            console.error(error);
            alert("Failed to generate image.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={ImageIcon} title="Illustration Generator" description="Create high-quality, custom illustrations for worksheets, presentations, or storybooks."/>
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A cute cartoon capybara reading a book under a tree'"
                className="w-full p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt}
                className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
            >
                {isLoading ? 'Generating...' : 'Generate Illustration'}
            </button>
            {isLoading && <Loader text="Creating your masterpiece..."/>}
            {image && <img src={image} alt="Generated illustration" className="rounded-xl w-full max-w-xl mx-auto shadow-lg" />}
        </div>
    );
};


const ImageEditorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
    const [editedImage, setEditedImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileSelect = async (file: File) => {
        const base64 = await GeminiService.fileToBase64(file);
        setOriginalImage({ base64, mimeType: file.type, name: file.name });
        setEditedImage('');
    };
    
    const handleClearFile = () => {
        setOriginalImage(null);
        setEditedImage('');
    }

    const handleGenerate = async () => {
        if (!prompt || !originalImage) return;
        setIsLoading(true);
        setEditedImage('');
        try {
            const result = await GeminiService.editImage(prompt, originalImage);
            setEditedImage(result);
        } catch (error) {
            console.error(error);
            alert("Failed to edit image.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={EditIcon} title="Illustration Editor" description="Upload an image and use simple text prompts to make powerful edits." />
            <FileUploader onFileSelect={handleFileSelect} accept="image/*" selectedFile={originalImage} onClear={handleClearFile} />
            {originalImage && (
                <>
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'Add a retro filter' or 'Make the sky purple'"
                        className="w-full p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt}
                        className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
                    >
                        {isLoading ? 'Editing...' : 'Edit Illustration'}
                    </button>
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

const MediaAnalyzerView: React.FC = () => {
    const [prompt, setPrompt] = useState('Describe this image for a young student.');
    const [image, setImage] = useState<ImageFile | null>(null);
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleFileSelect = async (file: File) => {
        const base64 = await GeminiService.fileToBase64(file);
        setImage({ base64, mimeType: file.type, name: file.name });
        setAnalysis('');
    };

    const handleAnalyze = async () => {
        if (!prompt || !image) return;
        setIsLoading(true);
        setAnalysis('');
        try {
            const result = await GeminiService.analyzeImage(prompt, image);
            setAnalysis(result);
        } catch (error) {
            console.error(error);
            alert("Failed to analyze image.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={SearchIcon} title="Media Analyzer" description="Upload media and ask Gemini to analyze it, create quiz questions, or provide educational descriptions."/>
            <FileUploader onFileSelect={handleFileSelect} accept="image/*" selectedFile={image} onClear={() => setImage(null)}/>
            {image && (
                 <>
                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt="For analysis" className="rounded-xl w-full max-w-md mx-auto shadow-lg" />
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., 'What kind of animal is this?' or 'Create three quiz questions about this historical photo.'"
                        className="w-full h-24 p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !prompt}
                        className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
                    >
                        {isLoading ? 'Analyzing...' : 'Analyze Media'}
                    </button>
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


const AudiobookStudioView: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [ttsText, setTtsText] = useState('');
    const [isLoadingTTS, setIsLoadingTTS] = useState(false);
    const [micPermissionStatus, setMicPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const audioPlayerRef = useRef<HTMLAudioElement>(null);
    const sessionRef = useRef<Session | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const checkMicPermission = async () => {
            if (!navigator.permissions) {
                console.warn("Permissions API not supported.");
                return;
            }
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                setMicPermissionStatus(permissionStatus.state);
                permissionStatus.onchange = () => {
                    setMicPermissionStatus(permissionStatus.state);
                };
            } catch (error) {
                console.error("Could not query microphone permission:", error);
            }
        };

        checkMicPermission();

        return () => {
            // Cleanup on component unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (sessionRef.current) {
                sessionRef.current.close();
            }
        };
    }, []);

    const toggleRecording = async () => {
        if (isRecording) {
            setIsRecording(false);
            if(sessionRef.current) {
                sessionRef.current.close();
                sessionRef.current = null;
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        } else {
            setTranscript('');
            
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMicPermissionStatus('granted');
            } catch (error) {
                console.error("Failed to get microphone permission", error);
                setMicPermissionStatus('denied');
                alert("Microphone permission is required for this feature. Please enable it in your browser settings.");
                return;
            }

            setIsRecording(true);
            sessionRef.current = await GeminiService.startTranscriptionSession(streamRef.current, (newTranscript, isFinal) => {
                 setTranscript(newTranscript);
                 if(isFinal && newTranscript.trim()){
                     setTtsText(prev => `${prev ? prev + ' ' : ''}${newTranscript.trim()}`);
                 }
            });
        }
    };

    const handleGenerateAudio = async () => {
        if (!ttsText) return;
        setIsLoadingTTS(true);
        try {
            const audioBuffer = await GeminiService.textToSpeech(ttsText);
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // Create a Blob and Object URL to use with the HTMLAudioElement
            const outputBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
            for(let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                outputBuffer.copyToChannel(audioBuffer.getChannelData(channel), channel);
            }
            
            // Convert to WAV Blob
            const wavBlob = bufferToWave(outputBuffer, outputBuffer.length);
            const audioUrl = URL.createObjectURL(wavBlob);
            
            if (audioPlayerRef.current) {
                audioPlayerRef.current.src = audioUrl;
                audioPlayerRef.current.hidden = false;
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate audio.");
        } finally {
            setIsLoadingTTS(false);
        }
    };
    
    // Helper to convert AudioBuffer to a WAV Blob
    function bufferToWave(abuffer: AudioBuffer, len: number) {
      //... implementation omitted for brevity, but it's a standard algorithm
      let numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

      // write WAVE header
      setUint32(0x46464952);                         // "RIFF"
      setUint32(length - 8);                         // file length - 8
      setUint32(0x45564157);                         // "WAVE"

      setUint32(0x20746d66);                         // "fmt " chunk
      setUint32(16);                                 // length = 16
      setUint16(1);                                  // PCM (uncompressed)
      setUint16(numOfChan);
      setUint32(abuffer.sampleRate);
      setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
      setUint16(numOfChan * 2);                      // block-align
      setUint16(16);                                 // 16-bit
      
      setUint32(0x61746164);                         // "data" - chunk
      setUint32(length - pos - 4);                   // chunk length

      // write interleaved data
      for(i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

      while(pos < length) {
        for(i = 0; i < numOfChan; i++) {             // interleave channels
          sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
          sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
          view.setInt16(pos, sample, true);          // write 16-bit sample
          pos += 2;
        }
        offset++                                     // next source sample
      }

      function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
      }

      function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
      }

      return new Blob([buffer], {type: "audio/wav"});
    }


    return (
        <div className="space-y-6">
            <ViewHeader icon={MicIcon} title="Audiobook Studio" description="Transcribe speech to text using Gemini Live, then convert the final text into a high-quality audiobook narration." />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-xl font-bold text-brand-text mb-4">1. Transcribe from Speech</h3>
                     <button
                        onClick={toggleRecording}
                        disabled={micPermissionStatus === 'denied'}
                        className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all shadow-lg ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-accent hover:opacity-90'} ${micPermissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                         <MicIcon className="w-6 h-6"/>
                         <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                     </button>
                     {micPermissionStatus === 'denied' && <p className="text-red-400 text-sm mt-2">Microphone access denied. Please enable it in your browser settings to use this feature.</p>}
                     <div className="mt-4 p-4 bg-brand-primary/50 rounded-lg min-h-[100px] text-brand-text">
                        <p>{transcript || 'Live transcription will appear here...'}</p>
                     </div>
                </Card>
                <Card>
                    <h3 className="text-xl font-bold text-brand-text mb-4">2. Generate Audiobook</h3>
                    <textarea 
                        value={ttsText}
                        onChange={e => setTtsText(e.target.value)}
                        placeholder="Text from transcription or pasted text will appear here. You can edit it before generating audio."
                        className="w-full h-40 p-4 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                    />
                    <button
                        onClick={handleGenerateAudio}
                        disabled={isLoadingTTS || !ttsText}
                        className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg mt-4"
                    >
                        {isLoadingTTS ? 'Generating Audio...' : 'Generate Audio'}
                    </button>
                    {isLoadingTTS && <Loader text="Generating audio..." />}
                    <audio ref={audioPlayerRef} controls hidden className="w-full mt-4"></audio>
                </Card>
            </div>
        </div>
    );
};


const VideoGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [image, setImage] = useState<ImageFile | null>(null);
    const [video, setVideo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeySelected, setApiKeySelected] = useState(true);

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
        if (!prompt && !image) return;
        if (!(await checkApiKey())) return;

        setIsLoading(true);
        setVideo('');
        try {
            const result = await GeminiService.generateVideoVeo(prompt, aspectRatio, image);
            setVideo(result);
        } catch (error: any) {
            console.error(error);
            if (error?.message?.includes('Requested entity was not found')) {
                setApiKeySelected(false);
                alert("Video generation failed. Your API key might be invalid. Please select a valid key.");
            } else {
                alert("Failed to generate video.");
            }
        } finally {
            setIsLoading(false);
        }
    };

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
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A majestic eagle soaring over a mountain range at sunrise, cinematic style.'"
                className="w-full h-24 p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                    className="w-full p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                >
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                </select>
                <FileUploader onFileSelect={handleFileSelect} accept="image/*" selectedFile={image} onClear={() => setImage(null)}/>
            </div>
            <button
                onClick={handleGenerate}
                disabled={isLoading || (!prompt && !image)}
                className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
            >
                {isLoading ? 'Generating...' : 'Generate Video'}
            </button>
            {isLoading && <Loader text="Generating video, this may take a few minutes..."/>}
            {video && <video src={video} controls className="rounded-xl w-full max-w-xl mx-auto shadow-lg" />}
        </div>
    );
};

const FactCheckerView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState<{ text: string, sources: GroundingChunk[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setResult(null);
        try {
            const searchResult = await GeminiService.groundedSearch(prompt);
            setResult(searchResult);
        } catch (error) {
            console.error(error);
            alert("Failed to perform search.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={GlobeIcon} title="Fact Checker" description="Ask questions and get up-to-date answers grounded in Google Search results." />
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
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
                                {result.sources.map((source, index) => (
                                    source.web ? (
                                    <li key={index} className="truncate">
                                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">
                                           {index + 1}. {source.web.title}
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

const LessonPlanGeneratorView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [plan, setPlan] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    // Auto-save logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (topic || plan) {
                GeminiService.saveInProgress(View.LESSON_PLAN_GENERATOR, { topic, plan });
            }
        }, 60000); // Every 60 seconds

        return () => clearInterval(interval);
    }, [topic, plan]);

    // Resume logic on mount
    useEffect(() => {
        const savedProgress = GeminiService.loadInProgress(View.LESSON_PLAN_GENERATOR);
        if (savedProgress && (savedProgress.topic || savedProgress.plan)) {
            setShowResumePrompt(true);
        }
    }, []);
    
    const handleResume = () => {
        const savedProgress = GeminiService.loadInProgress(View.LESSON_PLAN_GENERATOR);
        if (savedProgress) {
            setTopic(savedProgress.topic || '');
            setPlan(savedProgress.plan || '');
        }
        setShowResumePrompt(false);
    };

    const handleDismissResume = () => {
        GeminiService.clearInProgress(View.LESSON_PLAN_GENERATOR);
        setShowResumePrompt(false);
    };

    const handleGenerate = async () => {
        if (!topic) return;
        GeminiService.clearInProgress(View.LESSON_PLAN_GENERATOR);
        setIsLoading(true);
        setPlan('');
        try {
            const prompt = `Create a structured lesson plan for the topic: "${topic}". Include the following sections: Learning Objectives, Materials, Activities (with estimated times), and Assessment Ideas. Format the output clearly using headings.`;
            const result = await GeminiService.complexGeneration(prompt);
            setPlan(result);
        } catch (error) {
            console.error(error);
            setPlan("An error occurred while generating the lesson plan.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleExport = (format: 'txt' | 'md') => {
        if (!plan) return;
        const filename = `${topic.slice(0, 20).replace(/\s+/g, '_') || 'lesson_plan'}.${format}`;
        const blob = new Blob([plan], { type: `text/${format === 'md' ? 'markdown' : 'plain'}` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <ViewHeader icon={ClipboardListIcon} title="Lesson Plan Generator" description="Enter a topic to generate a comprehensive and structured lesson plan for your class."/>
            {showResumePrompt && <ResumePrompt onResume={handleResume} onDismiss={handleDismissResume} />}
            <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., 'The Water Cycle for 3rd Graders' or 'Introduction to Photosynthesis for Middle School'"
                className="w-full h-24 p-4 bg-brand-secondary rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading || !topic}
                className="w-full bg-brand-accent text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg"
            >
                {isLoading ? 'Generating...' : 'Generate Lesson Plan'}
            </button>
            {isLoading && <Loader text="Building your lesson plan..."/>}
            {plan && (
                <Card>
                    <div className="prose prose-invert max-w-none prose-p:text-brand-text prose-headings:text-brand-text">
                        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{plan}</pre>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-600 flex justify-end space-x-2">
                        <button
                            onClick={() => handleExport('txt')}
                            title="Export as Text File"
                            className="flex items-center space-x-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-all shadow-md"
                        >
                            <DownloadIcon className="h-5 w-5" />
                            <span>.txt</span>
                        </button>
                        <button
                            onClick={() => handleExport('md')}
                            title="Export as Markdown File"
                            className="flex items-center space-x-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-all shadow-md"
                        >
                            <DownloadIcon className="h-5 w-5" />
                            <span>.md</span>
                        </button>
                    </div>
                </Card>
            )}
        </div>
    );
}

// --- MAIN APP COMPONENT ---

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const VIEWS: { [key in View]: React.ComponentType<any> } = {
        [View.DASHBOARD]: () => <DashboardView setActiveView={setActiveView} />,
        [View.STORY_WRITER]: StoryWriterView,
        [View.STORYBOOK_CREATOR]: StorybookCreatorView,
        [View.ILLUSTRATION_GENERATOR]: IllustrationGeneratorView,
        [View.IMAGE_EDITOR]: ImageEditorView,
        [View.MEDIA_ANALYZER]: MediaAnalyzerView,
        [View.AUDIOBOOK_STUDIO]: AudiobookStudioView,
        [View.VIDEO_GENERATOR]: VideoGeneratorView,
        [View.FACT_CHECKER]: FactCheckerView,
        [View.LESSON_PLAN_GENERATOR]: LessonPlanGeneratorView,
    };

    const ActiveViewComponent = VIEWS[activeView];

    return (
        <div className="min-h-screen text-brand-text font-sans flex">
            {/* Mobile Sidebar */}
            <div className={`fixed inset-0 bg-black/50 z-40 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`} onClick={() => setIsSidebarOpen(false)}></div>
            <div className={`fixed top-0 left-0 h-full z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
                <Sidebar activeView={activeView} setActiveView={setActiveView} onNavigate={() => setIsSidebarOpen(false)} />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:flex-shrink-0">
                <Sidebar activeView={activeView} setActiveView={setActiveView} onNavigate={() => {}} />
            </div>

            <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
                 <button className="md:hidden p-2 -ml-2 mb-4" onClick={() => setIsSidebarOpen(true)}>
                    <MenuIcon className="h-6 w-6"/>
                </button>
                <ActiveViewComponent />
            </main>
        </div>
    );
};

export default App;
