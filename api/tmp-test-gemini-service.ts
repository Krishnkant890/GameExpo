import { generateImageFromPrompt, getPromptSimilarity } from './src/services/gemini.service.js';

async function test() {
    console.log("Testing generation...");
    const url = await generateImageFromPrompt("hello");
    console.log("Result URL:", url);

    console.log("Testing similarity...");
    const sim = await getPromptSimilarity("A futuristic city at night - Match the static image", "hello");
    console.log("Similarity:", sim);
}

test().catch(console.error);
