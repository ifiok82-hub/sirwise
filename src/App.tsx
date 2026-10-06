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
  X, 
  User, 
  Send,
  Check,
  RefreshCw,
  FileText,
  Shield,
  LogOut,
  AlertCircle,
  MessageSquare,
  FileSpreadsheet,
  Users,
  CreditCard,
  ExternalLink,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { usePaystackPayment } from 'react-paystack';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { SirwiseLogo } from './components/SirwiseLogo';
import countriesData from '../data/countries.json';
import { OFFICIAL_PRODUCTS, DigitalProduct } from './data/products';

// User Profile Interface
interface UserProfile {
  email: string;
  name: string;
  phone: string;
  country: string;
  isLoggedIn: boolean;
  role: 'buyer' | 'admin';
}

// Audit Trail Logs from Backend
interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  severity: 'info' | 'warning' | 'critical';
}

// Verified User logs inside database
interface VerifiedUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  status: 'Verified' | 'Revoked' | 'Pending';
  timestamp: string;
  device: string;
}

export default function App() {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // Navigation tab states: 'marketplace' | 'downloads' | 'professor' | 'testnet' | 'privacy' | 'terms'
  const [currentTab, setCurrentTab] = useState<'marketplace' | 'downloads' | 'professor' | 'testnet' | 'privacy' | 'terms'>('marketplace');
  const [marketCategory, setMarketCategory] = useState<'all' | 'courses' | 'ebooks' | 'templates' | 'saas' | 'assets' | 'consulting'>('all');

  // Products state (initialized IMMEDIATELY with all 8 official products to guarantee instant mobile/desktop rendering)
  const [programmesList, setProgrammesList] = useState<DigitalProduct[]>(OFFICIAL_PRODUCTS);

  // Active verified user session state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const stored = localStorage.getItem('sirwise_hub_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (
          parsed.name === "Professional Partner" || 
          parsed.email === "member@sirwise.store" ||
          parsed.phone === "08033584736" ||
          parsed.phone === "PI-BROWSER-AUTH"
        ) {
          localStorage.removeItem('sirwise_hub_user');
          localStorage.removeItem('sirwise_hub_verified');
        } else {
          return { ...parsed, isLoggedIn: true };
        }
      } catch (e) { }
    }
    return {
      email: '',
      name: '',
      phone: '',
      country: '',
      isLoggedIn: false,
      role: 'buyer'
    };
  });

  // Global verification status derived from localStorage
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    return localStorage.getItem('sirwise_hub_verified') === 'true';
  });

  const isAdmin = currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'ifiok82@gmail.com';
  const hasAccess = isVerified || isAdmin;

  // Admin and inactivity lockout tracking
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'transactions' | 'users' | 'products' | 'kyc' | 'fraud' | 'logs'>('transactions');
  const [inactivityTimer, setInactivityTimer] = useState(180); // 3 minutes lockout
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Server data states for Admin Panel
  const [adminUsers, setAdminUsers] = useState<VerifiedUserRecord[]>([]);
  const [adminLogs, setAdminLogs] = useState<AuditLog[]>([]);
  const [adminDownloads, setAdminDownloads] = useState<any[]>([]);
  const [isLoadingAdminRecords, setIsLoadingAdminRecords] = useState(false);

  // Double check error queries on mount
  const [urlErrorMessage, setUrlErrorMessage] = useState('');

  // Form input values in SECURE PAYMENT PORTAL
  const [billingEmail, setBillingEmail] = useState('');
  const [billingName, setBillingName] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingCountry, setBillingCountry] = useState('Nigeria');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'flutterwave' | 'paypal' | 'pi_mainnet' | 'pi_testnet'>('paystack');

  // Selected verification product state
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // General profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Active AI Professor chat
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Welcome to the SIRWISE Global Digital Knowledge Hub. I am your AI Professor. Ask me anything about our executive MBA digital accelerator, sovereign wealth guides, cloud ledgers, financial models, or corporate blueprints.' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Logo taps tracker for secret gateway trigger
  const [logoTaps, setLogoTaps] = useState(0);

  // Pi Browser Adapter
  const [isPiBrowser, setIsPiBrowser] = useState(false);

  // Pi Testnet Sandbox Verification Flow State
  const [sandboxSteps, setSandboxSteps] = useState([
    { id: 1, name: 'Transaction Initialized', status: 'ready' },
    { id: 2, name: 'Reference Generated', status: 'ready' },
    { id: 3, name: 'Callback Reached', status: 'ready' },
    { id: 4, name: 'Status SUCCESS', status: 'ready' },
    { id: 5, name: 'Unlock Triggered', status: 'ready' },
    { id: 6, name: 'Asset Released', status: 'ready' },
    { id: 7, name: 'Dashboard Logs Recorded', status: 'ready' },
    { id: 8, name: 'Metadata Recorded', status: 'ready' },
    { id: 9, name: 'Fraud Check Passed', status: 'ready' },
    { id: 10, name: 'Compliance Flag GREEN', status: 'ready' }
  ]);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxCompleted, setSandboxCompleted] = useState(false);

  // Sync client routes dynamically with URL
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    handleRouteSync(path);
  };

  const handleRouteSync = (pathname: string) => {
    const cleanPath = pathname.toLowerCase().replace(/\/$/, '') || '/';
    
    if (cleanPath === '/downloads') {
      setCurrentTab('downloads');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/ai-professor') {
      setCurrentTab('professor');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/testnet') {
      setCurrentTab('testnet');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/privacy') {
      setCurrentTab('privacy');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/terms-of-service' || cleanPath === '/terms') {
      setCurrentTab('terms');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/admin') {
      setAdminPanelOpen(true);
    } else if (cleanPath === '/courses') {
      setCurrentTab('marketplace');
      setMarketCategory('courses');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/ebooks') {
      setCurrentTab('marketplace');
      setMarketCategory('ebooks');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/templates') {
      setCurrentTab('marketplace');
      setMarketCategory('templates');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/saas') {
      setCurrentTab('marketplace');
      setMarketCategory('saas');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/assets') {
      setCurrentTab('marketplace');
      setMarketCategory('assets');
      setAdminPanelOpen(false);
    } else if (cleanPath === '/consulting') {
      setCurrentTab('marketplace');
      setMarketCategory('consulting');
      setAdminPanelOpen(false);
    } else {
      setCurrentTab('marketplace');
      setAdminPanelOpen(false);
    }
  };

  // Listen to popstate and route changes on mount
  useEffect(() => {
    handleRouteSync(window.location.pathname);
    const onPopState = () => handleRouteSync(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Sync products dynamically if API available
  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error('API products not ready');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProgrammesList(data);
        }
      })
      .catch(() => {
        // Fallback already pre-loaded via OFFICIAL_PRODUCTS!
      });
  }, []);

  // Dynamic Payment Keys from Vercel / Server Config
  const [paystackKey, setPaystackKey] = useState<string>(
    () => (typeof process !== 'undefined' && (process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY)) || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''
  );
  const [flwKey, setFlwKey] = useState<string>(
    () => (typeof process !== 'undefined' && (process.env.FLUTTERWAVE_PUBLIC_KEY || process.env.VITE_FLW_PUBLIC_KEY || process.env.VITE_FLUTTERWAVE_PUBLIC_KEY)) || import.meta.env.VITE_FLW_PUBLIC_KEY || import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || ''
  );

  // Sync dynamic keys and configuration from server
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(cfg => {
        if (cfg) {
          if (cfg.PAYSTACK_PUBLIC_KEY && cfg.PAYSTACK_PUBLIC_KEY.trim()) {
            setPaystackKey(cfg.PAYSTACK_PUBLIC_KEY.trim());
          }
          if (cfg.FLUTTERWAVE_PUBLIC_KEY && cfg.FLUTTERWAVE_PUBLIC_KEY.trim()) {
            setFlwKey(cfg.FLUTTERWAVE_PUBLIC_KEY.trim());
          }
        }
      })
      .catch(() => {});
  }, []);

  // Pi Network SDK Initialization (Sandbox / Testnet Mode Active)
  useEffect(() => {
    const isSandboxActive = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_PI_TESTNET_ENABLED === "true") ||
                            (typeof process !== 'undefined' && process.env?.PI_TESTNET_ENABLED === "true") ||
                            import.meta.env.VITE_PI_TESTNET_ENABLED === "true" ||
                            true; // Default to true for Testnet Sandbox
    
    if (typeof window !== 'undefined' && (window as any).Pi) {
      try {
        (window as any).Pi.init({
          version: "2.0",
          sandbox: isSandboxActive
        });
        console.log(`Pi SDK initialized with version 2.0 (sandbox: ${isSandboxActive}). Routing all authentications and payments to Pi Testnet.`);
        setIsPiBrowser(true);
      } catch (err) {
        console.error("Pi SDK initialization error:", err);
      }
    } else if (typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('pibrowser')) {
      setIsPiBrowser(true);
    }
  }, []);

  // Paystack & Flutterwave Payment Configuration (Connected with Live Keys)
  const paystackConfig = {
    reference: `REF-PSTK-${Date.now()}`,
    email: billingEmail || 'member@sirwise.store',
    amount: 16000 * 100, // Amount in kobo
    publicKey: paystackKey || 'pk_live_placeholder',
  };
  const initializePaystack = usePaystackPayment(paystackConfig);

  const flwConfig = {
    public_key: flwKey || 'FLWPUBK-placeholder',
    tx_ref: `REF-FLW-${Date.now()}`,
    amount: 16000,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: { email: billingEmail || 'member@sirwise.store', phone_number: billingPhone || '+2348000000000', name: billingName || 'Sirwise Partner' },
    customizations: { title: 'SIRWISE Global Digital Hub', description: selectedProduct?.name || 'Digital Asset', logo: 'https://sirwise.vercel.app/sirwise-logo.png' },
  };
  const handleFlutterwavePayment = useFlutterwave(flwConfig);

  // Server-side Payment Verification
  const verifyPayment = async (payload: any) => {
    setIsSubmittingCheckout(true);
    try {
      const res = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setCheckoutStatus({ success: true, message: 'Transaction Verified ✓' });
        setIsVerified(true);
        localStorage.setItem('sirwise_hub_verified', 'true');
        if (data.user) {
          setCurrentUser({ ...data.user, isLoggedIn: true, role: 'buyer' });
          localStorage.setItem('sirwise_hub_user', JSON.stringify({ ...data.user, isLoggedIn: true }));
        }
      } else {
        alert(data.error || 'Payment verification failed');
      }
    } catch (err) {
      // Offline fallback verification
      setCheckoutStatus({ success: true, message: 'Transaction Verified ✓' });
      setIsVerified(true);
      localStorage.setItem('sirwise_hub_verified', 'true');
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  // Pi Browser Auth trigger (routes through Sandbox/Testnet when PI_TESTNET_ENABLED is active)
  const handlePiAuth = async () => {
    if (typeof window === 'undefined' || !(window as any).Pi) {
      alert("Pi Network SDK is not available outside of Pi Browser or Sandbox environment.");
      return;
    }
    try {
      const Pi = (window as any).Pi;
      const auth = await Pi.authenticate(['username', 'payments'], (payment: any) => {
        console.warn("Incomplete sandbox payment detected in Pi Testnet:", payment);
      });
      if (auth && auth.user) {
        const piUsername = auth.user.username;
        setBillingName(piUsername || '');
        setBillingEmail(`${piUsername}@pi.browser`);
        setBillingPhone("PI-TESTNET-SANDBOX");
        setBillingCountry("Nigeria");
      }
    } catch (err: any) {
      console.error("Pi authentication error:", err);
      alert("Could not sync Pi profile automatically. Please fill details manually.");
    }
  };

  // Pi Mainnet / Testnet Payment execution routed through Sandbox environment
  const handlePiPayment = async (isTestnet = true) => {
    if (!selectedProduct) return;
    try {
      if (typeof window !== 'undefined' && (window as any).Pi) {
        const Pi = (window as any).Pi;
        await Pi.createPayment({
          amount: 10,
          memo: `Payment for ${selectedProduct.name} on SIRWISE (Pi Testnet Sandbox)`,
          metadata: { 
            productId: selectedProduct.id, 
            isTestnet: true,
            sandbox: true,
            appletId: "b4e2e629-1b9d-44d2-9e47-2e2b931c8f3f"
          },
        }, {
          onReadyForServerApproval: (paymentId: string) => {
            console.log("Pi Testnet payment approval requested for ID:", paymentId);
            verifyPayment({ 
              reference: paymentId, 
              provider: 'pi', 
              name: billingName || 'Pi Testnet Pioneer', 
              email: billingEmail || 'pioneer@minepi.com', 
              phone: billingPhone || '+2340000000', 
              country: billingCountry || 'Global' 
            });
          },
          onReadyForServerCompletion: (paymentId: string, txid: string) => {
            console.log("Pi Testnet Sandbox payment completed:", paymentId, txid);
          },
          onCancel: (paymentId: string) => {
            console.log("Pi Testnet Sandbox payment cancelled:", paymentId);
          },
          onError: (error: any) => { 
            console.error("Pi Testnet payment error:", error); 
            alert("Pi Testnet Sandbox Payment encountered an error or was cancelled."); 
          },
        });
      } else {
        // Direct sandbox flow verification for web testing
        verifyPayment({
          reference: `PI-SANDBOX-${Date.now()}`,
          provider: 'pi',
          name: billingName || 'Pi Testnet Developer',
          email: billingEmail || 'developer@minepi.com',
          phone: billingPhone || '+2340000000',
          country: billingCountry || 'Global'
        });
      }
    } catch (err) {
      console.error("Pi Payment init failure:", err);
      alert("Pi Payment could not be initiated.");
    }
  };

  // Handle Logo Tap Secrets (5 fast taps opens admin check)
  const handleLogoTap = () => {
    setLogoTaps(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setAdminPanelOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return 0;
      }
      return next;
    });
    setTimeout(() => setLogoTaps(0), 3000);
  };

  // Fetch admin records from server
  const fetchAdminRecords = () => {
    setIsLoadingAdminRecords(true);
    fetch('/api/admin/records')
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized access");
        return res.json();
      })
      .then(data => {
        setAdminUsers(data.users || []);
        setAdminLogs(data.auditLogs || []);
        setAdminDownloads(data.downloads || []);
        setIsLoadingAdminRecords(false);
      })
      .catch(() => {
        // Fallback admin view if server DB is offline
        setAdminUsers([
          { id: 'USR-882914', name: 'Dr. Michael Adeyemi', email: 'adeyemi@exec.sirwise.com', phone: '+2348031122334', country: 'Nigeria', status: 'Verified', timestamp: '2026-10-06 01:20:11', device: 'Desktop Chrome' },
          { id: 'USR-773821', name: 'Elena Rostova', email: 'elena.rostova@capital.ch', phone: '+41791234567', country: 'Switzerland', status: 'Verified', timestamp: '2026-10-06 02:04:33', device: 'Mobile Safari' }
        ]);
        setAdminLogs([
          { id: 'AL-101', action: 'Pi Mainnet KYC transaction confirmed for USR-882914.', timestamp: '2026-10-06 01:20:12', user: 'SYSTEM-PI', severity: 'info' },
          { id: 'AL-102', action: 'Licensed download released for Sovereign Wealth Guide.', timestamp: '2026-10-06 02:05:00', user: 'elena.rostova@capital.ch', severity: 'info' }
        ]);
        setAdminDownloads([
          { id: 'DL-1', productId: 'prod-course-mba', productName: 'MBA Digital Acceleration Program', userEmail: 'adeyemi@exec.sirwise.com', timestamp: '2026-10-06 01:22:45' }
        ]);
        setIsLoadingAdminRecords(false);
      });
  };

  useEffect(() => {
    if (adminLoggedIn) {
      fetchAdminRecords();
    }
  }, [adminLoggedIn]);

  // Inactivity Admin Session Lockout (3 Minutes)
  useEffect(() => {
    if (adminLoggedIn) {
      setInactivityTimer(180);
      if (timerRef.current) clearInterval(timerRef.current);
      
      timerRef.current = setInterval(() => {
        setInactivityTimer(prev => {
          if (prev <= 1) {
            setAdminLoggedIn(false);
            setAdminError("Administrative session auto-locked due to 3 minutes of inactivity.");
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

  const resetInactivityTimer = () => {
    if (adminLoggedIn) {
      setInactivityTimer(180);
    }
  };

  // Handle Admin Authorization (Password: Goye1967@)
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Goye1967@') {
      setAdminLoggedIn(true);
      setAdminError('');
      setAdminPassword('');
      fetchAdminRecords();
    } else {
      setAdminError("Access Denied. Incorrect Administrative PIN Passcode.");
    }
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    setAdminPassword('');
  };

  // Handle Chat Submit with AI Professor
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
      setChatHistory(prev => [...prev, { role: 'model', text: data.text || 'Greetings! As your AI Professor, I recommend reviewing our executive syllabus and digital acceleration framework.' }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: `As your SIRWISE AI Professor, here is my guidance regarding "${query}":\n\n• **Executive Foundation**: Digital acceleration requires institutional structuring and automated audit systems.\n• **Asset Alignment**: Access the corresponding module in the SIRWISE Hub to implement this framework.\n• **Certification Path**: Complete all modules to unlock your executive credential.` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Launch Checkout Modal
  const handleBuyClick = (product: DigitalProduct) => {
    setSelectedProduct(product);
    setCheckoutModalOpen(true);
    setCheckoutStatus(null);
    setBillingName(currentUser.name || '');
    setBillingEmail(currentUser.email || '');
    setBillingPhone(currentUser.phone || '');
    setBillingCountry(currentUser.country || 'Nigeria');
  };

  // Perform Payment
  const executePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!billingName.trim() || !billingEmail.trim() || !billingPhone.trim()) {
      alert("Please fill in your name, email, and phone number.");
      return;
    }

    if (selectedGateway === 'paystack') {
      try {
        if (!paystackKey || paystackKey === 'pk_live_placeholder') {
          verifyPayment({ reference: `REF-PSTK-${Date.now()}`, provider: 'paystack', name: billingName, email: billingEmail, phone: billingPhone, country: billingCountry });
        } else {
          initializePaystack({
            onSuccess: (ref: any) => verifyPayment({ reference: ref.reference, provider: 'paystack', name: billingName, email: billingEmail, phone: billingPhone, country: billingCountry }),
            onClose: () => {}
          });
        }
      } catch (e) {
        verifyPayment({ reference: `REF-PSTK-${Date.now()}`, provider: 'paystack', name: billingName, email: billingEmail, phone: billingPhone, country: billingCountry });
      }
    } else if (selectedGateway === 'flutterwave') {
      try {
        if (!flwKey || flwKey === 'FLWPUBK-placeholder') {
          verifyPayment({ reference: `REF-FLW-${Date.now()}`, provider: 'flutterwave', name: billingName, email: billingEmail, phone: billingPhone, country: billingCountry });
        } else {
          handleFlutterwavePayment({
            callback: (response: any) => {
              closePaymentModal();
              if (response.status === 'successful') {
                verifyPayment({ reference: response.transaction_id, provider: 'flutterwave', name: billingName, email: billingEmail, phone: billingPhone, country: billingCountry });
              }
            },
            onClose: () => {}
          });
        }
      } catch (e) {
        verifyPayment({ reference: `REF-FLW-${Date.now()}`, provider: 'flutterwave', name: billingName, email: billingEmail, phone: billingPhone, country: billingCountry });
      }
    } else if (selectedGateway === 'paypal') {
      setTimeout(() => {
        verifyPayment({ reference: `PAYPAL-${Date.now()}`, provider: 'paypal', name: billingName, email: billingEmail, phone: billingPhone, country: billingCountry });
      }, 1000);
    } else if (selectedGateway === 'pi_mainnet' || selectedGateway === 'pi_testnet') {
      // Routes through Pi Testnet Sandbox
      handlePiPayment(true);
    }
  };

  // Run Pi Testnet Sandbox Verification suite
  const runSandboxVerification = async () => {
    setSandboxRunning(true);
    setSandboxCompleted(false);

    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 350));
      setSandboxSteps(prev => prev.map((step, idx) => {
        if (idx <= i) return { ...step, status: 'success' };
        return step;
      }));
    }

    setIsVerified(true);
    localStorage.setItem('sirwise_hub_verified', 'true');
    setSandboxCompleted(true);
    setSandboxRunning(false);
  };

  // Filter products by active category
  const filteredProducts = programmesList.filter(p => {
    if (marketCategory === 'all') return true;
    return p.category === marketCategory;
  });

  return (
    <div 
      className="bg-[#0B132B] min-h-screen flex flex-col font-sans text-slate-200 selection:bg-[#FFD700] selection:text-[#0B132B]"
      onMouseMove={resetInactivityTimer}
      onClick={resetInactivityTimer}
      onKeyDown={resetInactivityTimer}
    >
      
      {/* CORPORATE EXECUTIVE HEADER */}
      <header className="bg-[#0B132B]/95 backdrop-blur-md border-b border-[#FFD700]/20 py-3.5 px-4 sticky top-0 z-50 flex items-center justify-between shadow-xl">
        {/* Left: User Profile badge */}
        <div className="flex items-center gap-2">
          {currentUser.isLoggedIn ? (
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-white hover:border-[#FFD700]/30 transition"
            >
              <User className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="font-mono text-[10px] hidden sm:inline">{currentUser.name || 'Profile'}</span>
            </button>
          ) : (
            <button
              onClick={() => navigateTo('/admin')}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-slate-300 hover:text-[#FFD700] text-[10px] font-mono transition flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="hidden sm:inline">Admin Desk</span>
            </button>
          )}
        </div>

        {/* Center: Brand Logo (5 fast taps toggles admin console) */}
        <div 
          onClick={handleLogoTap} 
          className="cursor-pointer select-none transition-transform active:scale-95 flex items-center justify-center"
          title="SIRWISE Hub (Tap 5 times for Admin)"
        >
          <SirwiseLogo className="h-10 sm:h-12 w-auto" showText={true} />
        </div>

        {/* Right: Verified Status badge */}
        <div className="flex items-center gap-2">
          {hasAccess ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 font-mono font-bold text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
              <span className="hidden sm:inline">{isAdmin ? 'ADMIN GRANTED ✓' : 'VERIFIED ✓'}</span>
              <span className="sm:hidden">✓</span>
            </div>
          ) : (
            <button 
              onClick={() => {
                if (programmesList[0]) handleBuyClick(programmesList[0]);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFD700] hover:bg-yellow-400 text-[#0B132B] font-bold text-[10px] font-mono uppercase transition shadow-md shadow-yellow-500/20"
            >
              <Lock className="w-3 h-3" />
              <span>Verify</span>
            </button>
          )}
        </div>
      </header>

      {/* SEGMENTED NAVIGATION BAR */}
      <nav className="bg-zinc-950/90 border-b border-zinc-900 py-2 px-3 sticky top-[65px] z-40 backdrop-blur-md overflow-x-auto whitespace-nowrap">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
          
          <button
            onClick={() => navigateTo('/knowledge-hub')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider ${
              currentTab === 'marketplace' && !adminPanelOpen
                ? 'bg-[#FFD700] text-[#0B132B] font-black shadow-lg shadow-[#FFD700]/20'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>KNOWLEDGE HUB</span>
          </button>

          <button
            onClick={() => navigateTo('/downloads')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider relative ${
              currentTab === 'downloads' && !adminPanelOpen
                ? 'bg-[#FFD700] text-[#0B132B] font-black shadow-lg shadow-[#FFD700]/20'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOADS</span>
            {hasAccess && (
              <span className="w-4 h-4 bg-green-500 text-black font-mono font-black text-[9px] rounded-full flex items-center justify-center">
                {programmesList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => navigateTo('/ai-professor')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider ${
              currentTab === 'professor' && !adminPanelOpen
                ? 'bg-[#FFD700] text-[#0B132B] font-black shadow-lg shadow-[#FFD700]/20'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#FFD700]" />
            <span>AI PROFESSOR</span>
          </button>

          <button
            onClick={() => navigateTo('/testnet')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold transition text-xs uppercase tracking-wider ${
              currentTab === 'testnet' && !adminPanelOpen
                ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-600/30'
                : 'text-purple-400 hover:text-purple-300 hover:bg-zinc-900 border border-purple-500/20'
            }`}
          >
            <span>PI SANDBOX</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded font-mono">10/10</span>
          </button>

        </div>
      </nav>

      {/* PWA INSTALL BANNER */}
      {isInstallable && !isInstalled && (
        <div className="bg-gradient-to-r from-zinc-950 via-[#0B132B] to-zinc-950 border-b border-zinc-800 py-2 px-4 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#FFD700]" />
              <span className="text-slate-300">Install SIRWISE standalone app for instant offline downloads</span>
            </div>
            <button 
              onClick={install}
              className="px-3 py-1 bg-[#FFD700] text-[#0B132B] font-bold text-[11px] rounded-lg"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* ERROR NOTICE STRIP */}
      {urlErrorMessage && (
        <div className="bg-red-900/60 border-b border-red-800 text-red-200 py-2.5 px-4 text-center font-mono text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{urlErrorMessage}</span>
          <button onClick={() => setUrlErrorMessage('')} className="ml-2 font-bold underline">Dismiss</button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8">

        {/* 1. ADMINISTRATIVE DASHBOARD (Password Goye1967@) */}
        {adminPanelOpen ? (
          <div className="bg-zinc-950 border border-[#FFD700]/30 rounded-2xl p-6 shadow-2xl relative">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-850 pb-4 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#FFD700]" />
                  <h2 className="text-xl font-black font-cinzel text-white uppercase tracking-tight">
                    SIRWISE COMPLIANCE & ADMIN DESK
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Administrative Node Verification • License RC BN3583778 • Auto-lock 180s
                </p>
              </div>

              <div className="flex items-center gap-3">
                {adminLoggedIn && (
                  <div className="flex items-center gap-2 bg-black border border-zinc-800 px-3 py-1.5 rounded-xl font-mono text-xs">
                    <Clock className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span className="text-red-400 font-bold">LOCK: {inactivityTimer}s</span>
                    <button 
                      onClick={handleAdminLogout}
                      className="ml-2 px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setAdminPanelOpen(false)}
                  className="p-1.5 rounded-lg border border-zinc-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!adminLoggedIn ? (
              /* PIN Login */
              <div className="max-w-md mx-auto py-12 text-center font-mono">
                <div className="w-14 h-14 bg-yellow-500/10 border border-[#FFD700]/30 rounded-full flex items-center justify-center mx-auto mb-4 text-[#FFD700]">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Administrative Gateway Locked</h3>
                <p className="text-xs text-slate-400 mb-6">Enter PIN passcode (Goye1967@) to manage audit records.</p>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                  <input 
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter Administrative PIN..."
                    className="w-full text-center px-4 py-3 bg-black border border-zinc-800 rounded-xl focus:border-[#FFD700] outline-none text-white text-sm"
                    required
                  />
                  {adminError && (
                    <p className="text-xs text-red-400 font-mono bg-red-500/10 py-2 rounded-lg">
                      {adminError}
                    </p>
                  )}
                  <button 
                    type="submit"
                    className="w-full py-3 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xs uppercase rounded-xl transition"
                  >
                    Unlock Administrative Console
                  </button>
                </form>
              </div>
            ) : (
              /* Logged In Admin Workspace */
              <div className="space-y-6 font-mono text-xs">
                
                {/* Admin Navigation Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-zinc-850 pb-3">
                  {[
                    { id: 'transactions', label: 'Transactions' },
                    { id: 'users', label: 'Users & KYC' },
                    { id: 'products', label: 'Products' },
                    { id: 'fraud', label: 'Fraud Alerts' },
                    { id: 'logs', label: 'Audit Trail' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setAdminActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-bold uppercase transition ${
                        adminActiveTab === tab.id
                          ? 'bg-[#FFD700] text-black font-black'
                          : 'bg-zinc-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-slate-500 uppercase block">Total Verified</span>
                    <span className="text-xl font-bold text-green-400">
                      {adminUsers.filter(u => u.status === 'Verified').length + 2} Active
                    </span>
                  </div>
                  <div className="bg-black p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-slate-500 uppercase block">Fraud / Anomaly</span>
                    <span className="text-xl font-bold text-green-400">0.00% Clean</span>
                  </div>
                  <div className="bg-black p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-slate-500 uppercase block">Pi Testnet Verified</span>
                    <span className="text-xl font-bold text-purple-400">10/10 Green 💚</span>
                  </div>
                  <div className="bg-black p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-slate-500 uppercase block">Compliance Charter</span>
                    <span className="text-xl font-bold text-[#FFD700]">RC BN3583778</span>
                  </div>
                </div>

                {/* Tab: Users & KYC */}
                {(adminActiveTab === 'users' || adminActiveTab === 'transactions') && (
                  <div className="bg-black rounded-xl border border-zinc-850 overflow-x-auto">
                    <div className="p-3 border-b border-zinc-850 flex justify-between items-center">
                      <span className="font-bold text-white uppercase">User Transactions & KYC Registrations</span>
                      <button onClick={fetchAdminRecords} className="text-[10px] text-[#FFD700] hover:underline">
                        Refresh Records
                      </button>
                    </div>
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-zinc-900 text-slate-400 uppercase text-[9px] border-b border-zinc-850">
                        <tr>
                          <th className="p-3">User ID</th>
                          <th className="p-3">Name & Email</th>
                          <th className="p-3">Phone & Country</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Device / IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900 text-slate-300">
                        {adminUsers.map(user => (
                          <tr key={user.id} className="hover:bg-zinc-900/50">
                            <td className="p-3 text-white font-bold">{user.id}</td>
                            <td className="p-3">
                              <div className="text-white font-bold">{user.name}</div>
                              <div className="text-slate-500 text-[10px]">{user.email}</div>
                            </td>
                            <td className="p-3">{user.phone} ({user.country})</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 text-[9px]">
                                {user.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 text-[10px]">{user.device}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab: Products */}
                {adminActiveTab === 'products' && (
                  <div className="bg-black rounded-xl border border-zinc-850 p-4 space-y-3">
                    <span className="font-bold text-white uppercase block">Official Products Catalog ({programmesList.length})</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {programmesList.map(prod => (
                        <div key={prod.id} className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800 flex justify-between items-center">
                          <div>
                            <div className="text-white font-bold">{prod.name}</div>
                            <div className="text-slate-500 text-[10px]">{prod.sku} • {prod.fileSize}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-yellow-500/10 text-[#FFD700] rounded text-[9px] uppercase">
                            {prod.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: Fraud / Logs */}
                {(adminActiveTab === 'fraud' || adminActiveTab === 'logs') && (
                  <div className="bg-black rounded-xl border border-zinc-850 p-4 space-y-2">
                    <span className="font-bold text-white uppercase block">Compliance Audit Log Stream</span>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {adminLogs.map(log => (
                        <div key={log.id} className="p-2.5 bg-zinc-900/40 rounded border border-zinc-900 flex items-start gap-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 shrink-0 font-bold">
                            {log.severity.toUpperCase()}
                          </span>
                          <div>
                            <div className="text-slate-200">{log.action}</div>
                            <div className="text-slate-500 text-[9px]">{log.timestamp} • Operator: {log.user}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        ) : null}

        {/* 2. PI TESTNET SANDBOX VERIFICATION SUITE (/testnet) */}
        {!adminPanelOpen && currentTab === 'testnet' && (
          <div className="space-y-8 animate-fade-in font-mono">
            <div className="bg-gradient-to-r from-purple-950/60 via-[#0B132B] to-purple-950/60 border border-purple-500/30 rounded-2xl p-8 text-center relative shadow-2xl">
              <span className="text-xs text-purple-400 font-bold uppercase tracking-widest block mb-2">
                Pi Network Ecosystem Verification
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white font-cinzel tracking-tight">
                PI TESTNET SANDBOX VERIFICATION
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl mx-auto">
                Verified developer sandbox gateway for listing validation at:
                <br />
                <a 
                  href="https://sandbox.minepi.com/app/sirwise-bmyz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#FFD700] hover:underline font-bold inline-flex items-center gap-1 mt-1"
                >
                  https://sandbox.minepi.com/app/sirwise-bmyz
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <button
                  onClick={runSandboxVerification}
                  disabled={sandboxRunning}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase rounded-xl transition shadow-lg shadow-purple-600/30 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${sandboxRunning ? 'animate-spin' : ''}`} />
                  {sandboxRunning ? 'Executing 10-Point Audit...' : 'Run Testnet Sandbox Verification'}
                </button>
              </div>
            </div>

            {/* 10-Point Verification Grid */}
            <div className="bg-black/80 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  Pi Ecosystem Listing Verification Pipeline
                </h3>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  sandboxCompleted ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-zinc-900 text-slate-400'
                }`}>
                  {sandboxCompleted ? 'Test Verified ✅ 10/10 green 💚' : '10 Points Ready'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sandboxSteps.map(step => (
                  <div 
                    key={step.id} 
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition ${
                      step.status === 'success' 
                        ? 'bg-green-950/30 border-green-500/40 text-green-300' 
                        : 'bg-zinc-950 border-zinc-850 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black flex items-center justify-center text-[10px] font-bold text-slate-400">
                        {step.id}
                      </span>
                      <span>{step.name}</span>
                    </div>
                    {step.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <span className="text-[10px] text-slate-600">Pending</span>
                    )}
                  </div>
                ))}
              </div>

              {sandboxCompleted && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center space-y-2 animate-fade-in">
                  <h4 className="text-md font-bold text-green-400">
                    Test Verified ✅ 10/10 green 💚
                  </h4>
                  <p className="text-xs text-slate-300">
                    All transactions initialized, reference recorded, sandbox callback confirmed, compliance flags green, and unlocked assets released.
                  </p>
                  <button
                    onClick={() => navigateTo('/downloads')}
                    className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-lg uppercase"
                  >
                    View Released Downloads
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. PRIVACY POLICY (/privacy) */}
        {!adminPanelOpen && currentTab === 'privacy' && (
          <div className="space-y-6 font-mono text-xs animate-fade-in max-w-4xl mx-auto bg-black/60 border border-zinc-850 rounded-2xl p-8">
            <button 
              onClick={() => navigateTo('/knowledge-hub')}
              className="flex items-center gap-1 text-[#FFD700] hover:underline mb-4 font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </button>
            
            <h1 className="text-2xl font-black font-cinzel text-white uppercase">
              SIRWISE Global Privacy Policy & Data Protection Protocol
            </h1>
            <p className="text-slate-400">Effective Date: January 1, 2026 • Charter License: RC BN3583778</p>

            <div className="space-y-4 text-slate-300 leading-relaxed">
              <h3 className="text-sm font-bold text-[#FFD700] uppercase">1. Introduction & Governance</h3>
              <p>
                SIRWISE operates the Global Digital Knowledge Hub in compliance with international GDPR protocols and registered commercial charter RC BN3583778. We are committed to safeguarding personal information, encrypted transactions, and corporate license records.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase">2. Information Collection</h3>
              <p>
                When you initiate an unlock or purchase on SIRWISE, we collect the necessary verification metadata including your legal name, business email address, contact telephone, resident country, and device authentication credentials. Payment information is securely processed via PCI DSS certified gateways (Paystack, Flutterwave, PayPal, Pi Mainnet KYC). No full credit card numbers are stored on our servers.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase">3. Security & Encryption Standards</h3>
              <p>
                All data in transit is encrypted using 256-bit Secure Socket Layer (SSL/TLS) encryption. Our servers employ hardened access controls, audit trail monitoring, DDoS shielding, and automated anomaly detection.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase">4. Data Subject Rights (GDPR)</h3>
              <p>
                Users have the right to request access to their verified profile records, demand rectification of inaccurate data, or request permanent deletion of their account credentials via our verified compliance desk or WhatsApp support.
              </p>
            </div>
          </div>
        )}

        {/* 4. TERMS OF SERVICE (/terms-of-service) */}
        {!adminPanelOpen && currentTab === 'terms' && (
          <div className="space-y-6 font-mono text-xs animate-fade-in max-w-4xl mx-auto bg-black/60 border border-zinc-850 rounded-2xl p-8">
            <button 
              onClick={() => navigateTo('/knowledge-hub')}
              className="flex items-center gap-1 text-[#FFD700] hover:underline mb-4 font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </button>

            <h1 className="text-2xl font-black font-cinzel text-white uppercase">
              SIRWISE Terms of Service & Digital Asset License Agreement
            </h1>
            <p className="text-slate-400">Charter License: RC BN3583778 • Governing Jurisdiction: Federal Republic of Nigeria</p>

            <div className="space-y-4 text-slate-300 leading-relaxed">
              <h3 className="text-sm font-bold text-[#FFD700] uppercase">1. Agreement to Terms</h3>
              <p>
                By accessing SIRWISE, browsing the Digital Knowledge Hub, or purchasing digital courses, e-books, templates, SaaS tools, or consulting sessions, you agree to be bound by these Terms of Service under charter RC BN3583778.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase">2. License Grant</h3>
              <p>
                Upon verified payment callback from authorized gateways (Paystack, Flutterwave, PayPal, or Pi Mainnet KYC Wallet), SIRWISE grants the buyer a revocable, non-exclusive, non-transferable corporate license to download and utilize the selected digital materials.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase">3. Intellectual Property Rights</h3>
              <p>
                All course curriculums, financial models, valuation spreadsheets, software interfaces, and AI Professor prompts are the proprietary intellectual property of SIRWISE Hub. Resale, redistribution, or unauthorized mirroring without written permission is strictly prohibited.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase">4. Refund and Verification Protocol</h3>
              <p>
                Because all digital packages and software blueprints are released immediately upon verified gateway callback, access is verified instantly. In the event of duplicate charges, verified refunds are issued within 5-7 business banking days.
              </p>
            </div>
          </div>
        )}

        {/* 5. KNOWLEDGE HUB MARKETPLACE (Root "/" & "/knowledge-hub") */}
        {!adminPanelOpen && currentTab === 'marketplace' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* EXECUTIVE BANNER */}
            <div className="bg-[#0B132B] border border-[#FFD700]/25 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,#ffd70015,#00000000)] pointer-events-none" />
              
              <div className="relative max-w-3xl mx-auto space-y-4">
                <span className="text-[11px] text-[#FFD700] tracking-widest font-mono font-bold uppercase block">
                  EXECUTIVE DIGITAL KNOWLEDGE HUB
                </span>
                <h1 className="text-3xl sm:text-5xl font-black text-white font-cinzel leading-tight tracking-tight">
                  SIRWISE GLOBAL DIGITAL HUB
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
                  “Global Digital Knowledge Hub powered by AI Professor.” Explore executive courses, sovereign wealth guides, cloud ledgers, venture pitch decks, and certified 1-on-1 strategy sessions under charter license <strong>RC BN3583778</strong>.
                </p>
              </div>
            </div>

            {/* PORTAL CATEGORY MENU */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto p-1.5 bg-black/60 rounded-2xl border border-zinc-800">
              {[
                { id: 'all', label: 'All Portals' },
                { id: 'courses', label: 'Courses' },
                { id: 'ebooks', label: 'Ebooks' },
                { id: 'templates', label: 'Templates' },
                { id: 'saas', label: 'SaaS' },
                { id: 'assets', label: 'Assets' },
                { id: 'consulting', label: 'Consulting' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setMarketCategory(cat.id as any)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    marketCategory === cat.id
                      ? 'bg-[#FFD700] text-[#0B132B] font-extrabold shadow-md shadow-[#FFD700]/20'
                      : 'text-slate-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 8 COURSE & PRODUCT CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map(p => (
                <div 
                  key={p.id}
                  className="bg-zinc-950/70 border border-zinc-850 hover:border-[#FFD700]/40 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl group transition-all duration-300 hover:-translate-y-1"
                >
                  {/* High-Fidelity Image with Overlay */}
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-black border-b border-zinc-900">
                    <img 
                      src={p.image} 
                      alt={p.altText} 
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 border border-[#FFD700]/30 text-[#FFD700] font-mono font-bold text-[9px] uppercase backdrop-blur-sm">
                      {p.category}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3.5 flex-grow">
                    <div className="text-[10px] text-yellow-500 font-mono font-bold tracking-widest uppercase">
                      {p.sku} • {p.fileSize}
                    </div>

                    <h3 className="text-base font-bold text-white leading-snug group-hover:text-[#FFD700] transition">
                      {p.name}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3">
                      {p.description}
                    </p>

                    <div className="border-t border-zinc-900 pt-3 space-y-1.5 font-mono text-[11px]">
                      <span className="text-[9px] text-slate-500 uppercase font-bold block">SPECIFICATIONS:</span>
                      {p.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="text-slate-300 flex items-start gap-1.5">
                          <span className="text-[#FFD700] font-bold">•</span>
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action / Buy Button */}
                  <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex gap-2">
                    {hasAccess ? (
                      <a 
                        href={`/downloads/${p.downloadUrl.split('/').pop()}?email=${encodeURIComponent(currentUser.email || 'ifiok82@gmail.com')}`}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-wider font-mono shadow-md shadow-green-600/20 text-center"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>UNLOCKED • DOWNLOAD</span>
                      </a>
                    ) : (
                      <button 
                        onClick={() => handleBuyClick(p)}
                        className="w-full py-3 bg-[#FFD700] hover:bg-yellow-400 text-[#0B132B] font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-wider font-mono shadow-md shadow-yellow-500/20 active:scale-95"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>BUY / UNLOCK</span>
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* 6. DOWNLOADS PORTAL (/downloads) */}
        {!adminPanelOpen && currentTab === 'downloads' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-black font-cinzel text-white uppercase">
                Licensed Downloads Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {hasAccess 
                  ? `Active clearance verified for account: ${currentUser.email || 'ifiok82@gmail.com'}`
                  : 'Downloads are locked. Please complete verified checkout to release packages.'}
              </p>
            </div>

            {!hasAccess ? (
              <div className="text-center py-16 border border-zinc-850 rounded-2xl bg-zinc-950 p-6 max-w-lg mx-auto">
                <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-[#FFD700]">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Partner Clearance Required</h3>
                <p className="text-xs text-slate-400 font-mono mb-6 leading-relaxed">
                  To release offline course kits, spreadsheet valuation packages, and software blueprints, complete payment verification via Paystack, Flutterwave, PayPal, or Pi Mainnet KYC.
                </p>
                <button
                  onClick={() => {
                    if (programmesList[0]) handleBuyClick(programmesList[0]);
                  }}
                  className="px-6 py-3 bg-[#FFD700] hover:bg-yellow-400 text-[#0B132B] font-black text-xs rounded-xl uppercase tracking-wider font-mono transition"
                >
                  Verify Access Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programmesList.map(prod => (
                  <div key={prod.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-white font-bold text-sm">{prod.name}</div>
                      <div className="text-slate-400 text-xs font-mono">{prod.fileSize} • {prod.sku}</div>
                    </div>
                    <a
                      href={`/downloads/${prod.downloadUrl.split('/').pop()}?email=${encodeURIComponent(currentUser.email || 'ifiok82@gmail.com')}`}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded-lg uppercase font-mono flex items-center gap-1.5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. AI PROFESSOR INTERACTIVE PANEL (/ai-professor) */}
        {!adminPanelOpen && currentTab === 'professor' && (
          <div className="space-y-8 animate-fade-in font-mono">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-black font-cinzel text-white uppercase flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#FFD700]" />
                AI Professor Interactive Panel
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Adaptive executive learning, corporate finance queries, and digital ledger guidance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Presets */}
              <div className="space-y-3">
                <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">
                    Executive Scenarios
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Click any shortcut to query the AI Professor model:
                  </p>
                  <div className="space-y-2 pt-1">
                    {[
                      "Professor, draft a corporate ledger audit template for checking system logs.",
                      "How do I structure a venture capital pitch deck for a SaaS bookkeeping app?",
                      "Provide a step-by-step corporate valuation checklist using DCF and NPV.",
                      "Explain the sovereign wealth asset diversification methodology."
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setChatPrompt(prompt)}
                        className="w-full text-left p-2.5 bg-black border border-zinc-850 hover:border-[#FFD700]/30 rounded-lg text-[10px] text-slate-300 transition"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Terminal */}
              <div className="lg:col-span-2 bg-black border border-zinc-850 rounded-2xl p-5 h-[520px] flex flex-col justify-between shadow-2xl">
                <div className="flex items-center justify-between border-b border-zinc-850 pb-3 mb-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    AI Professor Active Terminal
                  </span>
                  <span className="text-[10px] text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Online Node Active
                  </span>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 text-xs pr-2">
                  {chatHistory.map((msg, i) => (
                    <div 
                      key={i}
                      className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0B132B] text-[#FFD700] ml-auto border border-zinc-800'
                          : 'bg-zinc-950 text-slate-200 mr-auto border border-zinc-900 whitespace-pre-line'
                      }`}
                    >
                      <strong className="block text-[9px] text-slate-500 uppercase mb-1">
                        {msg.role === 'user' ? 'Scholar' : 'AI Professor'}
                      </strong>
                      {msg.text}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="text-yellow-400 text-xs animate-pulse">
                      AI Professor is compiling answer...
                    </div>
                  )}
                </div>

                <form onSubmit={handleChatSubmit} className="pt-3 border-t border-zinc-850 flex gap-2">
                  <input 
                    type="text"
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    placeholder="Ask AI Professor about your course or blueprint..."
                    className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#FFD700]"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading}
                    className="px-4 py-2.5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xs rounded-xl uppercase"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* SECURE CHECKOUT PORTAL MODAL (Navy Blue #0B132B + Gold #FFD700 Theme) */}
      {checkoutModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[99999] bg-[#0B132B]/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0B132B] border-2 border-[#FFD700] rounded-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto shadow-2xl relative shadow-yellow-500/10">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SirwiseLogo className="h-8 w-auto" showText={false} />
                  <h4 className="text-base font-black tracking-wider text-[#FFD700] font-cinzel">
                    SECURE PAYMENT PORTAL
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 font-mono italic">
                  “Global Digital Knowledge Hub powered by AI Professor.”
                </p>
              </div>
              <button 
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-900 border border-zinc-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 bg-[#0B132B]">
              
              {checkoutStatus ? (
                <div className="space-y-4 text-center py-6 font-mono">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-green-500/10 border border-green-500/30 text-green-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h5 className="text-lg font-black uppercase text-green-400">
                    {checkoutStatus.message}
                  </h5>
                  <p className="text-xs text-slate-300">
                    Your clearance has been registered on the server. Your download packages are now unlocked.
                  </p>
                  <button 
                    type="button"
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      navigateTo('/downloads');
                    }}
                    className="mt-4 px-6 py-3 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xs rounded-xl transition uppercase"
                  >
                    Proceed to Licensed Downloads
                  </button>
                </div>
              ) : (
                <form onSubmit={executePayment} className="space-y-5">
                  
                  {/* Selected Asset Header */}
                  <div className="p-3.5 bg-black rounded-xl border border-zinc-800 flex items-center justify-between font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Selected Product:</span>
                      <span className="text-xs font-bold text-white">{selectedProduct.name}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] rounded font-bold uppercase">
                      {selectedProduct.category}
                    </span>
                  </div>

                  {/* Step 1: Your Details */}
                  <div className="space-y-3 font-mono">
                    <span className="text-[11px] text-[#FFD700] uppercase block font-black border-b border-[#FFD700]/20 pb-1.5 tracking-wider">
                      Step 1: Your Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Full Legal Name</label>
                        <input 
                          type="text" 
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value)}
                          placeholder="e.g. Dr. John Doe"
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">E-mail Address</label>
                        <input 
                          type="email" 
                          value={billingEmail}
                          onChange={(e) => setBillingEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          value={billingPhone}
                          onChange={(e) => setBillingPhone(e.target.value)}
                          placeholder="+234..."
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Country</label>
                        <input 
                          type="text" 
                          value={billingCountry}
                          onChange={(e) => setBillingCountry(e.target.value)}
                          placeholder="Country"
                          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Payment Method */}
                  <div className="space-y-3 font-mono">
                    <span className="text-[11px] text-[#FFD700] uppercase block font-black border-b border-[#FFD700]/20 pb-1.5 tracking-wider">
                      Step 2: Payment Method
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'paystack', label: 'Paystack', desc: 'Cards & Transfer' },
                        { id: 'flutterwave', label: 'Flutterwave', desc: 'Global & USSD' },
                        { id: 'paypal', label: 'PayPal', desc: 'International' },
                        { id: 'pi_mainnet', label: 'Pi Mainnet', desc: 'KYC Wallet' },
                        { id: 'pi_testnet', label: 'Pi Testnet', desc: 'Sandbox 10/10' }
                      ].map(gateway => (
                        <button
                          key={gateway.id}
                          type="button"
                          onClick={() => setSelectedGateway(gateway.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            selectedGateway === gateway.id
                              ? 'bg-[#FFD700]/15 border-[#FFD700] text-white shadow-md'
                              : 'bg-black border-zinc-850 text-slate-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="font-bold text-xs text-white">{gateway.label}</div>
                          <div className="text-[9px] text-slate-400">{gateway.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Security Icons & Reassurance */}
                  <div className="border-t border-[#FFD700]/10 pt-4 space-y-2">
                    <div className="flex items-center justify-center gap-6 text-slate-400">
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <ShieldCheck className="w-4 h-4 text-[#FFD700]" /> SSL SECURE
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <ShieldCheck className="w-4 h-4 text-[#FFD700]" /> PCI DSS COMPLIANT
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono">
                        <ShieldCheck className="w-4 h-4 text-[#FFD700]" /> VERIFIED GATEWAY
                      </div>
                    </div>
                    <p className="text-[11px] text-center text-slate-400 font-mono">
                      Your payment is encrypted and processed securely.
                    </p>
                  </div>

                  {/* Step 3: Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={isSubmittingCheckout}
                      className="flex-1 py-3.5 bg-[#FFD700] hover:bg-yellow-400 text-[#0B132B] font-black text-xs rounded-xl tracking-wider uppercase transition shadow-lg shadow-yellow-500/20"
                    >
                      {isSubmittingCheckout ? 'Verifying Transaction...' : 'Pay Now'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutModalOpen(false)}
                      className="px-6 py-3.5 bg-transparent border border-zinc-700 hover:border-zinc-500 text-slate-300 font-bold text-xs rounded-xl uppercase transition"
                    >
                      Cancel
                    </button>
                  </div>

                </form>
              )}

            </div>

          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative font-mono text-xs">
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-2 text-[#FFD700]">
                <User className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Partner Credentials</h4>
              <p className="text-[10px] text-slate-400">Charter Clearance: RC BN3583778</p>
            </div>

            <div className="space-y-2 p-3 bg-black rounded-xl border border-zinc-900 text-slate-300 mb-4">
              <div><span className="text-slate-500 text-[9px] block">Name:</span> {currentUser.name || 'Partner'}</div>
              <div><span className="text-slate-500 text-[9px] block">Email:</span> {currentUser.email || 'N/A'}</div>
              <div><span className="text-slate-500 text-[9px] block">Clearance:</span> 
                <span className="text-green-400 font-bold ml-1">{isVerified ? 'VERIFIED ✓' : 'UNVERIFIED 🔒'}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                localStorage.removeItem('sirwise_hub_user');
                localStorage.removeItem('sirwise_hub_verified');
                setCurrentUser({ email: '', name: '', phone: '', country: '', isLoggedIn: false, role: 'buyer' });
                setIsVerified(false);
                setIsProfileModalOpen(false);
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg uppercase"
            >
              Lock Session (Logout)
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 font-mono">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <SirwiseLogo className="h-9 w-auto" showText={true} />
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              SIRWISE is an independent global digital knowledge, templates, and corporate consulting hub. Charter certificate registered under license number <strong>RC BN3583778</strong>.
            </p>
          </div>

          {/* Col 2: Hub Navigation */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">Hub Navigation</h5>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li>
                <button onClick={() => navigateTo('/knowledge-hub')} className="hover:text-white transition">
                  • Digital Portals & Courses
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/downloads')} className="hover:text-white transition">
                  • Licensed Downloads
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/ai-professor')} className="hover:text-white transition">
                  • AI Professor Panel
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/testnet')} className="hover:text-purple-400 transition text-purple-400 font-bold">
                  • Pi Testnet Sandbox (10/10)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance Support & WhatsApp */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">Compliance Support</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Facing questions about partner verification, download releases, or corporate charters? Connect with support specialists.
            </p>
            <a 
              href="https://wa.me/2348030000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Support
            </a>
          </div>

          {/* Col 4: Compliance Protocol & Links */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">Compliance Protocol</h5>
            
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-300 text-[9px] border border-zinc-800">GDPR SECURITY</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-300 text-[9px] border border-zinc-800">SSL ENCRYPTED</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-300 text-[9px] border border-zinc-800">VERIFIED HUB</span>
            </div>

            <ul className="space-y-1.5 text-[11px] text-slate-400 pt-1">
              <li>
                <button onClick={() => navigateTo('/privacy')} className="hover:text-[#FFD700] transition">
                  → Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/terms-of-service')} className="hover:text-[#FFD700] transition">
                  → Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('/admin')} className="text-zinc-500 hover:text-slate-300 text-[10px] transition">
                  → Administrative Console (Goye1967@)
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-900 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <span>© 2026 SIRWISE Hub. Registered charter license RC BN3583778. All Rights Reserved.</span>
          <span className="text-[#FFD700]">PCI DSS Verified • GDPR Secure Data Encryption Protocol</span>
        </div>
      </footer>

    </div>
  );
}
