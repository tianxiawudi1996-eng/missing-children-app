
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { GenerationResult, GenerationOptions } from "../types";

const generationSchema = {
  type: Type.OBJECT,
  properties: {
    category: { type: Type.STRING, enum: ["MISSING", "RAINBOW", "TOGETHER", "GROWTH", "ADOPTION"] },
    factSummary: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        subInfo: { type: Type.STRING },
        location: { type: Type.STRING },
        breedAndFeatures: { type: Type.STRING },
        situation: { type: Type.STRING },
        ownerMessage: { type: Type.STRING },
      },
      required: ["name", "subInfo", "location", "breedAndFeatures", "situation", "ownerMessage"],
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
      description: "MANDATORY: Generate exactly 20 distinct scenes for the storyboard.",
      minItems: 20,
      maxItems: 20,
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
    "category", "factSummary", "storyType", "emotionalIntent", "musicDirection", "track1", "track2", "youtubePackage", "imagePrompts"
  ],
};

// UPDATED: Check process.env first, then localStorage for deployed apps
const getApiKey = () => {
  const envKey = process.env.API_KEY;
  if (envKey) return envKey;
  
  const localKey = localStorage.getItem("gemini_api_key");
  if (localKey) return localKey;

  throw new Error("API Key is missing. Please set it in Settings.");
};

// Helper for batch processing to avoid rate limits and improve stability
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processItem: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processItem));
    results.push(...batchResults);
  }
  return results;
}

export const generateContent = async (options: GenerationOptions): Promise<GenerationResult> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  // 1. Prepare Content for Text/Lyrics Generation (Multimodal)
  const parts: any[] = [];
  
  // Add reference images to the context so the AI can "see" the pet for lyrics/story
  if (options.referenceImages && options.referenceImages.length > 0) {
    options.referenceImages.forEach(base64 => {
      parts.push({ inlineData: { data: base64, mimeType: 'image/png' } });
    });
  }

  const producerBrief = `
    [REQUEST FROM LABEL EXECUTIVE]
    Target Category: ${options.category} (${options.category === 'MISSING' ? 'URGENT' : 'EMOTIONAL'})
    Source Data: ${options.sourceText}

    [MANDATORY REQUIREMENTS]
    1. **Lyrics:** Create a full 4-minute song structure. REPEAT THE CHORUS LYRICS EXPLICITLY. Do not use shortcuts like "(x2)".
    2. **Vision:** Analyze the provided images (if any) and incorporate specific visual details (fur color, eyes, specific items) into the lyrics and story.
    3. **Visuals:** Generate exactly 20 storyboard scenes.
    4. **Tone:** Apply the specific "CATEGORY-SPECIFIC DIRECTION" from the System Instruction strictly.
    
    Make this a masterpiece.
  `;
  parts.push({ text: producerBrief });

  // 2. Generate JSON (Lyrics & Storyboard)
  const textResponse = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts }, // Now includes images + text
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: generationSchema,
      thinkingConfig: { thinkingBudget: 32768 }
    },
  });

  const result = JSON.parse(textResponse.text!) as GenerationResult;

  // 3. Generate 20 Images (Batched for stability)
  if (options.autoGenerateImages && result.imagePrompts) {
    const targetPrompts = result.imagePrompts.slice(0, 20);
    
    // Process 4 images at a time to prevent browser/API timeout
    const generatedImages = await processInBatches(targetPrompts, 4, async (promptData) => {
      try {
        const genAI = new GoogleGenAI({ apiKey: getApiKey() });
        const imgParts: any[] = [];
        
        // Use reference images for style consistency in generated images too
        if (options.referenceImages && options.referenceImages.length > 0) {
          options.referenceImages.forEach(base64 => {
            imgParts.push({ inlineData: { data: base64, mimeType: 'image/png' } });
          });
        }
        
        // Enhanced Prompt for 8K Quality
        imgParts.push({ text: `${promptData.imagePromptEN}. Masterpiece, Cinematic Lighting, 8K, Highly Detailed, Photorealistic. Style: ${promptData.styleKeywords}` });

        const imgResponse = await genAI.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: imgParts },
          config: {
            imageConfig: { aspectRatio: options.aspectRatio, imageSize: "1K" }
          }
        });

        for (const part of imgResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) return part.inlineData.data;
        }
      } catch (e: any) {
        console.error("Scene generation failed:", e);
        // Return undefined to continue even if one image fails
      }
      return undefined;
    });

    result.imagePrompts = targetPrompts.map((p, i) => ({
      ...p,
      generatedImage: generatedImages[i]
    }));
  }

  return result;
};

export const validateApiKey = async (): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: "ping" });
    return true;
  } catch { return false; }
};

export const analyzeYoutubeContent = async (rawText: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Extract the full emotional narrative for a 4-minute epic song:\n${rawText}`
  });
  return response.text || "No result.";
};
