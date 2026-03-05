import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'EMPTY_KEY');

export async function generateImageFromPrompt(prompt: string) {
    // If no real API key, return a mock URL
    const isPlaceholder = !process.env.GEMINI_API_KEY;

    if (isPlaceholder) {
        console.warn('GEMINI_API_KEY is a placeholder or not set. Returning mock image.');
        return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash"
        });

        // Use Gemini Flash to enhance a small prompt into a highly cinematic prompt
        const promptToEnhance = `You are a master AI image prompt engineer. The user wants to generate an image based on this short prompt: "${prompt}".
        Expand this into a highly detailed, cinematic, comma-separated midjourney-style image generation prompt. Keep it under 500 characters. Return ONLY the enhanced prompt string, nothing else.`;

        const result = await model.generateContent(promptToEnhance);
        let enhancedPrompt = result.response.text().trim();

        // Remove quotes or asterisks if Gemini added them
        enhancedPrompt = enhancedPrompt.replace(/^['"]|['"]$/g, '').replace(/\*/g, '');

        console.log(`[Gemini] Enhanced prompt: ${enhancedPrompt}`);

        // Return a dynamically generated AI image based on the enhanced prompt using pollinations.ai
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        // We append a random seed to prevent aggressive browser caching if the user sends the same prompt
        const randomSeed = Math.floor(Math.random() * 10000000);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;
    } catch (error: any) {
        console.warn('Gemini text enhancement failed:', error.message);
        console.warn('Falling back to direct pollinations.ai URL with original prompt...');

        const encodedPrompt = encodeURIComponent(prompt);
        const randomSeed = Math.floor(Math.random() * 10000000);
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;
    }
}

// Simple text similarity using a mock embedding approach if real embeddings aren't requested
// Or we can use the Gemini embedding model
export async function getPromptSimilarity(prompt1: string, prompt2: string) {
    const isPlaceholder = !process.env.GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY === 'your_key_here' ||
        process.env.GEMINI_API_KEY === 'EMPTY_KEY';

    if (isPlaceholder) {
        // Simple fallback similarity based on word overlap for testing
        const words1 = new Set(prompt1.toLowerCase().split(/\s+/));
        const words2 = new Set(prompt2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const res1 = await model.embedContent(prompt1);
        const res2 = await model.embedContent(prompt2);

        const embedding1 = res1.embedding.values;
        const embedding2 = res2.embedding.values;

        return calculateCosineSimilarity(embedding1, embedding2);
    } catch (error) {
        console.error('Error calculating similarity with Gemini:', error);
        return 0.5; // Error fallback
    }
}

function calculateCosineSimilarity(a: number[], b: number[]) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        const valA = a[i] || 0;
        const valB = b[i] || 0;
        dotProduct += valA * valB;
        magnitudeA += valA * valA;
        magnitudeB += valB * valB;
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
}
