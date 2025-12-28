import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GenerationResult, GenerationOptions } from "../types";

const generationSchema = {
  type: Type.OBJECT,
  properties: {
    factSummary: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        missingDate: { type: Type.STRING },
        location: { type: Type.STRING },
        physicalFeatures: { type: Type.STRING },
        situation: { type: Type.STRING },
        familyMessage: { type: Type.STRING },
      },
      required: ["name", "missingDate", "location", "physicalFeatures", "situation", "familyMessage"],
    },
    storyType: { type: Type.STRING },
    emotionalIntent: { type: Type.STRING },
    musicDirection: {
      type: Type.OBJECT,
      properties: {
        genre: { type: Type.STRING },
        bpmRange: { type: Type.STRING },
        instruments: { type: Type.STRING },
        vocalStyle: { type: Type.STRING },
      },
      required: ["genre", "bpmRange", "instruments", "vocalStyle"],
    },
    track1: {
      type: Type.OBJECT,
      properties: {
        titleKO: { type: Type.STRING },
        titleEN: { type: Type.STRING },
        stylePrompt: { type: Type.STRING },
        lyrics: { type: Type.STRING },
      },
      required: ["titleKO", "titleEN", "stylePrompt", "lyrics"],
    },
    track2: {
      type: Type.OBJECT,
      properties: {
        titleKO: { type: Type.STRING },
        titleEN: { type: Type.STRING },
        stylePrompt: { type: Type.STRING },
        lyrics: { type: Type.STRING },
      },
      required: ["titleKO", "titleEN", "stylePrompt", "lyrics"],
    },
    youtubePackage: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        descriptionKR: { type: Type.STRING },
        descriptionEN: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["title", "descriptionKR", "descriptionEN", "tags", "hashtags"],
    },
    imagePrompts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING },
          imagePromptEN: { type: Type.STRING },
          negativePromptEN: { type: Type.STRING },
          aspectRatio: { type: Type.STRING },
          styleKeywords: { type: Type.STRING },
        },
        required: ["section", "imagePromptEN", "negativePromptEN", "aspectRatio", "styleKeywords"],
      },
    },
  },
  required: [
    "factSummary", "storyType", "emotionalIntent", "musicDirection", "track1", "track2", "youtubePackage", "imagePrompts"
  ],
};

// Helper to get the valid API key
const getApiKey = (providedKey?: string) => {
  const key = providedKey || process.env.API_KEY;
  if (!key) throw new Error("Gemini API Key가 필요합니다. 설정(Settings) 메뉴에서 키를 입력해주세요.");
  return key;
};

// --- NEW: Test Connection Function ---
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Minimal token usage request to test auth
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
    });
    return true;
  } catch (e) {
    console.error("API Key Validation Failed:", e);
    throw e;
  }
};

// --- RESTORED: Missing Children YouTube Analysis ---
export const analyzeYoutubeContent = async (rawText: string, providedKey?: string): Promise<string> => {
  const apiKey = getApiKey(providedKey);
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `이 텍스트는 실종 아동 관련 뉴스 보도나 전단지의 내용입니다. 
    이 텍스트에서 실종 아동의 이름, 나이, 실종된 날짜, 실종 장소, 신체 특징(키, 체중, 착의, 흉터 등), 실종 당시의 상황을 추출하여 
    "한 편의 완성된 실종 아동 프로필 및 사연" 형태로 다시 작성해주세요. 
    불필요한 인사말이나 앵커 멘트는 모두 제거하고 팩트 위주로 작성하세요. 반드시 한국어로 작성하세요.
    
    데이터:\n${rawText}`,
    config: {
      temperature: 0.7,
      topP: 0.95,
    }
  });

  return response.text || "분석 결과가 없습니다.";
};

export const generateContent = async (options: GenerationOptions): Promise<GenerationResult> => {
  const apiKey = getApiKey(options.apiKey);
  const ai = new GoogleGenAI({ apiKey });

  const musicDirectives = `MUSIC_STUDIO_SETTINGS: [Genre: ${options.musicSettings.genre}, Mood: ${options.musicSettings.mood}, Instruments: ${options.musicSettings.instruments}, Tempo: ${options.musicSettings.tempo}]. ${options.manualMusicStyle || ''}`;
  const visualDirectives = `VISUAL_STUDIO_SETTINGS: [Lighting: ${options.visualSettings.lighting}, Angle: ${options.visualSettings.angle}, Background: ${options.visualSettings.background}, Style: ${options.visualSettings.style}]`;

  let promptContent = `SOURCE_TEXT:\n${options.sourceText}\n\n`;
  promptContent += `USER_DIRECTIVES:\n${musicDirectives}\n${visualDirectives}\n`;
  
  const textResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: promptContent,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: generationSchema,
    },
  });

  const result = JSON.parse(textResponse.text!) as GenerationResult;

  if (options.autoGenerateImages && result.imagePrompts) {
    const visualMod = `Visual Directive: ${visualDirectives}. Negative Prompt: blurred, low quality, distorted.`;
    
    const imagePromises = result.imagePrompts.slice(0, 20).map(async (promptData) => {
      try {
        // Must recreate instance or reuse to ensure Image generation also uses the correct key
        const genAI = new GoogleGenAI({ apiKey });
        
        const parts: any[] = [];
        if (options.referenceImages && options.referenceImages.length > 0) {
          options.referenceImages.forEach(base64 => {
            parts.push({
              inlineData: { data: base64, mimeType: 'image/png' }
            });
          });
        }
        parts.push({ text: `${promptData.imagePromptEN}. ${visualMod}. Style Keywords: ${promptData.styleKeywords}` });

        const imgResponse = await genAI.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: options.aspectRatio,
              imageSize: "1K"
            }
          }
        });

        for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) return part.inlineData.data;
        }
      } catch (e) {
        console.error("Image generation failed:", e);
      }
      return undefined;
    });

    const generatedImages = await Promise.all(imagePromises);
    result.imagePrompts = result.imagePrompts.map((p, i) => ({
      ...p,
      generatedImage: generatedImages[i]
    }));
  }

  return result;
};