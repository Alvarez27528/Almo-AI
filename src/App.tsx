/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Dashboard from './components/Dashboard';
import AuthView from './components/AuthView';
import VIPUpgradeView from './components/VIPUpgradeView';

// Code-split every secondary view so the first paint only ships what's needed
const Onboarding = lazy(() => import('./components/Onboarding'));
const Transactions = lazy(() => import('./components/Transactions'));
const AIScanner = lazy(() => import('./components/AIScanner'));
const AIChat = lazy(() => import('./components/AIChat'));
const Plans = lazy(() => import('./components/Plans'));
const Simulator = lazy(() => import('./components/Simulator'));
const Investments = lazy(() => import('./components/Investments'));
const VintedMode = lazy(() => import('./components/VintedMode'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const Challenges = lazy(() => import('./components/Challenges'));
const Settings = lazy(() => import('./components/Settings'));
const RankManagement = lazy(() => import('./components/RankManagement'));
const BadgesView = lazy(() => import('./components/BadgesView'));

function ViewSkeleton() {
  return (
    <div className="space-y-6 animate-fade-up" aria-busy="true" aria-label="Cargando">
      <div className="skeleton h-8 w-56 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="skeleton h-32 rounded-3xl" />
        <div className="skeleton h-32 rounded-3xl" />
        <div className="skeleton h-32 rounded-3xl" />
      </div>
      <div className="skeleton h-72 rounded-3xl" />
    </div>
  );
}

import { PinLock } from './components/PinLock';

import { onAuthStateChanged, signOut, User, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isPermissionError = errorMessage.toLowerCase().includes('permission') || 
                            errorMessage.toLowerCase().includes('insufficient') ||
                            (error && typeof error === 'object' && 'code' in error && (error as any).code === 'permission-denied');

  if (isPermissionError && !auth.currentUser) {
    console.warn('Gracefully ignored permission error during sign-out or temporary authentication step:', errorMessage);
    return null;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL: Validate connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();


import { AppState, UserProfile, Transaction, InvestmentAsset, CalendarEvent, Challenge, FinancialPlan, ChatMessage, Budget } from './types';
import { calculateFinancialStats, formatCurrency } from './utils/finance';
import { getDailyChallengeIds, CHALLENGES_POOL } from './utils/challenges';

import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Scan, 
  MessageSquare, 
  Compass, 
  LineChart, 
  Sliders, 
  Briefcase, 
  ShoppingBag, 
  CalendarDays, 
  Trophy, 
  BarChart4, 
  Settings as SettingsIcon,
  Menu,
  X,
  Sparkles,
  Flame,
  Award,
  Landmark,
  ShieldCheck,
  Zap,
  Lock,
  BookOpen,
  Bell,
  Wifi,
  WifiOff,
  CloudLightning,
  CloudOff,
  RefreshCw
} from 'lucide-react';

function sanitizeForFirestore(val: any): any {
  if (val === undefined) return null;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map(sanitizeForFirestore);
  }
  if (typeof val === 'object') {
    const res: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        res[key] = sanitizeForFirestore(val[key]);
      }
    }
    return res;
  }
  return val;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [state, setState] = useState<AppState>({
    userProfile: null as any,
    transactions: [],
    goals: [],
    budgets: [],
    challenges: [],
    investments: [],
    vintedListings: [],
    calendarEvents: [],
    chatHistory: [],
    financialPlans: [],
    userXP: 0,
    userLevel: 1,
    badges: [],
    theme: 'dark',
    userRank: 'Normal',
    aiTokensUsed: 0
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing' | 'error'>('synced');
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPinLock, setShowPinLock] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const handleTabChange = (tab: string) => {
    const protectedTabs = state.userProfile?.protectedTabs || ['settings', 'investments'];
    const isSensitive = protectedTabs.includes(tab);
    if (isSensitive && state.userProfile?.securityPin) {
      setPendingTab(tab);
      setShowPinLock(true);
    } else {
      setActiveTab(tab);
    }
  };
  const mainRef = useRef<HTMLElement | null>(null);

  // Scroll to top with each view change (like native navigation)
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  // Auto re-lock protected areas after the app has been in the background for a while
  const hiddenAtRef = useRef<number | null>(null);
  useEffect(() => {
    const AUTO_LOCK_MS = 2 * 60 * 1000;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenFor = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
      hiddenAtRef.current = null;
      const protectedTabs = state.userProfile?.protectedTabs || ['settings', 'investments'];
      if (hiddenFor > AUTO_LOCK_MS && state.userProfile?.securityPin && protectedTabs.includes(activeTab)) {
        setPendingTab(activeTab);
        setActiveTab('dashboard');
        setShowPinLock(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [activeTab, state.userProfile?.securityPin, state.userProfile?.protectedTabs]);

  const [aiTip, setAiTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(true);

  // Safety timeout for initial auth load (prevent hanging forever in iframe)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        console.warn("Auth state took too long to respond. Forcing load completion.");
        setAuthLoading(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [authLoading]);

  // Monitor browser connection status to handle offline synchronization
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("Conexión a Internet detectada.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('pending');
      console.log("Conexión a Internet perdida.");
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const cacheKey = `fiducia_ai_state_${firebaseUser.uid}`;
        // 1. Instantly load from local cache if it exists for lightning-fast start
        const cachedDataStr = localStorage.getItem(cacheKey);
        if (cachedDataStr) {
          try {
            const cachedData = JSON.parse(cachedDataStr) as AppState;
            setState(cachedData);
            setInitialLoadDone(true);
            setAuthLoading(false); // Disable spinner instantly!
          } catch (e) {
            console.warn("Error parsing cached state:", e);
          }
        }

        let fetchSuccessful = false;
        // 2. Fetch fresh data from Firestore with a 3.5s timeout
          try {
            const docRef = doc(db, 'users', firebaseUser.uid);
            const docSnap = await Promise.race([
              getDoc(docRef),
              new Promise<any>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout de Firestore')), 3500)
              )
            ]).catch(error => handleFirestoreError(error, OperationType.GET, 'users/' + firebaseUser.uid));

            if (docSnap && docSnap.exists()) {
            const userData = docSnap.data() as AppState;
            const updatedState = {
              ...userData,
              userRank: userData.userRank || 'Normal',
              aiTokensUsed: userData.aiTokensUsed || 0
            };
            setState(updatedState);
            // Update local cache
            localStorage.setItem(cacheKey, JSON.stringify(updatedState));
          } else {
            // New user, reset state
            const defaultState: AppState = {
              userProfile: null as any,
              transactions: [],
              goals: [],
              budgets: [],
              challenges: [],
              investments: [],
              vintedListings: [],
              calendarEvents: [],
              chatHistory: [],
              financialPlans: [],
              userXP: 0,
              userLevel: 1,
              theme: 'dark',
              userRank: 'Normal',
              aiTokensUsed: 0
            };
            setState(defaultState);
            localStorage.setItem(cacheKey, JSON.stringify(defaultState));
          }
          fetchSuccessful = true;
        } catch (err) {
          console.error("Error fetching user data from Firestore (using cache fallback):", err);
          // If we had absolutely no cache, set a default state so they are not locked out
          if (!localStorage.getItem(cacheKey)) {
            setState({
              userProfile: null as any,
              transactions: [],
              goals: [],
              budgets: [],
              challenges: [],
              investments: [],
              vintedListings: [],
              calendarEvents: [],
              chatHistory: [],
              financialPlans: [],
              userXP: 0,
              userLevel: 1,
              theme: 'dark',
              userRank: 'Normal',
              aiTokensUsed: 0
            });
          }
        } finally {
          // If we had cached data or fetch was successful, initial load is completed
          setInitialLoadDone(true);
          setAuthLoading(false);
        }
      } else {
        // No user logged in
        setState({
          userProfile: null as any,
          transactions: [],
          goals: [],
          budgets: [],
          challenges: [],
          investments: [],
          vintedListings: [],
          calendarEvents: [],
          chatHistory: [],
          financialPlans: [],
          userXP: 0,
          userLevel: 1,
          theme: 'dark',
          userRank: 'Normal',
          aiTokensUsed: 0
        });
        setInitialLoadDone(false);
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync state to Firestore when state changes or when connection is restored
  useEffect(() => {
    if (!user || !initialLoadDone) return;
    if (!state.userProfile) return; // don't sync if onboarding not completed

    // Save to local cache instantly for zero latency
    localStorage.setItem(`fiducia_ai_state_${user.uid}`, JSON.stringify(state));

    if (!isOnline) {
      setSyncStatus('pending');
      return;
    }

    setSyncStatus('syncing');

    // Debounce the heavy network write to Firestore to prevent UI freeze and rate-limiting
    const timer = setTimeout(async () => {
      try {
        const docRef = doc(db, 'users', user.uid);
        await setDoc(docRef, sanitizeForFirestore(state)).catch(error => handleFirestoreError(error, OperationType.WRITE, 'users/' + user.uid));
        console.log("State successfully synchronized with Firestore (debounced).");
        setSyncStatus('synced');
        setShowSyncSuccess(true);
        const hideTimer = setTimeout(() => setShowSyncSuccess(false), 3000);
        return () => clearTimeout(hideTimer);
      } catch (err) {
        console.error("Error saving state to Firestore:", err);
        setSyncStatus('error');
      }
    }, 1200); // 1.2 seconds wait time before syncing

    return () => clearTimeout(timer);
  }, [state, user, initialLoadDone, isOnline]);

  // Fetch Daily AI Tip from Server Gemini Endpoint on Mount or when coming online
  useEffect(() => {
    if (!state.userProfile || !isOnline) return;
    const fetchTip = async () => {
      setLoadingTip(true);
      try {
        const stats = calculateFinancialStats(state);
        const response = await fetch('/api/gemini/tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: state.userProfile,
            stats
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.tip) setAiTip(data.tip);
        } else {
          setAiTip('');
        }
      } catch (e) {
        setAiTip('');
      } finally {
        setLoadingTip(false);
      }
    };

    fetchTip();
  }, [user?.uid, state.userProfile?.name, state.transactions.length, state.investments.length, isOnline]);

  // Sincronizar retos diarios activos asegurando que existan en el estado
  useEffect(() => {
    if (!initialLoadDone || !state.userProfile) return;
    
    const activeIds = getDailyChallengeIds();
    const missingChallenges: Challenge[] = [];
    
    activeIds.forEach(id => {
      const exists = state.challenges.some(ch => ch.id === id);
      if (!exists) {
        const poolCh = CHALLENGES_POOL.find(ch => ch.id === id);
        if (poolCh) {
          missingChallenges.push({
            ...poolCh,
            currentAmount: 0,
            isCompleted: false,
            progressionPercent: 0
          });
        }
      }
    });
    
    if (missingChallenges.length > 0) {
      setState(prev => ({
        ...prev,
        challenges: [...prev.challenges, ...missingChallenges]
      }));
    }
  }, [initialLoadDone, !!state.userProfile, state.challenges.length]);

  // Sync theme with system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setState(prev => ({
        ...prev,
        theme: e.matches ? 'dark' : 'light'
      }));
    };
    
    // Set initial
    setState(prev => ({
      ...prev,
      theme: mediaQuery.matches ? 'dark' : 'light'
    }));

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
    const seed: AppState = {
      userProfile: profile,
      transactions: [],
      goals: profile.primaryGoals.map((title, i) => ({
        id: `g-${i + 1}`,
        title,
        targetAmount: title === 'Comprar casa' ? 50000 : title === 'Comprar coche' ? 15000 : 3000,
        currentAmount: 0,
        deadline: '2027-12-31',
        category: title,
        suggestedAction: 'Ahorrar un porcentaje constante de tus ingresos fijos.'
      })),
      budgets: [
        { category: 'Vivienda', limitAmount: profile.expenseHousing || 500, spentAmount: 0 },
        { category: 'Alimentación', limitAmount: profile.expenseFood || 300, spentAmount: 0 },
        { category: 'Transporte', limitAmount: profile.expenseTransport || 100, spentAmount: 0 },
        { category: 'Suscripciones', limitAmount: profile.expenseSubscriptions || 50, spentAmount: 0 },
        { category: 'Ocio', limitAmount: profile.expenseLeisure || 200, spentAmount: 0 },
        { category: 'Educación', limitAmount: profile.expenseEducation || 50, spentAmount: 0 },
        { category: 'Salud', limitAmount: profile.expenseHealth || 50, spentAmount: 0 }
      ],
      challenges: CHALLENGES_POOL.map(ch => ({
        ...ch,
        currentAmount: 0,
        isCompleted: false,
        progressionPercent: 0
      })),
      investments: [],
      vintedListings: [],
      calendarEvents: [
        {
          id: 'ev-1',
          title: 'Gastos de Vivienda',
          amount: profile.expenseHousing,
          date: '2026-07-10',
          type: 'rent',
          isPaid: false
        }
      ],
      chatHistory: [
        {
          sender: 'assistant' as const,
          text: `¡Hola ${profile.name}! Soy ALMO AI, tu asesor financiero personal. He configurado tu cuenta de la forma más sencilla basándose en tus respuestas. Veo que tienes unos ingresos fijos de ${profile.incomeFixed} ${profile.currency} y quieres ahorrar para conseguir: ${profile.primaryGoals.join(', ')}. ¿En qué puedo ayudarte hoy?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      financialPlans: [],
      userXP: 100,
      userLevel: 1,
      theme: 'dark' as const,
      userRank: 'Normal',
      aiTokensUsed: 0
    };
    setState(seed);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleTabChange('dashboard');
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#F5F5F7] flex flex-col justify-center items-center font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <motion.div
              className="absolute -inset-6 rounded-full bg-[#00FF66]/10 blur-2xl"
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative w-16 h-16 rounded-[20px] bg-white text-black flex items-center justify-center shadow-[0_20px_50px_-15px_rgba(255,255,255,0.4)]">
              <Landmark size={28} strokeWidth={2.2} />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#8E8E93]"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  if (!state.userProfile) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
        <Onboarding onComplete={handleOnboardingComplete} />
      </Suspense>
    );
  }

  const profile = state.userProfile;
  const stats = calculateFinancialStats(state);

  // Core callback modifiers
  const triggerChallengeAction = (categoryType: 'Ahorro' | 'Inversión' | 'IA' | 'Planificación', amount: number = 1) => {
    setState(prev => {
      const activeIds = getDailyChallengeIds();
      const updatedChallenges = prev.challenges.map(ch => {
        if (activeIds.includes(ch.id) && ch.category === categoryType && !ch.isCompleted) {
          const nextAmount = Math.min(ch.targetAmount, ch.currentAmount + amount);
          const progress = Math.round((nextAmount / ch.targetAmount) * 100);
          return { ...ch, currentAmount: nextAmount, progressionPercent: progress };
        }
        return ch;
      });
      return {
        ...prev,
        challenges: updatedChallenges
      };
    });
  };

  const handleAddTransaction = (tx: Transaction) => {
    setState(prev => {
      const updatedTxns = [tx, ...prev.transactions];
      const xpGain = 0;
      const newXP = prev.userXP + xpGain;
      const newLevel = Math.floor(newXP / 1000) + 1;

      // Update active Ahorro challenge progress automatically
      const activeIds = getDailyChallengeIds();
      const updatedChallenges = prev.challenges.map(ch => {
        if (activeIds.includes(ch.id) && ch.category === 'Ahorro' && !ch.isCompleted) {
          const nextAmount = Math.min(ch.targetAmount, ch.currentAmount + 1);
          const progress = Math.round((nextAmount / ch.targetAmount) * 100);
          return { ...ch, currentAmount: nextAmount, progressionPercent: progress };
        }
        return ch;
      });

      return {
        ...prev,
        transactions: updatedTxns,
        challenges: updatedChallenges,
        userXP: newXP,
        userLevel: Math.max(prev.userLevel, newLevel)
      };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setState(prev => {
      const updatedTxns = prev.transactions.filter(t => t.id !== id);

      // Symmetrically decrement active Ahorro challenge progress if not completed
      const activeIds = getDailyChallengeIds();
      const updatedChallenges = prev.challenges.map(ch => {
        if (activeIds.includes(ch.id) && ch.category === 'Ahorro' && !ch.isCompleted) {
          const nextAmount = Math.max(0, ch.currentAmount - 1);
          const progress = Math.round((nextAmount / ch.targetAmount) * 100);
          return { ...ch, currentAmount: nextAmount, progressionPercent: progress };
        }
        return ch;
      });

      return {
        ...prev,
        transactions: updatedTxns,
        challenges: updatedChallenges
      };
    });
  };

  const handleAddChallenge = (ch: Challenge) => {
    // Retos personalizados desactivados, mantener estructura como no-op por seguridad de props
  };

  const handleUpdateChallengeProgress = (id: string, amount: number) => {
    // Progreso manual / trampas desactivado, mantener estructura como no-op por seguridad de props
  };

  const handleSaveScannedTransaction = (tx: Transaction) => {
    setState(prev => {
      const updatedTxns = [tx, ...prev.transactions];
      const xpGain = 0;
      const newXP = prev.userXP + xpGain;
      const newLevel = Math.floor(newXP / 1000) + 1;

      // Update active IA challenge progress automatically
      const activeIds = getDailyChallengeIds();
      const updatedChallenges = prev.challenges.map(ch => {
        if (activeIds.includes(ch.id) && ch.category === 'IA' && !ch.isCompleted) {
          const nextAmount = Math.min(ch.targetAmount, ch.currentAmount + 1);
          const progress = Math.round((nextAmount / ch.targetAmount) * 100);
          return { ...ch, currentAmount: nextAmount, progressionPercent: progress };
        }
        return ch;
      });

      return {
        ...prev,
        transactions: updatedTxns,
        challenges: updatedChallenges,
        userXP: newXP,
        userLevel: Math.max(prev.userLevel, newLevel)
      };
    });
  };

  const handleAddAsset = (asset: InvestmentAsset) => {
    setState(prev => {
      const updatedInvestments = [...prev.investments, asset];
      const xpGain = 0;
      const newXP = prev.userXP + xpGain;
      const newLevel = Math.floor(newXP / 1000) + 1;

      // Update active Inversión challenge progress automatically
      const activeIds = getDailyChallengeIds();
      const updatedChallenges = prev.challenges.map(ch => {
        if (activeIds.includes(ch.id) && ch.category === 'Inversión' && !ch.isCompleted) {
          const nextAmount = Math.min(ch.targetAmount, ch.currentAmount + 1);
          const progress = Math.round((nextAmount / ch.targetAmount) * 100);
          return { ...ch, currentAmount: nextAmount, progressionPercent: progress };
        }
        return ch;
      });

      return {
        ...prev,
        investments: updatedInvestments,
        challenges: updatedChallenges,
        userXP: newXP,
        userLevel: Math.max(prev.userLevel, newLevel)
      };
    });
  };

  const handleAddPlan = (plan: FinancialPlan) => {
    setState(prev => {
      const updatedPlans = [...prev.financialPlans, plan];
      const xpGain = 0;
      const newXP = prev.userXP + xpGain;
      const newLevel = Math.floor(newXP / 1000) + 1;

      // Update active Planificación challenge progress automatically
      const activeIds = getDailyChallengeIds();
      const updatedChallenges = prev.challenges.map(ch => {
        if (activeIds.includes(ch.id) && ch.category === 'Planificación' && !ch.isCompleted) {
          const nextAmount = Math.min(ch.targetAmount, ch.currentAmount + 1);
          const progress = Math.round((nextAmount / ch.targetAmount) * 100);
          return { ...ch, currentAmount: nextAmount, progressionPercent: progress };
        }
        return ch;
      });

      return {
        ...prev,
        financialPlans: updatedPlans,
        challenges: updatedChallenges,
        userXP: newXP,
        userLevel: Math.max(prev.userLevel, newLevel)
      };
    });
  };

  const handleAddEvent = (ev: CalendarEvent) => {
    setState(prev => ({
      ...prev,
      calendarEvents: [...prev.calendarEvents, ev]
    }));
  };

  const handleUpdateBudgets = (updatedBudgets: Budget[]) => {
    setState(prev => ({
      ...prev,
      budgets: updatedBudgets
    }));
  };

  const handlePayEvent = (id: string) => {
    setState(prev => {
      const updatedEvents = prev.calendarEvents.map(ev => {
        if (ev.id === id) return { ...ev, isPaid: true };
        return ev;
      });

      const xpGain = 0;
      const newXP = prev.userXP + xpGain;
      const newLevel = Math.floor(newXP / 1000) + 1;

      return {
        ...prev,
        calendarEvents: updatedEvents,
        userXP: newXP,
        userLevel: Math.max(prev.userLevel, newLevel)
      };
    });
  };

  const handleAddChatMessage = (msg: ChatMessage) => {
    setState(prev => {
      const activeIds = getDailyChallengeIds();
      const updatedChallenges = prev.challenges.map(ch => {
        if (msg.sender === 'user' && activeIds.includes(ch.id) && ch.category === 'IA' && !ch.isCompleted) {
          const nextAmount = Math.min(ch.targetAmount, ch.currentAmount + 1);
          const progress = Math.round((nextAmount / ch.targetAmount) * 100);
          return { ...ch, currentAmount: nextAmount, progressionPercent: progress };
        }
        return ch;
      });

      return {
        ...prev,
        chatHistory: [...prev.chatHistory, msg],
        challenges: updatedChallenges
      };
    });
  };

  const handleUpdateLastChatMessage = (text: string) => {
    setState(prev => {
      if (prev.chatHistory.length === 0) return prev;
      const history = [...prev.chatHistory];
      const lastMsg = history[history.length - 1];
      if (lastMsg.sender === 'assistant') {
        history[history.length - 1] = { ...lastMsg, text };
        return { ...prev, chatHistory: history };
      }
      return prev;
    });
  };

  const handleClaimChallenge = (id: string, xpReward: number) => {
    setState(prev => {
      const updatedChallenges = prev.challenges.map(ch => {
        if (ch.id === id) return { ...ch, isCompleted: true, progressionPercent: 100 };
        return ch;
      });

      const newXP = prev.userXP + xpReward;
      const newLevel = Math.floor(newXP / 1000) + 1;

      return {
        ...prev,
        challenges: updatedChallenges,
        userXP: newXP,
        userLevel: Math.max(prev.userLevel, newLevel)
      };
    });
  };

  const handleClaimBadge = (badgeId: string, xpReward: number) => {
    setState(prev => {
      const currentBadges = prev.badges || [];
      if (currentBadges.includes(badgeId)) return prev;

      const updatedBadges = [...currentBadges, badgeId];
      const newXP = prev.userXP + xpReward;
      const newLevel = Math.floor(newXP / 1000) + 1;

      return {
        ...prev,
        badges: updatedBadges,
        userXP: newXP,
        userLevel: Math.max(prev.userLevel, newLevel)
      };
    });
  };

  const handleDeleteAsset = (id: string) => {
    setState(prev => ({
      ...prev,
      investments: prev.investments.filter(as => as.id !== id)
    }));
  };

  const handleDeletePlan = (id: string) => {
    setState(prev => ({
      ...prev,
      financialPlans: prev.financialPlans.filter(p => p.id !== id)
    }));
  };

  const handleUpdateProfile = (p: UserProfile) => {
    // Find what changed to alert the user via SMTP
    const currentProfile = state.userProfile;
    if (currentProfile && user?.email) {
      const changesList: string[] = [];
      if (currentProfile.name !== p.name) changesList.push(`Nombre: "${currentProfile.name}" -> "${p.name}"`);
      if (currentProfile.riskLevel !== p.riskLevel) changesList.push(`Riesgo: "${currentProfile.riskLevel}" -> "${p.riskLevel}"`);
      if (currentProfile.profession !== p.profession) changesList.push(`Profesión: "${currentProfile.profession}" -> "${p.profession}"`);
      if (currentProfile.country !== p.country) changesList.push(`País: "${currentProfile.country}" -> "${p.country}"`);
      if (currentProfile.currency !== p.currency) changesList.push(`Moneda: "${currentProfile.currency}" -> "${p.currency}"`);
      if (currentProfile.incomeFixed !== p.incomeFixed) changesList.push(`Ingresos: ${currentProfile.incomeFixed} -> ${p.incomeFixed}`);
      if (currentProfile.currentSavings !== p.currentSavings) changesList.push(`Ahorros: ${currentProfile.currentSavings} -> ${p.currentSavings}`);

      if (changesList.length > 0) {
        fetch('/api/send-automated-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'critical_change',
            email: user.email,
            details: {
              name: p.name,
              changes: changesList.join('; '),
              device: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido',
              ip: '127.0.0.1'
            }
          })
        })
        .then(res => res.json())
        .then(data => {
          void data;
        })
        .catch(err => {
          console.error('Error al enviar alerta de seguridad:', err);
        });
      }
    }

    setState(prev => ({
      ...prev,
      userProfile: p
    }));
  };

  const handleSetUserRank = (rank: 'Normal' | 'VIP') => {
    setState(prev => ({
      ...prev,
      userRank: rank
    }));
  };

  const handleIncrementAiTokens = () => {
    setState(prev => ({
      ...prev,
      aiTokensUsed: (prev.aiTokensUsed || 0) + 1
    }));
  };

  const handleUpdateSavedChats = (savedChats: any[]) => {
    setState(prev => ({
      ...prev,
      savedChats
    }));
  };

  const handleLoadChatHistory = (history: any[]) => {
    setState(prev => ({
      ...prev,
      chatHistory: history
    }));
  };

  const handleClearChat = () => {
    setState(prev => ({
      ...prev,
      chatHistory: []
    }));
  };

  const handleResetData = async () => {
    if (user) {
      const uid = user.uid;
      try {
        let backendDeleted = false;

        // Try deleting through the secure backend Admin SDK first
        try {
          const idToken = await user.getIdToken(true);
          const response = await fetch('/api/delete-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
          
          if (response.ok) {
            const resData = await response.json();
            if (resData.success) {
              backendDeleted = true;
              console.log("Account successfully deleted completely via backend Admin SDK.");
            }
          } else {
            const errData = await response.json();
            console.warn("Backend deletion returned non-ok response, falling back to client-side:", errData.error);
          }
        } catch (backendErr) {
          console.warn("Backend deletion failed or unreachable, falling back to client-side:", backendErr);
        }

        if (!backendDeleted) {
          // 1. Delete document from Firestore
          const docRef = doc(db, 'users', uid);
          await deleteDoc(docRef);
          
          // 2. Delete user account from Firebase Auth (Client-side)
          try {
            await deleteUser(user);
          } catch (authErr: any) {
            if (authErr.code === 'auth/requires-recent-login') {
              alert('Por seguridad, para eliminar tu cuenta permanentemente debes haber iniciado sesión recientemente. Por favor, cierra sesión e inicia sesión de nuevo para realizar esta acción.');
              // We sign them out so they must log in again to delete the auth account.
              // Their data is already deleted from Firestore.
              await signOut(auth);
              localStorage.removeItem(`fiducia_ai_state_${uid}`);
              localStorage.removeItem('savedEmail');
              return;
            }
            throw authErr;
          }
        }
        
        // 3. Clear all cached local storage keys for this user
        localStorage.removeItem(`fiducia_ai_state_${uid}`);
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('fiducia_ai_state'); // Clear any legacy or non-UID cached state
        localStorage.removeItem('almo_last_chat_clear_timestamp');
        
        // 4. Force the next auth view to show registration screen
        localStorage.setItem('forceRegister', 'true');

        // 5. Always sign out client-side to ensure the session is completely terminated and trigger navigation
        try {
          await signOut(auth);
        } catch (signOutErr) {
          console.warn("Sign out during complete deletion:", signOutErr);
        }

        // Force state reset to initial values
        setState({
          userProfile: null as any,
          userRank: 'Normal',
          userLevel: 1,
          userXP: 0,
          aiTokensUsed: 0,
          transactions: [],
          investments: [],
          badges: [],
          challenges: [],
          goals: [],
          budgets: [],
          chatHistory: [],
          vintedListings: [],
          calendarEvents: [],
          financialPlans: [],
          savedChats: [],
          theme: 'dark'
        });

        alert('Tu cuenta y todos tus datos han sido eliminados por completo del sistema.');
      } catch (err) {
        console.error("Error deleting user account and database data:", err);
        alert('Hubo un error al eliminar algunos datos. Por favor, contacta con soporte o intenta cerrar sesión de nuevo.');
        
        // Fallback: Sign out so they have to log in or register again
        try {
          await signOut(auth);
        } catch (signOutErr) {
          console.error("Error on fallback sign out:", signOutErr);
        }
        localStorage.removeItem(`fiducia_ai_state_${uid}`);
      }
    }
  };

  const totalCompletedChallenges = state.challenges.filter(ch => ch.isCompleted).length;
  const isMaxLevelReached = totalCompletedChallenges >= 24;
  const isVIP = state.userRank === 'VIP' || isMaxLevelReached;

  const sidebarTabs = [
    { key: 'dashboard', label: 'Panel Principal', icon: <LayoutDashboard size={18} />, isPremium: false },
    { key: 'transactions', label: 'Movimientos', icon: <ArrowRightLeft size={18} />, isPremium: false },
    { key: 'scan', label: 'Escáner de Tickets', icon: <Scan size={18} />, isPremium: false },
    { key: 'chat', label: 'ALMO AI Chat', icon: <MessageSquare size={18} />, isPremium: false },
    { key: 'investments', label: 'Cartera Inversión', icon: <Briefcase size={18} />, isPremium: false },
    { key: 'calendar', label: 'Calendario Pagos', icon: <CalendarDays size={18} />, isPremium: false },
    { key: 'challenges', label: 'Retos de Ahorro', icon: <Trophy size={18} />, isPremium: false },
    { key: 'plans', label: 'Planes Estratégicos', icon: <Compass size={18} />, isPremium: true },
    { key: 'simulator', label: 'Simulador Futuro', icon: <LineChart size={18} />, isPremium: true },
    { key: 'vinted', label: 'Modo Vinted', icon: <ShoppingBag size={18} />, isPremium: true },
    { key: 'settings', label: 'Configuración', icon: <SettingsIcon size={18} />, isPremium: false },
    { key: 'alerts', label: 'Mis Insignias', icon: <Award size={18} className="text-[#00FF66]" />, isPremium: false },
    { key: 'rank', label: 'Mi Rango ALMO', icon: <Award size={18} className="text-[#00FF66]" />, isPremium: false }
  ];

  const activeTabMeta = sidebarTabs.find(t => t.key === activeTab);

  return (
    <div id="fiducia-app-shell" className="relative min-h-screen bg-[#050505] text-[#F5F5F7] flex flex-col lg:flex-row font-sans antialiased">

      {/* Ambient aurora background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="aurora w-[38rem] h-[38rem] -top-40 -right-40 bg-[#00FF66]/[0.05]" />
        <div className="aurora w-[30rem] h-[30rem] -bottom-40 -left-20 bg-white/[0.035]" style={{ animationDelay: '-9s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,#050505_70%)]" />
      </div>

      {/* MOBILE TOP BAR */}
      <header className="lg:hidden glass sticky top-0 z-40 px-4 h-[60px] flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-white text-black flex items-center justify-center">
            <Landmark size={16} strokeWidth={2.2} />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">ALMO AI</span>
          {!isOnline && (
            <span className="ml-1 px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">
              OFFLINE
            </span>
          )}
        </div>
        <button
          onClick={() => setMobileMenuOpen(o => !o)}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
          className="w-10 h-10 -mr-1 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/5 active:scale-95"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mobileMenuOpen ? 'x' : 'menu'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </header>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-x-0 bottom-0 top-[60px] bg-black/60 backdrop-blur-sm z-20"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop spacer */}
      <div className="hidden lg:block w-[248px] shrink-0" />

      {/* SIDEBAR */}
      <aside
        className={`fixed top-[60px] lg:top-0 bottom-0 left-0 z-30 w-[248px] h-[calc(100dvh-60px)] lg:h-screen bg-[#0A0A0B]/95 lg:bg-[#070708] backdrop-blur-xl border-r border-white/[0.06] flex flex-col transform transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="hidden lg:flex items-center justify-between px-5 h-[68px] border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-white text-black flex items-center justify-center shadow-[0_8px_24px_-8px_rgba(255,255,255,0.35)]">
              <Landmark size={18} strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <span className="text-[15px] font-semibold tracking-[-0.01em] block">ALMO AI</span>
              <span className="text-[10px] text-[#8E8E93] font-medium">Finanzas inteligentes</span>
            </div>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#00FF66] shadow-[0_0_8px_rgba(0,255,102,0.8)]' : 'bg-amber-400'}`}
            title={isOnline ? 'Conectado' : 'Sin conexión'}
          />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Navegación principal">
          {sidebarTabs.map((tab) => {
            const isLocked = tab.isPremium && !isVIP;
            const isActive = activeTab === tab.key;
            return (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleTabChange(isLocked ? 'rank' : tab.key);
                  setMobileMenuOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative w-full flex items-center gap-3 px-3 h-10 rounded-[12px] text-[13px] font-medium text-left ${
                  isActive
                    ? 'text-white'
                    : isLocked
                    ? 'text-[#5A5A5E] hover:text-[#8E8E93]'
                    : 'text-[#8E8E93] hover:text-[#F5F5F7] hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarTabIndicator"
                    className="absolute inset-0 bg-white/[0.07] rounded-[12px]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarTabDot"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[#00FF66]"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className={`relative z-10 transition-colors ${isActive ? 'text-[#00FF66]' : 'group-hover:text-white'}`}>
                  {tab.icon}
                </span>
                <span className="relative z-10 truncate">{tab.label}</span>
                {isLocked && <Lock size={12} className="relative z-10 ml-auto opacity-60" />}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          <button
            onClick={() => { handleTabChange('rank'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 h-9 rounded-[10px] text-[11px] font-semibold border ${
              state.userRank === 'VIP'
                ? 'bg-[#00FF66]/10 border-[#00FF66]/20 text-[#00FF66]'
                : 'bg-white/[0.03] border-white/[0.06] text-[#8E8E93] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Award size={12} className={state.userRank === 'VIP' ? 'fill-[#00FF66]' : ''} />
              {state.userRank === 'VIP' ? 'Miembro VIP' : 'Plan Normal'}
            </span>
            {state.userRank !== 'VIP' && <span className="flex items-center gap-1 text-[#00FF66]"><Zap size={10} className="fill-current" /> Mejorar</span>}
          </button>

          <div className="flex items-center gap-3 px-2 py-2 rounded-[12px]">
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-white to-[#C7C7CC] text-black flex items-center justify-center font-semibold text-xs">
              {profile.name?.charAt(0)?.toUpperCase() || 'A'}
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0A0A0B] text-[8px] font-bold text-white flex items-center justify-center border border-white/10">
                {state.userLevel}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium text-[#F5F5F7] block truncate">{profile.name}</span>
              <div className="mt-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full bg-[#00FF66] rounded-full"
                  initial={false}
                  animate={{ width: `${(state.userXP % 1000) / 10}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                />
              </div>
            </div>
          </div>
          <div className="text-[10px] text-[#5A5A5E] flex items-center justify-center gap-1 pb-1">
            <ShieldCheck size={11} />
            <span>Cifrado y protegido</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main
        ref={mainRef}
        className={`relative flex-1 w-full ${activeTab === 'chat' ? 'p-0 h-[calc(100dvh-60px)] lg:h-screen lg:overflow-hidden' : 'px-5 py-6 sm:px-8 sm:py-10 lg:px-14 lg:py-12 min-h-[calc(100dvh-60px)] lg:min-h-screen'}`}
      >
        <div className={activeTab === 'chat' ? 'h-full' : 'mx-auto max-w-6xl'}>

        {/* Floating status toasts */}
        <div className="pointer-events-none fixed top-[72px] lg:top-6 right-4 lg:right-8 z-50 flex flex-col items-end gap-2">
          <AnimatePresence>
            {!isOnline && (
              <Toast key="offline" icon={<WifiOff size={15} />} tone="amber" title="Sin conexión" desc="Tus cambios se guardan localmente y se sincronizarán al volver." />
            )}
            {isOnline && syncStatus === 'syncing' && (
              <Toast key="syncing" icon={<RefreshCw size={15} className="animate-spin" />} tone="neutral" title="Sincronizando" />
            )}
            {showSyncSuccess && (
              <Toast key="synced" icon={<CloudLightning size={15} />} tone="green" title="Sincronizado" desc="Todo guardado en la nube." />
            )}
            {syncStatus === 'error' && isOnline && (
              <Toast key="error" icon={<CloudOff size={15} />} tone="red" title="Error al sincronizar" desc="Reintentaremos automáticamente." />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={activeTab === 'chat' ? 'h-full' : ''}
          >
            <Suspense fallback={activeTab === 'chat' ? <div className="h-full" /> : <ViewSkeleton />}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                state={state} 
                stats={stats}
                aiTip={aiTip}
                loadingTip={loadingTip}
                onNavigate={setActiveTab}
                onQuickAddTransaction={() => handleTabChange('transactions')}
                onUpdateBudgets={handleUpdateBudgets}
              />
            )}

            {activeTab === 'alerts' && (
              <BadgesView 
                state={state}
                onClaimBadge={handleClaimBadge}
              />
            )}

            {activeTab === 'transactions' && (
              <Transactions 
                state={state}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onNavigateToScan={() => handleTabChange('scan')}
              />
            )}

            {activeTab === 'scan' && (
              <AIScanner 
                state={state}
                onSaveScannedTransaction={handleSaveScannedTransaction}
                onNavigateToRegistry={() => handleTabChange('transactions')}
              />
            )}

            {activeTab === 'chat' && (
              <AIChat 
                state={state}
                onAddMessage={handleAddChatMessage}
                onUpdateLastMessage={handleUpdateLastChatMessage}
                onIncrementTokens={handleIncrementAiTokens}
                onSetUserRank={handleSetUserRank}
                onClearChat={handleClearChat}
                onUpdateSavedChats={handleUpdateSavedChats}
                onLoadChatHistory={handleLoadChatHistory}
              />
            )}

            {activeTab === 'plans' && (
              state.userRank === 'VIP' ? (
                <Plans 
                  state={state}
                  onAddPlan={handleAddPlan}
                  onDeletePlan={handleDeletePlan}
                />
              ) : (
                <VIPUpgradeView 
                  featureName="Planes Estratégicos Inteligentes"
                  featureDescription="La planificación estratégica a corto, medio y largo plazo con optimización inteligente de liquidez y ahorro requiere el motor de IA de nivel VIP."
                  onUpgrade={() => handleTabChange('rank')}
                />
              )
            )}

            {activeTab === 'simulator' && (
              state.userRank === 'VIP' ? (
                <Simulator 
                  state={state}
                />
              ) : (
                <VIPUpgradeView 
                  featureName="Simulador Futuro Financiero"
                  featureDescription="Calcula proyecciones avanzadas de interés compuesto, simulaciones de hipotecas y análisis interactivo de escenarios de riesgo de forma ilimitada con la suite predictiva VIP."
                  onUpgrade={() => handleTabChange('rank')}
                />
              )
            )}

            {activeTab === 'investments' && (
              <Investments 
                state={state}
                onAddAsset={handleAddAsset}
                onDeleteAsset={handleDeleteAsset}
              />
            )}

            {activeTab === 'vinted' && (
              state.userRank === 'VIP' ? (
                <VintedMode 
                  state={state}
                  onAddTransaction={handleAddTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              ) : (
                <VIPUpgradeView 
                  featureName="Modo Vinted y Gestión Pyme"
                  featureDescription="El módulo avanzado para vendedores autónomos, control exacto de comisiones de envíos, gastos de publicidad y conciliación de saldos requiere la licencia VIP."
                  onUpgrade={() => handleTabChange('rank')}
                />
              )
            )}

            {activeTab === 'calendar' && (
              <CalendarView 
                state={state}
                onPayEvent={handlePayEvent}
                onAddEvent={handleAddEvent}
              />
            )}

            {activeTab === 'challenges' && (
              <Challenges 
                state={state}
                onClaimChallenge={handleClaimChallenge}
              />
            )}

            {activeTab === 'rank' && (
              <RankManagement 
                state={state}
                onSetUserRank={handleSetUserRank}
              />
            )}

            {activeTab === 'settings' && (
              <Settings 
                state={state}
                onUpdateProfile={handleUpdateProfile}
                onResetData={handleResetData}
                onLogout={handleLogout}
              />
            )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showPinLock && (
          <PinLock
            savedPin={state.userProfile?.securityPin || ''}
            onUnlock={() => {
              setShowPinLock(false);
              if (pendingTab) {
                setActiveTab(pendingTab);
                setPendingTab(null);
              }
            }}
            onCancel={() => {
              setShowPinLock(false);
              setPendingTab(null);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}


type ToastTone = 'green' | 'amber' | 'red' | 'neutral';
const TOAST_TONES: Record<ToastTone, string> = {
  green: 'text-[#00FF66] border-[#00FF66]/20',
  amber: 'text-amber-400 border-amber-500/20',
  red: 'text-red-400 border-red-500/20',
  neutral: 'text-[#F5F5F7] border-white/10',
};

function Toast({ icon, title, desc, tone }: { icon: React.ReactNode; title: string; desc?: string; tone: ToastTone }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      role="status"
      className={`pointer-events-auto glass flex items-start gap-3 pl-3.5 pr-4 py-3 rounded-2xl max-w-[320px] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] ${TOAST_TONES[tone]}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#F5F5F7] leading-tight">{title}</p>
        {desc && <p className="text-[11.5px] text-[#8E8E93] mt-0.5 leading-snug">{desc}</p>}
      </div>
    </motion.div>
  );
}
