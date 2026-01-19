/**
 * Service for interacting with Google Gemini API for in-game chatbot
 * 
 * This service provides a mysterious dungeon guide chatbot that helps players
 * with lore, hints, and gameplay tips in an immersive way.
 */

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * System prompt that defines the chatbot's personality and behavior
 */
const SYSTEM_PROMPT = `You are a mysterious dungeon guide, an ancient spirit who has witnessed countless trials within these dark halls. 
You speak in cryptic, immersive language that fits a fantasy dungeon setting. Your responses should be:
- Short and concise (2-5 lines maximum)
- Mysterious and atmospheric
- Helpful with hints and lore about the dungeon
- Never mention real-world concepts, APIs, or technology
- Use fantasy-themed language (e.g., "ancient halls", "dark corridors", "mysterious forces")
- Provide gameplay tips when asked, but frame them as ancient wisdom

You help adventurers navigate the trials, understand the dungeon's secrets, and survive its dangers. 
Speak as if you are part of the game world itself.`;

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Send a message to Gemini API and get a response
 * 
 * @param userMessage - The player's message
 * @param conversationHistory - Previous messages in the conversation (optional)
 * @returns Promise<string> - The assistant's response
 */
export async function sendMessageToGemini(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  if (!API_KEY) {
    console.error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file');
    throw new Error('API key not configured');
  }

  // Build the conversation context
  const messages = [
    {
      parts: [{ text: SYSTEM_PROMPT }],
      role: 'user' as const,
    },
    {
      parts: [{ text: 'I understand. I will guide adventurers through these ancient halls with cryptic wisdom.' }],
      role: 'model' as const,
    },
    // Add conversation history
    ...conversationHistory.map((msg) => ({
      parts: [{ text: msg.content }],
      role: msg.role === 'user' ? ('user' as const) : ('model' as const),
    })),
    // Add current user message
    {
      parts: [{ text: userMessage }],
      role: 'user' as const,
    },
  ];

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.8, // Creative but focused responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200, // Keep responses short (2-5 lines)
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Extract the generated text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No response generated from Gemini API');
    }

    // Clean up the response (remove any markdown formatting if present)
    const cleanedText = generatedText.trim().replace(/```/g, '').trim();
    
    return cleanedText;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Return a fallback immersive message instead of throwing
    if (error instanceof Error && error.message.includes('API key')) {
      throw error; // Re-throw API key errors so UI can handle them
    }
    
    // Return a fallback message that fits the game world
    return 'The ancient spirit seems distant... Perhaps the connection to the other realm is weakened. Try again when the mystical energies align.';
  }
}
