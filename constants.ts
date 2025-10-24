import { AspectRatio, QuestionType } from './types';

// --- SHARED OPTIONS ---

export const audienceOptions: { value: string; label: string }[] = [
    { value: "Toddlers (Ages 1-3)", label: "Toddler (Ages 1-3)" },
    { value: "Preschoolers (Ages 3-5)", label: "Preschool (Ages 3-5)" },
    { value: "Early Elementary (Grades K-2)", label: "Early Elementary (K-2)" },
    { value: "Upper Elementary (Grades 3-5)", label: "Upper Elementary (3-5)" },
    { value: "Middle School (Grades 6-8)", label: "Middle School (6-8)" },
    { value: "High School (Grades 9-12)", label: "High School (9-12)" },
    { value: "University Students", label: "University" },
    { value: "Adult Learners", label: "Adult Learner" },
];

export const storyGenreOptions: { value: string; label: string }[] = [
    { value: "Any", label: "Any Genre" },
    { value: "Fantasy", label: "Fantasy" },
    { value: "Science Fiction", label: "Science Fiction" },
    { value: "Mystery", label: "Mystery" },
    { value: "Adventure", label: "Adventure" },
    { value: "Fairy Tale", label: "Fairy Tale" },
    { value: "Historical Fiction", label: "Historical Fiction" },
    { value: "Comedy", label: "Comedy" },
    { value: "Educational", label: "Educational" },
];

export const storyToneOptions: { value: string; label: string }[] = [
    { value: "Any", label: "Any Tone" },
    { value: "Humorous", label: "Humorous" },
    { value: "Serious", label: "Serious" },
    { value: "Whimsical", label: "Whimsical" },
    { value: "Suspenseful", label: "Suspenseful" },
    { value: "Heartwarming", label: "Heartwarming" },
    { value: "Inspirational", label: "Inspirational" },
    { value: "Mysterious", label: "Mysterious" },
];

// --- TOOL-SPECIFIC OPTIONS ---

// Assessment Generator
export const assessmentQuestionTypes: { id: QuestionType; label: string }[] = [
    { id: 'multiple-choice', label: 'Multiple Choice' },
    { id: 'short-answer', label: 'Short Answer' },
    { id: 'true-false', label: 'True / False' },
    { id: 'fill-in-the-blank', label: 'Fill in the Blank' },
];

export const assessmentDifficultyOptions: { value: string; label: string }[] = [
    { value: 'Easy', label: 'Easy' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Hard', label: 'Hard' },
    { value: 'Expert', label: 'Expert' },
];

// Audiobook Studio
export const ttsVoices: { value: string; label: string }[] = [
    { value: 'Kore', label: 'Kore (Calm, Female)' },
    { value: 'Puck', label: 'Puck (Energetic, Male)' },
    { value: 'Zephyr', label: 'Zephyr (Friendly, Female)' },
    { value: 'Charon', label: 'Charon (Deep, Male)' },
    { value: 'Fenrir', label: 'Fenrir (Strong, Male)' },
];

// Illustration Generator
export const illustrationStylePresets: { name: string; prompt: string }[] = [
    { name: 'Default', prompt: '' },
    { name: 'Cartoon', prompt: 'in a cute, vibrant cartoon style for children' },
    { name: 'Watercolor', prompt: 'in a soft, flowing watercolor painting style' },
    { name: 'Pixel Art', prompt: 'as colorful 16-bit pixel art' },
    { name: 'Line Art', prompt: 'as a clean black and white line art drawing' },
    { name: 'Photorealistic', prompt: 'photorealistic, 8k, detailed, professional photography' },
    { name: 'Fantasy Art', prompt: 'in a detailed, epic fantasy art style' },
    { name: '3D Render', prompt: 'as a polished 3D render' },
];

export const illustrationAspectRatioOptions: { value: AspectRatio, label: string }[] = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '3:4', label: 'Book Cover (3:4)' },
    { value: '4:3', label: 'Illustration (4:3)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
];

// Image Editor
export const imageEditPresets: { name: string; prompt: string }[] = [
    { name: 'Vintage', prompt: 'Add a retro, vintage filter with faded colors and slight grain' },
    { name: 'Vibrant', prompt: 'Make the colors more vibrant and saturated, enhance the contrast' },
    { name: 'B&W', prompt: 'Convert to a dramatic black and white photo' },
    { name: 'Glow', prompt: 'Add a soft, dreamy glow effect to the image' },
    { name: 'Sunset BG', prompt: 'Realistically change the background to a beautiful sunset over a beach' },
    { name: 'Painterly', prompt: 'Give it a painterly, artistic style, like an oil painting' },
    { name: 'Remove BG', prompt: 'Remove the background, leaving the main subject on a transparent background' },
    { name: 'Add Confetti', prompt: 'Add falling colorful confetti all over the image' },
];

// Lesson Plan Generator
export const lessonPlanDurationOptions: { value: string; label: string }[] = [
    { value: "15 minutes (Quick Activity)", label: "15 Min (Quick Activity)" },
    { value: "30 minutes", label: "30 Minutes" },
    { value: "45 minutes", label: "45 Minutes" },
    { value: "60 minutes (1 Hour)", label: "60 Min (1 Hour)" },
    { value: "90 minutes (1.5 Hours)", label: "90 Min (1.5 Hours)" },
];

export const lessonPlanActivityOptions: string[] = ['Group Work', 'Individual Assignment', 'Presentation', 'Experiment', 'Discussion', 'Creative Project', 'Quiz'];

// Media Analyzer
export const mediaAnalysisPresets: { name: string; prompt: string }[] = [
    { name: 'Detailed Description', prompt: 'Describe this image in detail for a 5th grader. Explain what is happening and what objects are present.' },
    { name: 'Quiz Questions', prompt: 'Generate three multiple-choice quiz questions based on this image, along with the correct answers. The questions should test observation skills.' },
    { name: 'Historical Context', prompt: 'If this is a historical photo, what is the historical context? Who are the people, what is happening, and why is it significant?' },
    { name: 'Story Starter', prompt: 'Write a short, imaginative story paragraph inspired by this image. The paragraph should be a compelling opening for a mystery story.' },
    { name: 'Identify Elements', prompt: 'List the key objects, people, and animals visible in this image.' },
];

// Storybook Creator
export const storybookIllustrationStyleOptions: { name: string; prompt: string }[] = [
    { name: 'Default', prompt: '' },
    { name: 'Cartoon', prompt: 'in a cute, vibrant cartoon style suitable for young children' },
    { name: 'Watercolor', prompt: 'in a soft, flowing watercolor style with gentle colors' },
    { name: 'Line Art', prompt: 'as a clean black and white line art drawing, like a coloring book page' },
    { name: 'Vintage', prompt: 'in a classic, vintage storybook illustration style from the 1950s' },
    { name: 'Claymation', prompt: 'in the style of claymation, with visible textures and fingerprints' },
];


// Video Generator
export const videoStylePresets: { name: string; suffix: string }[] = [
    { name: 'Default', suffix: '' },
    { name: 'Cinematic', suffix: ', cinematic style, high detail, 8k, dramatic lighting' },
    { name: 'Animated', suffix: ', in the style of a 3D animated movie, vibrant colors' },
    { name: 'Time-lapse', suffix: ', as a fast-paced time-lapse video' },
    { name: 'Documentary', suffix: ', in a realistic documentary style with a steady camera' },
    { name: 'Vintage Film', suffix: ', as if shot on grainy, vintage 8mm film' },
    { name: 'Dreamy', suffix: ', with a soft, dream-like, ethereal quality' },
];