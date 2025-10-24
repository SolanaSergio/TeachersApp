import React, { useState, Suspense, lazy } from 'react';
import { View } from './types';
import { MenuIcon } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { Loader } from './components/ui/Loader';
import { ToastProvider } from './contexts/ToastContext';

// Lazy load all the view components
const viewImports = {
  [View.DASHBOARD]: lazy(() => import('./views/DashboardView')),
  [View.STORY_WRITER]: lazy(() => import('./views/StoryWriterView')),
  [View.STORYBOOK_CREATOR]: lazy(() => import('./views/StorybookCreatorView')),
  [View.LESSON_PLAN_GENERATOR]: lazy(() => import('./views/LessonPlanGeneratorView')),
  [View.ASSESSMENT_GENERATOR]: lazy(() => import('./views/AssessmentGeneratorView')),
  [View.ILLUSTRATION_GENERATOR]: lazy(() => import('./views/IllustrationGeneratorView')),
  [View.IMAGE_EDITOR]: lazy(() => import('./views/ImageEditorView')),
  [View.MEDIA_ANALYZER]: lazy(() => import('./views/MediaAnalyzerView')),
  [View.AUDIOBOOK_STUDIO]: lazy(() => import('./views/AudiobookStudioView')),
  [View.VIDEO_GENERATOR]: lazy(() => import('./views/VideoGeneratorView')),
  [View.FACT_CHECKER]: lazy(() => import('./views/FactCheckerView')),
};

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const ActiveViewComponent = viewImports[activeView];

    return (
      <ToastProvider>
        <div className="min-h-screen text-brand-text font-sans flex bg-brand-primary">
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
                 <button className="md:hidden p-2 -ml-2 mb-4 text-brand-subtle" onClick={() => setIsSidebarOpen(true)} aria-label="Open menu">
                    <MenuIcon className="h-6 w-6"/>
                </button>
                <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader text="Loading..." /></div>}>
                  <ActiveViewComponent setActiveView={setActiveView} />
                </Suspense>
            </main>
        </div>
      </ToastProvider>
    );
};

export default App;
