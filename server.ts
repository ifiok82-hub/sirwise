import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini SDK securely
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Professor chat proxy endpoint
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (!geminiApiKey) {
      // Return a simulated high-quality response if API Key is not set
      res.json({
        text: `Greetings from SIRWISE! (Offline Sandbox Mode) I am your AI Professor. To assist you with your question about "${prompt}":\n\n1. **Digital Mastery:** In our Knowledge Hub, we emphasize continuous mastery of core frameworks in technology, business metrics, creative templates, and cloud-based SaaS integrations.\n2. **Your Current Topic:** Expanding on your query, we provide downloadable guides, interactive mockups, and fully verified certifications tailored to these subjects.\n3. **Immediate Action:** To access complete courses, SaaS accounts, and premium templates, unlock this asset in your student dashboard using standard browser gateways or our Pi Browser secure wallets.\n\nHow can I further customize your learning progress today?`,
      });
      return;
    }

    // Format chat history or build prompt with system context
    const systemInstruction = 
      "You are the SIRWISE AI Professor, a personalized AI tutor with adaptive learning, instant Q&A, multilingual support, and certification guidance. " +
      "You guide users within SIRWISE, a global digital business and learning hub offering universally in-demand, professional, and profitable digital products. " +
      "These products span six categories: Online Courses & Certifications, E-books & Guides, Business Templates & Tools, SaaS Applications, Creative Assets, and Consulting & Mentorship. " +
      "Always remain professional, trustworthy, globally inclusive, and direct. Use markdown, clear headings, and bullet points to organize your answers.";

    const contents = [];
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
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error with Gemini API:', error);
    res.status(500).json({ 
      error: 'Failed to generate answer from AI Professor. Please try again.',
      details: error.message 
    });
  }
});

// Paystack Server-side Live Initialization
app.post('/api/payment/paystack/initialize', async (req: Request, res: Response) => {
  try {
    const { email, amount, productId } = req.body;
    const secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_live_mock_secret_key_9018';

    // Call official Paystack endpoint: https://api.paystack.co/transaction/initialize
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        amount: Math.round(amount * 1600 * 100), // convert USD to NGN Kobo at 1,600 rate
        currency: 'NGN',
        callback_url: `${req.headers.origin || 'http://localhost:3000'}/?gateway=paystack&productId=${productId}`
      })
    });

    const data: any = await paystackRes.json();
    if (!paystackRes.ok || !data.status) {
      throw new Error(data.message || 'Paystack initialization failed');
    }

    res.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    });
  } catch (error: any) {
    console.error('Paystack initialization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Flutterwave Server-side Live Initialization
app.post('/api/payment/flutterwave/initialize', async (req: Request, res: Response) => {
  try {
    const { email, name, amount, productId } = req.body;
    const secretKey = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK-mock_secret_key_8834';

    // Call official Flutterwave endpoint: https://api.flutterwave.com/v3/payments
    const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tx_ref: `SIR-${Date.now()}`,
        amount: amount,
        currency: 'USD',
        redirect_url: `${req.headers.origin || 'http://localhost:3000'}/?gateway=flutterwave&productId=${productId}`,
        customer: {
          email: email,
          name: name || 'Sirwise Customer'
        },
        customizations: {
          title: 'SIRWISE Asset License',
          description: `Acquiring SKU: ${productId}`
        }
      })
    });

    const data: any = await flwRes.json();
    if (!flwRes.ok || data.status !== 'success') {
      throw new Error(data.message || 'Flutterwave initialization failed');
    }

    res.json({
      link: data.data.link
    });
  } catch (error: any) {
    console.error('Flutterwave initialization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Secure endpoint to fetch public config keys
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_mock_paystack_key_56781234',
    FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY || 'flwpubk_live_mock_flutterwave_key_43218765',
    PI_TESTNET_WALLET: process.env.PI_TESTNET_WALLET || 'GBPI-TESTNET-WALLET-ADDRESS-MOCK',
    PI_MAINNET_KYC_WALLET: process.env.PI_MAINNET_KYC_WALLET || 'GBPI-MAINNET-KYC-WALLET-ADDRESS-MOCK'
  });
});

// Configure development or production middleware
const isProd = process.env.NODE_ENV === 'production' || __dirname.includes('dist');

if (!isProd) {
  // Import dynamically to avoid requiring vite as a prod dependency if running node compiled
  import('vite').then((vite) => {
    vite.createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    }).then((viteServer) => {
      app.use(viteServer.middlewares);
      
      // Serve index.html for all SPA routes in dev
      app.use('*', async (req, res, next) => {
        try {
          let template = path.resolve(__dirname, 'index.html');
          res.status(200).set({ 'Content-Type': 'text/html' }).sendFile(template);
        } catch (e) {
          viteServer.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    });
  });
} else {
  // Serve built files
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`SIRWISE Full-Stack Server running at http://localhost:${port}`);
});
