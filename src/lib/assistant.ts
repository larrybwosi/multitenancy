'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

// System prompt that provides context about the POS system
const SYSTEM_PROMPT = `
You are an AI assistant for a Modern POS (Point of Sale) System. Your role is to help users understand and use the system effectively.

The POS system has the following key features:
1. Inventory Management - Adding products, bulk stock updates, barcode generation, low stock alerts
2. Sales Processing - Creating orders, applying discounts, processing various payment methods
3. M-Pesa Integration - STK push, transaction status checking, callback processing
4. Loyalty Program - Customer points, tiered levels (Bronze, Silver, Gold, Platinum), coupon generation
5. Analytics - Sales trends, product performance, peak hours, monthly reports
6. User Management - Role-based access control, audit logging, employee performance tracking
7. System Configuration - Initial setup, database settings, security options

Provide helpful, concise, and accurate responses to user questions about these features. If you don't know the answer, say so rather than making up information.
`;

// Initialize the Gemini API client
let genAI: GoogleGenerativeAI | null = null;

// Function to get or initialize the Gemini client
function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
}

// Type for chat messages
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

/**
 * Ask a question to Gemini and get a response
 * @param question The user's question
 * @param history Previous chat messages for context
 * @returns The assistant's response
 */
export async function askGemini(question: string, history: ChatMessage[] = []): Promise<string> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Format the chat history for Gemini
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Start a new chat with the system prompt
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: 'model',
          parts: [
            {
              text: "I understand my role as a POS system assistant. I'll provide helpful information about the system features and functionality. How can I assist you today?",
            },
          ],
        },
        ...formattedHistory,
      ],
    });

    // Send the user's question and get a response
    const result = await chat.sendMessage(question);
    const response = result.response.text();

    return response;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get response from Gemini');
  }
}
