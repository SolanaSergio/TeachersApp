import { GoogleGenAI, Modality, GenerateContentResponse, LiveServerMessage, Blob, Type } from "@google/genai";
import { View } from './types';
import type { AspectRatio, ImageFile, GroundingChunk, SavedContent, SavedStorybookPage } from './types';

// --- UTILS ---

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

// --- AUDIO UTILS for Live API & TTS ---

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const encode = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const createPcmBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};


// --- LOCALSTORAGE SERVICES ---

const SAVED_CONTENT_KEY = 'teachersSuperApp_savedContent';
const IN_PROGRESS_CONTENT_KEY = 'teachersSuperApp_inProgressContent';

export const getSavedContent = (): SavedContent[] => {
    try {
        const rawContent = localStorage.getItem(SAVED_CONTENT_KEY);
        return rawContent ? JSON.parse(rawContent) : [];
    } catch (error) {
        console.error("Failed to get saved content:", error);
        return [];
    }
};

export const saveStory = (title: string, prompt: string, content: string): SavedContent => {
    const allContent = getSavedContent();
    const newStory: SavedContent = {
        id: new Date().toISOString() + Math.random(), // Add random to avoid collision
        type: 'Story',
        title: title,
        prompt: prompt,
        content: content,
        createdAt: new Date().toISOString(),
    };
    const updatedContent = [newStory, ...allContent];
    localStorage.setItem(SAVED_CONTENT_KEY, JSON.stringify(updatedContent));
    return newStory;
};

export const saveStorybook = (title: string, prompt: string, pages: SavedStorybookPage[]): SavedContent => {
    const allContent = getSavedContent();
    const newStorybook: SavedContent = {
        id: new Date().toISOString() + Math.random(),
        type: 'Storybook',
        title: title,
        prompt: prompt,
        pages: pages,
        createdAt: new Date().toISOString(),
        bookmarkPageIndex: 0,
    };
    const updatedContent = [newStorybook, ...allContent];
    localStorage.setItem(SAVED_CONTENT_KEY, JSON.stringify(updatedContent));
    return newStorybook;
};

export const saveBookmark = (contentId: string, pageIndex: number): boolean => {
    try {
        const allContent = getSavedContent();
        const contentIndex = allContent.findIndex(item => item.id === contentId);
        if (contentIndex > -1 && allContent[contentIndex].type === 'Storybook') {
            allContent[contentIndex].bookmarkPageIndex = pageIndex;
            localStorage.setItem(SAVED_CONTENT_KEY, JSON.stringify(allContent));
            return true;
        }
        return false;
    } catch (error) {
        console.error("Failed to save bookmark:", error);
        return false;
    }
};

export const deleteContent = (contentId: string): void => {
    try {
        let allContent = getSavedContent();
        allContent = allContent.filter(item => item.id !== contentId);
        localStorage.setItem(SAVED_CONTENT_KEY, JSON.stringify(allContent));
    } catch (error) {
        console.error("Failed to delete content:", error);
    }
};

// --- AUTO-SAVE & RESUME SERVICES ---

const getInProgressObject = (): { [key: string]: any } => {
    try {
        const rawContent = localStorage.getItem(IN_PROGRESS_CONTENT_KEY);
        return rawContent ? JSON.parse(rawContent) : {};
    } catch (error) {
        console.error("Failed to get in-progress content:", error);
        return {};
    }
};

export const saveInProgress = (view: View, data: any): void => {
    try {
        const allInProgress = getInProgressObject();
        allInProgress[view] = data;
        localStorage.setItem(IN_PROGRESS_CONTENT_KEY, JSON.stringify(allInProgress));
    } catch (error) {
        console.error(`Failed to save in-progress content for ${view}:`, error);
    }
};

export const loadInProgress = (view: View): any | null => {
    try {
        const allInProgress = getInProgressObject();
        return allInProgress[view] || null;
    } catch (error) {
        console.error(`Failed to load in-progress content for ${view}:`, error);
        return null;
    }
};

export const clearInProgress = (view: View): void => {
    try {
        const allInProgress = getInProgressObject();
        if (allInProgress[view]) {
            delete allInProgress[view];
            localStorage.setItem(IN_PROGRESS_CONTENT_KEY, JSON.stringify(allInProgress));
        }
    } catch (error) {
        console.error(`Failed to clear in-progress content for ${view}:`, error);
    }
};


// --- GEMINI API SERVICES ---

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const editImage = async (prompt: string, image: ImageFile): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: image.base64, mimeType: image.mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const content = response?.candidates?.[0]?.content;
    if (content?.parts) {
        for (const part of content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
    }
    
    const blockReason = response?.promptFeedback?.blockReason;
    if (blockReason) {
        throw new Error(`Image editing was blocked. Reason: ${blockReason}`);
    }
    throw new Error("Image editing failed. The response may have been empty or blocked.");
};

export const generateImage = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const content = response?.candidates?.[0]?.content;
    if (content?.parts) {
        for (const part of content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
    }

    const blockReason = response?.promptFeedback?.blockReason;
    if (blockReason) {
        throw new Error(`Image generation was blocked. Reason: ${blockReason}`);
    }
    throw new Error("Image generation failed. The response may have been empty or blocked.");
};

export const generateVideoVeo = async (prompt: string, aspectRatio: '16:9' | '9:16', image?: ImageFile) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); // Re-init to get latest key
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio,
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const analyzeImage = async (prompt: string, image: ImageFile): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { data: image.base64, mimeType: image.mimeType } },
            ]
        },
    });
    return response.text;
};

export const textToSpeech = async (text: string): Promise<AudioBuffer> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("TTS generation failed");
    }

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
};


export const startTranscriptionSession = (stream: MediaStream, onTranscriptUpdate: (transcript: string, isFinal: boolean) => void) => {
    const ai = getAiClient();
    let currentInputTranscription = '';

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                console.log('Live session opened.');
                const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                const source = inputAudioContext.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    sessionPromise.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    currentInputTranscription += text;
                    onTranscriptUpdate(currentInputTranscription, false);
                }
                if (message.serverContent?.turnComplete) {
                    onTranscriptUpdate(currentInputTranscription, true);
                    currentInputTranscription = '';
                }
            },
            onerror: (e: ErrorEvent) => console.error('Live session error:', e),
            onclose: (e: CloseEvent) => console.log('Live session closed.'),
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
        },
    });

    return sessionPromise;
};


export const groundedSearch = async (prompt: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    return {
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
};

export const complexGeneration = async (prompt: string): Promise<string> => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        },
    });
    return response.text;
};