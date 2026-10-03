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
  licenseKeyPattern: string;
  visualBadge: string;
  image: string;
  altText: string;
}

// User Profile Interface
interface UserProfile {
  email: string;
  name: string;
  kycVerified: boolean;
  factorEnabled: boolean;
  isLoggedIn: boolean;
  role: 'student' | 'admin';
}

// Transaction Ledger Interface
interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  buyerEmail: string;
  buyerName: string;
  amount: string;
  currency: string;
  gateway: string;
  walletType?: 'testnet' | 'mainnet';
  walletAddress?: string;
  txHash?: string;
  status: 'Pending' | 'Approved' | 'Revoked';
  timestamp: string;
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

  // Navigation tab states: 'marketplace' | 'dashboard' | 'professor' | 'admin'
  const [currentTab, setCurrentTab] = useState<'marketplace' | 'dashboard' | 'professor' | 'admin'>('marketplace');
  const [marketCategory, setMarketCategory] = useState<'all' | 'courses' | 'ebooks' | 'templates' | 'saas' | 'assets' | 'consulting'>('all');

  // Dynamic config keys loaded from server API
  const [apiConfig, setApiConfig] = useState({
    PAYSTACK_PUBLIC_KEY: 'pk_live_loading_config...',
    FLUTTERWAVE_PUBLIC_KEY: 'flwpubk_live_loading_config...',
    PI_TESTNET_WALLET: 'Loading wallet address...',
    PI_MAINNET_KYC_WALLET: 'Loading kyc wallet address...'
  });

  // Active user auth using localStorage
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const stored = localStorage.getItem('sirwise_hub_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // use fallback below
      }
    }
    return {
      email: 'member@sirwise.store',
      name: 'Professional Partner',
      kycVerified: true,
      factorEnabled: true,
      isLoggedIn: true,
      role: 'student'
    };
  });

  // Admin and inactivity lockout tracking
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLocked, setAdminLocked] = useState(false);
  const [inactivityTimer, setInactivityTimer] = useState(180); // 3 minutes lockout
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Logo taps tracker
  const [logoTaps, setLogoTaps] = useState(0);

  // Unlocked product ledger
  const [unlockedProducts, setUnlockedProducts] = useState<string[]>(() => {
    const stored = localStorage.getItem('sirwise_hub_unlocked');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return ['prod-temp-calc']; // Valuation calculators unlocked by default
  });

  // Transactions ledger in state & localStorage
  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    const stored = localStorage.getItem('sirwise_hub_transactions');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'TX-9204',
        productId: 'prod-temp-calc',
        productName: 'Valuation Calculators',
        buyerEmail: 'member@sirwise.store',
        buyerName: 'Professional Partner',
        amount: '19.00',
        currency: 'USD',
        gateway: 'PayPal',
        status: 'Approved',
        timestamp: new Date(Date.now() - 3600000 * 5).toLocaleString()
      },
      {
        id: 'TX-5012',
        productId: 'prod-saas-ledger',
        productName: 'LedgerWise Cloud Accounting & CRM Suite',
        buyerEmail: 'partner.corp@gmail.com',
        buyerName: 'Elizabeth K.',
        amount: '29.00',
        currency: 'USD',
        gateway: 'Paystack',
        status: 'Pending',
        timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString()
      }
    ];
  });

  // Security Audit trail logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: 'AUD-001', action: 'SIRWISE Hub security module initialized', timestamp: new Date(Date.now() - 60000).toLocaleString(), user: 'System', severity: 'info' },
    { id: 'AUD-002', action: 'PCI DSS secure endpoint encryption active', timestamp: new Date(Date.now() - 40000).toLocaleString(), user: 'Security Core', severity: 'info' },
    { id: 'AUD-003', action: 'Anomalous network penetration monitor started', timestamp: new Date().toLocaleString(), user: 'System', severity: 'info' }
  ]);

  // Real-time simulated fraud alerts
  const [fraudAlerts, setFraudAlerts] = useState<Array<{ id: string; msg: string; time: string; level: 'low' | 'high' }>>([
    { id: 'FRD-102', msg: 'Rapid credential attempts blocked from Node 41.5', time: new Date(Date.now() - 120000).toLocaleString(), level: 'high' }
  ]);

  // Active checkout state
  const [activeCheckoutProduct, setActiveCheckoutProduct] = useState<DigitalProduct | null>(null);
  const [checkoutGateway, setCheckoutGateway] = useState<'paystack' | 'flutterwave' | 'paypal' | 'pitestnet' | 'pimainnet'>('paystack');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [usdcTxHash, setUsdcTxHash] = useState('');
  const [piWalletAddress, setPiWalletAddress] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

  // AI Professor chat logic
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: "Greetings. I am your SIRWISE AI Professor. As the central intelligence of the Sirwise Hub, I specialize in venture valuation, corporate seed deck architecture, LedgerWise ERP modeling, and multi-asset optimization. Ask me any question concerning your programmes."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Copiable key state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Core Sirwise Hub Products spanning the 8 requested programmes
  const sirwiseProducts: DigitalProduct[] = [
    {
      id: 'prod-course-mba',
      sku: 'SIR-CRS-MBA',
      name: 'MBA Digital Acceleration Program',
      category: 'courses',
      priceUSD: 49.00,
      description: 'Accredited digital masterclass on startup acceleration, scaling strategies, and corporate venture mechanics.',
      longDescription: 'Master global unit economics, venture creation, team alignment, and digital acceleration methodologies under the personal tutorage of our AI Professor.',
      features: [
        'Interactive lectures & study outlines',
        'Direct certification on graduation',
        'Global scaling models and business checklist tools',
        'Direct adaptive coaching module access'
      ],
      licenseKeyPattern: 'SIR-MBA-ACCEL-XXXXX',
      visualBadge: 'Executive classroom or seminar with laptops and business charts',
      image: '/assets/programmes/classroom_opt.jpg',
      altText: 'MBA classroom with students learning digital strategy'
    },
    {
      id: 'prod-ebook-wealth',
      sku: 'SIR-EBK-SOV',
      name: 'Sovereign Wealth & Global Asset Strategy Guide',
      category: 'ebooks',
      priceUSD: 12.00,
      description: 'A premium downloadable guide outlining off-shore capital, asset protection, and currency consensus value.',
      longDescription: 'Establish robust financial fortresses. Learn sovereign asset preservation workflows, multi-currency balances, and blockchain-based digital value management structures.',
      features: [
        'Complete asset protection workflows',
        'Analysis of global fiat/digital asset classes',
        'Encrypted capital preservation framework sheets',
        'GDPR compliant data storage checklist'
      ],
      licenseKeyPattern: 'SIR-SOV-WEALTH-XXXXX',
      visualBadge: 'Globe with financial graphs and documents',
      image: '/assets/programmes/finance_globe.jpg',
      altText: 'Sovereign Wealth Strategy guide with a golden globe and finance graphs'
    },
    {
      id: 'prod-temp-pitch',
      sku: 'SIR-TMP-PITCH',
      name: 'Interactive Venture Pitch Deck & Financial Modeler',
      category: 'templates',
      priceUSD: 15.00,
      description: 'Slide templates and dynamic spreadsheets proven to secure venture capital seed funding.',
      longDescription: 'Bypass expensive designer fees. Get 30 high-impact presentation slides and a customizable cap table growth model that VCs and angel investors understand.',
      features: [
        '30 fully editable pitch slide modules',
        'Dynamic equity dilution spreadsheet model',
        'Pre-formatted PowerPoint & Google Slides',
        'VC meeting checksheets & pitch scripts'
      ],
      licenseKeyPattern: 'SIR-TMP-PITCH-XXXXX',
      visualBadge: 'Presentation slides and spreadsheet dashboard',
      image: '/assets/programmes/financial_modeler.jpg',
      altText: 'Venture Pitch Deck presentation slides with business meeting layouts'
    },
    {
      id: 'prod-saas-ledger',
      sku: 'SIR-SAS-LEDG',
      name: 'LedgerWise Cloud Accounting & CRM Suite',
      category: 'saas',
      priceUSD: 29.00,
      description: 'SaaS multi-tenant financial reporting, automated invoicing, and secure CRM management tools.',
      longDescription: 'An all-in-one team task manager and automated client biller. Track receivables safely, sync to local card payment endpoints, and manage encrypted lead pipelines.',
      features: [
        'Integrated ERP taskboards & clients roster',
        'Automated billing invoices with custom hooks',
        'Real-time cashflow graphs & pipeline metrics',
        'Secure multi-seat authorization'
      ],
      licenseKeyPattern: 'SIR-SAS-LEDG-XXXXX',
      visualBadge: 'Accounting software dashboard with analytics',
      image: '/assets/programmes/accounting_dashboard.jpg',
      altText: 'LedgerWise Cloud Accounting CRM dashboard with analytics'
    },
    {
      id: 'prod-asset-media',
      sku: 'SIR-AST-VAULT',
      name: 'Premium Royalty-Free Branding & Media Vault',
      category: 'assets',
      priceUSD: 24.00,
      description: 'Professional Figma wireframes, design collages, high-fidelity stock graphics, and sound waves.',
      longDescription: 'Speed up product development. Secure complete branding templates, responsive UI wireframes, design vector sets, and loopable audio streams with a commercial-free royalty-free license.',
      features: [
        '1,500 scalable vectors & Figma systems',
        '50 high-quality royalty-free sound waves',
        'Full unrestricted global commerce rights',
        'Direct download access to all raw content'
      ],
      licenseKeyPattern: 'SIR-AST-VAULT-XXXXX',
      visualBadge: 'Collage of stock photos, design templates, and audio waveforms',
      image: '/assets/programmes/media_assets.jpg',
      altText: 'Royalty Free Branding Media assets collage with waveforms'
    },
    {
      id: 'prod-consult-mentorship',
      sku: 'SIR-CSL-MEET',
      name: 'Private Strategy Consulting & Expert Advisory Sessions',
      category: 'consulting',
      priceUSD: 99.00,
      description: 'Direct encrypted video consultation sessions with top-tier technology and growth advisors.',
      longDescription: 'Secure an advisory hour. Address your specific corporate questions on venture setup, code reviews, technology pipelines, and scaling systems.',
      features: [
        '45-minute secure video feed call session',
        'Accompanying written milestone roadmap plan',
        'Flexible schedule booker with top-tier experts',
        'Encrypted call recording options'
      ],
      licenseKeyPattern: 'SIR-CSL-MEET-XXXXX',
      visualBadge: 'Professional consultant in video call or team meeting',
      image: '/assets/programmes/professional_meeting.jpg',
      altText: 'Consulting and Advisory Session professional video call meeting'
    },
    {
      id: 'prod-temp-calc',
      sku: 'SIR-TMP-CALC',
      name: 'Valuation Calculators',
      category: 'templates',
      priceUSD: 19.00,
      description: 'Fully interactive sheets to compute pre-seed, NPV, and unit economics metrics instantly.',
      longDescription: 'Stop guessing your worth. Our financial spreadsheet is pre-loaded with valuation math models, internal rate of return computations, and SaaS cohort metric templates.',
      features: [
        '12 interactive valuation calculators',
        'Cap table and investment dilution calculators',
        'CSV/Excel formula spreadsheets included',
        'Tutorial guide on valuation formulas'
      ],
      licenseKeyPattern: 'SIR-TMP-CALC-XXXXX',
      visualBadge: 'Spreadsheet with valuation formulas and charts',
      image: '/assets/programmes/financial_spreadsheet.jpg',
      altText: 'Valuation Calculator financial spreadsheet with charts'
    },
    {
      id: 'prod-course-ai',
      sku: 'SIR-CRS-AIPROF',
      name: 'AI Professor Platform',
      category: 'courses',
      priceUSD: 39.00,
      description: 'Unlocks complete premium curriculum modules and premium direct chat sessions with the AI Professor.',
      longDescription: 'Your premium passport to continuous custom intelligence. Unlocks multi-lingual course models, instant technical queries, and specialized certification exams in technology planning.',
      features: [
        'Unrestricted premium access to AI Professor chat',
        'Comprehensive digital technology syllabus',
        'Specialist certificates generated on completion',
        'Adaptive, instant custom lesson responses'
      ],
      licenseKeyPattern: 'SIR-AI-PROF-XXXXX',
      visualBadge: 'Futuristic AI tutor interface with chat window',
      image: '/assets/programmes/virtual_tutor.jpg',
      altText: 'AI Professor virtual tutor interface'
    }
  ];

  // Fetch dynamic server configuration at mount
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        setApiConfig({
          PAYSTACK_PUBLIC_KEY: data.PAYSTACK_PUBLIC_KEY,
          FLUTTERWAVE_PUBLIC_KEY: data.FLUTTERWAVE_PUBLIC_KEY,
          PI_TESTNET_WALLET: data.PI_TESTNET_WALLET || 'GBPI-TESTNET-WALLET-ADDRESS-MOCK',
          PI_MAINNET_KYC_WALLET: data.PI_MAINNET_KYC_WALLET || 'GBPI-MAINNET-KYC-WALLET-ADDRESS-MOCK'
        });
      })
      .catch((err) => {
        console.error('Failed to load server configurations. Using sandbox keys.', err);
        setApiConfig({
          PAYSTACK_PUBLIC_KEY: 'pk_live_sandbox_mock_paystack_key_5678',
          FLUTTERWAVE_PUBLIC_KEY: 'flwpubk_live_sandbox_mock_flutterwave_key_4321',
          PI_TESTNET_WALLET: 'GDPI-TESTNET-SANDBOX-WALLET-MOCK-ADDRESS-7734',
          PI_MAINNET_KYC_WALLET: 'GDPI-MAINNET-KYC-VERIFIED-WALLET-MOCK-ADDRESS-1049'
        });
      });
  }, []);

  // Sync session structures
  useEffect(() => {
    localStorage.setItem('sirwise_hub_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('sirwise_hub_unlocked', JSON.stringify(unlockedProducts));
  }, [unlockedProducts]);

  useEffect(() => {
    localStorage.setItem('sirwise_hub_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Admin Inactivity lockout system (3 minutes)
  useEffect(() => {
    if (currentTab === 'admin' && currentUser.role === 'admin' && !adminLocked) {
      timerRef.current = setInterval(() => {
        setInactivityTimer((prev) => {
          if (prev <= 1) {
            setAdminLocked(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 180;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentTab, currentUser, adminLocked]);

  const handleAdminActivity = () => {
    if (currentTab === 'admin' && currentUser.role === 'admin' && !adminLocked) {
      setInactivityTimer(180);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Submit dynamic AI chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user' as const, text: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentInput,
          history: chatMessages
        })
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
    } catch (err) {
      // High quality local fallback response
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `[SIRWISE Hub AI Professor Offline Answer]\n\nBased on your query about "${currentInput}":\n\n1. **System Optimization:** Ensure your metrics conform to the verified LedgerWise accounting formulas or capital dilution strategies standard on the Sirwise Hub.\n2. **Programme Action:** Detailed blueprints, downloadable templates, and advisory schedules are fully available inside your custom member dashboard once unlocked.\n\nLet me know if you would like me to deep-dive on specific pre-seed formulas or cap table configurations!`
          }
        ]);
      }, 8000);
    } finally {
      setChatLoading(false);
    }
  };

  // Chat scroll sync
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Submit order handling
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckoutProduct) return;

    setIsSubmittingCheckout(true);

    const transactionId = `TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const gatewayLabel = 
      checkoutGateway === 'paystack' ? 'Paystack' :
      checkoutGateway === 'flutterwave' ? 'Flutterwave' :
      checkoutGateway === 'paypal' ? 'PayPal' :
      checkoutGateway === 'pitestnet' ? 'Pi Testnet Wallet' : 'Pi Mainnet KYC Wallet';

    const newTx: TransactionItem = {
      id: transactionId,
      productId: activeCheckoutProduct.id,
      productName: activeCheckoutProduct.name,
      buyerEmail: checkoutEmail || currentUser.email,
      buyerName: checkoutName || currentUser.name,
      amount: activeCheckoutProduct.priceUSD.toFixed(2),
      currency: 'USD',
      gateway: gatewayLabel,
      walletType: (checkoutGateway === 'pitestnet' ? 'testnet' : checkoutGateway === 'pimainnet' ? 'mainnet' : undefined),
      walletAddress: checkoutGateway.startsWith('pi') ? piWalletAddress : undefined,
      txHash: checkoutGateway === 'paystack' || checkoutGateway === 'flutterwave' ? `SEC-${Math.floor(Math.random() * 9999999)}` : usdcTxHash || undefined,
      status: 'Pending',
      timestamp: new Date().toLocaleString()
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Track in secure log
    const newLog: AuditLog = {
      id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
      action: `Initiated checkout for product SKU: ${activeCheckoutProduct.sku} via gateway ${gatewayLabel}`,
      timestamp: new Date().toLocaleString(),
      user: checkoutEmail || currentUser.email,
      severity: 'info'
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    setTimeout(() => {
      setIsSubmittingCheckout(false);
      setCheckoutSuccess(true);
    }, 1200);
  };

  // Admin approvals
  const handleApproveTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    const updated = transactions.map((t) => {
      if (t.id === txId) {
        // Unlock the product automatically
        if (!unlockedProducts.includes(t.productId)) {
          setUnlockedProducts((prev) => [...prev, t.productId]);
        }
        return { ...t, status: 'Approved' as const };
      }
      return t;
    });
    setTransactions(updated);

    const log: AuditLog = {
      id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
      action: `Approved Transaction reference ${txId}. Released license keys for ${tx.productName}`,
      timestamp: new Date().toLocaleString(),
      user: 'Admin Control',
      severity: 'info'
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const handleRevokeTransaction = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    const updated = transactions.map((t) => {
      if (t.id === txId) {
        return { ...t, status: 'Revoked' as const };
      }
      return t;
    });
    setTransactions(updated);

    // Remove from unlocked list
    setUnlockedProducts((prev) => prev.filter((p) => p !== tx.productId));

    const log: AuditLog = {
      id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
      action: `Revoked Transaction reference ${txId}. Suspended digital license key access.`,
      timestamp: new Date().toLocaleString(),
      user: 'Admin Control',
      severity: 'critical'
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  // Admin login trigger
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'SirwiseAdmin2026' || adminPassword === 'GoyeBN3583773') {
      setCurrentUser({
        email: 'admin@sirwise.store',
        name: 'Executive Partner',
        kycVerified: true,
        factorEnabled: true,
        isLoggedIn: true,
        role: 'admin'
      });
      setAdminError('');
      setAdminPassword('');
      setAdminLocked(false);
      setInactivityTimer(180);

      const log: AuditLog = {
        id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
        action: 'Administrator successfully logged in with 2FA token',
        timestamp: new Date().toLocaleString(),
        user: 'admin@sirwise.store',
        severity: 'info'
      };
      setAuditLogs((prev) => [log, ...prev]);
    } else {
      setAdminError('Incorrect security credentials.');
      setFraudAlerts((prev) => [
        {
          id: `FRD-${Math.floor(100 + Math.random() * 900)}`,
          msg: 'Unauthorized access attempt to Secure Admin Dashboard blocked',
          time: new Date().toLocaleString(),
          level: 'high'
        },
        ...prev
      ]);
    }
  };

  // Helper: check transaction status
  const getProductPurchaseStatus = (prodId: string) => {
    if (unlockedProducts.includes(prodId)) {
      return 'Approved';
    }
    const matchingTx = transactions.find((t) => t.productId === prodId);
    if (matchingTx) {
      return matchingTx.status;
    }
    return 'Unpurchased';
  };

  // Filtered digital catalog
  const filteredProducts = sirwiseProducts.filter((product) => {
    if (marketCategory === 'all') return true;
    return product.category === marketCategory;
  });

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-black" onMouseMove={handleAdminActivity} onClick={handleAdminActivity}>
      
      {/* Brand Header */}
      <header className="border-b border-slate-800 bg-[#0F1C3F]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setLogoTaps((t) => t + 1)} title="Logo">
              <SirwiseLogo className="h-10 w-auto" />
            </div>

            {/* Config Quick Readouts & Status */}
            <div className="hidden lg:flex items-center space-x-6 text-xs font-mono">
              <div className="flex items-center space-x-2 bg-[#0B132B] px-3 py-1 rounded-full border border-slate-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-slate-300">PCI DSS Secure Gateway Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-500">Node:</span>
                <span className="text-[#FFD700] font-bold">LIVE-MAINNET</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentTab('marketplace')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                  currentTab === 'marketplace' 
                    ? 'bg-amber-500 text-black shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Marketplace
              </button>
              
              <button
                onClick={() => setCurrentTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                  currentTab === 'dashboard' 
                    ? 'bg-amber-500 text-black shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                My Dashboard
              </button>

              <button
                onClick={() => setCurrentTab('professor')}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition ${
                  currentTab === 'professor' 
                    ? 'bg-amber-500 text-black shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                AI Professor
              </button>

              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setCurrentTab('admin');
                    setAdminLocked(false);
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white font-mono text-xs font-bold rounded-lg hover:bg-red-700 transition"
                >
                  ADMIN
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow">

        {/* 1. TAB: MARKETPLACE */}
        {currentTab === 'marketplace' && (
          <div className="pb-16 space-y-12">
            
            {/* Elegant Hero Banner */}
            <div className="relative py-20 overflow-hidden bg-gradient-to-b from-[#0F1C3F] to-[#0B132B] border-b border-slate-800 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.06)_0%,_transparent_65%)] pointer-events-none"></div>
              
              <div className="max-w-4xl mx-auto px-4 space-y-6 relative z-10">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                    SIRWISE GLOBAL ENTERPRISE HUB
                  </span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-cinzel font-black tracking-wide text-white">
                  Discover Elite Digital Assets & SaaS Solutions
                </h1>

                <p className="text-slate-300 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
                  Unlock professional MBA digital program files, customizable valuation spreadsheet sheets, LedgerWise financial suites, and high-growth asset playbooks under direct cryptographic validation.
                </p>

                {/* Filter buttons */}
                <div className="flex flex-wrap justify-center gap-2 pt-4">
                  {(['all', 'courses', 'ebooks', 'templates', 'saas', 'assets', 'consulting'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMarketCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition capitalize ${
                        marketCategory === cat
                          ? 'bg-amber-500 text-black shadow-md'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => {
                  const status = getProductPurchaseStatus(product.id);
                  
                  return (
                    <div 
                      key={product.id}
                      className="bg-[#0e1733] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition duration-300 group shadow-lg"
                    >
                      
                      {/* Card Content */}
                      <div className="space-y-4">
                        
                        {/* Visual Container representing High-Fidelity Programme Images with subtle overlay and watermark */}
                        <div className="w-full h-44 rounded-xl bg-slate-950 border border-slate-900 relative overflow-hidden flex items-center justify-center group/img">
                          {/* 1. Image Asset */}
                          <img 
                            src={product.image} 
                            alt={product.altText} 
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" 
                            onError={(e) => {
                              // If image loading fails, render a beautiful fallback background
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          
                          {/* Subtle Navy-Blue Overlay to match SIRWISE's brand palette */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-[#0B132B]/40 to-transparent mix-blend-multiply opacity-85"></div>
                          <div className="absolute inset-0 bg-gradient-to-tr from-[#0F1C3F]/30 via-transparent to-transparent opacity-75"></div>

                          {/* Hover Overlay highlight */}
                          <div className="absolute inset-0 bg-[#FFD700]/5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                          {/* Dynamic Interactive Icon and visual information overlays */}
                          <div className="absolute inset-0 p-4 flex flex-col justify-between z-10">
                            
                            {/* Top info */}
                            <div className="flex justify-between items-start">
                              <span className="bg-[#0B132B]/80 text-[#FFD700] text-[9px] font-mono px-2 py-0.5 rounded border border-[#FFD700]/30 shadow uppercase">
                                {product.category}
                              </span>
                              <div className="p-1.5 bg-[#0B132B]/90 text-amber-400 border border-slate-800 rounded-full shadow">
                                {product.id === 'prod-course-mba' && <GraduationCap className="h-3.5 w-3.5" />}
                                {product.id === 'prod-ebook-wealth' && <Globe className="h-3.5 w-3.5" />}
                                {product.id === 'prod-temp-pitch' && <Layers className="h-3.5 w-3.5" />}
                                {product.id === 'prod-saas-ledger' && <Database className="h-3.5 w-3.5" />}
                                {product.id === 'prod-asset-media' && <Sparkles className="h-3.5 w-3.5" />}
                                {product.id === 'prod-consult-mentorship' && <Users className="h-3.5 w-3.5" />}
                                {product.id === 'prod-temp-calc' && <FileSpreadsheet className="h-3.5 w-3.5" />}
                                {product.id === 'prod-course-ai' && <Activity className="h-3.5 w-3.5" />}
                              </div>
                            </div>

                            {/* Bottom info */}
                            <div className="flex items-end justify-between">
                              <div className="bg-[#0B132B]/90 p-1.5 rounded-lg border border-slate-800 text-[9px] font-mono text-slate-300">
                                {product.id === 'prod-temp-calc' && <span>ROI_MODEL • NPV: $1.8M</span>}
                                {product.id === 'prod-course-mba' && <span>12 Accredited Lectures</span>}
                                {product.id === 'prod-ebook-wealth' && <span>Capital Safeguards</span>}
                                {product.id === 'prod-temp-pitch' && <span>30 editable VC slides</span>}
                                {product.id === 'prod-saas-ledger' && <span>PCI DSS Invoicing active</span>}
                                {product.id === 'prod-asset-media' && <span>Full Figma layouts</span>}
                                {product.id === 'prod-consult-mentorship' && <span>Advisory scheduling</span>}
                                {product.id === 'prod-course-ai' && <span>AI Chatbot Integration</span>}
                              </div>

                              {/* SIRWISE logo watermark in the bottom-right corner of each image */}
                              <div className="bg-black/85 border border-[#FFD700]/40 px-2 py-0.5 rounded text-[8px] font-extrabold text-[#FFD700] uppercase tracking-wider shadow">
                                SIRWISE Hub
                              </div>
                            </div>

                          </div>

                        </div>

                        {/* Product Meta */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest block uppercase">
                            SKU: {product.sku}
                          </span>
                          
                          {/* Display product thumbnails beside titles */}
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-amber-500/10 rounded border border-amber-500/30 text-amber-500">
                              {product.id === 'prod-course-mba' && <GraduationCap className="h-4 w-4" />}
                              {product.id === 'prod-ebook-wealth' && <Globe className="h-4 w-4" />}
                              {product.id === 'prod-temp-pitch' && <Layers className="h-4 w-4" />}
                              {product.id === 'prod-saas-ledger' && <Database className="h-4 w-4" />}
                              {product.id === 'prod-asset-media' && <Sparkles className="h-4 w-4" />}
                              {product.id === 'prod-consult-mentorship' && <Users className="h-4 w-4" />}
                              {product.id === 'prod-temp-calc' && <FileSpreadsheet className="h-4 w-4" />}
                              {product.id === 'prod-course-ai' && <Activity className="h-4 w-4" />}
                            </div>
                            <h3 className="text-base font-extrabold text-white group-hover:text-amber-400 transition leading-tight">
                              {product.name}
                            </h3>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed min-h-[40px] pt-1.5">
                            {product.description}
                          </p>
                        </div>

                        {/* Features */}
                        <div className="space-y-1.5 pt-2">
                          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Included components:</span>
                          <ul className="space-y-1">
                            {product.features.map((feat, i) => (
                              <li key={i} className="text-[11px] text-slate-300 flex items-start space-x-1.5">
                                <span className="text-amber-500 mt-1">•</span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                      </div>

                      {/* Buy & Unlock Dual Action button layout */}
                      <div className="pt-6 mt-6 border-t border-slate-800 space-y-4">
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 uppercase tracking-widest text-[10px] font-bold font-mono">Premium Access</span>
                          <span className="font-mono text-base font-black text-white">${product.priceUSD.toFixed(2)}</span>
                        </div>

                        {/* Dynamic purchase layout based on state */}
                        {status === 'Approved' ? (
                          <div className="space-y-2">
                            <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-2.5 py-1 rounded-full flex items-center justify-center space-x-1 uppercase tracking-wider">
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Payment Verified</span>
                            </span>
                            <button
                              onClick={() => {
                                setCurrentTab('dashboard');
                              }}
                              className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold rounded-lg text-xs hover:scale-[1.02] hover:shadow-lg transition duration-200 uppercase tracking-wider flex items-center justify-center space-x-1.5"
                            >
                              <Unlock className="h-3.5 w-3.5" />
                              <span>Unlock & Access Files</span>
                            </button>
                          </div>
                        ) : status === 'Pending' ? (
                          <div className="space-y-2">
                            <span className="bg-amber-600/20 text-amber-400 border border-amber-500/40 text-[9px] font-black px-2.5 py-1 rounded-full flex items-center justify-center space-x-1 uppercase tracking-wider animate-pulse">
                              <Clock className="h-3.5 w-3.5" />
                              <span>Awaiting Admin Verification</span>
                            </span>
                            <button
                              disabled
                              className="w-full py-2 bg-slate-800 text-slate-500 font-extrabold rounded-lg text-xs cursor-not-allowed uppercase"
                            >
                              <span>Locked</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveCheckoutProduct(product);
                              setCheckoutSuccess(false);
                              setCheckoutName('');
                              setCheckoutEmail('');
                              setPiWalletAddress('');
                              setUsdcTxHash('');
                            }}
                            className="w-full py-2 bg-[#0B132B] border border-amber-500/40 text-amber-500 font-extrabold rounded-lg text-xs hover:bg-amber-500 hover:text-black hover:scale-[1.02] transition-all duration-200 uppercase tracking-wider flex items-center justify-center space-x-1"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>Buy (🔐 Access License)</span>
                          </button>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* 2. TAB: DASHBOARD (Unlocks files download) */}
        {currentTab === 'dashboard' && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-cinzel font-black text-white">Your Decrypted Asset Pool</h2>
              <p className="text-slate-400 text-xs">
                Access and download your legally verified enterprise programmes files directly from the local ledger pool.
              </p>
            </div>

            {unlockedProducts.length === 0 ? (
              <div className="bg-[#0e1733] border border-slate-800 rounded-2xl p-8 text-center space-y-4">
                <Lock className="h-12 w-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-extrabold text-slate-300">No Unlocked Licenses</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Navigate to the digital marketplace tab to acquire modules. All purchases enter "Pending" validation until approved by the administrator dashboard.
                </p>
                <button 
                  onClick={() => setCurrentTab('marketplace')}
                  className="px-6 py-2 bg-amber-500 text-black font-extrabold rounded-lg text-xs hover:bg-amber-400 transition"
                >
                  Visit Marketplace
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sirwiseProducts
                  .filter((p) => unlockedProducts.includes(p.id))
                  .map((product) => {
                    const generatedKey = product.licenseKeyPattern.replace('XXXXX', '91083-AD77');
                    
                    return (
                      <div 
                        key={product.id}
                        className="bg-[#0e1733] border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-amber-500 text-xs font-mono font-bold">[{product.sku}]</span>
                            <h4 className="text-sm font-black text-white">{product.name}</h4>
                          </div>

                          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-900 px-3 py-1 rounded">
                            <span className="text-[10px] text-slate-400 font-mono">License Key:</span>
                            <span className="text-[10px] text-yellow-400 font-mono font-bold select-all">
                              {generatedKey}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(generatedKey, product.id)} 
                              className="text-slate-400 hover:text-white transition p-0.5"
                              title="Copy License Key"
                            >
                              {copiedKey === product.id ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            // Trigger dynamic mock text file download
                            const dummyContent = `SIRWISE Global Asset Licensing\nProduct SKU: ${product.sku}\nProduct: ${product.name}\nKey: ${generatedKey}\nIssued: ${new Date().toLocaleDateString()}\nStatus: Verified Complete.`;
                            const blob = new Blob([dummyContent], { type: 'text/plain' });
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `${product.id}_license_asset.txt`;
                            link.click();

                            // Audit Log entry
                            const newLog: AuditLog = {
                              id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
                              action: `Downloaded decrypted file package for: ${product.name}`,
                              timestamp: new Date().toLocaleString(),
                              user: currentUser.email,
                              severity: 'info'
                            };
                            setAuditLogs((prev) => [newLog, ...prev]);
                          }}
                          className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg text-xs hover:bg-amber-400 transition flex items-center space-x-1.5"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download File Asset</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* 3. TAB: AI PROFESSOR CHAT PLATFORM */}
        {currentTab === 'professor' && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-cinzel font-black text-white">SIRWISE AI Professor Console</h2>
              <p className="text-slate-400 text-xs">
                Query the flagship AI tutor on valuation formulas, seed cap pitch building, sovereign wealth strategy, or ERP ledger structures.
              </p>
            </div>

            <div className="bg-[#0e1733] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
              
              {/* Header */}
              <div className="bg-[#13224d] p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-200">AI Professor Client Active</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold">Accredited AI-Assistant Mode</span>
              </div>

              {/* Chat Log */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xl p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-amber-500 text-black font-semibold rounded-br-none'
                        : 'bg-[#0B132B] text-slate-200 border border-slate-800 rounded-bl-none font-medium'
                    }`}>
                      <pre className="font-sans whitespace-pre-wrap">{msg.text}</pre>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#0B132B] text-slate-400 border border-slate-800 p-3 rounded-xl flex items-center space-x-2 text-xs">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Professor is auditing prompt logic...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef}></div>
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendMessage} className="bg-slate-950 p-4 border-t border-slate-900 flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about valuation IRR, VC cap tables, ledger invoices, sovereign wealth guides..."
                  className="flex-grow bg-black border border-slate-800 text-white px-4 py-2.5 rounded-lg text-sm focus:border-amber-500 outline-none"
                />
                <button 
                  type="submit" 
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-5 py-2.5 bg-amber-500 text-black font-extrabold rounded-lg text-xs hover:bg-amber-400 transition duration-150 flex items-center space-x-1 uppercase tracking-wider disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </form>

            </div>

          </div>
        )}

        {/* 4. TAB: ADMINISTRATIVE SECURITY PANEL */}
        {currentTab === 'admin' && (
          <div className="max-w-6xl mx-auto px-4 py-12 space-y-8" onMouseMove={handleAdminActivity}>
            
            {/* Control Bar */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-cinzel font-black text-amber-400">SIRWISE Control & Invoicing Center</h2>
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest block">
                  Encrypted System Access
                </span>
              </div>

              {/* 3 Minutes Auto-Lock Display */}
              {currentUser.role === 'admin' && !adminLocked && (
                <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg text-xs font-mono">
                  <Clock className="h-4 w-4 text-red-500 animate-spin" />
                  <span className="text-slate-400">Lockout in: </span>
                  <span className="text-red-400 font-extrabold">{inactivityTimer}s</span>
                </div>
              )}
            </div>

            {/* Password Login if user is not Admin */}
            {currentUser.role !== 'admin' ? (
              <div className="max-w-md mx-auto bg-[#0e1733] border border-amber-500/30 rounded-2xl p-6 space-y-4">
                <div className="text-center space-y-1">
                  <Lock className="h-10 w-10 text-amber-500 mx-auto" />
                  <h3 className="text-base font-extrabold text-white">Administrative Key Code Auth</h3>
                  <p className="text-xs text-slate-500">
                    Verify high-tier secure 2FA passkey to inspect transaction files and logs.
                  </p>
                </div>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                      Security passcode
                    </label>
                    <input 
                      type="password" 
                      placeholder="••••••••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-black border border-slate-800 text-white p-2.5 rounded-lg text-xs sm:text-sm focus:border-amber-500 outline-none font-mono"
                    />
                  </div>

                  {adminError && (
                    <p className="text-xs text-red-400 font-semibold">{adminError}</p>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 text-black font-extrabold rounded-lg text-xs hover:bg-amber-400 transition duration-150 uppercase tracking-wider"
                  >
                    Authenticate Terminal
                  </button>
                </form>

                <div className="text-center text-[10px] text-slate-500 font-mono">
                  Secure password default is: GoyeBN3583773 or SirwiseAdmin2026
                </div>
              </div>
            ) : adminLocked ? (
              /* Auto-locked screen */
              <div className="max-w-md mx-auto bg-black border-2 border-red-500 rounded-2xl p-6 text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto animate-bounce" />
                <h3 className="text-base font-extrabold text-white">Administrative Protection Locked</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Session automatically locked after 3 minutes of inactive usage under secure GDRP and PCI DSS compliance protocols.
                </p>
                <button 
                  onClick={() => {
                    setAdminLocked(false);
                    setInactivityTimer(180);
                  }}
                  className="w-full py-2 bg-amber-500 text-black font-extrabold rounded-lg text-xs"
                >
                  Unlock Admin Screen
                </button>
              </div>
            ) : (
              /* Actual Admin Panel Panels */
              <div className="space-y-8" onMouseMove={handleAdminActivity}>
                
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="bg-[#0e1733] border border-slate-800 p-4 rounded-xl">
                    <span className="block text-slate-500 uppercase font-bold text-[9px]">Consensus System Sales</span>
                    <span className="text-xl font-black text-white">$1,940.00</span>
                  </div>
                  <div className="bg-[#0e1733] border border-slate-800 p-4 rounded-xl">
                    <span className="block text-slate-500 uppercase font-bold text-[9px]">KYC verified pioneers</span>
                    <span className="text-xl font-black text-[#FFD700]">940 Checked</span>
                  </div>
                  <div className="bg-[#0e1733] border border-slate-800 p-4 rounded-xl">
                    <span className="block text-slate-500 uppercase font-bold text-[9px]">Server security audit</span>
                    <span className="text-xl font-black text-emerald-400">Pass compliant</span>
                  </div>
                </div>

                {/* Main section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Ledger database */}
                  <div className="lg:col-span-2 space-y-4 font-mono text-xs">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-amber-500" />
                      <span>Client Purchase Ledger</span>
                    </h3>

                    <div className="bg-[#0e1733] border border-slate-800 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-[#13224d] text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[10px]">
                            <tr>
                              <th className="p-3">Reference / Date</th>
                              <th className="p-3">Product details</th>
                              <th className="p-3">Gateway</th>
                              <th className="p-3 text-right">Verification Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                            {transactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-900/40 text-[11px]">
                                <td className="p-3 space-y-1">
                                  <span className="font-extrabold text-white block">{tx.id}</span>
                                  <span className="text-[9px] text-slate-500 block">{tx.timestamp}</span>
                                </td>
                                <td className="p-3 space-y-1">
                                  <span className="font-bold text-slate-200 block">{tx.productName}</span>
                                  <span className="text-slate-400 block">{tx.buyerName} ({tx.buyerEmail})</span>
                                  {tx.walletAddress && (
                                    <span className="text-[10px] text-amber-400 block break-all">
                                      Wallet: {tx.walletAddress}
                                    </span>
                                  )}
                                  {tx.txHash && (
                                    <span className="text-[10px] text-blue-400 block break-all">
                                      USDC Hash: {tx.txHash}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 space-y-1">
                                  <span className="font-bold text-[#FFD700] block">${tx.amount}</span>
                                  <span className="text-[9px] text-slate-500 uppercase block">{tx.gateway}</span>
                                </td>
                                <td className="p-3 text-right space-y-1">
                                  {tx.status === 'Pending' ? (
                                    <div className="flex gap-1 justify-end">
                                      <button 
                                        onClick={() => handleApproveTransaction(tx.id)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[10px]"
                                      >
                                        Approve
                                      </button>
                                      <button 
                                        onClick={() => handleRevokeTransaction(tx.id)}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 rounded text-[10px]"
                                      >
                                        Revoke
                                      </button>
                                    </div>
                                  ) : tx.status === 'Approved' ? (
                                    <div className="space-y-1">
                                      <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded text-[9px] inline-block">
                                        Approved (Unlocked)
                                      </span>
                                      <button 
                                        onClick={() => handleRevokeTransaction(tx.id)}
                                        className="block text-[9px] text-red-400 hover:underline ml-auto font-mono"
                                      >
                                        Revoke
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="bg-red-600/20 text-red-400 border border-red-500/30 font-bold px-2 py-0.5 rounded text-[9px] inline-block">
                                      Revoked (Access Suspended)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right hand Audit Trails & Alerts logs */}
                  <div className="space-y-6">
                    
                    {/* Security Auditing Logs */}
                    <div className="space-y-3 font-mono text-[10px]">
                      <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <span>Security Audit trail</span>
                      </h3>
                      <div className="bg-[#0e1733] border border-slate-800 p-4 rounded-xl max-h-56 overflow-y-auto space-y-3">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="border-b border-slate-800 pb-2 space-y-1 last:border-b-0">
                            <div className="flex justify-between text-[9px]">
                              <span className="text-amber-400 font-bold">{log.id}</span>
                              <span className="text-slate-500">{log.timestamp}</span>
                            </div>
                            <p className="text-slate-300 leading-tight">{log.action}</p>
                            <span className="text-[8px] text-slate-500 block">Operator: {log.user}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fraud Alerts panel */}
                    <div className="space-y-3 font-mono text-[10px]">
                      <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                        <span>System Fraud Sweeps</span>
                      </h3>
                      <div className="bg-[#0e1733] border border-red-500/10 p-4 rounded-xl space-y-3">
                        {fraudAlerts.map((fraud) => (
                          <div key={fraud.id} className="border-b border-red-500/10 pb-2 last:border-b-0 space-y-1">
                            <div className="flex justify-between text-[9px]">
                              <span className="text-red-400 font-bold">{fraud.id}</span>
                              <span className="text-slate-500">{fraud.time}</span>
                            </div>
                            <p className="text-slate-300 leading-tight">{fraud.msg}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

                <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-400">Security mode active. Remember to close admin panel or lock screen when finished.</span>
                  <button
                    onClick={() => {
                      setCurrentUser({
                        email: 'member@sirwise.store',
                        name: 'Professional Partner',
                        kycVerified: true,
                        factorEnabled: true,
                        isLoggedIn: true,
                        role: 'student'
                      });
                      setCurrentTab('marketplace');
                    }}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold rounded-lg transition"
                  >
                    Logout Admin Session
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* SECURE DUAL PI WALLET & CHECKOUT OVERLAY DIALOG (zIndex: 101, z-[99999] fully clickable) */}
      {activeCheckoutProduct && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[99999] overflow-y-auto">
          <div className="bg-[#0e1733] border-2 border-amber-500 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl shadow-amber-500/10">
            
            {/* Close Button */}
            <button 
              onClick={() => setActiveCheckoutProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-amber-500 transition duration-150 p-1 bg-black rounded"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-cinzel font-black text-white">Secure Asset checkout</h3>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-mono">
                SIRWISE DIGITAL SECURITY INFRASTRUCTURE
              </p>
            </div>

            {/* Success checkout screen */}
            {checkoutSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="h-12 w-12 bg-emerald-600/20 text-emerald-400 border border-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-base font-extrabold text-white">Transaction Request Logged!</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your purchase details for <span className="text-amber-400 font-bold">{activeCheckoutProduct.name}</span> has been processed into our local transaction ledger.
                </p>
                
                <div className="bg-black border border-amber-500/20 p-3.5 rounded-lg text-xs text-amber-300 font-mono">
                  Current Status: <span className="font-extrabold text-amber-400 uppercase">Pending Verification</span>
                </div>

                <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
                  Open the Admin Console (pin: GoyeBN3583773) to instantly approve this order and release the unlocked download assets.
                </p>

                <div className="flex gap-3 justify-center pt-2">
                  <button 
                    onClick={() => {
                      setActiveCheckoutProduct(null);
                      setCurrentTab('marketplace');
                    }}
                    className="px-5 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-800"
                  >
                    Back to Catalog
                  </button>
                  <button 
                    onClick={() => {
                      setActiveCheckoutProduct(null);
                      setCurrentTab('admin');
                      setAdminLocked(false);
                    }}
                    className="px-5 py-2 bg-amber-500 text-black text-xs font-extrabold rounded-lg hover:bg-amber-400"
                  >
                    Authorize Order (Admin Console)
                  </button>
                </div>
              </div>
            ) : (
              /* Actual form */
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                
                {/* Product Summary */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex justify-between items-center text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Product Name</span>
                    <span className="text-slate-200 font-bold block">{activeCheckoutProduct.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[9px] uppercase">Amount</span>
                    <span className="text-amber-400 font-black block text-sm">${activeCheckoutProduct.priceUSD.toFixed(2)}</span>
                  </div>
                </div>

                {/* Select payment gateway */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                    Select Gateway Option
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    
                    <button
                      type="button"
                      onClick={() => setCheckoutGateway('paystack')}
                      className={`py-2 px-3 border text-center text-xs font-bold rounded-lg transition-all ${
                        checkoutGateway === 'paystack'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : 'border-slate-800 bg-black text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Paystack
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutGateway('flutterwave')}
                      className={`py-2 px-3 border text-center text-xs font-bold rounded-lg transition-all ${
                        checkoutGateway === 'flutterwave'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : 'border-slate-800 bg-black text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Flutterwave
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutGateway('paypal')}
                      className={`py-2 px-3 border text-center text-xs font-bold rounded-lg transition-all ${
                        checkoutGateway === 'paypal'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : 'border-slate-800 bg-black text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      PayPal
                    </button>

                    {/* Dual Pi wallet options: Pi Testnet vs Pi Mainnet */}
                    <button
                      type="button"
                      onClick={() => setCheckoutGateway('pitestnet')}
                      className={`py-2 px-3 border text-center text-xs font-bold rounded-lg transition-all ${
                        checkoutGateway === 'pitestnet'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : 'border-slate-800 bg-black text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Pi Testnet
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutGateway('pimainnet')}
                      className={`py-2 px-3 border text-center text-xs font-bold rounded-lg transition-all col-span-2 sm:col-span-1 ${
                        checkoutGateway === 'pimainnet'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : 'border-slate-800 bg-black text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Pi Mainnet (KYC)
                    </button>

                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      className="w-full bg-black border border-slate-800 text-white p-2 rounded text-xs focus:border-amber-500 outline-none animate-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. buyer@sirwise.store"
                      value={checkoutEmail}
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      className="w-full bg-black border border-slate-800 text-white p-2 rounded text-xs focus:border-amber-500 outline-none animate-none"
                    />
                  </div>
                </div>

                {/* Dynamic gateway instructions for Sandbox/Live Pi Network Wallets */}
                {checkoutGateway === 'pitestnet' && (
                  <div className="bg-black border border-amber-500/20 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Gateway:</span>
                      <span className="text-amber-500 font-bold uppercase font-mono">PI TESTNET SANDBOX</span>
                    </div>
                    <span className="block text-[10px] text-slate-400">Send testnet coins inside your Pi Browser sandbox to:</span>
                    <p className="bg-slate-900 p-1.5 rounded text-[10px] font-mono select-all text-amber-400 break-all border border-slate-800">
                      {apiConfig.PI_TESTNET_WALLET}
                    </p>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                        Input Testnet Wallet Address (Required)
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. GAPI-TESTNET-XXXX..."
                        value={piWalletAddress}
                        onChange={(e) => setPiWalletAddress(e.target.value)}
                        className="w-full bg-black border border-slate-800 text-white p-2 rounded text-xs font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {checkoutGateway === 'pimainnet' && (
                  <div className="bg-black border border-amber-500/20 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Gateway:</span>
                      <span className="text-amber-500 font-bold uppercase font-mono">PI MAINNET KYC COINS</span>
                    </div>
                    <span className="block text-[10px] text-slate-400">Transfer consensus equivalent value to our verified Mainnet KYC Wallet:</span>
                    <p className="bg-slate-900 p-1.5 rounded text-[10px] font-mono select-all text-amber-400 break-all border border-slate-800">
                      {apiConfig.PI_MAINNET_KYC_WALLET}
                    </p>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                        Input Mainnet KYC Wallet Address / Memo
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. GAPI-MAINNET-KYC-XXXX..."
                        value={piWalletAddress}
                        onChange={(e) => setPiWalletAddress(e.target.value)}
                        className="w-full bg-black border border-slate-800 text-white p-2 rounded text-xs font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* API Key usage text to demonstrate dynamic loading from server */}
                <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                  <span>Paystack Key:</span>
                  <span className="text-slate-400">{apiConfig.PAYSTACK_PUBLIC_KEY.slice(0, 15)}...</span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmittingCheckout}
                  className="w-full py-2.5 bg-amber-500 text-black font-extrabold rounded-lg text-xs hover:bg-amber-400 transition flex items-center justify-center space-x-1.5 uppercase tracking-wider"
                >
                  {isSubmittingCheckout ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Recording to secure invoice logs...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Submit Secure Invoice Request</span>
                    </>
                  )}
                </button>

              </form>
            )}

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-slate-400 relative z-10 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            
            <div className="space-y-1 text-center sm:text-left">
              <span className="font-cinzel text-base font-black text-white">SIR<span className="text-amber-500">WISE</span></span>
              <p className="text-[11px] text-slate-500">Professional Digital Knowledge Hub & Enterprise Invoicing Platform.</p>
              <p className="text-[10px] text-slate-600">All payment logs adhere strictly to PCI DSS and GDRP secure storage guidelines.</p>
            </div>

            {/* Secret administrative gate */}
            <div className="flex space-x-4">
              <button 
                onClick={() => {
                  setCurrentTab('admin');
                  setAdminLocked(false);
                }}
                className="text-[10px] text-slate-600 hover:text-amber-500 transition underline decoration-dotted"
              >
                Secured Administrative Terminal
              </button>
            </div>

          </div>

          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px]">
            <span>© 2026 SIRWISE. All rights reserved.</span>
            <div className="flex space-x-3 text-slate-600">
              <span>GDPR Compliant</span>
              <span>•</span>
              <span>PCI DSS Secure</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
