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
  Users
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { usePaystackPayment } from 'react-paystack';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { SirwiseLogo } from './components/SirwiseLogo';
import countriesData from '../data/countries.json';

// Digital Product Interface loaded dynamically from Backend
interface DigitalProduct {
  id: string;
  sku: string;
  name: string;
  category: 'courses' | 'ebooks' | 'templates' | 'saas' | 'assets' | 'consulting';
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

  // Navigation tab states: 'marketplace' | 'downloads' | 'professor'
  const [currentTab, setCurrentTab] = useState<'marketplace' | 'downloads' | 'professor'>('marketplace');
  const [marketCategory, setMarketCategory] = useState<'all' | 'courses' | 'ebooks' | 'templates' | 'saas' | 'assets' | 'consulting'>('all');

  // Products state (populated dynamically via fetch /api/products)
  const [programmesList, setProgrammesList] = useState<DigitalProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Active verified user session state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const stored = localStorage.getItem('sirwise_hub_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Purge old mock user cache from previous sessions if present
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

  // Global verification status derived from localStorage or sync check
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
  const [inactivityTimer, setInactivityTimer] = useState(180); // 3 minutes lockout
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Server data states for Admin Panel
  const [adminUsers, setAdminUsers] = useState<VerifiedUserRecord[]>([]);
  const [adminLogs, setAdminLogs] = useState<AuditLog[]>([]);
  const [adminDownloads, setAdminDownloads] = useState<any[]>([]);
  const [isLoadingAdminRecords, setIsLoadingAdminRecords] = useState(false);

  // Double check error queries on mount (for server-side redirect parameters)
  const [urlErrorMessage, setUrlErrorMessage] = useState('');

  // Form input values in SECURE PAYMENT PORTAL
  const [billingEmail, setBillingEmail] = useState('');
  const [billingName, setBillingName] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingCountry, setBillingCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);

  // Selected verification product state
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Paystack & Flutterwave Payment Configuration
  const paystackConfig = {
    reference: `REF-${Date.now()}`,
    email: billingEmail,
    amount: 16000 * 100, // Amount in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
  };
  const initializePaystack = usePaystackPayment(paystackConfig);

