export enum View {
  DASHBOARD = 'Dashboard',
  STORY_WRITER = 'Story Writer',
  STORYBOOK_CREATOR = 'Storybook Creator',
  LESSON_PLAN_GENERATOR = 'Lesson Plan Generator',
  ASSESSMENT_GENERATOR = 'Assessment Generator',
  ILLUSTRATION_GENERATOR = 'Illustration Generator',
  IMAGE_EDITOR = 'Image Editor',
  MEDIA_ANALYZER = 'Media Analyzer',
  AUDIOBOOK_STUDIO = 'Audiobook Studio',
  VIDEO_GENERATOR = 'Video Generator',
  FACT_CHECKER = 'Fact Checker',
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
}

export interface GroundingChunk {
  // FIX: Make uri and title optional to match the type from @google/genai.
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface SavedStorybookPage {
  text: string;
  imageUrl: string;
}

export interface SavedContent {
  id: string;
  type: 'Story' | 'Storybook';
  title: string;
  prompt: string;
  content?: string; // For Story
  pages?: SavedStorybookPage[]; // For Storybook
  createdAt: string;
  bookmarkPageIndex?: number;
}

export type QuestionType = 'multiple-choice' | 'short-answer' | 'true-false' | 'fill-in-the-blank';

export interface Question {
  question: string;
  type: QuestionType;
  options?: string[];
  answer: string;
}

export interface Quiz {
  title: string;
  questions: Question[];
}

export interface StorybookContent {
  title: string;
  authorName: string;
  illustrationStyleGuide: string;
  storyPages: string[];
}