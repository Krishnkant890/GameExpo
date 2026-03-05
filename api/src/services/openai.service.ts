import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImageWithOpenAI(prompt: string): Promise<string> {
    const isPlaceholder = !process.env.OPENAI_API_KEY;

    if (isPlaceholder) {
        console.warn('[OpenAI] OPENAI_API_KEY is not set. Using pollinations.ai fallback.');
        return buildFallbackUrl(prompt);
    }

    try {
        console.log(`[OpenAI] Generating image for prompt: "${prompt}"`);

        const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard',
        });

        const imageUrl = response.data?.[0]?.url;
        if (!imageUrl) throw new Error('No image URL returned from OpenAI');

        console.log(`[OpenAI] Image generated successfully.`);
        return imageUrl;
    } catch (error: any) {
        console.warn('[OpenAI] Image generation failed:', error.message);
        console.warn('[OpenAI] Falling back to pollinations.ai...');
        return buildFallbackUrl(prompt);
    }
}

function buildFallbackUrl(prompt: string): string {
    const encodedPrompt = encodeURIComponent(prompt);
    const randomSeed = Math.floor(Math.random() * 10000000);
    return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;
}
