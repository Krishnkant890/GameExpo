import { InferenceClient } from '@huggingface/inference';
import * as dotenv from 'dotenv';
dotenv.config();

const HF_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

const client = new InferenceClient(process.env.HUGGINGFACE_API_KEY || '');

/**
 * Generate an image from a text prompt using Hugging Face Inference API.
 * Returns a base64 data URL that can be used directly in <img> tags.
 */
export async function generateImageWithHuggingFace(prompt: string): Promise<string> {
    if (!process.env.HUGGINGFACE_API_KEY) {
        console.warn('[HuggingFace] HUGGINGFACE_API_KEY is not set. Using pollinations.ai fallback.');
        return buildFallbackUrl(prompt);
    }

    try {
        console.log(`[HuggingFace] Generating image with model "${HF_MODEL}" for prompt: "${prompt}"`);

        const dataUrl: string = await client.textToImage({
            model: HF_MODEL,
            inputs: prompt,
            parameters: {
                width: 1024,
                height: 1024,
            },
        }, { outputType: 'dataUrl' });

        console.log(`[HuggingFace] Image generated successfully.`);
        return dataUrl;
    } catch (error: any) {
        console.warn('[HuggingFace] Image generation failed:', error.message);
        console.warn('[HuggingFace] Falling back to pollinations.ai...');
        return buildFallbackUrl(prompt);
    }
}

function buildFallbackUrl(prompt: string): string {
    const encodedPrompt = encodeURIComponent(prompt);
    const randomSeed = Math.floor(Math.random() * 10000000);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;
}
