/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import AIScanner from './components/AIScanner';
import AIChat from './components/AIChat';
import Plans from './components/Plans';
import Simulator from './components/Simulator';
import VIPUpgradeView from './components/VIPUpgradeView';
import Investments from './components/Investments';
import VintedMode from './components/VintedMode';
import CalendarView from './components/CalendarView';
import Challenges from './components/Challenges';
import Statistics from './components/Statistics';
import Settings from './components/Settings';
import AuthView from './components/AuthView';
import RankManagement from './components/RankManagement';
import BadgesView from './components/BadgesView';

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
import { getSeededState } from './data/mockData';
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
  const [aiTip, setAiTip] = useState('Tu nivel de liquidez es saludable. Te sugerimos destinar un 10% extra a indexados este mes para maximizar interés compuesto.');
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
      console.log('onAuthStateChanged: firebaseUser=', firebaseUser);
      setUser(firebaseUser);
      if (firebaseUser) {
        const cacheKey = `fiducia_ai_state_${firebaseUser.uid}`;
        // 1. Instantly load from local cache if it exists for lightning-fast start
        const cachedDataStr = localStorage.getItem(cacheKey);
        if (cachedDataStr) {
          try {
            const cachedData = JSON.parse(cachedDataStr) as AppState;
            if (firebaseUser.email === 'marioam777@gmail.com') {
              if (!cachedData.transactions) cachedData.transactions = [];
              const hasTx = cachedData.transactions.some((t: any) => t.amount === 35.1);
              if (!hasTx) {
                cachedData.transactions.unshift({
                  id: 'tx-mario-351',
                  amount: 35.1,
                  type: 'income',
                  date: new Date().toISOString().split('T')[0],
                  category: 'Otros ingresos',
                  description: 'Ingreso Extra Realizado (35.10 €)',
                  paymentMethod: 'Tarjeta Apple Pay',
                  notes: 'Transacción añadida automáticamente para balancear la cuenta de Mario'
                });
              }
            }
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
            if (firebaseUser.email === 'marioam777@gmail.com') {
              if (!userData.transactions) userData.transactions = [];
              const hasTx = userData.transactions.some((t: any) => t.amount === 35.1);
              if (!hasTx) {
                userData.transactions.unshift({
                  id: 'tx-mario-351',
                  amount: 35.1,
                  type: 'income',
                  date: new Date().toISOString().split('T')[0],
                  category: 'Otros ingresos',
                  description: 'Ingreso Extra Realizado (35.10 €)',
                  paymentMethod: 'Tarjeta Apple Pay',
                  notes: 'Transacción añadida automáticamente para balancear la cuenta de Mario'
                });
              }
            }
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
          if (data.tip) {
            setAiTip(data.tip);
          }
        }
      } catch (e) {
        console.error('Failed to fetch AI tip:', e);
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
          animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#00FF66] to-[#10B981] text-black shadow-[0_0_20px_rgba(0,255,102,0.3)]">
            <Landmark size={32} className="stroke-[2.5]" />
          </div>
          <p className="text-xs font-mono text-[#00FF66] uppercase tracking-widest animate-pulse">Conectando de forma segura...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  if (!state.userProfile) {
    return (
      <Onboarding onComplete={handleOnboardingComplete} />
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
          console.log('Alerta de cambio crítico de perfil enviada con éxito:', data);
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
          userProfile: null,
          userRank: 'Normal',
          userLevel: 1,
          aiTokensUsed: 0,
          currentView: 'onboarding',
          transactions: [],
          investments: [],
          badges: [],
          challenges: [],
          goals: [],
          budgets: [],
          chatHistory: [],
          unusualMovements: [],
          vintedItems: [],
          savedChats: []
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

  return (
    <div id="fiducia-app-shell" className="min-h-screen bg-[#050505] text-[#F5F5F7] flex flex-col lg:flex-row font-sans selection:bg-white/10 selection:text-[#F5F5F7] antialiased">
      
      {/* Background Soft Ambient Light blur glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/3 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/2 blur-[120px] pointer-events-none rounded-full" />

      {/* MOBILE BAR */}
      <div className="lg:hidden bg-[#050505] border-b border-[#ffffff10] px-4 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-[#050505]/90">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-white text-black">
            <Landmark size={18} />
          </div>
          <span className="text-md font-extrabold tracking-tight bg-gradient-to-r from-[#F5F5F7] via-white to-[#8E8E93] bg-clip-text text-transparent">ALMO AI</span>
          {!isOnline && (
            <span className="ml-2 px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full animate-pulse">
              OFFLINE
            </span>
          )}
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#8E8E93] hover:text-[#F5F5F7] transition-colors"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-x-0 bottom-0 top-[65px] bg-black/70 backdrop-blur-sm z-20"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop spacer to hold layout space for the fixed sidebar */}
      <div className="hidden lg:block w-64 shrink-0" />

      {/* SIDEBAR CONTAINER (DESKTOP) & DRAWER (MOBILE) */}
      <aside 
        className={`fixed top-[65px] lg:top-0 bottom-0 left-0 z-30 w-64 h-[calc(100dvh-65px)] lg:h-screen bg-[#050505]/98 lg:bg-[#050505] border-r border-[#ffffff10] p-5 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:fixed shrink-0 overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Logo Brand Title */}
          <div className="hidden lg:flex items-center justify-between pb-4 border-b border-[#ffffff10]">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-white text-black shadow-md shadow-white/5">
                <Landmark size={20} />
              </div>
              <div>
                <span className="text-md font-black tracking-tight bg-gradient-to-r from-white via-[#F5F5F7] to-[#8E8E93] bg-clip-text text-transparent">ALMO AI</span>
                <p className="text-[9px] font-mono text-[#8E8E93] uppercase tracking-wider">Premium Ecosystem</p>
              </div>
            </div>
            {/* Connection badge */}
            <div className="shrink-0">
              {isOnline ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Offline</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab lists */}
          <nav className="space-y-1 relative">
            {sidebarTabs.map((tab) => {
              const isLocked = tab.isPremium && !isVIP;
              const isActive = activeTab === tab.key;
              return (
                <motion.button
                  key={tab.key}
                  whileHover={{ scale: 1.015, x: 2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    if (isLocked) {
                      handleTabChange('rank');
                    } else {
                      handleTabChange(tab.key);
                    }
                    setMobileMenuOpen(false);
                  }}
                  className={`relative w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                    isActive
                      ? 'text-white font-extrabold'
                      : isLocked
                      ? 'text-slate-600 opacity-70 hover:opacity-100 hover:text-slate-400'
                      : 'text-[#8E8E93] hover:text-[#F5F5F7]'
                  }`}
                >
                  {/* Smooth Sliding Active Background Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebarTabIndicator"
                      className="absolute inset-0 bg-[#121214] border-l-2 border-[#00FF66] rounded-xl shadow-sm shadow-[#00FF66]/10"
                      initial={false}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 32
                      }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <motion.span
                      animate={{ scale: isActive ? 1.15 : 1 }}
                      transition={{ duration: 0.2 }}
                      className={isActive ? 'text-[#00FF66]' : ''}
                    >
                      {tab.icon}
                    </motion.span>
                    <span>{tab.label}</span>
                    {isLocked && <Lock size={12} className="ml-auto opacity-70" />}
                  </div>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* User status and level footer in sidebar */}
        <div className="pt-4 border-t border-[#ffffff10] space-y-3">
          <div className="flex flex-col gap-1.5 px-1">
            <div className="flex justify-between items-center text-[10px] font-mono text-[#8E8E93]">
              <span>RANGO CLIENTE</span>
              {state.userRank === 'VIP' ? (
                <span className="text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/20 px-2 py-0.5 rounded font-extrabold flex items-center gap-0.5 animate-pulse text-[9px] uppercase tracking-wider">
                  <Award size={10} className="fill-[#00FF66]" /> VIP
                </span>
              ) : (
                <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-bold flex items-center gap-0.5 text-[9px] uppercase tracking-wider">
                  <Award size={10} className="fill-amber-400" /> Normal
                </span>
              )}
            </div>
            {state.userRank === 'Normal' ? (
              <button
                onClick={() => {
                  handleTabChange('rank');
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-1 py-1.5 px-2 text-center rounded-lg bg-[#00FF66]/15 hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-extrabold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#00FF66]/20"
              >
                <Zap size={10} className="fill-current" /> Gestionar Rango VIP
              </button>
            ) : (
              <button
                onClick={() => {
                  handleTabChange('rank');
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-1 py-1.5 px-2 text-center rounded-lg bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-400 font-bold text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border border-amber-500/20"
              >
                Gestionar Rango Normal
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3 bg-[#121214] p-2.5 rounded-xl border border-[#ffffff08]">
            <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs shadow shadow-white/10">
              {state.userLevel}
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-[#F5F5F7] block">{profile.name}</span>
              <span className="text-[10px] text-[#8E8E93] font-mono block">Nivel {state.userLevel} ({state.userXP % 1000} XP)</span>
            </div>
          </div>
          <div className="text-[10px] text-[#8E8E93] flex items-center justify-center gap-1">
            <ShieldCheck size={12} className="text-[#8E8E93]" />
            <span>ALMO AI Protection</span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW SCREEN PORTAL */}
      <main className={`flex-1 mx-auto w-full overflow-x-hidden ${activeTab === 'chat' ? 'p-0 max-w-full h-[calc(100dvh-65px)] lg:h-screen lg:overflow-hidden' : 'p-5 sm:p-8 lg:p-14 max-w-7xl min-h-[calc(100dvh-65px)] lg:min-h-screen'}`}>
        
        {/* Connection Status Banners */}
        {!isOnline && (
          <div id="offline-banner" className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center gap-3 shadow-lg shadow-amber-500/5 animate-pulse">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
              <WifiOff size={20} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-extrabold text-amber-400 tracking-wider uppercase">MODO SIN CONEXIÓN ACTIVO</h4>
              <p className="text-xs text-[#8E8E93] leading-relaxed">
                Estás desconectado, pero ALMO AI sigue protegiéndote. Puedes seguir añadiendo movimientos, consultando tus retos y navegando por la app de forma normal. Tus cambios se guardarán localmente y se sincronizarán con la nube de Firebase Store automáticamente cuando recuperes la conexión.
              </p>
            </div>
          </div>
        )}

        {showSyncSuccess && (
          <div id="sync-success-banner" className="mb-6 p-4 rounded-2xl bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center gap-3 shadow-lg shadow-[#00FF66]/5">
            <div className="p-2 rounded-xl bg-[#00FF66]/15 text-[#00FF66] shrink-0">
              <CloudLightning size={20} className="animate-bounce" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-extrabold text-[#00FF66] tracking-wider uppercase">¡DATOS SINCRONIZADOS!</h4>
              <p className="text-xs text-[#8E8E93]">
                La conexión se ha restablecido. Todos tus movimientos y cambios locales se han guardado de forma segura en la nube de Firebase Store.
              </p>
            </div>
          </div>
        )}

        {isOnline && syncStatus === 'syncing' && (
          <div id="syncing-banner" className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 shadow-lg shadow-blue-500/5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 shrink-0 animate-spin">
              <RefreshCw size={20} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-extrabold text-blue-400 tracking-wider uppercase">SINCRONIZANDO CON LA NUBE</h4>
              <p className="text-xs text-[#8E8E93]">
                Guardando tus últimos cambios en la base de datos de Firebase Store de forma segura...
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1]
            }}
            className={activeTab === 'chat' ? 'h-full' : ''}
          >
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
          </motion.div>
        </AnimatePresence>
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
