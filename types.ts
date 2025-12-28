export interface FactSummary {
  name: string;
  missingDate: string;
  location: string;
  physicalFeatures: string;
  situation: string;
  familyMessage: string;
}

export interface MusicDirection {
  genre: string;
  bpmRange: string;
  instruments: string;
  vocalStyle: string;
}

export interface SongTrack {
  titleKO: string;
  titleEN: string;
  stylePrompt: string;
  lyrics: string;
}

export interface YoutubePackage {
  title: string;
  descriptionKR: string;
  descriptionEN: string;
  tags: string[];
  hashtags: string[];
}

export interface ImagePrompt {
  section: string;
  imagePromptEN: string;
  negativePromptEN: string;
  aspectRatio: string;
  styleKeywords: string;
  generatedImage?: string; 
}

export interface VisualSettings {
  lighting: string;
  angle: string;
  background: string;
  style: string;
}

export interface MusicSettings {
  genre: string;
  mood: string;
  instruments: string;
  tempo: string;
}

export interface GenerationResult {
  factSummary: FactSummary;
  storyType: string;
  emotionalIntent: string;
  musicDirection: MusicDirection;
  track1: SongTrack;
  track2: SongTrack;
  youtubePackage: YoutubePackage;
  imagePrompts: ImagePrompt[];
}

export interface GenerationOptions {
  apiKey?: string; // Added field for custom API key
  sourceText: string;
  manualMusicStyle?: string;
  autoGenerateImages: boolean;
  aspectRatio: "1:1" | "4:3" | "16:9" | "9:16";
  visualSettings: VisualSettings;
  musicSettings: MusicSettings;
  referenceImages?: string[]; // base64 strings
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  data: GenerationResult;
  sourceText: string;
}

export enum AppStep {
  INPUT = 'INPUT',
  CONFIRMATION = 'CONFIRMATION',
  GENERATING = 'GENERATING',
  RESULTS = 'RESULTS',
}