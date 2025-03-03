import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';

// Initialize Gemini with error handling
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Missing Gemini API key in environment variables');
}

// Initialize with proper API version
const genAI = new GoogleGenerativeAI(apiKey || '', {
  apiVersion: 'v1beta' // Add explicit API version
});

// Create a reusable model instance with correct model name
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// Rest of the file remains the same...


export interface GeminiResponse {
  text: string;
  error?: string;
  safetyRatings?: any[];
}

async function processResponse(result: GenerateContentResult): Promise<GeminiResponse> {
  const response = await result.response;
  return {
    text: response.text(),
    safetyRatings: response.promptFeedback?.safetyRatings
  };
}

export async function generateContent(prompt: string): Promise<GeminiResponse> {
  try {
    const result = await model.generateContent(prompt);
    return processResponse(result);
  } catch (error) {
    console.error('Error generating content:', error);
    return { 
      text: '',
      error: error instanceof Error ? error.message : 'Failed to generate content'
    };
  }
}

export async function improveComment(comment: string): Promise<GeminiResponse> {
  const prompt = `
    Improve this comment to make it more engaging while maintaining its core message:
    "${comment}"
    
    Make it:
    1. More conversational and natural
    2. Add relevant emojis where appropriate
    3. Keep the same key points and intent
    4. Ensure it stays under 300 characters
    5. Make it more likely to encourage interaction
  `;

  return generateContent(prompt);
}

export async function turnCommentToPost(comment: string): Promise<GeminiResponse> {
  const prompt = `
use your deep experience and knowledge in copywriting and content creation to turn this message into a post that stands by itself while maintaining its core message: 
    "${comment}"
    
    Make it:
    1. Conversational and natural but keep it to 30 words.
    2. Add a hook that never starts with a question.
    3. Add storytelling that shares a personal experience in first person.
    4. Use clear and concise language. Use simple language 
    5. Avoid using unnecessary jargon.
    6. Make it more likely to inspire and encourage interaction 
    7. Share simple actionable advice in a natural conversational style    
  `;

  return generateContent(prompt);
}

export async function generatePostIdeas(topic: string, count: number = 3): Promise<GeminiResponse> {
  const prompt = `
    Generate ${count} engaging post ideas about ${topic} for Bluesky.
    Each post should:
    1. Be conversational and engaging
    2. Include relevant emojis
    3. Be under 300 characters
    4. Encourage discussion and interaction
    5. Be unique and thought-provoking
    6. Feel natural and authentic
    7. Be relevant to the Bluesky community

    Format each post idea on a new line starting with a bullet point.
  `;

  return generateContent(prompt);
}

export async function enhanceEngagement(text: string): Promise<GeminiResponse> {
  const prompt = `
    Enhance this text to maximize engagement while keeping the core message:
    "${text}"

    Guidelines:
    1. Keep it authentic and genuine
    2. Add a hook or interesting opener
    3. Include a clear call-to-action or question
    4. Use appropriate emojis naturally
    5. Stay under 300 characters
    6. Maintain the original voice and tone
    7. Make it shareable and relatable
  `;

  return generateContent(prompt);
}

export async function generateThreadIdeas(topic: string): Promise<GeminiResponse> {
  const prompt = `
    Generate a Bluesky thread outline about ${topic}.
    
    Guidelines:
    1. Create 3-5 connected posts that flow naturally
    2. Each post should be under 300 characters
    3. Start with a strong hook
    4. Build the narrative progressively
    5. End with engagement prompt
    6. Include relevant emojis
    7. Make it informative yet conversational
    
    Format as:
    • Post 1: [hook/intro]
    • Post 2: [development]
    • Post 3: [insights]
    • Post 4: [conclusion/call-to-action]
  `;

  return generateContent(prompt);
}