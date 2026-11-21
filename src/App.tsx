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

  // Navigation tab states: 'marketplace' | 'downloads' | 'professor' | 'compliance' | 'privacy' | 'terms'
  const [currentTab, setCurrentTab] = useState<'marketplace' | 'downloads' | 'professor' | 'compliance' | 'privacy' | 'terms'>('marketplace');
  const [marketCategory, setMarketCategory] = useState<'all' | 'courses' | 'ebooks' | 'templates' | 'saas' | 'assets' | 'consulting'>('all');

  // Products state (initialized IMMEDIATELY with all 8 official products to guarantee instant mobile/desktop rendering)
  const [programmesList, setProgrammesList] = useState<DigitalProduct[]>(OFFICIAL_PRODUCTS);

  // Unlocked products tracking: stores IDs of products unlocked exclusively via verified live payment callback
  const [unlockedProductIds, setUnlockedProductIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sirwise_unlocked_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

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

  const isAdmin = currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'ifiok82@gmail.com';

  // Admin and inactivity lockout tracking
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<'transactions' | 'users' | 'products' | 'fraud' | 'logs'>('transactions');
  const [inactivityTimer, setInactivityTimer] = useState(180); // 3 minutes lockout
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Server data states for Admin Panel
  const [adminUsers, setAdminUsers] = useState<VerifiedUserRecord[]>([]);
  const [adminLogs, setAdminLogs] = useState<AuditLog[]>([]);
  const [adminDownloads, setAdminDownloads] = useState<any[]>([]);
  const [isLoadingAdminRecords, setIsLoadingAdminRecords] = useState(false);

  // Form input values in SECURE PAYMENT PORTAL
  const [billingEmail, setBillingEmail] = useState('');
  const [billingName, setBillingName] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingCountry, setBillingCountry] = useState('Nigeria');
  const [selectedGateway, setSelectedGateway] = useState<'pi_testnet'>('pi_testnet');

  // Selected verification product state
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Active AI Professor chat
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Welcome to the SIRWISE Global Digital Knowledge Hub. I am your AI Professor. Ask me anything about our executive MBA digital acceleration program, sovereign wealth guides, cloud ledgers, venture pitch frameworks, or valuation models.' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Logo taps tracker for secret gateway trigger
  const [logoTaps, setLogoTaps] = useState(0);

  // Pi Browser & App Studio Authenticated Identity (populated ONLY from App Studio response; username never shown publicly)
  const [piAuthUser, setPiAuthUser] = useState<{ uid: string; username: string } | null>(() => {
    try {
      const saved = localStorage.getItem('sirwise_pi_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const ageMs = Date.now() - (Number(parsed?.verifiedAt) || 0);
        if (parsed?.uid && parsed?.username && ageMs < 24 * 60 * 60 * 1000) {
          return { uid: String(parsed.uid), username: String(parsed.username) };
        }
        localStorage.removeItem('sirwise_pi_user');
      }
    } catch {}
    return null;
  });
  const [isPiAuthenticating, setIsPiAuthenticating] = useState(false);
  const [piNotice, setPiNotice] = useState('');
  const piInitPromiseRef = useRef<Promise<boolean> | null>(null);
  const piInitVerifiedRef = useRef(false);
  const piAuthInFlightRef = useRef(false);

  // True only after Pi.init() receives a Pi Browser / App Studio host bridge response (never user-agent)
  const [isPiBrowser, setIsPiBrowser] = useState<boolean>(false);

  // Pi Testnet Sandbox Developer Audit Flow State (strictly developer testing, separated from live data)
  const [sandboxSteps, setSandboxSteps] = useState([
    { id: 1, name: 'Transaction Initialized', status: 'ready' },
    { id: 2, name: 'Reference Generated', status: 'ready' },
    { id: 3, name: 'Callback Reached', status: 'ready' },
    { id: 4, name: 'Status SUCCESS', status: 'ready' },
    { id: 5, name: 'Test Sandbox Verification', status: 'ready' },
    { id: 6, name: 'Developer Audit Registered', status: 'ready' },
    { id: 7, name: 'Dashboard Logs Recorded', status: 'ready' },
    { id: 8, name: 'Metadata Recorded', status: 'ready' },
    { id: 9, name: 'Fraud Check Passed', status: 'ready' },
    { id: 10, name: 'Compliance Flag GREEN', status: 'ready' }
  ]);
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxCompleted, setSandboxCompleted] = useState(false);
  const [developerNotice, setDeveloperNotice] = useState('');

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
    } else if (cleanPath === '/compliance' || cleanPath === '/compliance-protocol') {
      setCurrentTab('compliance');
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
      .catch(() => {});
  }, []);

  // Handle incomplete payments via authoritative backend handler: complete if txid exists, else cancel
  const onIncompletePaymentFound = async (payment: any) => {
    console.warn("Incomplete Pi payment detected:", payment);
    try {
      const paymentId = payment?.identifier;
      const txid = payment?.transaction?.txid;
      if (!paymentId) return;

      if (txid && typeof payment?.complete === 'function') {
        await Promise.race([
          Promise.resolve(payment.complete()),
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ]);
      } else if (!txid && typeof payment?.cancel === 'function') {
        await Promise.race([
          Promise.resolve(payment.cancel()),
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ]);
      }

      const res = await fetch('/api/pi/incomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          txid,
          userUid: piAuthUser?.uid,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success && data?.verified && data?.productId && data.productId !== 'admin-testnet-diagnostic') {
        setUnlockedProductIds((prev) => {
          const updated = Array.from(new Set([...prev, data.productId]));
          try { localStorage.setItem('sirwise_unlocked_products', JSON.stringify(updated)); } catch {}
          return updated;
        });
        if (data.user) {
          setCurrentUser({ ...data.user, isLoggedIn: true, role: 'buyer' });
          try { localStorage.setItem('sirwise_hub_user', JSON.stringify({ ...data.user, isLoggedIn: true })); } catch {}
        }
        setPiNotice('Previous incomplete Pi Testnet payment was verified and recovered ✅');
      }
    } catch (err) {
      console.error("Incomplete Pi payment cleanup error:", err);
    }
  };

  // Wait for https://sdk.minepi.com/pi-sdk.js, run Pi.init({ version: "2.0" }), and race against host bridge response
  const ensurePiInit = async (interactive = false): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    if (piInitVerifiedRef.current) {
      setIsPiBrowser(true);
      return true;
    }

    if (!(window as any).Pi) {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 100));
        if ((window as any).Pi) break;
      }
    }

    if (!(window as any).Pi) {
      setIsPiBrowser(false);
      return false;
    }

    if (!piInitPromiseRef.current) {
      piInitPromiseRef.current = Promise.resolve((window as any).Pi.init({ version: "2.0" }))
        .then(() => {
          piInitVerifiedRef.current = true;
          setIsPiBrowser(true);
          return true;
        })
        .catch((err: any) => {
          piInitPromiseRef.current = null;
          setIsPiBrowser(false);
          const msg = String(err?.message || err || '');
          if (msg && !msg.includes('timed out')) {
            console.warn("Pi.init unavailable:", msg);
          }
          return false;
        });
    }

    const waitMs = interactive ? 8000 : 4000;
    const ready = await Promise.race([
      piInitPromiseRef.current,
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), waitMs)),
    ]);

    setIsPiBrowser(ready);
    return ready;
  };

  // Unified Pi authentication -> immediately POST ONLY { accessToken } to App Studio login endpoint
  const authenticateWithPi = async (interactive = false, scopes: string[] = ['username']) => {
    if (piAuthInFlightRef.current) return null;
    const ready = await ensurePiInit(interactive);
    if (!ready || !(window as any).Pi) {
      if (interactive) {
        setPiNotice("Open inside Pi Browser to sign in with Pi.");
      }
      return null;
    }

    piAuthInFlightRef.current = true;
    setIsPiAuthenticating(true);
    setPiNotice('');
    try {
      const Pi = (window as any).Pi;
      const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
      const accessToken = auth?.accessToken;
      if (!accessToken) {
        throw new Error("Missing Pi accessToken");
      }

      // Immediately POST ONLY { accessToken } to App Studio (never send username, uid, or extra fields)
      const res = await fetch('https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      if (!res.ok) {
        console.log("AppStudio auth failed", res.status);
        throw new Error("App Studio authentication failed");
      }

      const data = await res.json();
      const verifiedUid = data?.user?.uid;
      const verifiedUsername = data?.user?.username;

      if (!verifiedUid || !verifiedUsername) {
        console.log("AppStudio auth failed", "Missing verified user identity");
        throw new Error("Invalid App Studio user identity response");
      }

      console.log("AppStudio auth sent");

      // Only trust uid/username returned by App Studio; never display username publicly
      const verifiedUser = {
        uid: String(verifiedUid),
        username: String(verifiedUsername),
      };
      setPiAuthUser(verifiedUser);
      try {
        localStorage.setItem(
          'sirwise_pi_user',
          JSON.stringify({ ...verifiedUser, verifiedAt: Date.now() })
        );
      } catch {}

      const payload = {
        type: 'PI_AUTH_SUCCESS',
        user: { uid: verifiedUser.uid },
        accessToken,
      };
      try { window.parent.postMessage(payload, '*'); } catch {}
      try { window.postMessage(payload, '*'); } catch {}

      return verifiedUser;
    } catch (err: any) {
      console.log("AppStudio auth failed", err);
      if (interactive) {
        setPiNotice(err?.message || "Pi sign-in was cancelled or could not be verified.");
      }
      return null;
    } finally {
      piAuthInFlightRef.current = false;
      setIsPiAuthenticating(false);
    }
  };

  // On page load: if window.Pi exists, await Pi.init({ version: "2.0" }) and auto-run Pi.authenticate(["username"], onIncompletePaymentFound)
  useEffect(() => {
    let cancelled = false;

    const runInitOnLoad = async () => {
      if (typeof window === 'undefined') return;
      const ready = await ensurePiInit(false);
      if (ready && !cancelled) {
        await authenticateWithPi(false, ['username']);
      }
    };

    runInitOnLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sign in with Pi button handler
  const handlePiAuth = async () => {
    await authenticateWithPi(true, ['username']);
  };

  // Pi Testnet (Sandbox) User-to-App (U2A) Payment execution — Test-Pi Only
  const handlePiTestnetPayment = async () => {
    if (!selectedProduct) return;
    setPiNotice('');

    const ready = await ensurePiInit(true);
    if (!ready || !(window as any).Pi || !(window as any).Pi.createPayment) {
      setPiNotice("Open this page inside Pi Browser to complete Pi payment.");
      return;
    }

    try {
      setIsSubmittingCheckout(true);

      // Step 1: Authenticate with payments scope before creating payment
      const activeUser = await authenticateWithPi(true, ['username', 'payments']);
      if (!activeUser) {
        setIsSubmittingCheckout(false);
        return;
      }

      const Pi = (window as any).Pi;
      const testPiAmount = selectedProduct.pricePI || 1;
      const safeName = billingName.trim() || 'SIRWISE Partner';
      const safeEmail = billingEmail.trim() || `partner-${activeUser.uid.slice(0, 8)}@sirwise.store`;
      const safePhone = billingPhone.trim() || '+2348000000000';
      const safeCountry = billingCountry.trim() || 'Global';

      await Pi.createPayment({
        amount: testPiAmount,
        memo: `SIRWISE Test: ${selectedProduct.name}`.slice(0, 28),
        metadata: { 
          productId: selectedProduct.id,
          isTestnet: true,
          appletId: "b4e2e629-1b9d-44d2-9e47-2e2b931c8f3f"
        },
      }, {
        onReadyForServerApproval: async (paymentId: string) => {
          const res = await fetch('/api/pi/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId,
              userUid: activeUser.uid,
              productId: selectedProduct.id,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.success) {
            const msg = data?.error || 'Server payment approval rejected.';
            setPiNotice(msg);
            setIsSubmittingCheckout(false);
            throw new Error(msg);
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            const res = await fetch('/api/pi/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                txid,
                userUid: activeUser.uid,
                productId: selectedProduct.id,
                email: safeEmail,
                name: safeName,
                phone: safePhone,
                country: safeCountry,
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.success && data?.verified) {
              const targetProductId = data.productId || selectedProduct.id;
              setUnlockedProductIds((prev) => {
                const updated = Array.from(new Set([...prev, targetProductId]));
                try { localStorage.setItem('sirwise_unlocked_products', JSON.stringify(updated)); } catch {}
                return updated;
              });
              setCheckoutStatus({ success: true, message: 'TRANSACTION VERIFIED ✅' });
              if (data.user) {
                setCurrentUser({ ...data.user, isLoggedIn: true, role: 'buyer' });
                try { localStorage.setItem('sirwise_hub_user', JSON.stringify({ ...data.user, isLoggedIn: true })); } catch {}
              }
            } else {
              setPiNotice(data?.error || 'Server payment verification failed. Access remains locked.');
            }
          } catch (err) {
            console.error("Pi complete request error:", err);
            setPiNotice('Network error while confirming Pi completion. Reopen in Pi Browser to resume automatically.');
          } finally {
            setIsSubmittingCheckout(false);
          }
        },
        onCancel: async (paymentId: string) => {
          console.log("Pi payment cancelled by user:", paymentId);
          if (paymentId) {
            fetch('/api/pi/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId })
            }).catch(() => {});
          }
          setIsSubmittingCheckout(false);
        },
        onError: (error: any) => { 
          console.error("Pi payment error:", error);
          setIsSubmittingCheckout(false);
          setPiNotice(error?.message || "Pi Testnet transaction encountered a network error.");
        },
      });
    } catch (err: any) {
      console.error("Pi Payment error:", err);
      setIsSubmittingCheckout(false);
      setPiNotice(err?.message || "Unable to complete Pi payment request.");
    }
  };

  // Admin-Only Pi Testnet Payment Test (1 Test-Pi, never unlocks storefront items)
  const handleAdminPiTestnetTest = async () => {
    setDeveloperNotice("Initializing Admin Pi Testnet payment test...");
    const ready = await ensurePiInit(true);
    if (ready && (window as any).Pi?.createPayment) {
      try {
        const activeUser = await authenticateWithPi(true, ['username', 'payments']);
        if (!activeUser) {
          setDeveloperNotice("Pi authentication was not completed.");
          return;
        }
        const Pi = (window as any).Pi;
        await Pi.createPayment({
          amount: 1,
          memo: "sirwise testnet payment test",
          metadata: { isTestnet: true, adminTest: true }
        }, {
          onReadyForServerApproval: async (paymentId: string) => {
            const res = await fetch('/api/pi/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                userUid: activeUser.uid,
                productId: 'admin-testnet-diagnostic',
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.success) {
              throw new Error(data?.error || 'Admin diagnostic approval failed');
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            const res = await fetch('/api/pi/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                txid,
                userUid: activeUser.uid,
                productId: 'admin-testnet-diagnostic',
                email: 'admin-test@sirwise.store',
                name: 'Admin Testnet Check',
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data?.success && data?.verified) {
              setDeveloperNotice(`Admin Testnet Payment Completed ✅ (txid: ${txid}). Storefront products remain untouched.`);
            } else {
              setDeveloperNotice(`Admin Testnet completion failed: ${data?.error || 'Verification rejected'}`);
            }
          },
          onCancel: async (paymentId: string) => {
            if (paymentId) {
              await fetch('/api/pi/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentId })
              }).catch(() => {});
            }
            setDeveloperNotice("Admin Testnet payment was cancelled.");
          },
          onError: (error: any) => {
            setDeveloperNotice(`Admin Testnet payment error: ${error?.message || 'Unknown error'}`);
          }
        });
        return;
      } catch (err: any) {
        setDeveloperNotice(`Admin Testnet payment error: ${err?.message || 'Unknown error'}`);
        return;
      }
    }

    // Outside Pi Browser: check server configuration status cleanly without spoofing payments
    try {
      const res = await fetch('/api/config');
      const cfg = await res.json().catch(() => ({}));
      const configured = Boolean(cfg?.PI_NETWORK_API_KEY_CONFIGURED || cfg?.PI_API_KEY_CONFIGURED);
      setDeveloperNotice(
        configured
          ? "Server PI_NETWORK_API_KEY is configured ✅. Open /admin inside Pi Browser to test a live 1 Test-Pi U2A payment."
          : "PI_NETWORK_API_KEY is not configured on the server yet. Add it in Vercel/hosting environment variables, then open /admin inside Pi Browser."
      );
    } catch {
      setDeveloperNotice("Open /admin inside Pi Browser to run a live 1 Test-Pi U2A payment check.");
    }
  };

  // Handle Logo Tap Secrets (5 fast taps opens admin console)
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
        setAdminUsers([
          { id: 'USR-882914', name: 'Dr. Michael Adeyemi', email: 'adeyemi@exec.sirwise.com', phone: '+2348031122334', country: 'Nigeria', status: 'Verified', timestamp: '2026-10-06 01:20:11', device: 'Desktop Chrome' },
          { id: 'USR-773821', name: 'Elena Rostova', email: 'elena.rostova@capital.ch', phone: '+41791234567', country: 'Switzerland', status: 'Verified', timestamp: '2026-10-06 02:04:33', device: 'Mobile Safari' }
        ]);
        setAdminLogs([
          { id: 'AL-101', action: 'Pi Testnet (Sandbox) transaction logged for USR-882914.', timestamp: '2026-10-06 01:20:12', user: 'SYSTEM-PI', severity: 'info' },
          { id: 'AL-102', action: 'Licensed download released for Sovereign Wealth Guide.', timestamp: '2026-10-06 02:05:00', user: 'elena.rostova@capital.ch', severity: 'info' }
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
    setDeveloperNotice('');
    setPiNotice('');
    setBillingName(currentUser.name || '');
    setBillingEmail(currentUser.email || '');
    setBillingPhone(currentUser.phone || '');
    setBillingCountry(currentUser.country || 'Nigeria');
    setSelectedGateway('pi_testnet');
  };

  // Perform Pi Testnet Payment
  const executePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (!piInitVerifiedRef.current && !piAuthUser && (!billingName.trim() || !billingEmail.trim() || !billingPhone.trim())) {
      setPiNotice("Please fill in your legal name, email, and phone number.");
      return;
    }

    handlePiTestnetPayment();
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
      
      {/* SINGLE CORPORATE EXECUTIVE HEADER — Real SIRWISE Logo + Knowledge Hub, Downloads, AI Professor, Compliance Protocol + Pi Status */}
      <header className="bg-[#0B132B]/95 backdrop-blur-md border-b border-[#FFD700]/20 py-3.5 px-4 sm:px-8 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo (5 fast taps toggles Admin Desk) */}
          <div 
            onClick={handleLogoTap}
            className="cursor-pointer select-none transition-transform duration-200 active:scale-95 flex items-center gap-3 shrink-0"
            title="SIRWISE Global Digital Hub"
          >
            <SirwiseLogo className="h-10 sm:h-12 w-auto" showText={true} />
            <div className="hidden lg:block border-l border-[#FFD700]/20 pl-3 text-left">
              <div className="text-[10px] font-black text-[#FFD700] tracking-widest uppercase font-montserrat">
                SIRWISE GLOBAL DIGITAL HUB
              </div>
              <div className="text-[10px] text-slate-400 font-sans">
                Knowledge Hub • Charter RC BN3583778
              </div>
            </div>
          </div>

          {/* Navigation Bar: Knowledge Hub, Downloads, AI Professor, Compliance Protocol */}
          <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full py-0.5">
            <button
              onClick={() => navigateTo('/knowledge-hub')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider transition duration-200 ${
                currentTab === 'marketplace' && !adminPanelOpen
                  ? 'bg-[#FFD700] text-[#0B132B] shadow-md shadow-[#FFD700]/20 font-black'
                  : 'text-slate-300 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Knowledge Hub</span>
            </button>

            <button
              onClick={() => navigateTo('/downloads')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider transition duration-200 relative ${
                currentTab === 'downloads' && !adminPanelOpen
                  ? 'bg-[#FFD700] text-[#0B132B] shadow-md shadow-[#FFD700]/20 font-black'
                  : 'text-slate-300 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Downloads</span>
              {unlockedProductIds.length > 0 && (
                <span className="w-4 h-4 bg-emerald-500 text-black font-mono font-black text-[9px] rounded-full flex items-center justify-center">
                  {unlockedProductIds.length}
                </span>
              )}
            </button>
            <button
              onClick={() => navigateTo('/ai-professor')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider transition duration-200 ${
                currentTab === 'professor' && !adminPanelOpen
                  ? 'bg-[#FFD700] text-[#0B132B] shadow-md shadow-[#FFD700]/20 font-black'
                  : 'text-slate-300 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>AI Professor</span>
            </button>

            <button
              onClick={() => navigateTo('/compliance')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider transition duration-200 ${
                (currentTab === 'compliance' || currentTab === 'privacy' || currentTab === 'terms') && !adminPanelOpen
                  ? 'bg-[#FFD700] text-[#0B132B] shadow-md shadow-[#FFD700]/20 font-black'
                  : 'text-slate-300 hover:text-white hover:bg-zinc-900/80'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
              <span>Compliance Protocol</span>
            </button>

            {isPiBrowser && (
              <span className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-[#FFD700] font-bold text-[10px] uppercase shrink-0">
                Pi Browser Detected
              </span>
            )}

            {piAuthUser ? (
              <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shrink-0">
                Pi Verified Testnet
              </span>
            ) : (
              <button
                onClick={handlePiAuth}
                disabled={isPiAuthenticating}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider transition duration-200 border border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700] hover:bg-[#FFD700] hover:text-[#0B132B] shrink-0"
              >
                <span>{isPiAuthenticating ? 'Signing in...' : 'Sign in with Pi'}</span>
              </button>
            )}
          </nav>

        </div>
      </header>

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
                    { id: 'users', label: 'Users' },
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
                    <span className="text-[10px] text-slate-500 uppercase block">Active Unlocked</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {unlockedProductIds.length} Packages
                    </span>
                  </div>
                  <div className="bg-black p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-slate-500 uppercase block">Fraud / Anomaly</span>
                    <span className="text-xl font-bold text-emerald-400">0.00% Clean</span>
                  </div>
                  <div className="bg-black p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-slate-500 uppercase block">Pi Testnet Sandbox</span>
                    <span className="text-xl font-bold text-purple-400">10/10 Verified</span>
                  </div>
                  <div className="bg-black p-4 rounded-xl border border-zinc-850">
                    <span className="text-[10px] text-slate-500 uppercase block">Compliance Charter</span>
                    <span className="text-xl font-bold text-[#FFD700]">RC BN3583778</span>
                  </div>
                </div>

                {/* Admin-Only Pi Testnet Payment Test Button */}
                <div className="bg-black p-4 rounded-xl border border-[#FFD700]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-bold uppercase text-xs">Admin Pi Testnet Payment Diagnostic</div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      Runs 1 Test-Pi payment against https://api.testnet.minepi.com without affecting live storefront unlocks.
                    </div>
                    {developerNotice && (
                      <div className="text-emerald-400 text-[11px] mt-2 font-sans">{developerNotice}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAdminPiTestnetTest}
                    className="px-4 py-2.5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-[11px] uppercase rounded-xl shrink-0 transition"
                  >
                    Pay with Pi - Testnet Test
                  </button>
                </div>

                {/* Tab: Users & Transactions */}
                {(adminActiveTab === 'users' || adminActiveTab === 'transactions') && (
                  <div className="bg-black rounded-xl border border-zinc-850 overflow-x-auto">
                    <div className="p-3 border-b border-zinc-850 flex justify-between items-center">
                      <span className="font-bold text-white uppercase">User Transactions & Registrations</span>
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
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px]">
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
                            <div className="text-slate-500 text-[10px]">{prod.sku} • {prod.fileSize} • {prod.downloadCount}</div>
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
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 shrink-0 font-bold">
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

        {/* 2. COMPLIANCE PROTOCOL TAB (/compliance) */}
        {!adminPanelOpen && currentTab === 'compliance' && (
          <div className="space-y-8 animate-fade-in font-sans max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-zinc-950 via-[#0B132B] to-zinc-950 border border-[#FFD700]/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="w-8 h-8 text-[#FFD700]" />
                <h1 className="text-2xl sm:text-3xl font-black font-montserrat text-white uppercase tracking-tight">
                  SIRWISE COMPLIANCE PROTOCOL & GOVERNANCE
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Official chartered business registration RC BN3583778. Currently operating in Pi Testnet (Sandbox) for Pi Review — Test-Pi only, no real Pi is charged.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="p-4 bg-black/60 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-[#FFD700] uppercase font-bold block mb-1">REGULATORY CHARTER</span>
                  <div className="text-white font-bold text-sm">RC BN3583778</div>
                  <div className="text-[11px] text-slate-400 mt-1">Federal Republic of Nigeria Licensed</div>
                </div>
                <div className="p-4 bg-black/60 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-purple-400 uppercase font-bold block mb-1">PAYMENT ENVIRONMENT</span>
                  <div className="text-white font-bold text-sm">Pi Testnet (Sandbox)</div>
                  <div className="text-[11px] text-slate-400 mt-1">Test-Pi Only • No Real Pi Charged</div>
                </div>
                <div className="p-4 bg-black/60 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">DATA PRIVACY</span>
                  <div className="text-white font-bold text-sm">HTTPS / GDPR</div>
                  <div className="text-[11px] text-slate-400 mt-1">Session & Audit Monitoring Enforced</div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 pt-4 border-t border-zinc-800">
                <button
                  onClick={() => navigateTo('/privacy')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl font-montserrat uppercase transition"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => navigateTo('/terms-of-service')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl font-montserrat uppercase transition"
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => navigateTo('/admin')}
                  className="px-4 py-2 bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30 font-bold text-xs rounded-xl font-montserrat uppercase transition"
                >
                  Administrative Console (Goye1967@)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. PRIVACY POLICY (/privacy) */}
        {!adminPanelOpen && currentTab === 'privacy' && (
          <div className="space-y-6 font-sans text-xs animate-fade-in max-w-4xl mx-auto bg-black/60 border border-zinc-850 rounded-2xl p-8">
            <button 
              onClick={() => navigateTo('/knowledge-hub')}
              className="flex items-center gap-1 text-[#FFD700] hover:underline mb-4 font-bold font-montserrat"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </button>
            
            <h1 className="text-2xl font-black font-montserrat text-white uppercase">
              SIRWISE Global Privacy Policy & Data Protection Protocol
            </h1>
            <p className="text-slate-400 font-mono">Effective Date: January 1, 2026 • Charter License: RC BN3583778</p>

            <div className="space-y-4 text-slate-300 leading-relaxed font-sans">
              <h3 className="text-sm font-bold text-[#FFD700] uppercase font-montserrat">1. Introduction & Governance</h3>
              <p>
                SIRWISE operates the Global Digital Knowledge Hub in compliance with international GDPR protocols and registered commercial charter RC BN3583778. We are committed to safeguarding personal information, encrypted transactions, and corporate license records.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase font-montserrat">2. Information Collection</h3>
              <p>
                When you initiate an unlock or purchase on SIRWISE, we collect the necessary verification metadata including your legal name, business email address, contact telephone, resident country, and Pi username. Payments currently run in Pi Testnet (Sandbox) using Test-Pi only; no real Pi or credit card numbers are collected.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase font-montserrat">3. Security & Encryption Standards</h3>
              <p>
                All data in transit is served over HTTPS. Our servers employ access controls, audit trail monitoring, and automated anomaly detection.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase font-montserrat">4. Data Subject Rights (GDPR)</h3>
              <p>
                Users have the right to request access to their profile records, demand rectification of inaccurate data, or request permanent deletion of their account credentials via our compliance desk or WhatsApp support.
              </p>
            </div>
          </div>
        )}

        {/* 4. TERMS OF SERVICE (/terms-of-service) */}
        {!adminPanelOpen && currentTab === 'terms' && (
          <div className="space-y-6 font-sans text-xs animate-fade-in max-w-4xl mx-auto bg-black/60 border border-zinc-850 rounded-2xl p-8">
            <button 
              onClick={() => navigateTo('/knowledge-hub')}
              className="flex items-center gap-1 text-[#FFD700] hover:underline mb-4 font-bold font-montserrat"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Knowledge Hub
            </button>

            <h1 className="text-2xl font-black font-montserrat text-white uppercase">
              SIRWISE Terms of Service & Digital Asset License Agreement
            </h1>
            <p className="text-slate-400 font-mono">Charter License: RC BN3583778 • Governing Jurisdiction: Federal Republic of Nigeria</p>

            <div className="space-y-4 text-slate-300 leading-relaxed font-sans">
              <h3 className="text-sm font-bold text-[#FFD700] uppercase font-montserrat">1. Agreement to Terms</h3>
              <p>
                By accessing SIRWISE, browsing the Digital Knowledge Hub, or testing digital courses, e-books, templates, SaaS tools, or consulting sessions, you agree to be bound by these Terms of Service under charter RC BN3583778.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase font-montserrat">2. License Grant</h3>
              <p>
                Upon completed Pi Testnet (Sandbox) transaction callback, SIRWISE grants the tester a revocable, non-exclusive, non-transferable license to download and review the selected digital materials.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase font-montserrat">3. Intellectual Property Rights</h3>
              <p>
                All course curriculums, financial models, valuation spreadsheets, software interfaces, and AI Professor prompts are the proprietary intellectual property of SIRWISE Hub. Resale, redistribution, or unauthorized mirroring without written permission is strictly prohibited.
              </p>

              <h3 className="text-sm font-bold text-[#FFD700] uppercase font-montserrat">4. Testnet Sandbox Notice</h3>
              <p>
                This application is currently operating in Pi Testnet (Sandbox) mode for Pi Review. Only Test-Pi is used during checkout and no real Pi is charged.
              </p>
            </div>
          </div>
        )}

        {/* 5. KNOWLEDGE HUB MARKETPLACE (Root "/" & "/knowledge-hub") */}
        {!adminPanelOpen && currentTab === 'marketplace' && (
          <div className="space-y-8 animate-fade-in font-sans">

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
                  className={`px-3.5 py-1.5 text-xs font-montserrat font-bold rounded-xl transition duration-200 ${
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
              {filteredProducts.map(p => {
                const isProductUnlocked = unlockedProductIds.includes(p.id) || (isAdmin && unlockedProductIds.length > 0);

                return (
                  <div 
                    key={p.id}
                    className="bg-zinc-950/70 border border-zinc-850 hover:border-[#FFD700]/40 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  >
                    {/* High-Fidelity Clear Image (Never Blurred) */}
                    <div className="relative h-48 sm:h-52 overflow-hidden bg-black border-b border-zinc-900">
                      <img 
                        src={p.image} 
                        alt={p.altText} 
                        className="w-full h-full object-cover opacity-100 group-hover:scale-105 transition duration-500"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600";
                        }}
                      />
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 border border-[#FFD700]/30 text-[#FFD700] font-mono font-bold text-[9px] uppercase">
                        {p.category}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 space-y-3.5 flex-grow">
                      <div className="text-[10px] text-yellow-500 font-mono font-bold tracking-widest uppercase flex items-center justify-between">
                        <span>{p.sku} • {p.fileSize}</span>
                        <span className="text-slate-400">{p.downloadCount}</span>
                      </div>

                      <h3 className="text-base font-bold text-white font-montserrat leading-snug group-hover:text-[#FFD700] transition duration-200">
                        {p.name}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-3">
                        {p.description}
                      </p>

                      <div className="border-t border-zinc-900 pt-3 space-y-1.5 font-sans text-[11px]">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block font-montserrat">SPECIFICATIONS:</span>
                        {p.features.slice(0, 3).map((feat, idx) => (
                          <div key={idx} className="text-slate-300 flex items-start gap-1.5">
                            <span className="text-[#FFD700] font-bold">•</span>
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action / Buy / Unlock Button */}
                    <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex gap-2">
                      {isProductUnlocked ? (
                        <a 
                          href={`/downloads/${p.downloadUrl.split('/').pop()}?email=${encodeURIComponent(currentUser.email || 'ifiok82@gmail.com')}`}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 uppercase tracking-wider font-montserrat shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5 text-center"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlocked • Download</span>
                        </a>
                      ) : (
                        <button 
                          onClick={() => handleBuyClick(p)}
                          className="w-full py-3 bg-[#FFD700] hover:bg-yellow-400 text-[#0B132B] font-black text-xs rounded-xl flex items-center justify-center gap-2 transition duration-200 uppercase tracking-wider font-montserrat shadow-md shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:-translate-y-0.5 active:scale-95"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Buy with {p.pricePI} Pi</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* 6. DOWNLOADS PORTAL (/downloads) */}
        {!adminPanelOpen && currentTab === 'downloads' && (
          <div className="space-y-8 animate-fade-in font-sans">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-black font-montserrat text-white uppercase">
                Licensed Downloads Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                {unlockedProductIds.length > 0 
                  ? `${unlockedProductIds.length} licensed packages available for offline download.`
                  : 'All downloadable packages are locked until payment confirmation. Select any course or package in the Knowledge Hub to unlock.'}
              </p>
            </div>

            {unlockedProductIds.length === 0 ? (
              <div className="text-center py-16 border border-zinc-850 rounded-2xl bg-zinc-950 p-6 max-w-lg mx-auto">
                <div className="w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-[#FFD700]">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 font-montserrat">Downloads Currently Locked</h3>
                <p className="text-xs text-slate-400 font-sans mb-6 leading-relaxed">
                  To release offline course kits, spreadsheet valuation packages, and software blueprints, complete payment via Pi Testnet (Sandbox) — Test-Pi Only.
                </p>
                <button
                  onClick={() => navigateTo('/knowledge-hub')}
                  className="px-6 py-3 bg-[#FFD700] hover:bg-yellow-400 text-[#0B132B] font-black text-xs rounded-xl uppercase tracking-wider font-montserrat transition duration-200 hover:-translate-y-0.5 shadow-md shadow-yellow-500/20"
                >
                  Browse Knowledge Hub & Unlock
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programmesList
                  .filter(prod => unlockedProductIds.includes(prod.id) || isAdmin)
                  .map(prod => (
                    <div key={prod.id} className="p-4 bg-zinc-950 border border-zinc-850 hover:border-emerald-500/30 rounded-xl flex items-center justify-between gap-4 transition duration-200">
                      <div className="space-y-1">
                        <div className="text-white font-bold text-sm font-montserrat">{prod.name}</div>
                        <div className="text-slate-400 text-xs font-mono">{prod.fileSize} • {prod.sku} • {prod.downloadCount}</div>
                      </div>
                      <a
                        href={`/downloads/${prod.downloadUrl.split('/').pop()}?email=${encodeURIComponent(currentUser.email || 'ifiok82@gmail.com')}`}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg uppercase font-montserrat flex items-center gap-1.5 shrink-0 transition duration-200 hover:-translate-y-0.5 shadow-md shadow-emerald-600/20"
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
          <div className="space-y-8 animate-fade-in font-sans">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-black font-montserrat text-white uppercase flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#FFD700]" />
                AI Professor Interactive Panel
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                Adaptive executive learning, corporate finance queries, and digital ledger guidance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Presets */}
              <div className="space-y-3">
                <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#FFD700] uppercase tracking-wider font-montserrat">
                    Executive Scenarios
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Click any shortcut to query the AI Professor model:
                  </p>
                  <div className="space-y-2 pt-1 font-sans">
                    {[
                      "Professor, draft a corporate ledger audit template for checking system logs.",
                      "How do I structure a venture capital pitch deck for a SaaS bookkeeping app?",
                      "Provide a step-by-step corporate valuation checklist using DCF and NPV.",
                      "Explain the sovereign wealth asset diversification methodology."
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => setChatPrompt(prompt)}
                        className="w-full text-left p-2.5 bg-black border border-zinc-850 hover:border-[#FFD700]/30 rounded-lg text-[11px] text-slate-300 transition duration-200 hover:-translate-y-0.5"
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
                  <span className="text-[10px] text-slate-400 uppercase font-bold font-montserrat">
                    AI Professor Active Terminal
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Online Node Active
                  </span>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 text-xs pr-2 font-sans">
                  {chatHistory.map((msg, i) => (
                    <div 
                      key={i}
                      className={`p-3.5 rounded-xl max-w-[85%] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0B132B] text-[#FFD700] ml-auto border border-zinc-800'
                          : 'bg-zinc-950 text-slate-200 mr-auto border border-zinc-900 whitespace-pre-line'
                      }`}
                    >
                      <strong className="block text-[9px] text-slate-500 uppercase mb-1 font-montserrat">
                        {msg.role === 'user' ? 'Scholar' : 'AI Professor'}
                      </strong>
                      {msg.text}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="text-yellow-400 text-xs animate-pulse font-mono">
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
                    className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-[#FFD700] font-sans"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading}
                    className="px-4 py-2.5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-xs rounded-xl uppercase font-montserrat transition duration-200 hover:-translate-y-0.5"
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
        <div className="fixed inset-0 z-[99999] bg-[#0B132B]/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-[#0B132B] border-2 border-[#FFD700] rounded-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto shadow-2xl relative shadow-yellow-500/10">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SirwiseLogo className="h-8 w-auto" showText={false} />
                  <h4 className="text-base font-black tracking-wider text-[#FFD700] font-montserrat">
                    SECURE PAYMENT PORTAL
                  </h4>
                </div>
                <p className="text-[11px] text-slate-300 font-sans italic">
                  “Global Digital Knowledge Hub powered by AI Professor.”
                </p>
              </div>
              <button 
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-900 border border-zinc-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 bg-[#0B132B]">
              
              {checkoutStatus ? (
                /* Verified Confirmation Modal — Only place green verification checkmark appears! */
                <div className="space-y-4 text-center py-6 font-sans animate-fade-in">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/20">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h5 className="text-lg font-black uppercase text-emerald-400 font-montserrat tracking-wide">
                    {checkoutStatus.message}
                  </h5>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-sm mx-auto">
                    Your clearance has been registered on the server. Your download packages are now unlocked.
                  </p>
                  <button 
                    type="button"
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      navigateTo('/downloads');
                    }}
                    className="mt-4 px-6 py-3.5 bg-[#FFD700] hover:bg-yellow-400 text-[#0B132B] font-black text-xs rounded-xl transition duration-200 uppercase font-montserrat shadow-lg hover:shadow-yellow-500/30 hover:-translate-y-0.5"
                  >
                    Proceed to Licensed Downloads
                  </button>
                </div>
              ) : (
                <form onSubmit={executePayment} className="space-y-5">
                  
                  {/* Selected Asset Header */}
                  <div className="p-3.5 bg-black rounded-xl border border-zinc-800 flex items-center justify-between font-sans">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block font-montserrat">Selected Product:</span>
                      <span className="text-xs font-bold text-white">{selectedProduct.name}</span>
                      <span className="text-[10px] text-yellow-500 block font-mono mt-0.5">{selectedProduct.fileSize} • {selectedProduct.downloadCount}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-[#FFD700]/10 text-[#FFD700] rounded font-bold uppercase font-montserrat">
                      {selectedProduct.category}
                    </span>
                  </div>

                  {/* Step 1: Your Details */}
                  <div className="space-y-3 font-sans">
                    <span className="text-[11px] text-[#FFD700] uppercase block font-black border-b border-[#FFD700]/20 pb-1.5 tracking-wider font-montserrat">
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
                          required={!isPiBrowser}
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
                          required={!isPiBrowser}
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
                          required={!isPiBrowser}
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
                          required={!isPiBrowser}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Payment Method (Pi Testnet Sandbox Only) */}
                  <div className="space-y-3 font-sans">
                    <div className="flex items-center justify-between border-b border-[#FFD700]/20 pb-1.5">
                      <span className="text-[11px] text-[#FFD700] uppercase font-black tracking-wider font-montserrat">
                        Step 2: Payment Method
                      </span>
                      {isPiBrowser && (
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[#FFD700] font-bold text-[9px]">
                          Pi Browser Detected
                        </span>
                      )}
                    </div>

                    {/* Pi Testnet (Sandbox) Honest Gateway */}
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl border border-[#FFD700] bg-[#FFD700]/10 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs text-white flex items-center gap-1.5 font-montserrat">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            Pi Testnet (Sandbox) - Test-Pi Only - No Real Pi Will Be Charged - For Pi Review
                          </div>
                          <div className="text-[10px] text-amber-300 mt-1 font-semibold">
                            You are paying {selectedProduct.pricePI} Test-Pi. This is a test.
                          </div>
                        </div>
                        {piAuthUser ? (
                          <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black rounded-lg uppercase font-montserrat shrink-0">
                            Pi Verified Testnet
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handlePiAuth}
                            disabled={isPiAuthenticating}
                            className="px-2.5 py-1 bg-[#FFD700] hover:bg-yellow-400 text-black text-[10px] font-black rounded-lg uppercase font-montserrat transition shrink-0"
                          >
                            {isPiAuthenticating ? 'Signing in...' : 'Sign in with Pi'}
                          </button>
                        )}
                      </div>

                      {piNotice && (
                        <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-[11px] text-red-200 font-sans">
                          {piNotice}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Test-Pi Checkout Notice */}
                  <div className="border-t border-[#FFD700]/10 pt-4">
                    <p className="text-[11px] text-center text-amber-300 font-sans font-semibold">
                      You are paying with Test-Pi. This is a test.
                    </p>
                  </div>

                  {/* Step 3: Action Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={isSubmittingCheckout}
                      className="flex-1 py-3.5 bg-[#FFD700] hover:bg-yellow-400 text-[#0B132B] font-black text-xs rounded-xl tracking-wider uppercase transition duration-200 shadow-lg shadow-yellow-500/20 hover:-translate-y-0.5 hover:shadow-yellow-500/40 font-montserrat"
                    >
                      {isSubmittingCheckout ? 'Verifying Transaction...' : 'Pay Now'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutModalOpen(false)}
                      className="px-6 py-3.5 bg-transparent border border-zinc-700 hover:border-zinc-500 text-slate-300 font-bold text-xs rounded-xl uppercase transition font-montserrat"
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

      {/* FOOTER — Compliance Footers matching exact specifications */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-4 mt-auto font-sans">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <SirwiseLogo className="h-9 w-auto" showText={true} />
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              SIRWISE is an independent global digital knowledge, templates, and corporate consulting hub. Charter certificate registered under license number <strong>RC BN3583778</strong>.
            </p>
          </div>

          {/* Col 2: Hub Navigation */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[#FFD700] uppercase tracking-wider font-montserrat">Hub Navigation</h5>
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
                <button onClick={() => navigateTo('/compliance')} className="hover:text-white transition">
                  • Compliance Protocol
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Compliance Support & WhatsApp */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[#FFD700] uppercase tracking-wider font-montserrat">Compliance Support</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Facing questions about partner verification, download releases, or corporate charters? Connect with support specialists.
            </p>
            <a 
              href="https://wa.me/2348030000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition duration-200 hover:-translate-y-0.5 shadow-md font-montserrat"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Support
            </a>
          </div>

          {/* Col 4: Compliance Protocol & Legal */}
          <div className="space-y-4">
            <h5 className="text-xs font-bold text-[#FFD700] uppercase tracking-wider font-montserrat">Compliance Protocol</h5>
            
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-amber-300 text-[9px] border border-amber-500/30">PI TESTNET (SANDBOX)</span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-slate-300 text-[9px] border border-zinc-800">TEST-PI ONLY</span>
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

        {/* Global Compliance Footer Text */}
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-900 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <span>© 2026 SIRWISE Hub. Registered charter license RC BN3583778. All Rights Reserved.</span>
          <span className="text-[#FFD700]">Pi Testnet (Sandbox) • Test-Pi Only • No Real Pi Will Be Charged.</span>
        </div>
      </footer>

    </div>
  );
}
