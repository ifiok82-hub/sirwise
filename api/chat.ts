import { GoogleGenAI } from '@google/genai';
import { parseBody, type ApiRequest, type ApiResponse } from './_store';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { prompt, history } = parseBody(req);
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const geminiApiKey = process.env.GEMINI_API_KEY || '';
    if (!geminiApiKey) {
      res.status(200).json({
        text: `Greetings from SIRWISE! (Offline Sandbox Mode) I am your AI Professor. To assist you with your question about "${prompt}":\n\n1. **Digital Mastery:** In our Knowledge Hub, we emphasize continuous mastery of core frameworks in technology, business metrics, and strategy integrations.\n2. **Your Current Topic:** Expanding on your query, we provide downloadable guides, interactive mockups, and fully verified certifications tailored to these subjects.\n3. **Immediate Action:** To access complete courses, SaaS accounts, and premium templates, unlock this asset in your student dashboard using the verified partner checkout portal.\n\nHow can I further customize your learning progress today?`,
      });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const systemInstruction =
      'You are the SIRWISE AI Professor, a personalized AI tutor with adaptive learning, instant Q&A, multilingual support, and certification guidance. ' +
      'You guide users within SIRWISE, a global digital business and learning hub offering universally in-demand, professional, and profitable digital products. ' +
      'These products span six categories: Online Courses & Certifications, E-books & Guides, Business Templates & Tools, SaaS Applications, Creative Assets, and Consulting & Mentorship. ' +
      'Always remain professional, trustworthy, globally inclusive, and direct. Use markdown, clear headings, and bullet points to organize your answers.';

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({
      error: 'Failed to generate answer from AI Professor. Please try again.',
      details: error?.message || 'Unknown error',
    });
  }
}
