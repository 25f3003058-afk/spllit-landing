import OpenAI from 'openai';

let openai: OpenAI | null = null;

// Initialize OpenAI only if API key is available
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export const generateMessageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    // If OpenAI is not configured, return a placeholder message
    if (!openai) {
      console.warn('OpenAI API key not configured. Returning placeholder message.');
      return `Email based on prompt: "${prompt}" - Please configure OPENAI_API_KEY to enable AI features.`;
    }

    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Lightweight, fast, and cheap
      messages: [
        {
          role: 'system',
          content: 'You are a professional email writer. Generate a concise, engaging email message based on the user prompt. Keep it professional but friendly. Max 200 words.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const generatedText = message.choices[0]?.message?.content || '';
    return generatedText.trim();
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate message from prompt');
  }
};
