import React, { useState, useRef, useEffect } from 'react';
import type { Session } from '@google/genai';
import { ViewHeader } from '../components/ui/ViewHeader';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';
import { GenerateButton } from '../components/ui/GenerateButton';
import { MicIcon, DownloadIcon } from '../components/Icons';
import * as GeminiService from '../services';
import { useToast } from '../contexts/ToastContext';
import { useMicPermission } from '../hooks/useMicPermission';
import { useGemini } from '../hooks/useGemini';
import { Select } from '../components/ui/Select';
import { ttsVoices } from '../constants';

const AudiobookStudioView: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [ttsText, setTtsText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState('Kore');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const sessionRef = useRef<Session | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const { showToast } = useToast();
    const micPermissionStatus = useMicPermission();

    const { isLoading: isLoadingTTS, execute: generateAudio } = useGemini(
        GeminiService.textToSpeech,
        undefined,
        "Failed to generate audio"
    );

    useEffect(() => {
        return () => {
            // Cleanup on component unmount
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
            if (sessionRef.current) sessionRef.current.close();
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

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
                setIsRecording(true);
                sessionRef.current = await GeminiService.startTranscriptionSession(streamRef.current, (newTranscript, isFinal) => {
                     setTranscript(newTranscript);
                     if(isFinal && newTranscript.trim()){
                         setTtsText(prev => `${prev ? prev + ' ' : ''}${newTranscript.trim()}`);
                     }
                });
            } catch (error) {
                console.error("Failed to get microphone permission", error);
                showToast("Microphone permission is required. Please enable it in your browser settings.", 'error');
                return;
            }
        }
    };

    const handleGenerateAudio = async () => {
        if (!ttsText) return;
        setAudioUrl(null);
        try {
            const audioBuffer = await generateAudio(ttsText, selectedVoice);
            const wavBlob = GeminiService.bufferToWave(audioBuffer, audioBuffer.length);
            const url = URL.createObjectURL(wavBlob);
            setAudioUrl(url);
        } catch (error) {
            // Error is already handled by the useGemini hook
        }
    };
    
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
                <Card className="flex flex-col">
                    <h3 className="text-xl font-bold text-brand-text mb-4">2. Generate Audiobook</h3>
                    <textarea 
                        value={ttsText}
                        onChange={e => setTtsText(e.target.value)}
                        placeholder="Text from transcription or pasted text will appear here. You can edit it before generating audio."
                        className="w-full h-40 p-4 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none focus:ring-offset-2 focus:ring-offset-brand-primary transition-shadow mb-4"
                    />
                     <div className="mb-4">
                        <Select 
                            label="Select Voice"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            options={ttsVoices}
                        />
                    </div>
                    <GenerateButton
                        onClick={handleGenerateAudio}
                        isLoading={isLoadingTTS}
                        disabled={!ttsText}
                        loadingText="Generating Audio..."
                    >
                        Generate Audio
                    </GenerateButton>
                    <div className="flex-grow mt-4">
                        {isLoadingTTS && <div className="flex justify-center items-center h-full"><Loader text="Generating audio..." /></div>}
                        {audioUrl && (
                            <div className="space-y-2">
                               <audio src={audioUrl} controls className="w-full"></audio>
                               <a
                                    href={audioUrl}
                                    download="narration.wav"
                                    className="flex items-center justify-center space-x-2 w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-500 transition-all shadow-md"
                               >
                                   <DownloadIcon className="h-5 w-5"/>
                                   <span>Download Audio</span>
                               </a>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AudiobookStudioView;