  const flwConfig = {
    public_key: import.meta.env.VITE_FLW_PUBLIC_KEY || 'FLWPUBK_TEST-placeholder',
    tx_ref: `REF-${Date.now()}`,
    amount: 16000,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: { email: billingEmail, phone_number: billingPhone, name: billingName },
    customizations: { title: 'SIRWISE Hub', description: 'MBA Program', logo: '' },
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
        setCurrentUser(data.user);
        localStorage.setItem('sirwise_hub_user', JSON.stringify(data.user));
      } else {
        alert(data.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error(err);
      alert('Payment verification error');
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  // General profile modification modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Active AI Professor chat
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Welcome to the SIRWISE Global Digital Knowledge Hub. I am your AI Professor. Ask me anything about our professional MBA courses, digital ledger setups, financial models, or legal blueprints.' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Logo taps tracker for secret gateway trigger
  const [logoTaps, setLogoTaps] = useState(0);

  // Load products list from database GET /api/products
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProgrammesList(data);
        setIsLoadingProducts(false);
      })
      .catch(err => {
        console.error("Error loading products dynamically:", err);
        setIsLoadingProducts(false);
      });
  }, []);

  const [isPiBrowser, setIsPiBrowser] = useState(false);

  // Pi Browser Adapter & Auto-Fill authentication routine
  useEffect(() => {
    const checkPi = typeof window !== 'undefined' && 
                    !!(window as any).Pi && 
                    window.navigator.userAgent.toLowerCase().includes('pibrowser');
    setIsPiBrowser(checkPi);
    if (checkPi) {
      try {
        const Pi = (window as any).Pi;
        Pi.init({ version: "2.0" });
        console.log("Pi SDK initialized in Pi Browser. Dynamic verification available.");
      } catch (err) {
        console.error("Pi SDK crash protection:", err);
      }
    }
  }, []);

  // Secure Manual/On-demand Pi Network Authentication to prevent 120s promise timeouts
  const handlePiAuth = async () => {
    if (typeof window === 'undefined' || !(window as any).Pi) {
      alert("Pi Network SDK is not available outside of Pi Browser.");
      return;
    }
    try {
      const Pi = (window as any).Pi;
      const auth = await Pi.authenticate(['username', 'payments'], (payment: any) => {
        console.warn("Incomplete payments:", payment);
      });
      if (auth && auth.user) {
        const piUsername = auth.user.username;
        setBillingName(piUsername || '');
        setBillingEmail(`${piUsername}@pi.browser`);
        setBillingPhone("PI-BROWSER-AUTH");
        setBillingCountry("Nigeria");
      }
    } catch (err: any) {
      console.error("Pi authentication error:", err);
      alert("Could not sync Pi profile automatically. Please fill details manually.");
    }
  };

  const handlePiPayment = async () => {
     if (!selectedProduct) return;
     try {
       const Pi = (window as any).Pi;
       const payment = await Pi.createPayment({
         amount: 10,
         memo: `Payment for ${selectedProduct.name}`,
         metadata: { productId: selectedProduct.id },
       }, {
         onReadyForServerApproval: (paymentId: string) => {
             // Send paymentId to backend /api/verify-payment
             verifyPayment({ reference: paymentId, provider: 'pi', name: billingName, email: billingEmail, phone: billingPhone, country: billingCountry });
         },
         onReadyForServerCompletion: (paymentId: string, txid: string) => {
             console.log("Payment completed", txid);
         },
         onCancel: (paymentId: string) => {},
         onError: (error: any, payment: any) => { console.error(error); },
       });
     } catch (err) {
       console.error(err);
       alert("Pi Payment failed");
     }
  }

  // Sync verification status from server on mount
  useEffect(() => {
    // If URL has query parameters, parse them
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'not_verified') {
      setUrlErrorMessage('Your download session is not verified. Please verify your partner profile to unlock downloads.');
      setIsVerified(false);
      localStorage.setItem('sirwise_hub_verified', 'false');
    }

    if (currentUser && currentUser.email) {
      fetch('/api/admin/records')
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Not authorized to read records yet');
        })
        .then(data => {
          const matched = data.users.find((u: any) => u.email.toLowerCase() === currentUser.email.toLowerCase());
          if (matched) {
            const verified = matched.status === 'Verified';
            setIsVerified(verified);
            localStorage.setItem('sirwise_hub_verified', verified ? 'true' : 'false');
          }
        })
        .catch(() => {
          // Fallback if admin records endpoint is unauthorized (the client retains localStorage state)
        });
    }
  }, [currentUser]);

  // Handle logo tap secrets (5 fast taps opens admin check)
  const handleLogoTap = () => {
    setLogoTaps(prev => {
      const next = prev + 1;
      if (next >= 5) {
        setAdminPanelOpen(true);
        return 0;
      }
      return next;
    });
    setTimeout(() => setLogoTaps(0), 3000);
  };

  // Fetch admin records (users, logs, metrics) from backend server
  const fetchAdminRecords = () => {
    setIsLoadingAdminRecords(true);
    fetch('/api/admin/records')
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized pin access");
        return res.json();
      })
      .then(data => {
        setAdminUsers(data.users || []);
        setAdminLogs(data.auditLogs || []);
        setAdminDownloads(data.downloads || []);
        setIsLoadingAdminRecords(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingAdminRecords(false);
      });
  };

  // Trigger admin records loading upon successful login
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

  // Handle Admin Authorization
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('/api/admin/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: adminPassword })
    })
    .then(res => {
      if (res.ok) {
        setAdminLoggedIn(true);
        setAdminError('');
        setAdminPassword('');
      } else {
        throw new Error("Unauthorized PIN passcode");
      }
    })
    .catch(() => {
      setAdminError("Unauthorized PIN credentials. Access Denied.");
    });
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    setAdminPassword('');
  };

  // Admin change verified status (Approve/Revoke)
  const handleUpdateUserStatus = (userId: string, targetStatus: 'Verified' | 'Revoked') => {
    resetInactivityTimer();
    fetch('/api/admin/users/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: targetStatus })
    })
    .then(res => {
      if (res.ok) {
        fetchAdminRecords();
        // If the revoked user matches the current active user, instantly update local state
        const updatedUser = adminUsers.find(u => u.id === userId);
        if (updatedUser && currentUser.email.toLowerCase() === updatedUser.email.toLowerCase()) {
          const verified = targetStatus === 'Verified';
          setIsVerified(verified);
          localStorage.setItem('sirwise_hub_verified', verified ? 'true' : 'false');
        }
      }
    })
    .catch(err => console.error(err));
  };

  // Chat with AI Professor on server-side model
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

  // Launch Verification Checkout drawer
  const handleBuyClick = (product: DigitalProduct) => {
    setSelectedProduct(product);
    setCheckoutModalOpen(true);
    setCheckoutStatus(null);
    
    // Autofill with current user if already partially filled
    setBillingName(currentUser.name || '');
    setBillingEmail(currentUser.email || '');
    setBillingPhone(currentUser.phone || '');
    setBillingCountry(currentUser.country || '');
  };

  // Perform secure payment verification request
  const handleCheckoutSubmit = async (e: React.FormEvent, provider: 'paystack' | 'flutterwave') => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!billingName.trim() || !billingEmail.trim() || !billingPhone.trim() || !billingCountry) {
      alert("Please fill in all verification profile details.");
      return;
    }

    if (provider === 'paystack') {
        initializePaystack({
            onSuccess: (ref: any) => verifyPayment({ reference: ref.reference, provider: 'paystack', name: billingName, email: billingEmail, phone: billingPhone, country: billingCountry }),
            onClose: () => {}
        });
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
  };

  // Filtering products
  const filteredProducts = programmesList.filter(p => {
    if (marketCategory === 'all') return true;
    return p.category === marketCategory;
  });

  return (
    <div className="bg-[#0B132B] min-h-screen flex flex-col font-sans text-slate-200" onMouseMove={resetInactivityTimer} onClick={resetInactivityTimer} onKeyDown={resetInactivityTimer} onScroll={resetInactivityTimer}>
      
      {/* CORPORATE EXECUTIVE HEADER */}
      <header className="bg-[#0B132B] border-b border-[#FFD700]/20 py-4 px-4 sticky top-0 z-50 flex items-center justify-center shadow-xl relative">
        {/* Left: profile details if logged in */}
        {currentUser.isLoggedIn && (
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="absolute left-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-white hover:border-[#FFD700]/30 transition"
          >
            <User className="w-3.5 h-3.5 text-[#FFD700]" />
            <span className="font-mono text-[10px] hidden sm:inline">{currentUser.name || 'Profile'}</span>
          </button>
        )}

        {/* Center: Centered Logo with secret 5 taps logic */}
        <div 
          onClick={handleLogoTap} 
          className="cursor-pointer select-none transition-transform active:scale-95 flex items-center justify-center"
          title="Administrative Compliance desk access"
        >
          <SirwiseLogo className="h-10 w-auto" showText={true} />
        </div>

        {/* Right: verified status */}
        <div className="absolute right-4 flex items-center gap-2">
          {hasAccess && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-mono font-bold text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isAdmin ? 'ADMIN GRANTED ✓' : 'VERIFIED ✓'}</span>
              <span className="md:hidden">✓</span>
            </div>
          )}
        </div>
      </header>

      {/* SEGMENTED NAVIGATION BAR */}
      <nav className="bg-zinc-950/80 border-b border-zinc-900 py-3 px-4 sticky top-[72px] z-40 backdrop-blur-md overflow-x-auto whitespace-nowrap">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2">
          
          <button
            onClick={() => { setCurrentTab('marketplace'); setAdminPanelOpen(false); }}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black transition text-xs uppercase tracking-wider ${
              currentTab === 'marketplace' && !adminPanelOpen
                ? 'bg-[#F59E0B] text-black shadow-lg shadow-yellow-500/10'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>KNOWLEDGE HUB</span>
          </button>

          <button
            onClick={() => { setCurrentTab('downloads'); setAdminPanelOpen(false); }}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black transition text-xs uppercase tracking-wider relative ${
              currentTab === 'downloads' && !adminPanelOpen
                ? 'bg-[#F59E0B] text-black shadow-lg shadow-yellow-500/10'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOADS</span>
            {hasAccess && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 text-black font-mono font-black text-[10px] rounded-full flex items-center justify-center border-2 border-zinc-950">
                {programmesList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setCurrentTab('professor'); setAdminPanelOpen(false); }}
            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black transition text-xs uppercase tracking-wider ${
              currentTab === 'professor' && !adminPanelOpen
                ? 'bg-[#F59E0B] text-black shadow-lg shadow-yellow-500/10'
                : 'text-slate-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI PROFESSOR</span>
          </button>

        </div>
      </nav>

      {/* PWA NOTIFICATION BANNER */}
      {isInstallable && !isInstalled && (
        <div className="bg-gradient-to-r from-zinc-950 via-[#0B132B] to-zinc-950 border-y border-zinc-800 py-3 px-4 animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg text-black">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">SIRWISE Standalone Mobile Hub</h4>
                <p className="text-[11px] text-slate-400">Install the offline web portal to stream downloads and study modules instantly.</p>
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

      {/* ERROR MESSAGE STRIP FROM URL PARAMETERS */}
      {urlErrorMessage && (
        <div className="bg-red-900/40 border-y border-red-800 text-red-200 py-3 px-4 text-center font-mono text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 animate-bounce" />
          <span>{urlErrorMessage}</span>
          <button onClick={() => setUrlErrorMessage('')} className="ml-3 font-bold text-[10px] uppercase underline text-red-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* PRIMARY WORKSPACE */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8">

        {/* SECRET ADMINISTRATIVE INTERFACE PANEL */}
        {adminPanelOpen ? (
          <div className="bg-zinc-950 border-2 border-yellow-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-4 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-yellow-400" />
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
              /* PIN Authorization */
              <div className="max-w-md mx-auto py-12 text-center">
                <div className="w-14 h-14 bg-yellow-500/15 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-400">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-md font-bold text-white mb-1">Administrative Gateway Locked</h3>
                <p className="text-xs text-slate-400 mb-6 font-mono">Enter PIN passcode to view partner registries.</p>

                <form onSubmit={handleAdminLoginSubmit} className="space-y-4 font-mono">
                  <div>
                    <input 
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter PIN Passcode..."
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
              <div className="space-y-8 animate-fade-in font-mono">
                
                {/* Visual statistics row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-black border border-zinc-900 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-mono uppercase">VERIFIED PARTNERS</span>
                    <span className="text-xl font-black text-green-400 font-mono">
                      {adminUsers.filter(u => u.status === 'Verified').length} Active
                    </span>
                    <div className="w-full bg-zinc-900 h-1 rounded-full mt-2">
                      <div className="bg-green-400 h-full w-full" />
                    </div>
                  </div>
                  <div className="bg-black border border-zinc-900 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-mono uppercase">REVOKED LICENSES</span>
                    <span className="text-xl font-black text-red-400 font-mono">
                      {adminUsers.filter(u => u.status === 'Revoked').length} Blocked
                    </span>
                    <div className="w-full bg-zinc-900 h-1 rounded-full mt-2">
                      <div className="bg-red-400 h-full w-1/12" />
                    </div>
                  </div>
                  <div className="bg-black border border-zinc-900 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-mono uppercase">BLUEPRINT DOWNLOADS</span>
                    <span className="text-xl font-black text-white font-mono">
                      {adminDownloads.length} Records
                    </span>
                    <span className="text-[9px] text-green-400 font-mono block mt-1">▲ Real-time bandwidth serving</span>
                  </div>
                  <div className="bg-black border border-zinc-900 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 block font-mono uppercase">NODE SHIELDING</span>
                    <span className="text-xl font-black text-green-500 font-mono">GDPR / PCI</span>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">SSL Shielding Active</span>
                  </div>
                </div>

                {/* Users List from Server Database */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-yellow-400 tracking-wider font-mono uppercase flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Verified Partner Registrations Register
                    </h3>
                    <button 
                      onClick={fetchAdminRecords}
                      className="px-2.5 py-1 text-[9px] font-bold border border-zinc-800 bg-zinc-900 text-slate-300 rounded hover:text-[#FFD700] hover:border-[#FFD700]/30 transition uppercase"
                    >
                      Refresh Database
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-zinc-900 rounded-xl bg-black">
                    {isLoadingAdminRecords ? (
                      <div className="text-center py-8 text-xs text-slate-500 font-mono animate-pulse">
                        Querying database records from server...
                      </div>
                    ) : adminUsers.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500 font-mono">
                        No registered partners found in database.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-zinc-950 text-[9px] tracking-widest uppercase text-slate-500 border-b border-zinc-900 font-mono">
                          <tr>
                            <th className="p-3">Partner ID / Date</th>
                            <th className="p-3">Partner Contact Information</th>
                            <th className="p-3">Device / IP Metadata</th>
                            <th className="p-3">Clearance Status</th>
                            <th className="p-3 text-right">Instant Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 font-mono">
                          {adminUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-zinc-950/40 transition">
                              <td className="p-3">
                                <div className="font-bold text-white text-[11px]">{u.id}</div>
                                <div className="text-[9px] text-slate-500">{u.timestamp}</div>
                              </td>
                              <td className="p-3 text-[11px]">
                                <div className="font-bold text-white">{u.name}</div>
                                <div className="text-[10px] text-slate-400">{u.email}</div>
                                <div className="text-[9px] text-slate-500">{u.phone} | {u.country}</div>
                              </td>
                              <td className="p-3 text-[10px] text-slate-400">
                                {u.device}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  u.status === 'Verified' ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
                                  u.status === 'Pending' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 animate-pulse' :
                                  'bg-red-500/15 text-red-400 border border-red-500/30'
                                }`}>
                                  {u.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {u.status === 'Verified' ? (
                                  <button 
                                    onClick={() => handleUpdateUserStatus(u.id, 'Revoked')}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded transition uppercase"
                                  >
                                    Revoke Access
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => handleUpdateUserStatus(u.id, 'Verified')}
                                    className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[9px] font-bold rounded transition uppercase"
                                  >
                                    Verify Partner
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Audit Trail & Downloads Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Downloads Stream metrics */}
                  <div className="border border-zinc-900 bg-black/60 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-yellow-500 tracking-wider font-mono uppercase flex items-center gap-1.5 border-b border-zinc-900 pb-3 mb-3">
                      <Download className="w-4 h-4 text-yellow-400" />
                      Active Download Metric Audits
                    </h3>
                    <div className="h-64 overflow-y-auto space-y-3 font-mono text-[10px]">
                      {adminDownloads.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                          No downloads have been registered yet.
                        </div>
                      ) : (
                        adminDownloads.map((dl, idx) => (
                          <div key={dl.id || idx} className="border-b border-zinc-900 pb-2 flex justify-between items-start gap-2">
                            <div>
                              <p className="text-white font-bold">{dl.productName}</p>
                              <p className="text-slate-500 text-[9px]">{dl.userEmail}</p>
                            </div>
                            <span className="text-slate-500 text-[9px] font-mono">{dl.timestamp}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Server Compliance Audit Logs */}
                  <div className="border border-zinc-900 bg-black/60 rounded-xl p-4">
                    <h3 className="text-xs font-bold text-yellow-500 tracking-wider font-mono uppercase flex items-center gap-1.5 border-b border-zinc-900 pb-3 mb-3">
                      <Shield className="w-4 h-4 text-yellow-400" />
                      Compliance Audit Logs
                    </h3>
                    <div className="h-64 overflow-y-auto space-y-3 font-mono text-[10px]">
                      {adminLogs.map(log => (
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
          /* DIGITAL HUB WORKSPACE */
          <div className="space-y-12">
            
            {/* MARKETPLACE CHANNEL */}
            {currentTab === 'marketplace' && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Introduction Banner with design principles */}
                <div className="bg-[#0B132B] border border-[#FFD700]/20 rounded-2xl p-8 text-center relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#ffd70010,#00000000)] pointer-events-none" />
                  
                  <div className="relative max-w-2xl mx-auto space-y-4">
                    <span className="text-[10px] text-[#FFD700] tracking-widest font-mono font-bold block uppercase">
                      Executive Digital Knowledge Hub
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                      SIRWISE GLOBAL DIGITAL HUB
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Discover online courses, premium handbooks, legal blueprints, cloud-based software tools, and professional strategy sessions licensed under corporate charter <strong>RC BN3583778</strong>.
                    </p>
                  </div>
                </div>

                {/* Clean interactive filters */}
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto p-1 bg-[#0B132B]/50 rounded-xl border border-zinc-800">
                  {(['all', 'courses', 'ebooks', 'templates', 'saas', 'assets', 'consulting'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMarketCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        marketCategory === cat
                          ? 'bg-[#FFD700] text-[#0B132B] font-extrabold shadow-lg shadow-[#FFD700]/20'
                          : 'text-slate-400 hover:text-white hover:bg-zinc-800/60'
                      }`}
                    >
                      {cat === 'all' ? 'All Portals' : cat.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Product list skeleton loading state */}
                {isLoadingProducts ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                      <div key={idx} className="bg-zinc-950/60 border border-zinc-900 rounded-2xl h-[420px] animate-pulse flex flex-col justify-between p-5">
                        <div className="bg-zinc-900 h-40 rounded-xl mb-4" />
                        <div className="bg-zinc-900 h-6 w-3/4 rounded mb-2" />
                        <div className="bg-zinc-900 h-4 w-1/2 rounded" />
                        <div className="bg-zinc-900 h-10 w-full rounded-xl mt-auto" />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 8 Official Products Cards (Pricing completely removed) */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map((p) => {
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
                                e.currentTarget.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                          </div>

                          {/* Title & Features details */}
                          <div className="p-5 space-y-4 flex-grow">
                            <div>
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
                              <span className="text-[9px] text-slate-500 uppercase font-mono block font-bold">CORE SPECIFICATIONS:</span>
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

                          {/* Single Action / Dual State Product Button */}
                          <div className="p-5 border-t border-zinc-900 bg-zinc-950 flex gap-2">
                            {hasAccess ? (
                              <div className="w-full flex gap-2">
                                <a 
                                  href={`/downloads/${p.downloadUrl.split('/').pop()}?email=${encodeURIComponent(currentUser.email || 'ifiok82@gmail.com')}`}
                                  className="flex-grow py-3 bg-green-600 hover:bg-green-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-wider font-mono text-center shadow-lg shadow-green-500/10"
                                >
                                  <Unlock className="w-3.5 h-3.5" />
                                  UNLOCKED • DOWNLOAD
                                </a>
                                <div className="px-3.5 py-3 bg-green-950/60 border border-green-800 text-green-400 font-bold text-xs rounded-xl uppercase font-mono flex items-center justify-center gap-1">
                                  VERIFIED ✓
                               </div>
                              </div>
                            ) : (
                              <button 
                                onClick={() => handleBuyClick(p)}
                                className="w-full py-3 bg-[#FFD700] hover:bg-yellow-500 text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-wider font-mono shadow-lg shadow-yellow-500/10 active:scale-95"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>BUY (🔒)</span>
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* MY DOWNLOADS PORTFOLIO PORTAL */}
            {currentTab === 'downloads' && (
              <div className="space-y-8 animate-fade-in">
                
                <div className="border-b border-zinc-800 pb-4">
                  <h3 className="text-xl font-black font-cinzel text-white uppercase">
                    My Licensed Downloads
                  </h3>
                  {hasAccess ? (
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Retrieve active license keys and download package files compiled for user account {currentUser.email || 'ifiok82@gmail.com'}.
                    </p>
                  ) : (
                    <p className="text-xs text-red-400 mt-1 font-mono animate-pulse">
                      🔒 Downloads Portal is locked. Please BUY to unlock packages.
                    </p>
                  )}
                </div>

                {!hasAccess ? (
                  <div className="text-center py-12 border border-zinc-900 rounded-2xl bg-zinc-950">
                    <div className="w-12 h-12 bg-zinc-900/40 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white">No active corporate files unlocked</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-mono">
                      Please proceed to Knowledge Hub to buy e-books, online courses, and software licenses.
                    </p>
                    <button 
                      onClick={() => {
                        setCurrentTab('marketplace');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="mt-6 px-4 py-2 bg-yellow-500 text-black font-bold text-xs rounded-lg hover:bg-yellow-400 transition uppercase font-mono tracking-wider font-extrabold"
                    >
                      BUY NOW
                    </button>
                  </div>
                ) : programmesList.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono">
                    Querying product list database...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {programmesList.map((p) => (
                      <div 
                        key={p.id}
                        className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] text-[#FFD700] font-mono uppercase font-bold">
                            <span>SKU: {p.sku}</span>
                            <span>·</span>
                            <span>{p.fileSize}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">{p.name}</h4>
                          <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto font-mono">
                          <a 
                            href={`/downloads/${p.downloadUrl.split('/').pop()}?email=${encodeURIComponent(currentUser.email || 'ifiok82@gmail.com')}`}
                            className="flex-grow sm:flex-none px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition uppercase tracking-wider text-center"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Binary
                          </a>

                          <button 
                            onClick={() => {
                              alert(`LICENSING RECEIPT:\nProduct Name: ${p.name}\nSKU: ${p.sku}\nCharter Certificate: RC BN3583778\nHolder Session: ${currentUser.email || 'ifiok82@gmail.com'}\nStatus: Active Verified Partner`);
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

            {/* AI PROFESSOR PORTAL */}
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
                  
                  {/* Prompt contexts */}
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
                          onClick={() => setChatPrompt("Professor, draft a corporate ledger audit template for checking system logs.")}
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
                          onClick={() => setChatPrompt("Give me a step-by-step breakdown on optimizing system execution parameters for corporate nodes.")}
                          className="w-full text-left p-2.5 border border-zinc-900 hover:border-[#FFD700]/30 bg-black rounded-lg text-[10px] font-mono text-slate-300 transition"
                        >
                          [System Execution Checklist]
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LLM Terminal */}
                  <div className="lg:col-span-2 bg-black border border-zinc-900 rounded-2xl p-5 h-[500px] flex flex-col justify-between shadow-2xl relative">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                      <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Professor Interactive Sandbox</span>
                      <span className="text-[9px] text-green-400 font-mono flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        GEMINI 3.8 FLASH NODE ACTIVE
                      </span>
                    </div>

                    {/* Output log */}
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

            <form className="p-6 space-y-6 bg-[#0B132B]">
              
              {checkoutStatus ? (
                <div className="space-y-4 text-center py-6 font-mono">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-green-500/10 border border-green-500/30 text-green-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h5 className="text-lg font-black uppercase text-green-400">
                    {checkoutStatus.message}
                  </h5>
                  <button 
                    type="button"
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      setCurrentTab('downloads');
                    }}
                    className="mt-4 px-6 py-2.5 bg-[#FFD700] hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition uppercase"
                  >
                    Proceed to Hub
                  </button>
                </div>
              ) : (
                <>
                  {/* Pi Browser On-Demand Auth Trigger */}
                  {isPiBrowser && (
                    <div className="p-4 bg-zinc-900 border border-[#FFD700]/20 rounded-xl space-y-2 text-center font-mono">
                      <div className="flex items-center justify-center gap-2 text-xs text-[#FFD700] font-bold">
                        <Smartphone className="w-4 h-4 animate-pulse" />
                        <span>PI MAINNET KYC BROWSER</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Authorize via Pi Mainnet wallet for verified, secure asset unlocking.
                      </p>
                      <button
                        type="button"
                        onClick={handlePiAuth}
                        className="w-full py-2.5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-[11px] rounded-lg tracking-wider uppercase transition flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        SYNC PI WALLET
                      </button>
                    </div>
                  )}

                  {/* Customer Details */}
                  <div className="space-y-3">
                    <span className="text-[11px] text-[#FFD700] uppercase font-mono block font-black border-b border-[#FFD700]/10 pb-2 tracking-widest">
                      Your Details
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Full Legal Name</label>
                        <input 
                          type="text" 
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value)}
                          placeholder="Enter full legal name"
                          className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">E-mail Address</label>
                        <input 
                          type="email" 
                          value={billingEmail}
                          onChange={(e) => setBillingEmail(e.target.value)}
                          placeholder="Enter verified email"
                          className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          value={billingPhone}
                          onChange={(e) => setBillingPhone(e.target.value)}
                          placeholder="Enter phone number"
                          className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-700 focus:border-[#FFD700] outline-none"
                          required
                        />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] text-slate-400 block mb-1">Resident Country</label>
                        <button
                          type="button"
                          onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                          className="w-full bg-black border border-zinc-850 rounded-lg px-3 py-2.5 text-xs text-white text-left flex items-center justify-between focus:border-[#FFD700] outline-none select-none"
                        >
                          <span className="flex items-center gap-2">
                            {billingCountry ? (
                              <>
                                <span>{countriesData.find(c => c.name === billingCountry)?.flag}</span>
                                <span>{billingCountry}</span>
                              </>
                            ) : (
                              <span className="text-slate-500">Select Country</span>
                            )}
                          </span>
                          <span className="text-slate-500 text-[10px]">▼</span>
                        </button>

                        {countryDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-[999998]" 
                              onClick={() => { setCountryDropdownOpen(false); setCountrySearch(''); }}
                            />
                            <div className="absolute left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-[999999] p-2 max-h-60 flex flex-col">
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Type to search country..."
                                className="w-full bg-black border border-zinc-900 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-700 outline-none focus:border-[#FFD700] mb-2 font-mono"
                                autoFocus
                              />
                              <div className="overflow-y-auto flex-grow space-y-0.5 custom-scrollbar max-h-40">
                                {countriesData
                                  .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                                  .map(c => (
                                    <button
                                      key={c.code}
                                      type="button"
                                      onClick={() => { setBillingCountry(c.name); setCountryDropdownOpen(false); setCountrySearch(''); }}
                                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#FFD700]/10 rounded flex items-center gap-2 transition"
                                    >
                                      <span className="text-sm shrink-0">{c.flag}</span>
                                      {c.name}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security Reassurance */}
                  <div className="flex items-center justify-center gap-4 text-slate-500 py-4 border-t border-[#FFD700]/10">
                    <div className="flex items-center gap-1 text-[9px] font-mono"><ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" /> SSL SECURE</div>
                    <div className="flex items-center gap-1 text-[9px] font-mono"><ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" /> PCI DSS</div>
                    <div className="flex items-center gap-1 text-[9px] font-mono"><ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" /> VERIFIED</div>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 leading-relaxed font-mono">
                    Your payment is encrypted and processed securely through trusted gateways.
                  </p>

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={(e) => handleCheckoutSubmit(e, 'paystack')}
                      disabled={isSubmittingCheckout}
                      className="w-full py-3.5 bg-[#FFD700] hover:bg-yellow-400 text-[#0B132B] font-black text-xs rounded-xl tracking-wider uppercase transition"
                    >
                      {isSubmittingCheckout ? 'Processing...' : 'Pay Now (Paystack)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutModalOpen(false)}
                      className="w-full py-3.5 bg-transparent border border-zinc-700 hover:border-zinc-500 text-slate-300 font-bold text-xs rounded-xl tracking-wider uppercase transition"
                    >
                      Cancel
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
              <p className="text-[11px] text-slate-400 font-mono">Active Verification Database Credentials</p>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5 p-3.5 bg-black rounded-xl border border-zinc-900 leading-relaxed text-slate-300">
                <div><span className="text-slate-500 uppercase font-bold text-[9px] block">Name:</span> {currentUser.name || 'N/A'}</div>
                <div className="mt-2"><span className="text-slate-500 uppercase font-bold text-[9px] block">Email:</span> {currentUser.email || 'N/A'}</div>
                <div className="mt-2"><span className="text-slate-500 uppercase font-bold text-[9px] block">Phone:</span> {currentUser.phone || 'N/A'}</div>
                <div className="mt-2"><span className="text-slate-500 uppercase font-bold text-[9px] block">Country:</span> {currentUser.country || 'N/A'}</div>
                <div className="mt-2"><span className="text-slate-500 uppercase font-bold text-[9px] block">Status:</span> 
                  <span className="text-green-400 font-bold ml-1">{isVerified ? 'VERIFIED ✓' : 'UNVERIFIED 🔒'}</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 text-[10px] leading-relaxed text-slate-400">
                To update your verified details, clear your cookies or trigger an unlock with different credentials.
              </div>

              <button 
                onClick={() => {
                  // Clear session and lock
                  localStorage.removeItem('sirwise_hub_user');
                  localStorage.removeItem('sirwise_hub_verified');
                  setCurrentUser({
                    email: '',
                    name: '',
                    phone: '',
                    country: '',
                    isLoggedIn: false,
                    role: 'buyer'
                  });
                  setIsVerified(false);
                  setIsProfileModalOpen(false);
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-lg transition uppercase"
              >
                Clear Profile (Lock Session)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 font-mono">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <SirwiseLogo className="h-8 w-auto" showText={true} />
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              SIRWISE is an independent global digital knowledge, templates, and corporate consulting hub. Charter certificate registered under license number <strong>RC BN3583778</strong>.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider text-[#FFD700]">Hub Navigation</h5>
            <ul className="space-y-1.5 text-[11px] text-slate-400">
              <li>
                <button onClick={() => { setCurrentTab('marketplace'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="hover:text-white transition">
                  • Digital Portals
                </button>
              </li>
              <li>
                <button onClick={() => { setCurrentTab('downloads'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="hover:text-white transition">
                  • Licensed Downloads
                </button>
              </li>
              <li>
                <button onClick={() => { setCurrentTab('professor'); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="hover:text-white transition">
                  • AI Professor Panel
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider text-[#FFD700]">Compliance Support</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Facing questions about partner verification clearance, node downloads, or strategic micro-ledgers? Connect with support specialists.
            </p>
            
            <a 
              href="https://wa.me/2348030000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Support
            </a>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider text-[#FFD700]">Compliance Protocol</h5>
            
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-400 text-[9px] border border-zinc-800">GDPR SECURITY</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-400 text-[9px] border border-zinc-800">SSL ENCRYPTED</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-400 text-[9px] border border-zinc-800">VERIFIED HUB</span>
            </div>

            <div className="pt-2 border-t border-zinc-900">
              <button 
                onClick={() => {
                  setAdminPanelOpen(!adminPanelOpen);
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
                className="text-[10px] text-zinc-600 hover:text-[#FFD700]/70 underline transition"
              >
                Administrative Console login
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-900 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 SIRWISE Hub. Registered charter license RC BN3583778. All Rights Reserved.</span>
          <span className="text-[9px] text-[#FFD700]">PCI DSS Verified • GDPR Secure Data Encryption Protocol</span>
        </div>
      </footer>

    </div>
  );
}
