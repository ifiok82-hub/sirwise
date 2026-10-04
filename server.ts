import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

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

// Paths to database files
const DB_FILE = path.resolve(__dirname, 'data', 'db.json');
const PRODUCTS_FILE = path.resolve(__dirname, 'data', 'products.json');

// Database Access Helpers
interface DatabaseSchema {
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    status: 'Verified' | 'Revoked' | 'Pending';
    timestamp: string;
    device: string;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  downloads: Array<{
    id: string;
    productId: string;
    productName: string;
    userEmail: string;
    timestamp: string;
  }>;
}

function getDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      const initialDb: DatabaseSchema = {
        users: [],
        auditLogs: [
          {
            id: 'AL-1',
            action: 'SIRWISE Global Digital Hub database initialized.',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            user: 'SYSTEM',
            severity: 'info'
          }
        ],
        downloads: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed reading database file:', err);
    return { users: [], auditLogs: [], downloads: [] };
  }
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing to database file:', err);
  }
}

function getProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed loading products list:', err);
  }
  return [];
}

// AI Professor chat proxy endpoint
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, history } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    if (!geminiApiKey) {
      // Return simulated high-quality response if API Key is not set
      res.json({
        text: `Greetings from SIRWISE! (Offline Sandbox Mode) I am your AI Professor. To assist you with your question about "${prompt}":\n\n1. **Digital Mastery:** In our Knowledge Hub, we emphasize continuous mastery of core frameworks in technology, business metrics, and strategy integrations.\n2. **Your Current Topic:** Expanding on your query, we provide downloadable guides, interactive mockups, and fully verified certifications tailored to these subjects.\n3. **Immediate Action:** To access complete courses, SaaS accounts, and premium templates, unlock this asset in your student dashboard using the verified partner checkout portal.\n\nHow can I further customize your learning progress today?`,
      });
      return;
    }

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

// Endpoint to fetch verified products list (No pricing/badges)
app.get('/api/products', (req: Request, res: Response) => {
  const products = getProducts();
  res.json(products);
});

// Endpoint to Register and Verify a user
app.post('/api/verify', (req: Request, res: Response) => {
  try {
    const { name, email, phone, country } = req.body;

    if (!name || !email || !phone || !country) {
      res.status(400).json({ success: false, error: 'All fields (Name, Email, Phone, Country) are required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, error: 'Please enter a valid email address' });
      return;
    }

    const db = getDatabase();

    // Check if user already exists
    let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const deviceType = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device';

    if (!user) {
      user = {
        id: `USR-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        email: email.toLowerCase(),
        phone,
        country,
        status: 'Verified',
        timestamp,
        device: `${deviceType} (${req.ip || '127.0.0.1'})`
      };
      db.users.push(user);
    } else {
      // Re-activate as Verified if they were revoked previously, or update details
      user.name = name;
      user.phone = phone;
      user.country = country;
      user.status = 'Verified';
      user.timestamp = timestamp;
    }

    // Write compliance audit logs
    const logId = `AL-${Date.now()}`;
    db.auditLogs.unshift({
      id: logId,
      action: `User "${name}" verified access to SIRWISE Hub. Total unlocked status: GRANTED.`,
      timestamp,
      user: email.toLowerCase(),
      severity: 'info'
    });

    saveDatabase(db);

    res.json({
      success: true,
      message: 'Transaction Verified ✓',
      user: {
        email: user.email,
        name: user.name,
        phone: user.phone,
        country: user.country,
        status: user.status
      }
    });
  } catch (err: any) {
    console.error('Verification endpoint error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Protect /downloads route server-side: if not verified, redirect to verify portal
app.get('/downloads/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.redirect('/?error=not_verified');
    }

    const db = getDatabase();
    const verifiedUser = db.users.find(
      u => u.email.toLowerCase() === (email as string).toLowerCase() && u.status === 'Verified'
    );

    if (!verifiedUser) {
      // Record failed unauthorized download attempt to audit log
      db.auditLogs.unshift({
        id: `AL-${Date.now()}`,
        action: `Unauthorized download attempt for "${filename}" without valid verification token.`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        user: (email as string).toLowerCase() || 'Anonymous',
        severity: 'critical'
      });
      saveDatabase(db);
      return res.redirect('/?error=not_verified');
    }

    // Register active download metric
    const products = getProducts();
    const product = products.find((p: any) => p.downloadUrl.endsWith(filename));
    
    db.downloads.push({
      id: `DL-${Math.floor(100000 + Math.random() * 900000)}`,
      productId: product?.id || 'unknown',
      productName: product?.name || filename,
      userEmail: (email as string).toLowerCase(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
    
    db.auditLogs.unshift({
      id: `AL-${Date.now()}`,
      action: `Downloaded product file: ${filename}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: (email as string).toLowerCase(),
      severity: 'info'
    });
    
    saveDatabase(db);

    const filePath = path.resolve(__dirname, 'public', 'downloads', filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Resource file not found on server.');
    }
  } catch (err) {
    console.error('Download route failure:', err);
    res.status(500).send('An error occurred while fetching your download package.');
  }
});

// Endpoint to verify Admin Pin passcode
app.post('/api/admin/verify-pin', (req: Request, res: Response) => {
  const { pin } = req.body;
  if (pin === 'Goye1967@') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Access Denied. Incorrect pin credentials.' });
  }
});

// Endpoint to query Admin compliance records from server database
app.get('/api/admin/records', (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({
    users: db.users,
    auditLogs: db.auditLogs,
    downloads: db.downloads
  });
});

// Endpoint to Approve or Revoke user's unlocked status instantly
app.post('/api/admin/users/status', (req: Request, res: Response) => {
  try {
    const { userId, status } = req.body;
    if (!userId || !['Verified', 'Revoked', 'Pending'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid parameters provided' });
      return;
    }

    const db = getDatabase();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User registration not found' });
      return;
    }

    user.status = status;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.auditLogs.unshift({
      id: `AL-${Date.now()}`,
      action: `Administrator manually updated status of "${user.name}" (${user.email}) to ${status}.`,
      timestamp,
      user: 'ADMINISTRATOR',
      severity: status === 'Revoked' ? 'warning' : 'info'
    });

    saveDatabase(db);
    res.json({ success: true, message: `User status successfully updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clean dynamic config response
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    SYSTEM_MODE: 'VERIFICATION_ONLY',
    PLATFORM: 'SIRWISE Global Digital Hub',
    CHARTER: 'RC BN3583773'
  });
});

// Configure development or production middleware
const isProd = process.env.NODE_ENV === 'production' || __dirname.includes('dist');

if (!isProd) {
  import('vite').then((vite) => {
    vite.createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    }).then((viteServer) => {
      app.use(viteServer.middlewares);
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
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`SIRWISE Full-Stack Server running at http://localhost:${port}`);
});
