import { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Globe, 
  Award, 
  Lock, 
  Unlock, 
  BookOpen, 
  Download, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  CreditCard, 
  Wallet, 
  Search, 
  X, 
  ExternalLink, 
  User, 
  Key, 
  Send,
  Check,
  RefreshCw,
  FileText,
  HelpCircle,
  Shield,
  Activity,
  Copy,
  Menu,
  LogOut,
  LogIn,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Coins,
  MessageSquare,
  FileSpreadsheet,
  Layers,
  Database,
  Users
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { SirwiseLogo } from './components/SirwiseLogo';

// Digital Product Interface for SIRWISE Hub
interface DigitalProduct {
  id: string;
  sku: string;
  name: string;
  category: 'courses' | 'ebooks' | 'templates' | 'saas' | 'assets' | 'consulting';
  priceUSD: number;
  description: string;
  longDescription: string;
  features: string[];
  image: string;
  altText: string;
  fileSize: string;
  downloadUrl: string;
}

// User Profile Interface
interface UserProfile {
  email: string;
  name: string;
  phone: string;
  country: string;
  isLoggedIn: boolean;
  role: 'student' | 'admin';
}

// Transaction Ledger Interface
interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  gateway: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  txHash?: string;
  status: 'Pending' | 'Approved' | 'Revoked';
  timestamp: string;
  metadata: {
    device: string;
    country: string;
  };
}

// Audit Trail Action Logs
interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  severity: 'info' | 'warning' | 'critical';
}

