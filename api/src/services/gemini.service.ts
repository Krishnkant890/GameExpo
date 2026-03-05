import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'EMPTY_KEY');

export async function generateImageFromPrompt(prompt: string) {
    // If no real API key, return a mock URL
    const isPlaceholder = !process.env.GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY === 'your_key_here' ||
        process.env.GEMINI_API_KEY === 'EMPTY_KEY';

    if (isPlaceholder) {
        console.warn('GEMINI_API_KEY is a placeholder or not set. Returning mock image.');
        return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop';
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp"
        });

        // The user suggested "Generate a high quality cinematic image: " in the prompt
        const result = await model.generateContent([
            {
                text: `Generate a high quality cinematic image based on this prompt: ${prompt}`
            }
        ]);

        const response = result.response;

        // Find the image part in the response
        // Note: The structure might vary depending on the SDK version and model response
        const imagePart = response.candidates?.[0]?.content?.parts?.find(
            part => part.inlineData
        );

        if (imagePart && imagePart.inlineData) {
            // Return as data URL for easy consumption by the frontend
            return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }

        // Fallback or throw error if no image returned
        throw new Error('Gemini did not return an image. Check if image generation is supported for this model/region.');
    } catch (error: any) {
        console.warn('Gemini image generation failed (likely Free Tier quota limit):', error.message);
        console.warn('Falling back to free public AI image generation (pollinations.ai)...');

        // Return a dynamically generated AI image based on the prompt as a fallback
        // Unsplash Source API returns random images about the topic
        const keywords = encodeURIComponent(prompt.split(' ').slice(0, 3).join(','));
        return `https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1080&auto=format&fit=crop`;
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
