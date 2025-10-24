import React from 'react';
import { View } from '../types';
import { 
    HomeIcon, BrainCircuitIcon, BookOpenIcon, ClipboardListIcon, FileQuestionIcon, 
    ImageIcon, EditIcon, SearchIcon, MicIcon, VideoIcon, GlobeIcon, SparklesIcon 
} from './Icons';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onNavigate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onNavigate }) => {
  const navItems = [
    { view: View.DASHBOARD, icon: HomeIcon, label: 'Dashboard' },
    { view: View.STORY_WRITER, icon: BrainCircuitIcon, label: 'Story Writer' },
    { view: View.STORYBOOK_CREATOR, icon: BookOpenIcon, label: 'Storybook Creator' },
    { view: View.LESSON_PLAN_GENERATOR, icon: ClipboardListIcon, label: 'Lesson Plan Generator' },
    { view: View.ASSESSMENT_GENERATOR, icon: FileQuestionIcon, label: 'Assessment Generator' },
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
