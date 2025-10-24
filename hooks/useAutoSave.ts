import { useState, useEffect } from 'react';
import { View } from '../types';
import * as GeminiService from '../services';

export const useAutoSave = <T extends object>(view: View, dataToSave: T, isDataPresent: boolean) => {
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isDataPresent) {
                GeminiService.saveInProgress(view, dataToSave);
            }
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [view, dataToSave, isDataPresent]);

    useEffect(() => {
        const savedProgress = GeminiService.loadInProgress(view);
        if (savedProgress && Object.values(savedProgress).some(val => Array.isArray(val) ? val.length > 0 : !!val)) {
            setShowResumePrompt(true);
        }
    }, [view]);

    const loadSavedProgress = (): T | null => {
        return GeminiService.loadInProgress(view);
    };

    const clearSavedProgress = () => {
        GeminiService.clearInProgress(view);
        setShowResumePrompt(false);
    };

    return {
        showResumePrompt,
        setShowResumePrompt,
        loadSavedProgress,
        clearSavedProgress,
    };
};
