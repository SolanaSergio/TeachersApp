import React, { useState, useEffect } from 'react';
import { View, SavedContent } from '../types';
import { 
    BookIcon, BookOpenIcon, ImageIcon, VideoIcon, GlobeIcon, 
    ClipboardListIcon, FileQuestionIcon, TrashIcon 
} from '../components/Icons';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { StorybookViewer } from '../components/StorybookViewer';
import * as GeminiService from '../services';

interface DashboardViewProps {
    setActiveView: (view: View) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ setActiveView }) => {
    const features = [
      { view: View.LESSON_PLAN_GENERATOR, icon: ClipboardListIcon, title: 'Generate a Lesson Plan', description: 'Quickly create a structured plan for any topic, complete with activities.' },
      { view: View.STORYBOOK_CREATOR, icon: BookOpenIcon, title: 'Create a Storybook', description: 'Generate a complete, illustrated story from a simple prompt.' },
      { view: View.ASSESSMENT_GENERATOR, icon: FileQuestionIcon, title: 'Create an Assessment', description: 'Generate a quiz from a block of text to check for understanding.' },
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

export default DashboardView;
