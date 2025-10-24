import React, { useState } from 'react';
import { View } from '../types';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { ResumePrompt } from '../components/ui/ResumePrompt';
import { GenerateButton } from '../components/ui/GenerateButton';
import { ClipboardListIcon, DownloadIcon } from '../components/Icons';
import { useAutoSave } from '../hooks/useAutoSave';
import { useGemini } from '../hooks/useGemini';
import * as GeminiService from '../services';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { audienceOptions, lessonPlanDurationOptions, lessonPlanActivityOptions } from '../constants';

const LessonPlanGeneratorView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [audience, setAudience] = useState(audienceOptions[3].value);
    const [duration, setDuration] = useState(lessonPlanDurationOptions[2].value);
    const [activities, setActivities] = useState<string[]>([]);
    
    const { data: plan, isLoading, execute: generatePlan, setData: setPlan } = useGemini(
        GeminiService.complexGeneration,
        undefined,
        "Failed to generate lesson plan"
    );

    const { showResumePrompt, setShowResumePrompt, loadSavedProgress, clearSavedProgress } = useAutoSave(
        View.LESSON_PLAN_GENERATOR,
        { topic, audience, duration, activities, plan },
        !!(topic || plan)
    );
    
    const handleResume = () => {
        const savedProgress = loadSavedProgress();
        if (savedProgress) {
            setTopic(savedProgress.topic || '');
            setAudience(savedProgress.audience || audienceOptions[3].value);
            setDuration(savedProgress.duration || lessonPlanDurationOptions[2].value);
            setActivities(savedProgress.activities || []);
            setPlan(savedProgress.plan || '');
        }
        setShowResumePrompt(false);
    };

    const handleDismissResume = () => {
        clearSavedProgress();
    };

    const handleActivityChange = (activity: string, isChecked: boolean) => {
        setActivities(prev => isChecked ? [...prev, activity] : prev.filter(a => a !== activity));
    };

    const handleGenerate = () => {
        if (!topic || !audience) return;
        clearSavedProgress();
        let fullPrompt = `Create a structured lesson plan for the topic: "${topic}" for ${audience}. The lesson should be designed for a ${duration} session.`;
        if(activities.length > 0){
            fullPrompt += ` Please include the following types of activities: ${activities.join(', ')}.`;
        }
        fullPrompt += ` The plan must include these sections: Learning Objectives, Materials, a detailed schedule of Activities (with estimated times), and Assessment Ideas. Format the output clearly using Markdown headings.`;
        generatePlan(fullPrompt).catch(() => {});
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
            <ViewHeader icon={ClipboardListIcon} title="Lesson Plan Generator" description="Enter a topic and target audience to generate a comprehensive lesson plan."/>
            {showResumePrompt && <ResumePrompt onResume={handleResume} onDismiss={handleDismissResume} />}
            
            <Card>
                <h3 className="text-xl font-bold text-brand-text mb-4">1. Lesson Details</h3>
                <div className="space-y-4">
                    <textarea
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., 'The Water Cycle' or 'Introduction to Photosynthesis'"
                        className="w-full h-24 p-4 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Target Audience" value={audience} onChange={e => setAudience(e.target.value)} options={audienceOptions} />
                        <Select label="Lesson Duration" value={duration} onChange={e => setDuration(e.target.value)} options={lessonPlanDurationOptions} />
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold text-brand-text mb-4">2. Activities (Optional)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {lessonPlanActivityOptions.map(activity => (
                        <Checkbox 
                            key={activity}
                            label={activity}
                            checked={activities.includes(activity)}
                            onChange={e => handleActivityChange(activity, e.target.checked)}
                        />
                    ))}
                </div>
            </Card>
            
            <GenerateButton
                onClick={handleGenerate}
                isLoading={isLoading}
                disabled={!topic || !audience}
                loadingText="Generating..."
            >
                Generate Lesson Plan
            </GenerateButton>
            
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

export default LessonPlanGeneratorView;