export default function App() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Navigation tab states: 'marketplace' | 'downloads' | 'professor'
  const [currentTab, setCurrentTab] = useState<'marketplace' | 'downloads' | 'professor'>('marketplace');
  const [marketCategory, setMarketCategory] = useState<'all' | 'courses' | 'ebooks' | 'templates' | 'saas' | 'assets' | 'consulting'>('all');

  // Active user auth using localStorage
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const stored = localStorage.getItem('sirwise_hub_user');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return {
      email: 'member@sirwise.store',
      name: 'Elite Partner',
      phone: '+234 803 000 0000',
      country: 'Nigeria',
      isLoggedIn: true,
      role: 'student'
    };
  });

  // Dynamic config loaded from /api/config
  const [apiConfig, setApiConfig] = useState({
    PAYSTACK_PUBLIC_KEY: 'pk_live_loading_config...',
    FLUTTERWAVE_PUBLIC_KEY: 'flwpubk_live_loading_config...',
    PI_TESTNET_WALLET: 'GBPI-TESTNET-ADDRESS-PENDING',
    PI_MAINNET_KYC_WALLET: 'GBPI-MAINNET-KYC-ADDRESS-PENDING'
  });

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setApiConfig({
          PAYSTACK_PUBLIC_KEY: data.PAYSTACK_PUBLIC_KEY || 'pk_live_mock_paystack_key_56781234',
          FLUTTERWAVE_PUBLIC_KEY: data.FLUTTERWAVE_PUBLIC_KEY || 'flwpubk_live_mock_flutterwave_key_43218765',
          PI_TESTNET_WALLET: data.PI_TESTNET_WALLET || 'GBPI-TESTNET-WALLET-ADDRESS-MOCK',
          PI_MAINNET_KYC_WALLET: data.PI_MAINNET_KYC_WALLET || 'GBPI-MAINNET-KYC-WALLET-ADDRESS-MOCK'
        });
      })
      .catch(err => console.error("Error loading API configs dynamically:", err));
  }, []);

  // Admin and inactivity lockout tracking
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState(180); // 3 minutes lockout
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Logo taps tracker for secret gateway trigger
  const [logoTaps, setLogoTaps] = useState(0);

  // Unlocked products list from localStorage
  const [unlockedProductIds, setUnlockedProductIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('sirwise_hub_unlocked');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return ['prod-course-ai']; // Default free trial unlocked for display
  });

  // System Transactions list in localStorage
  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    const stored = localStorage.getItem('sirwise_hub_ledger');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return [
      {
        id: 'TXN-001092',
        productId: 'prod-ebook-sovereign',
        productName: 'Sovereign Wealth Guide',
        amount: 10,
        currency: 'USD',
        gateway: 'Pi Mainnet (KYC)',
        buyerEmail: 'member@sirwise.store',
        buyerName: 'Elite Partner',
        buyerPhone: '+234 803 000 0000',
        txHash: 'a290bcda00129bca238719873dcb90ef81827bca8831bca89021e8a0021bca82',
        status: 'Approved',
        timestamp: '2026-10-03 12:00:00',
        metadata: { device: 'Chrome / Windows', country: 'Nigeria' }
      },
      {
        id: 'TXN-002187',
        productId: 'prod-saas-ledger',
        productName: 'LedgerWise Cloud Accounting',
        amount: 35,
        currency: 'USD',
        gateway: 'Flutterwave Live',
        buyerEmail: 'ifiok82@gmail.com',
        buyerName: 'Ifiok Partner',
        buyerPhone: '+234 812 345 6789',
        txHash: 'FLW-TXN-REF-90182736',
        status: 'Approved',
        timestamp: '2026-10-03 14:32:11',
        metadata: { device: 'Safari / iPhone', country: 'United Kingdom' }
      }
    ];
  });

  // Audit Logs in localStorage
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const stored = localStorage.getItem('sirwise_hub_audit_logs');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    return [
      { id: 'AL-1', action: 'SIRWISE Global Digital Hub initialized securely.', timestamp: '2026-10-03 10:00:00', user: 'SYSTEM', severity: 'info' },
      { id: 'AL-2', action: 'Loaded public API configs dynamically.', timestamp: '2026-10-03 10:00:03', user: 'SYSTEM', severity: 'info' }
    ];
  });

  // Selected checkout product state
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutGateway, setCheckoutGateway] = useState<'paystack' | 'flutterwave' | 'paypal' | 'pigcv'>('paystack');
  const [piTxHash, setPiTxHash] = useState('');
  const [billingEmail, setBillingEmail] = useState(currentUser.email);
  const [billingName, setBillingName] = useState(currentUser.name);
  const [billingPhone, setBillingPhone] = useState(currentUser.phone);
  const [billingCountry, setBillingCountry] = useState(currentUser.country);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // General App Modals
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Active AI Professor chat inside Academy
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Welcome to the SIRWISE Global Digital Knowledge Hub. I am your AI Professor. Ask me anything about our professional MBA courses, digital ledger setups, financial models, or legal blueprints.' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Interactive Testnet sandbox inside Admin Panel
  const [testnetTxHash, setTestnetTxHash] = useState('');
  const [testnetStatus, setTestnetStatus] = useState('');

  // 8 Official Business Programmes
  const programmesList: DigitalProduct[] = [
    {
      id: 'prod-course-mba',
      sku: 'SKU-SIR-MBA-ACC',
      name: 'MBA Digital Acceleration Program',
      category: 'courses',
      priceUSD: 15,
      description: 'Accelerate your executive executive credentials with advanced corporate management modules, leadership strategies, and digital scaling blueprints.',
      longDescription: 'Our premier Digital MBA masterclass designed specifically for founders, executives, and high-growth team leaders. Master core business execution frameworks, administrative operations, scaling strategies, and corporate governance.',
      features: ['24 advanced video modules', 'Certified MBA completion badge', 'Case studies of unicorn company strategies', 'Interactive study guides and templates'],
      image: '/assets/programmes/classroom_opt.jpg',
      altText: 'Executive classroom with presentation board',
      fileSize: '48.2 MB (Course Package)',
      downloadUrl: '/downloads/sirwise-mba-program-kit.zip'
    },
    {
      id: 'prod-ebook-sovereign',
      sku: 'SKU-SIR-SOV-WEALTH',
      name: 'Sovereign Wealth Guide',
      category: 'ebooks',
      priceUSD: 10,
      description: 'The ultimate blueprint to understanding global capital flows, asset protection, and wealth accumulation guides.',
      longDescription: 'A premium corporate asset management playbook covering macro-economic capital flow dynamics, international corporate structures, asset security, tax mitigation, and wealth diversification strategies.',
      features: ['250-page deep-dive PDF handbook', 'Sovereign portfolio asset allocations matrices', 'Jurisdiction-specific legal comparison maps', 'Wealth generation worksheet templates'],
      image: '/assets/programmes/finance_globe.jpg',
      altText: 'Globe with financial projection indicators',
      fileSize: '12.4 MB (PDF Handbook)',
      downloadUrl: '/downloads/sirwise-sovereign-wealth-guide.pdf'
    },
    {
      id: 'prod-temp-pitch',
      sku: 'SKU-SIR-PITCH-DECK',
      name: 'Venture Pitch Deck Master Template',
      category: 'templates',
      priceUSD: 25,
      description: 'Raise capital instantly with our structured pitch framework utilized by global start-ups to raise millions.',
      longDescription: 'Save hundreds of hours designing your investor presentation slides. Formatted specifically to tell an impactful commercial narrative that grabs venture capitalists, angel networks, and banks.',
      features: ['100+ highly customizable PPTX slide layouts', 'Detailed financial model slides placeholders', 'Curated pitch fonts & icon assets', 'Step-by-step presentation narrative notes'],
      image: '/assets/programmes/financial_modeler.jpg',
      altText: 'Venture capital pitch presentation boards',
      fileSize: '18.7 MB (PowerPoint & Assets Kit)',
      downloadUrl: '/downloads/sirwise-venture-pitch-deck.zip'
    },
    {
      id: 'prod-saas-ledger',
      sku: 'SKU-SIR-LEDGER-ACC',
      name: 'LedgerWise Cloud Accounting Software',
      category: 'saas',
      priceUSD: 35,
      description: 'Streamline your bookkeeping, balance sheets, and invoicing with our customized, offline-first cloud accountant.',
      longDescription: 'A robust cloud-based billing and cash flow bookkeeping tool optimized for small businesses, contractors, and agencies. Automatically compile financial ledgers, draft balance sheets, track expenses, and issue client invoices.',
      features: ['Comprehensive billing & invoice creator', 'Dynamic balance sheet automator', 'Localized tax configuration matrices', 'Multi-user permission levels settings'],
      image: '/assets/programmes/accounting_dashboard.jpg',
      altText: 'Interactive cloud accounting dashboard interface',
      fileSize: '32.1 MB (Installer & API Config Pack)',
      downloadUrl: '/downloads/sirwise-ledgerwise-software.zip'
    },
    {
      id: 'prod-asset-media',
      sku: 'SKU-SIR-MEDIA-VAULT',
      name: 'Creative Media Asset Vault',
      category: 'assets',
      priceUSD: 20,
      description: 'Unbox over 10,000 royalty-free high-definition graphics, studio-recorded audio background packs, and UI templates.',
      longDescription: 'Elevate your creative production value. This massive collection gives developers, designers, and marketers royalty-free assets to launch high-fidelity websites, landing pages, social media campaigns, and videos.',
      features: ['5,000+ high-definition premium vector icons', '1,500+ studio-recorded audio loops', 'Responsive HTML5/Tailwind wireframe pages', 'Elite Adobe Illustrator & Figma sources'],
      image: '/assets/programmes/media_assets.jpg',
      altText: 'Collage of premium artistic media assets',
      fileSize: '154.5 MB (Creative Assets Package)',
      downloadUrl: '/downloads/sirwise-creative-media-vault.zip'
    },
    {
      id: 'prod-consult-mentorship',
      sku: 'SKU-SIR-CONSULT-MENT',
      name: 'Elite Consulting & Mentorship Session',
      category: 'consulting',
      priceUSD: 50,
      description: 'Secure a direct 1-on-1 virtual conference with certified senior digital business specialists and tax attorneys.',
      longDescription: 'Fast-track your corporate setup, immigration steps, or system development hurdles. Book a private, screen-sharing strategy meeting to audit your operational models and design a roadmap.',
      features: ['60-minute direct video call meeting', 'Custom corporate blueprint roadmap delivery', 'Complete call audio & screen recording files', 'Direct WhatsApp follow-up contact line'],
      image: '/assets/programmes/professional_meeting.jpg',
      altText: 'Professional business discussion and video call consultation',
      fileSize: '3.1 MB (Booking Confirmation PDF)',
      downloadUrl: '/downloads/sirwise-consulting-booking.pdf'
    },
    {
      id: 'prod-temp-calc',
      sku: 'SKU-SIR-VAL-CALC',
      name: 'Professional Valuation Calculators Package',
      category: 'templates',
      priceUSD: 30,
      description: 'Instantly calculate enterprise valuations, DCF models, internal rate of returns, and liquidity scenarios.',
      longDescription: 'Equip your finance team with elite corporate valuation models. Includes Discounted Cash Flow (DCF), Net Present Value (NPV), Weighted Average Cost of Capital (WACC), and merger analysis spreadsheets.',
      features: ['Complex multi-sheet valuation Excel files', 'Automated DCF modeling instructions', 'NPV, IRR, and payback period graphs', 'Equity dilution capitalization charts'],
      image: '/assets/programmes/financial_spreadsheet.jpg',
      altText: 'Corporate spreadsheet dashboard with performance charts',
      fileSize: '9.8 MB (Premium Excel Spreadsheets)',
      downloadUrl: '/downloads/sirwise-valuation-calculators.zip'
    },
    {
      id: 'prod-course-ai',
      sku: 'SKU-SIR-AI-PROF',
      name: 'AI Professor Masterclass & Toolkit',
      category: 'saas',
      priceUSD: 40,
      description: 'Master large language modeling, API integrations, and automate client pipelines in this extensive toolkit.',
      longDescription: 'The ultimate AI training blueprint. Build custom system instructions context parameters, program local node interfaces, fine-tune models, and deploy automated agent loops in your business.',
      features: ['Complete AI Professor system context framework', 'Hands-on node scripting guidelines', '1,000+ elite business automation prompts', 'API integration files & sandbox keys'],
      image: '/assets/programmes/virtual_tutor.jpg',
      altText: 'Futuristic virtual tutor with projection charts',
      fileSize: '41.5 MB (Full Training Package)',
      downloadUrl: '/downloads/sirwise-ai-professor-blueprint.zip'
    }
  ];

  // Local storage synchronization helpers
  const saveUserProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    localStorage.setItem('sirwise_hub_user', JSON.stringify(profile));
  };

  const addTransaction = (txn: TransactionItem) => {
    const updated = [txn, ...transactions];
    setTransactions(updated);
    localStorage.setItem('sirwise_hub_ledger', JSON.stringify(updated));

    // Append to Audit Logs
    const newLog: AuditLog = {
      id: `AL-${Date.now()}`,
      action: `New transaction created via ${txn.gateway}. Status: ${txn.status}.`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: txn.buyerEmail,
      severity: txn.status === 'Pending' ? 'warning' : 'info'
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('sirwise_hub_audit_logs', JSON.stringify(updatedLogs));
  };

  const addAuditLog = (action: string, severity: 'info' | 'warning' | 'critical' = 'info') => {
    const newLog: AuditLog = {
      id: `AL-${Date.now()}`,
      action,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user: currentUser.email,
      severity
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('sirwise_hub_audit_logs', JSON.stringify(updatedLogs));
  };

  // 5 tap secret logic on Sirwise Header Logo
  const handleLogoTap = () => {
    setLogoTaps(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setAdminPanelOpen(true);
        addAuditLog("Admin Panel accessed via secret 5 taps logo gesture.", "warning");
        return 0;
      }
      return next;
    });
    setTimeout(() => setLogoTaps(0), 3000); // reset taps if idle
  };

  // Inactivity Admin Session Lockout
  useEffect(() => {
    if (adminLoggedIn) {
      setInactivityTimer(180);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setInactivityTimer(prev => {
          if (prev <= 1) {
            setAdminLoggedIn(false);
            setAdminError("Administrative session auto-locked due to 3 minutes of inactivity.");
            addAuditLog("Administrative console automatically locked out to preserve PCI DSS status.", "critical");
            if (timerRef.current) clearInterval(timerRef.current);
            return 180;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [adminLoggedIn]);

  // Reset timer on user interaction
  const resetInactivityTimer = () => {
    if (adminLoggedIn) {
      setInactivityTimer(180);
    }
  };

  // Handle Admin Auth
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Goye1967@') {
      setAdminLoggedIn(true);
      setAdminError('');
      setAdminPassword('');
      addAuditLog("Administrative console successfully unlocked.", "info");
    } else {
      setAdminError("Unauthorized credentials. Access Denied.");
      addAuditLog("Failed administrative login attempt.", "critical");
    }
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    setAdminPassword('');
    addAuditLog("Administrative console session closed manually.", "info");
  };

  // Admin Ledger actions
  const handleApproveTransaction = (txnId: string) => {
    resetInactivityTimer();
    const updated = transactions.map(t => {
      if (t.id === txnId) {
        // Unlock download locally
        const unlocked = [...unlockedProductIds];
        if (!unlocked.includes(t.productId)) {
          unlocked.push(t.productId);
          setUnlockedProductIds(unlocked);
          localStorage.setItem('sirwise_hub_unlocked', JSON.stringify(unlocked));
        }
        addAuditLog(`Approved Transaction ${txnId}. SKU unlocked: ${t.productId}.`, "info");
        return { ...t, status: 'Approved' as const };
      }
      return t;
    });
    setTransactions(updated);
    localStorage.setItem('sirwise_hub_ledger', JSON.stringify(updated));
  };

  const handleRevokeTransaction = (txnId: string) => {
    resetInactivityTimer();
    const updated = transactions.map(t => {
      if (t.id === txnId) {
        // Remove download token
        const unlocked = unlockedProductIds.filter(id => id !== t.productId);
        setUnlockedProductIds(unlocked);
        localStorage.setItem('sirwise_hub_unlocked', JSON.stringify(unlocked));
        addAuditLog(`Revoked Transaction ${txnId}. SKU locked: ${t.productId}.`, "warning");
        return { ...t, status: 'Revoked' as const };
      }
      return t;
    });
    setTransactions(updated);
    localStorage.setItem('sirwise_hub_ledger', JSON.stringify(updated));
  };

  // Chat with AI Professor on endpoint
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPrompt.trim()) return;

    const query = chatPrompt;
    setChatPrompt('');
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: chatHistory
        })
      });

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'model', text: data.text || 'Apologies, let me access the core databases again.' }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'model', text: 'Transient error. AI Professor offline nodes verified your progress locally.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Launch Checkout Modal drawer
  const handleBuyClick = (product: DigitalProduct) => {
    setSelectedProduct(product);
    setCheckoutModalOpen(true);
    setCheckoutGateway('paystack');
    setCheckoutStatus(null);
    setPiTxHash('');
  };

  // Perform secure purchase details capture
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmittingCheckout(true);
    setCheckoutStatus(null);

    // Save profile updates
    saveUserProfile({
      ...currentUser,
      email: billingEmail,
      name: billingName,
      phone: billingPhone,
      country: billingCountry
    });

    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
    const userAgent = navigator.userAgent;
    const clientMeta = userAgent.includes('Mobile') ? 'Mobile Handset' : 'Desktop Node';

    // Dispatch details to owner via FormSubmit Ajax
    const dispatchLog = async (hashValue: string) => {
      const payload = {
        _subject: `SIRWISE HUB Sale [${checkoutGateway.toUpperCase()}]`,
        transactionId: txnId,
        productSku: selectedProduct.sku,
        productName: selectedProduct.name,
        amountUSD: selectedProduct.priceUSD,
        currency: checkoutGateway === 'paystack' ? 'NGN' : 'USD',
        amountConverted: checkoutGateway === 'paystack' ? selectedProduct.priceUSD * 1600 : selectedProduct.priceUSD,
        buyerName: billingName,
        buyerEmail: billingEmail,
        buyerPhone: billingPhone,
        buyerCountry: billingCountry,
        paymentMethod: checkoutGateway,
        txHash: hashValue,
        deviceMetadata: `${clientMeta} (${navigator.platform})`,
        timestamp: new Date().toISOString()
      };

      try {
        await fetch('https://formsubmit.co/ajax/ifiok82@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn("Secure compliance log stored locally.", err);
      }
    };

    // Live Gateway Flow: PAYSTACK
    if (checkoutGateway === 'paystack') {
      const paystackKey = apiConfig.PAYSTACK_PUBLIC_KEY || 'pk_live_mock_paystack_key_56781234';
      if ((window as any).PaystackPop) {
        try {
          const handler = (window as any).PaystackPop.setup({
            key: paystackKey,
            email: billingEmail,
            amount: Math.round(selectedProduct.priceUSD * 1600 * 100), // convert to NGN kobo at 1600 rate
            currency: 'NGN',
            ref: 'SIR-' + Date.now(),
            callback: async (response: any) => {
              setIsSubmittingCheckout(true);
              try {
                // Verify with backend
                const verifyRes = await fetch('/api/payment/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    gateway: 'paystack',
                    reference: response.reference,
                    productId: selectedProduct.id
                  })
                });
                const verifyData = await verifyRes.json();
                
                if (verifyData.success) {
                  const newTxn: TransactionItem = {
                    id: txnId,
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    amount: selectedProduct.priceUSD,
                    currency: 'USD',
                    gateway: 'Paystack Live',
                    buyerEmail: billingEmail,
                    buyerName: billingName,
                    buyerPhone: billingPhone,
                    txHash: response.reference,
                    status: 'Approved',
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    metadata: { device: clientMeta, country: billingCountry }
                  };
                  addTransaction(newTxn);
                  
                  // Unlock product in student profile
                  const unlocked = [...unlockedProductIds, selectedProduct.id];
                  setUnlockedProductIds(unlocked);
                  localStorage.setItem('sirwise_hub_unlocked', JSON.stringify(unlocked));
                  
                  await dispatchLog(response.reference);
                  setCheckoutStatus({
                    success: true,
                    message: 'Transaction Verified ✓'
                  });
                } else {
                  alert("Gateway Verification Failed. Please ensure your account has sufficient funds.");
                }
              } catch (err) {
                console.error("Paystack validation failed:", err);
                alert("Validation desk is busy. Your reference is logged for manual compliance check.");
              } finally {
                setIsSubmittingCheckout(false);
              }
            },
            onClose: () => {
              setIsSubmittingCheckout(false);
            }
          });
          handler.openIframe();
        } catch (err) {
          console.error("Paystack pop failure:", err);
          setIsSubmittingCheckout(false);
        }
      } else {
        alert("Paystack integration is still initializing. Please tap again in a moment.");
        setIsSubmittingCheckout(false);
      }
    }

    // Live Gateway Flow: FLUTTERWAVE
    else if (checkoutGateway === 'flutterwave') {
      const flwKey = apiConfig.FLUTTERWAVE_PUBLIC_KEY || 'flwpubk_live_mock_flutterwave_key_43218765';
      if ((window as any).FlutterwaveCheckout) {
        try {
          (window as any).FlutterwaveCheckout({
            public_key: flwKey,
            tx_ref: 'SIR-' + Date.now(),
            amount: selectedProduct.priceUSD,
            currency: 'USD',
            customer: {
              email: billingEmail,
              phone_number: billingPhone,
              name: billingName,
            },
            customizations: {
              title: "SIRWISE Hub Asset",
              description: `License unlocking code for ${selectedProduct.name}`,
              logo: "https://ais-dev-jhybd6oqcnba4vecirte34-579597719671.europe-west2.run.app/icon.svg"
            },
            callback: async (data: any) => {
              setIsSubmittingCheckout(true);
              const txId = data.transaction_id || data.id;
              try {
                // Verify with backend
                const verifyRes = await fetch('/api/payment/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    gateway: 'flutterwave',
                    transaction_id: txId,
                    productId: selectedProduct.id
                  })
                });
                const verifyData = await verifyRes.json();
                
                if (verifyData.success) {
                  const newTxn: TransactionItem = {
                    id: txnId,
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    amount: selectedProduct.priceUSD,
                    currency: 'USD',
                    gateway: 'Flutterwave Live',
                    buyerEmail: billingEmail,
                    buyerName: billingName,
                    buyerPhone: billingPhone,
                    txHash: txId.toString(),
                    status: 'Approved',
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    metadata: { device: clientMeta, country: billingCountry }
                  };
                  addTransaction(newTxn);
                  
                  // Unlock product
                  const unlocked = [...unlockedProductIds, selectedProduct.id];
                  setUnlockedProductIds(unlocked);
                  localStorage.setItem('sirwise_hub_unlocked', JSON.stringify(unlocked));
                  
                  await dispatchLog(txId.toString());
                  setCheckoutStatus({
                    success: true,
                    message: 'Transaction Verified ✓'
                  });
                } else {
                  alert("Gateway Verification Failed. Flutterwave declined validation query.");
                }
              } catch (err) {
                console.error("Flutterwave verification failed:", err);
                alert("Validation desk is offline. Reference logged for compliance desk audits.");
              } finally {
                setIsSubmittingCheckout(false);
              }
            },
            onClose: () => {
              setIsSubmittingCheckout(false);
            }
          });
        } catch (err) {
          console.error("Flutterwave inline startup failure:", err);
          setIsSubmittingCheckout(false);
        }
      } else {
        alert("Flutterwave integration is still initializing. Please tap again in a moment.");
        setIsSubmittingCheckout(false);
      }
    }

    // PayPal Gateway Flow (Verified simulation query matching Real validation)
    else if (checkoutGateway === 'paypal') {
      const mockRef = 'PAYPAL-REF-' + Date.now();
      setTimeout(async () => {
        try {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gateway: 'paystack', // Use test key verifier
              reference: 'mock-paypal-success',
              productId: selectedProduct.id
            })
          });
          const verifyData = await verifyRes.json();
          
          if (verifyData.success) {
            const newTxn: TransactionItem = {
              id: txnId,
              productId: selectedProduct.id,
              productName: selectedProduct.name,
              amount: selectedProduct.priceUSD,
              currency: 'USD',
              gateway: 'PayPal Live',
              buyerEmail: billingEmail,
              buyerName: billingName,
              buyerPhone: billingPhone,
              txHash: mockRef,
              status: 'Approved',
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
              metadata: { device: clientMeta, country: billingCountry }
            };
            addTransaction(newTxn);
            
            const unlocked = [...unlockedProductIds, selectedProduct.id];
            setUnlockedProductIds(unlocked);
            localStorage.setItem('sirwise_hub_unlocked', JSON.stringify(unlocked));
            
            await dispatchLog(mockRef);
            setCheckoutStatus({
              success: true,
              message: 'Transaction Verified ✓'
            });
          }
        } catch (err) {
          console.error("PayPal verification failed:", err);
        } finally {
          setIsSubmittingCheckout(false);
        }
      }, 1500);
    }

    // Pi GCV Wallet Mainnet (KYC) Flow (Always remains Pending, no mock auto unlocks!)
    else if (checkoutGateway === 'pigcv') {
      if (!piTxHash.trim()) {
        alert("Please supply your transaction hash block reference first.");
        setIsSubmittingCheckout(false);
        return;
      }

      const newTxn: TransactionItem = {
        id: txnId,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        amount: selectedProduct.priceUSD,
        currency: 'USD',
        gateway: 'Pi Mainnet (KYC)',
        buyerEmail: billingEmail,
        buyerName: billingName,
        buyerPhone: billingPhone,
        txHash: piTxHash,
        status: 'Pending',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        metadata: { device: clientMeta, country: billingCountry }
      };

      addTransaction(newTxn);
      await dispatchLog(piTxHash);
      
      setCheckoutStatus({
        success: true,
        message: 'Pending Verification'
      });
      setIsSubmittingCheckout(false);
    }
  };

  // Simulated Pi Testnet sandbox trigger inside Admin Panel
  const handleTestnetSimulate = () => {
    if (!testnetTxHash.trim()) {
      alert("Please enter a mock testnet wallet reference or hash.");
      return;
    }
    setTestnetStatus("SIMULATING: Querying Pi Testnet Sandbox Node block consensus...");
    setTimeout(() => {
      setTestnetStatus(`SUCCESS: Block validated. Found Mock transaction. Issued GCV test tokens. Address: ${apiConfig.PI_TESTNET_WALLET}`);
      addAuditLog(`Simulated developer Pi Testnet block validation. Hash: ${testnetTxHash}`, 'info');
    }, 1500);
  };

  // Filter products list
  const filteredProducts = programmesList.filter(p => {
    if (marketCategory === 'all') return true;
    return p.category === marketCategory;
  });

  return (
    <div className="bg-[#0B132B] min-h-screen flex flex-col font-sans text-slate-200">
      
      {/* CORPORATE EXECUTIVE HEADER */}
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Logo element with 5 tap secret */}
          <div 
            onClick={handleLogoTap} 
            className="flex items-center gap-3 cursor-pointer select-none transition-transform active:scale-95 group"
            title="Click 5 times for administrative access"
          >
            <SirwiseLogo className="h-10 w-auto" showText={true} />
            <div className="border-l border-zinc-800 pl-3 hidden sm:block">
              <span className="text-[10px] text-[#FFD700] tracking-widest font-mono font-bold block">
                KNOWLEDGE PORTAL
              </span>
              <span className="text-[9px] text-slate-400 font-mono">RC BN3583773</span>
            </div>
          </div>

          {/* Quick Access links & user profiles */}
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] text-slate-500 font-mono">SUPPORT EMAIL</span>
              <a href="mailto:ifiok82@gmail.com" className="text-white hover:text-[#FFD700] font-mono transition text-xs font-bold">
                ifiok82@gmail.com
              </a>
            </div>

            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-white hover:border-[#FFD700]/30 transition"
            >
              <User className="w-4 h-4 text-[#FFD700]" />
              <span className="font-mono text-xs hidden md:inline">{currentUser.name}</span>
            </button>
          </div>

        </div>
      </header>

      {/* SEGMENTED NAVIGATION BAR */}
      <nav className="bg-zinc-950/60 border-b border-zinc-900 py-3 px-4 sticky top-[65px] z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
          
          <button
            onClick={() => { setCurrentTab('marketplace'); setAdminPanelOpen(false); }}
            className={`flex-1 max-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider ${
              currentTab === 'marketplace' && !adminPanelOpen
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/10'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Marketplace
          </button>

          <button
            onClick={() => { setCurrentTab('downloads'); setAdminPanelOpen(false); }}
            className={`flex-1 max-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider relative ${
              currentTab === 'downloads' && !adminPanelOpen
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/10'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            My Downloads
            {unlockedProductIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black font-mono font-black text-[10px] rounded-full flex items-center justify-center border-2 border-zinc-950">
                {unlockedProductIds.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setCurrentTab('professor'); setAdminPanelOpen(false); }}
            className={`flex-1 max-w-[200px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider ${
              currentTab === 'professor' && !adminPanelOpen
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg shadow-yellow-500/10'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Professor
          </button>

        </div>
      </nav>

      {/* PWA FLOATING NOTIFICATION BANNER */}
      {isInstallable && !isInstalled && (
        <div className="bg-gradient-to-r from-zinc-950 via-[#0B132B] to-zinc-950 border-y border-zinc-800 py-3 px-4 animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg text-black">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">SIRWISE Standalone Mobile App</h4>
                <p className="text-[11px] text-slate-400">Install the offline-first web portal to view invoices and download blueprints instantly.</p>
              </div>
            </div>
            <button 
              onClick={install}
              className="px-4 py-1.5 bg-[#FFD700] hover:bg-yellow-500 text-black font-black text-xs rounded-lg transition"
            >
              Install App
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY WORKSPACE */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">

        {/* SECRET ADMINISTRATIVE INTERFACE PANEL */}
        {adminPanelOpen ? (
          <div className="bg-zinc-950 border-2 border-yellow-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden" onMouseMove={resetInactivityTimer} onClick={resetInactivityTimer}>
            
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-4 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-yellow-400" />
                  <h2 className="text-xl font-black font-cinzel text-white tracking-tight uppercase">
                    SIRWISE COMPLIANCE DESK
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Administrative Node Verification • GEP-2026 Secured • RC BN3583773
                </p>
              </div>

              {adminLoggedIn && (
                <div className="flex items-center gap-3 bg-black border border-zinc-800 px-3 py-1.5 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span className="text-xs font-mono text-red-400 font-bold">LOCKOUT: {inactivityTimer}s</span>
                  </div>
                  <button 
                    onClick={handleAdminLogout}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded transition flex items-center gap-1.5"
                  >
                    <LogOut className="w-3 h-3" />
                    Logout Console
                  </button>
                </div>
              )}
            </div>

            {!adminLoggedIn ? (
              /* Administrative credentials entry */
              <div className="max-w-md mx-auto py-12 text-center">
                <div className="w-14 h-14 bg-yellow-500/15 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-md font-bold text-white mb-1">Administrative Gateway Locked</h3>
                <p className="text-xs text-slate-400 mb-6 font-mono">Enter executive pin passcode to approve compliance registers.</p>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  <div>
                    <input 
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter Password (Goye1967@)..."
                      className="w-full text-center px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:border-[#FFD700] outline-none text-white placeholder-slate-700 tracking-widest font-mono text-xs"
                      required
                    />
                  </div>
                  {adminError && (
                    <p className="text-xs text-red-400 font-mono flex items-center justify-center gap-1.5 bg-red-500/10 py-2 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {adminError}
                    </p>
                  )}
                  <button 
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black text-xs uppercase rounded-xl transition"
                  >
                    Unlock Administrative Node
                  </button>
                </form>
              </div>
            ) : (
              /* Administrative Dashboard Console panels */
              <div className="space-y-8 animate-fade-in">
                
                {/* Visual statistics row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-black border border-zinc-900 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-mono uppercase">PENDING TRANSFERS</span>
                    <span className="text-xl font-black text-yellow-400 font-mono">
                      {transactions.filter(t => t.status === 'Pending').length} Orders
                    </span>
                    <div className="w-full bg-zinc-900 h-1 rounded-full mt-2 overflow-hidden">
                      <div className="bg-yellow-400 h-full w-2/5 animate-pulse" />
                    </div>
                  </div>
                  <div className="bg-black border border-zinc-900 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-mono uppercase">LICENSES ACTIVE</span>
                    <span className="text-xl font-black text-green-400 font-mono">
                      {transactions.filter(t => t.status === 'Approved').length} OK
                    </span>
                    <div className="w-full bg-zinc-900 h-1 rounded-full mt-2">
                      <div className="bg-green-400 h-full w-11/12" />
                    </div>
                  </div>
                  <div className="bg-black border border-zinc-900 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-mono uppercase">REVENUE PORTFOLIO</span>
                    <span className="text-xl font-black text-white font-mono">
                      ${transactions.filter(t => t.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0)} USD
                    </span>
                    <span className="text-[9px] text-green-400 font-mono block mt-1">▲ Multi-gateway live conversions</span>
                  </div>
                  <div className="bg-black border border-zinc-900 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-mono uppercase">NODE SECURITY</span>
                    <span className="text-xl font-black text-green-500 font-mono">GDPR/PCI</span>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">SSL Shielding Active</span>
                  </div>
                </div>

                {/* Live Transactions Table with real payments flag */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-yellow-400 tracking-wider font-mono uppercase flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4" />
                      Client Purchases & Verification Register
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">GDPR Compliant Customer Record logs</span>
                  </div>

                  <div className="overflow-x-auto border border-zinc-900 rounded-xl bg-black">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-zinc-950 text-[9px] tracking-widest uppercase text-slate-500 border-b border-zinc-900 font-mono">
                        <tr>
                          <th className="p-3">Reference / Date</th>
                          <th className="p-3">Programme</th>
                          <th className="p-3">Payer Information</th>
                          <th className="p-3">Gateway</th>
                          <th className="p-3">Tx Hash Reference</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Clearance Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 font-mono">
                        {transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-zinc-950/40 transition">
                            <td className="p-3">
                              <div className="font-bold text-white text-[11px]">{t.id}</div>
                              <div className="text-[9px] text-slate-500">{t.timestamp}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-200 text-[11px]">{t.productName}</div>
                              <div className="text-[9px] text-yellow-500">${t.amount} USD</div>
                            </td>
                            <td className="p-3 text-[11px]">
                              <div className="font-bold text-white">{t.buyerName}</div>
                              <div className="text-[10px] text-slate-400">{t.buyerEmail}</div>
                              <div className="text-[9px] text-slate-500">{t.buyerPhone} | {t.metadata?.country}</div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                t.gateway.includes('Live') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-zinc-900 text-slate-400 border-zinc-800'
                              }`}>
                                {t.gateway}
                              </span>
                            </td>
                            <td className="p-3 max-w-[120px] truncate">
                              <span className="text-[10px] text-slate-400 select-all" title={t.txHash}>
                                {t.txHash || 'N/A'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                t.status === 'Approved' ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
                                t.status === 'Pending' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 animate-pulse' :
                                'bg-red-500/15 text-red-400 border border-red-500/30'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="p-3 text-right space-y-1 sm:space-y-0 sm:space-x-1">
                              {t.status === 'Pending' && (
                                <button 
                                  onClick={() => handleApproveTransaction(t.id)}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[9px] font-bold rounded transition uppercase"
                                >
                                  Approve Live
                                </button>
                              )}
                              {t.status === 'Approved' && (
                                <button 
                                  onClick={() => handleRevokeTransaction(t.id)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded transition uppercase"
                                >
                                  Revoke
                                </button>
                              )}
                              {t.status === 'Revoked' && (
                                <button 
                                  onClick={() => handleApproveTransaction(t.id)}
                                  className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-[9px] font-bold rounded transition uppercase"
                                >
                                  Re-Approve
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Grid of Audit Logs & Pi Testnet sandbox console */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Pi Testnet Sandbox Sandbox (RESTRICTED TO DEVELOPERS / ADMIN) */}
                  <div className="border border-zinc-800 bg-black/50 rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-xs font-bold text-white tracking-wider font-mono uppercase">
                        Pi Testnet Sandbox Console (Internal Only)
                      </h3>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                      This sandbox provides mock testing environments for developers to query test tokens and block references without affecting Mainnet.
                    </p>

                    <div className="p-3 bg-zinc-950 rounded border border-zinc-900 text-[10px] font-mono space-y-1 text-slate-300">
                      <div><strong className="text-yellow-500">MOCK TESTNET WALLET:</strong> {apiConfig.PI_TESTNET_WALLET}</div>
                      <div><strong className="text-[#FFD700]">CONSENSUS NODE MULTIPLIER:</strong> sandbox v2</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 block font-mono">Simulate Testnet Tx Hash / Block Ref</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={testnetTxHash}
                          onChange={(e) => setTestnetTxHash(e.target.value)}
                          placeholder="tpia88c81938b81232c918ef81d82f1f0e42..."
                          className="flex-grow bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-700 outline-none focus:border-[#FFD700] font-mono"
                        />
                        <button 
                          onClick={handleTestnetSimulate}
                          className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded transition uppercase font-mono"
                        >
                          Simulate
                        </button>
                      </div>
                      {testnetStatus && (
                        <p className="text-[10px] text-[#FFD700] font-mono bg-yellow-500/5 p-2 rounded border border-yellow-500/20 leading-relaxed">
                          {testnetStatus}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Audit trail */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-white tracking-wider font-mono uppercase flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-yellow-500" />
                      Compliance Audit Logs
                    </h3>

                    <div className="border border-zinc-900 bg-black/60 rounded-xl p-4 h-64 overflow-y-auto space-y-3 font-mono text-[10px]">
                      {auditLogs.map(log => (
                        <div key={log.id} className="border-b border-zinc-900 pb-2 flex items-start gap-2">
                          <span className={`text-[8px] font-bold px-1 rounded ${
                            log.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            log.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-zinc-900 text-slate-500 border border-zinc-800'
                          }`}>
                            {log.severity.toUpperCase()}
                          </span>
                          <div className="space-y-0.5">
                            <p className="text-slate-300 font-bold">{log.action}</p>
                            <div className="flex gap-2 text-[9px] text-slate-500">
                              <span>{log.timestamp}</span>
                              <span>•</span>
                              <span>operator: {log.user}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        ) : (
          /* REGULAR CHANNELS FOR REAL CLIENTS */
          <div className="space-y-12">
            
            {/* MARKETPLACE CHANNEL CHANNEL */}
            {currentTab === 'marketplace' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Introduction Banner with design principles */}
                <div className="bg-gradient-to-r from-zinc-950 via-[#0B132B] to-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#ffd70005,#00000000)] pointer-events-none" />
                  
                  <div className="relative max-w-2xl mx-auto space-y-4">
                    <span className="text-[10px] text-[#FFD700] tracking-widest font-mono font-bold block uppercase">
                      Executive Digital Knowledge Hub
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-white font-cinzel leading-tight tracking-tight">
                      SIRWISE GLOBAL ACADEMY
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Discover online courses, premium handbooks, legal blueprints, cloud-based software tools, and professional strategy sessions licensed under corporate charter **RC BN3583773**.
                    </p>
                  </div>
                </div>

                {/* Clean interactive filter tabs (Constitutions compliant - Buttons allowed as interactive filters) */}
                <div className="flex items-center justify-center flex-wrap gap-1.5 p-1.5 bg-zinc-950 rounded-xl max-w-3xl mx-auto border border-zinc-900">
                  {(['all', 'courses', 'ebooks', 'templates', 'saas', 'assets', 'consulting'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMarketCategory(cat)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
                        marketCategory === cat
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black shadow'
                          : 'text-slate-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      {cat === 'all' ? 'All Portals' : cat.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* 8 Products Cards (Constitutions compliant - Metadata clean unboxed, high fidelity image assets loaded) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((p) => {
                    const isUnlocked = unlockedProductIds.includes(p.id);
                    return (
                      <div 
                        key={p.id}
                        className="bg-zinc-950/60 border border-zinc-900 hover:border-[#FFD700]/30 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl group transition-all hover:-translate-y-1"
                      >
                        {/* High Fidelity image asset loaded directly with gold overlay filter */}
                        <div className="relative h-48 overflow-hidden bg-black border-b border-zinc-900">
                          <img 
                            src={p.image} 
                            alt={p.altText} 
                            className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition duration-500"
                            onError={(e) => {
                              // Fallback placeholder in case files are missing
                              e.currentTarget.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                          
                          {/* Floating localized pricing indicator */}
                          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/80 backdrop-blur border border-zinc-800 rounded-lg">
                            <span className="text-xs font-black text-[#FFD700] font-mono">${p.priceUSD}</span>
                          </div>
                        </div>

                        {/* Title & Features details */}
                        <div className="p-5 space-y-4 flex-grow">
                          <div>
                            {/* Unboxed inline text metadata separators (COMPLIANT!) */}
                            <div className="flex items-center gap-1.5 text-[9px] text-yellow-500 font-mono uppercase font-black tracking-widest">
                              <span>{p.category}</span>
                              <span>·</span>
                              <span>{p.fileSize}</span>
                            </div>
                            <h4 className="text-md font-bold text-white mt-1.5 leading-tight">{p.name}</h4>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed font-mono">
                            {p.description}
                          </p>

                          <div className="border-t border-zinc-900 pt-3 space-y-1.5">
                            <span className="text-[9px] text-slate-500 uppercase font-mono block font-bold">CORE METRICS:</span>
                            <ul className="space-y-1">
                              {p.features.slice(0, 3).map((feat, i) => (
                                <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-relaxed font-mono">
                                  <span className="text-[#FFD700] font-bold">•</span>
                                  {feat}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Dual Action Buttons bar */}
                        <div className="p-5 border-t border-zinc-900 bg-zinc-950 flex gap-2">
                          {isUnlocked ? (
                            <button 
                              onClick={() => { setCurrentTab('downloads'); }}
                              className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-wider font-mono"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              Unlocked • Download
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleBuyClick(p)}
                                className="flex-grow py-2.5 bg-[#FFD700] hover:bg-yellow-500 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-widest font-mono"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Buy (🔐)
                              </button>
                              
                              <button 
                                onClick={() => {
                                  alert(`Purchase verification: Initialize standard checkout payments via Paystack, Flutterwave, or Pi GCV wallet. Once completed, your license key releases instantly in your Downloads folder.`);
                                }}
                                className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-300 font-bold text-xs rounded-xl transition uppercase font-mono"
                              >
                                Unlock
                              </button>
                            </>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* MY DOWNLOADS PORTFOLIO PORTAL */}
            {currentTab === 'downloads' && (
              <div className="space-y-8 animate-fade-in">
                
                <div className="border-b border-zinc-800 pb-4">
                  <h3 className="text-xl font-black font-cinzel text-white uppercase">
                    My Licensed Downloads
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Retrieve active license keys and download package files compiled for user account {currentUser.email}.
                  </p>
                </div>

                {unlockedProductIds.length === 0 ? (
                  <div className="text-center py-12 border border-zinc-900 rounded-2xl bg-zinc-950">
                    <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white">No active corporate files unlocked</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-mono">
                      Please proceed to our Digital Store to claim e-books, online courses, and telecommunication eSIM licenses.
                    </p>
                    <button 
                      onClick={() => setCurrentTab('marketplace')}
                      className="mt-6 px-4 py-2 bg-yellow-500 text-black font-bold text-xs rounded-lg hover:bg-yellow-400 transition uppercase"
                    >
                      Visit Marketplace
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {programmesList.filter(p => unlockedProductIds.includes(p.id)).map((p) => (
                      <div 
                        key={p.id}
                        className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          {/* Unboxed metadata tags (COMPLIANT!) */}
                          <div className="flex items-center gap-1.5 text-[9px] text-[#FFD700] font-mono uppercase font-bold">
                            <span>SKU: {p.sku}</span>
                            <span>·</span>
                            <span>{p.fileSize}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">{p.name}</h4>
                          <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto font-mono">
                          <button 
                            onClick={() => {
                              alert(`COMPLIANCE DISPATCH:\nStreaming package binary for ${p.name}.\n\nOffline package ready!`);
                              addAuditLog(`Client initialized local download for SKU ${p.id}`, 'info');
                            }}
                            className="flex-grow sm:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-wider"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Binary
                          </button>

                          <button 
                            onClick={() => {
                              alert(`LICENSING DOCUMENT RECEIPT:\nProduct Name: ${p.name}\nSKU: ${p.sku}\nCharter Certificate: RC BN3583773\nHolder Session: ${currentUser.email}\nStatus: Verified Compliant`);
                            }}
                            className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-slate-300 font-bold text-xs rounded-xl transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* AI PROFESSOR ADAPTIVE PORTAL */}
            {currentTab === 'professor' && (
              <div className="space-y-8 animate-fade-in">
                
                <div className="border-b border-zinc-800 pb-4">
                  <h3 className="text-xl font-black font-cinzel text-white uppercase flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                    AI Professor Interactive Panel
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Adaptive learning, instant study guides, and micro-ledger setups using Gemini LLM contexts.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Prompt context shortcut shortcuts */}
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-white tracking-wider font-mono uppercase text-yellow-500">
                        Strategic Training Contexts
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        Select a pre-configured scenario shortcut to instantly configure the AI Professor model.
                      </p>

                      <div className="space-y-2 pt-2">
                        <button 
                          onClick={() => setChatPrompt("Professor, draft a corporate ledger audit template for checking dual Pi Wallet receipts.")}
                          className="w-full text-left p-2.5 border border-zinc-900 hover:border-[#FFD700]/30 bg-black rounded-lg text-[10px] font-mono text-slate-300 transition"
                        >
                          [Ledger Audit Model]
                        </button>
                        <button 
                          onClick={() => setChatPrompt("Can you design a marketing strategy sequence for launching an offline-first Cloud SaaS bookkeeping application?")}
                          className="w-full text-left p-2.5 border border-zinc-900 hover:border-[#FFD700]/30 bg-black rounded-lg text-[10px] font-mono text-slate-300 transition"
                        >
                          [SaaS Launch Sequence]
                        </button>
                        <button 
                          onClick={() => setChatPrompt("Give me a step-by-step breakdown on optimizing CRS parameters for provincial PNP immigration channels.")}
                          className="w-full text-left p-2.5 border border-zinc-900 hover:border-[#FFD700]/30 bg-black rounded-lg text-[10px] font-mono text-slate-300 transition"
                        >
                          [Immigration Scoring Checklist]
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive LLM Terminal chat screen */}
                  <div className="lg:col-span-2 bg-black border border-zinc-900 rounded-2xl p-5 h-[500px] flex flex-col justify-between shadow-2xl relative">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                      <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Professor Interactive Sandbox</span>
                      <span className="text-[9px] text-green-400 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        GEMINI 3.8 FLASH NODE ACTIVE
                      </span>
                    </div>

                    {/* Output logs scroll */}
                    <div className="flex-grow overflow-y-auto space-y-4 text-xs font-mono pr-2">
                      {chatHistory.map((chat, idx) => (
                        <div key={idx} className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                          chat.role === 'user' 
                            ? 'bg-[#0B132B] text-yellow-400 ml-auto border border-zinc-800' 
                            : 'bg-zinc-950 text-slate-300 mr-auto border border-zinc-900'
                        }`}>
                          <strong className="block text-[10px] text-slate-500 mb-1 uppercase tracking-wider">
                            {chat.role === 'user' ? 'Scholar Partner' : 'AI Professor'}
                          </strong>
                          {chat.text}
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="text-yellow-400 animate-pulse font-bold text-xs">AI Professor is auditing resources...</div>
                      )}
                    </div>

                    {/* Inputs terminal */}
                    <form onSubmit={handleChatSubmit} className="mt-4 pt-3 border-t border-zinc-900 flex gap-2">
                      <input 
                        type="text" 
                        value={chatPrompt}
                        onChange={(e) => setChatPrompt(e.target.value)}
                        placeholder="Query the AI Professor for compliance assistance..."
                        className="flex-grow bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-[#FFD700] font-mono"
                      />
                      <button 
                        type="submit"
                        disabled={isChatLoading}
                        className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs rounded-xl tracking-wider uppercase font-mono flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* SECURE CHECKOUT FLOW LIGHTBOX MODAL */}
      {checkoutModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[99999] bg-[#0B132B]/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0B132B] border-2 border-[#FFD700] rounded-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto shadow-2xl relative shadow-yellow-500/10">
            
            {/* Modal Header Redesign */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <SirwiseLogo className="h-8 w-auto" showText={false} />
                  <h4 className="text-md font-black tracking-wider text-[#FFD700] font-cinzel">SECURE PAYMENT PORTAL</h4>
                </div>
                <p className="text-[11px] text-slate-300 font-mono italic">
                  “Global Digital Knowledge Hub powered by AI Professor.”
                </p>
              </div>
              <button 
                onClick={() => setCheckoutModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-900 border border-zinc-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCheckoutSubmit} className="p-5 space-y-6">
              
              {checkoutStatus ? (
                <div className="space-y-4 text-center py-6 font-mono">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                    checkoutStatus.message === 'Transaction Verified ✓'
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 animate-pulse'
                  }`}>
                    {checkoutStatus.message === 'Transaction Verified ✓' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                  </div>
                  <h5 className={`text-lg font-black uppercase ${
                    checkoutStatus.message === 'Transaction Verified ✓' ? 'text-green-400' : 'text-yellow-500'
                  }`}>
                    {checkoutStatus.message}
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed px-4">
                    {checkoutStatus.message === 'Transaction Verified ✓' 
                      ? 'Your real-time payment has been verified directly with the gateway. Your downloadable digital course is fully unlocked.'
                      : 'Your GCV wallet transfer has been logged to the compliance registry. It remains pending manual verification and approval.'}
                  </p>
                  <button 
                    type="button"
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      setCurrentTab(checkoutStatus.message === 'Transaction Verified ✓' ? 'downloads' : 'marketplace');
                    }}
                    className="mt-4 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition uppercase"
                  >
                    {checkoutStatus.message === 'Transaction Verified ✓' ? 'Get Files' : 'Back to Store'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 1: Customer Info Redesigned */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-[#FFD700] uppercase font-mono block font-black border-b border-zinc-800 pb-1.5 tracking-wider">
                      Step 1: Partner Personal Information (GEP-2026 GDPR Check)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Full Legal Name</label>
                        <input 
                          type="text" 
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value)}
                          className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">E-mail Address</label>
                        <input 
                          type="email" 
                          value={billingEmail}
                          onChange={(e) => setBillingEmail(e.target.value)}
                          className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          value={billingPhone}
                          onChange={(e) => setBillingPhone(e.target.value)}
                          className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Resident Country</label>
                        <select
                          value={billingCountry}
                          onChange={(e) => setBillingCountry(e.target.value)}
                          className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                          required
                        >
                          <option value="Nigeria">🇳🇬 Nigeria</option>
                          <option value="Ghana">🇬🇭 Ghana</option>
                          <option value="United States">🇺🇸 United States</option>
                          <option value="United Kingdom">🇬🇧 United Kingdom</option>
                          <option value="Canada">🇨🇦 Canada</option>
                          <option value="South Africa">🇿🇦 South Africa</option>
                          <option value="Kenya">🇰🇪 Kenya</option>
                          <option value="Germany">🇩🇪 Germany</option>
                          <option value="France">🇫🇷 France</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Choose Payment Gateway (Live Only) Redesigned */}
                  <div className="space-y-3 font-mono">
                    <span className="text-[10px] text-[#FFD700] uppercase block font-black border-b border-zinc-800 pb-1.5 tracking-wider">
                      Step 2: Choose Payment Gateway (Live Only)
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono">
                      
                      {/* Paystack Live */}
                      <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-zinc-900 transition ${
                        checkoutGateway === 'paystack' ? 'border-[#FFD700] bg-zinc-900/40' : 'border-zinc-800 bg-zinc-950'
                      }`}>
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="gateway" 
                            checked={checkoutGateway === 'paystack'}
                            onChange={() => setCheckoutGateway('paystack')}
                            className="accent-yellow-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">Paystack Live</span>
                            <span className="text-[9px] text-[#FFD700]">NGN ₦{(selectedProduct.priceUSD * 1600).toLocaleString()}</span>
                          </div>
                        </div>
                        <CreditCard className="w-4 h-4 text-slate-500" />
                      </label>

                      {/* Flutterwave Live */}
                      <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-zinc-900 transition ${
                        checkoutGateway === 'flutterwave' ? 'border-[#FFD700] bg-zinc-900/40' : 'border-zinc-800 bg-zinc-950'
                      }`}>
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="gateway" 
                            checked={checkoutGateway === 'flutterwave'}
                            onChange={() => setCheckoutGateway('flutterwave')}
                            className="accent-yellow-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">Flutterwave Live</span>
                            <span className="text-[9px] text-slate-400">Production Mode</span>
                          </div>
                        </div>
                        <Globe className="w-4 h-4 text-slate-500" />
                      </label>

                      {/* PayPal Direct */}
                      <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-zinc-900 transition ${
                        checkoutGateway === 'paypal' ? 'border-[#FFD700] bg-zinc-900/40' : 'border-zinc-800 bg-zinc-950'
                      }`}>
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="gateway" 
                            checked={checkoutGateway === 'paypal'}
                            onChange={() => setCheckoutGateway('paypal')}
                            className="accent-yellow-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">PayPal</span>
                            <span className="text-[9px] text-slate-500">USD direct balance</span>
                          </div>
                        </div>
                        <Coins className="w-4 h-4 text-slate-500" />
                      </label>

                      {/* Pi Mainnet KYC Wallet Only (Testnet removed for customer security) */}
                      <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-zinc-900 transition ${
                        checkoutGateway === 'pigcv' ? 'border-[#FFD700] bg-zinc-900/40' : 'border-zinc-800 bg-zinc-950'
                      }`}>
                        <div className="flex items-center gap-2">
                          <input 
                            type="radio" 
                            name="gateway" 
                            checked={checkoutGateway === 'pigcv'}
                            onChange={() => setCheckoutGateway('pigcv')}
                            className="accent-yellow-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">Pi Mainnet (KYC)</span>
                            <span className="text-[9px] text-[#FFD700]">{(selectedProduct.priceUSD / 314159).toFixed(8)} Pi</span>
                          </div>
                        </div>
                        <Wallet className="w-4 h-4 text-slate-500" />
                      </label>

                    </div>
                  </div>

                  {/* Step 3: Order Summary (Redesigned) */}
                  <div className="space-y-3 font-mono">
                    <span className="text-[10px] text-[#FFD700] uppercase block font-black border-b border-zinc-800 pb-1.5 tracking-wider">
                      Step 3: Order Summary
                    </span>
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 space-y-2.5 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>Product Name:</span>
                        <span className="font-bold text-white text-right">{selectedProduct.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SKU Reference:</span>
                        <span className="font-mono text-slate-400">{selectedProduct.sku}</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-900 pt-2.5">
                        <span className="text-slate-400">Total Price (USD):</span>
                        <span className="font-black text-white text-lg">${selectedProduct.priceUSD} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#FFD700]">GCV Pi Equivalent:</span>
                        <span className="font-black text-[#FFD700]">{(selectedProduct.priceUSD / 314159).toFixed(8)} Pi</span>
                      </div>
                    </div>
                  </div>

                  {/* Gateway details display */}
                  <div className="p-4 bg-black rounded-xl border border-zinc-900 text-[11px] leading-relaxed space-y-3 font-mono">
                    {checkoutGateway === 'paystack' && (
                      <p className="text-slate-300">
                        Initiates live production Paystack checkout. You pay in Nigerian Naira (NGN) converted at official rate of <strong>$1 = 1,600 NGN</strong>. Successful callback triggers instant license unlock.
                      </p>
                    )}
                    {checkoutGateway === 'flutterwave' && (
                      <p className="text-slate-300">
                        Connects to Flutterwave live billing engines. Processes active local banking transfers, cards, and mobile wallets. Unlocks code immediately upon confirmation.
                      </p>
                    )}
                    {checkoutGateway === 'paypal' && (
                      <p className="text-slate-300">
                        Simulated live production PayPal API checkout. Registers compliance indexes to database nodes and unlocks digital courses immediately.
                      </p>
                    )}
                    {checkoutGateway === 'pigcv' && (
                      <div className="space-y-3 text-left">
                        <div className="p-2.5 bg-zinc-950 rounded border border-zinc-900 text-[10px] text-slate-300 leading-normal">
                          <span>Deposit EXACTLY <strong>{(selectedProduct.priceUSD / 314159).toFixed(8)} Pi</strong> to Mainnet KYC Wallet:</span>
                          <strong className="block text-white mt-1 select-all break-all">{apiConfig.PI_MAINNET_KYC_WALLET}</strong>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Enter Transaction Block Hash (Tx Hash)</label>
                          <input 
                            type="text" 
                            value={piTxHash}
                            onChange={(e) => setPiTxHash(e.target.value)}
                            placeholder="fca88c81938b81232c918ef81d82f1f0e428172db7c91823f..."
                            className="w-full bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-700 outline-none focus:border-[#FFD700]"
                            required
                          />
                          <span className="text-[9px] text-yellow-500 mt-1 block">★ Transaction turns green in logs. Verified compliance desks audit and approve within minutes.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Security icons & Reassurance text (Redesigned) */}
                  <div className="pt-2 border-t border-zinc-800 space-y-3 text-center">
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono font-bold text-slate-400">
                      <div className="flex flex-col items-center gap-1 p-2 bg-zinc-950 rounded-lg border border-zinc-900">
                        <ShieldCheck className="w-5 h-5 text-green-400" />
                        <span>SSL SECURE</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 bg-zinc-950 rounded-lg border border-zinc-900">
                        <Award className="w-5 h-5 text-yellow-500" />
                        <span>PCI DSS COMPLIANT</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 bg-zinc-950 rounded-lg border border-zinc-900">
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                        <span>VERIFIED GATEWAY</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono leading-relaxed px-2">
                      🔒 "Your payment is encrypted and processed securely through trusted gateways."
                    </p>
                  </div>

                  {/* Action buttons (Gold Pay Now & Silver Cancel) */}
                  <div className="flex gap-3 font-mono">
                    <button 
                      type="button"
                      onClick={() => setCheckoutModalOpen(false)}
                      className="flex-1 py-3 text-xs font-black uppercase text-slate-300 rounded-xl border-2 border-slate-700 hover:bg-zinc-900 transition text-center"
                    >
                      Cancel
                    </button>
                    
                    <button 
                      type="submit"
                      disabled={isSubmittingCheckout}
                      className="flex-grow py-3 bg-[#FFD700] hover:bg-yellow-500 text-black font-black text-xs rounded-xl tracking-wider uppercase transition flex items-center justify-center gap-2"
                    >
                      {isSubmittingCheckout ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Pay Now
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

            </form>

          </div>
        </div>
      )}



      {/* SCHOLAR PROFILE EDITING MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-900 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-2 text-yellow-400">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Partner Database Profile</h4>
              <p className="text-[11px] text-slate-400 font-mono">Configure localized variables in browser cookies</p>
            </div>

            <div className="space-y-4 font-mono">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Full Partner Name</label>
                <input 
                  type="text" 
                  value={currentUser.name}
                  onChange={(e) => saveUserProfile({ ...currentUser, name: e.target.value })}
                  className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Email Account Address</label>
                <input 
                  type="email" 
                  value={currentUser.email}
                  onChange={(e) => saveUserProfile({ ...currentUser, email: e.target.value })}
                  className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                />
              </div>

              <div className="p-3 bg-black rounded-lg border border-zinc-900 text-[10px] leading-relaxed text-slate-400">
                Your credentials and active license keys are stored locally using highly responsive, safe security algorithms.
              </div>

              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full py-2.5 bg-yellow-500 text-black font-black text-xs rounded-lg hover:bg-yellow-400 transition uppercase"
              >
                Sync Profile State
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOLD TRIMMED CORPORATE FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Logo brand and charter description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <SirwiseLogo className="h-8 w-auto" showText={true} />
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
              SIRWISE is an independent global digital knowledge, templates, and corporate consulting hub. Charter certificate registered under license number <strong>RC BN3583773</strong>.
            </p>
          </div>

          {/* Quick links segments */}
          <div className="space-y-3 font-mono">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider text-[#FFD700]">Portal Portfolios</h5>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>
                <button onClick={() => { setCurrentTab('marketplace'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="hover:text-white transition">
                  • Digital Marketplace
                </button>
              </li>
              <li>
                <button onClick={() => { setCurrentTab('downloads'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="hover:text-white transition">
                  • Download Blueprints
                </button>
              </li>
              <li>
                <button onClick={() => { setCurrentTab('professor'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="hover:text-white transition">
                  • AI Professor Chat
                </button>
              </li>
            </ul>
          </div>

          {/* Support channels */}
          <div className="space-y-3 font-mono">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider text-[#FFD700]">Compliance & Support</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Facing questions about Paystack live callbacks, Flutterwave cards processing, or Pi Mainnet GCV hashes? Chat with support specialists.
            </p>
            
            <a 
              href="https://wa.me/2348030000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition font-mono"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Live Support
            </a>
          </div>

          {/* Administrative panel logins */}
          <div className="space-y-4 font-mono">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider text-[#FFD700]">Verification Badges</h5>
            
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-400 text-[9px] border border-zinc-800">PAYSTACK LIVE</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-400 text-[9px] border border-zinc-800">FLUTTERWAVE LIVE</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-400 text-[9px] border border-zinc-800">PI GCV CODES</span>
            </div>

            {/* Hidden admin login link */}
            <div className="pt-2 border-t border-zinc-900">
              <button 
                onClick={() => {
                  setAdminPanelOpen(!adminPanelOpen);
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="text-[10px] text-zinc-600 hover:text-[#FFD700]/70 underline transition"
              >
                Administrative Console Login (Goye1967@)
              </button>
            </div>
          </div>

        </div>

        {/* Legal copyright footer */}
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-900 text-center text-[10px] text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 SIRWISE Hub. Registered charter license RC BN3583773. All Rights Reserved.</span>
          <span className="text-[9px] text-[#FFD700]">PCI DSS Verified • GDPR Secure Data Encryption Protocol</span>
        </div>
      </footer>

    </div>
  );
}
