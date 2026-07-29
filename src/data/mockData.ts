/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState, UserProfile, Transaction, Goal, Budget, Challenge, InvestmentAsset, VintedListing, CalendarEvent } from '../types';

export const defaultProfile: UserProfile = {
  name: 'Alejandro Gómez',
  age: 32,
  country: 'España',
  currency: '€',
  profession: 'Desarrollador Freelance',
  company: 'ByteCraft Studio',
  workType: 'Autónomo',
  incomeFixed: 3200,
  incomeVariable: 650,
  incomeBusiness: 800,
  incomeOther: 150,
  expenseHousing: 850,
  expenseFood: 380,
  expenseTransport: 160,
  expenseSubscriptions: 90,
  expenseLeisure: 350,
  expenseEducation: 120,
  expenseHealth: 80,
  expenseTaxes: 650,
  expenseOther: 150,
  currentSavings: 14500,
  currentInvestments: 32000,
  debts: 8000,
  riskLevel: 'Medio',
  primaryGoals: ['Comprar casa', 'Libertad financiera', 'Viajar'],
  businessSector: 'Desarrollo de Software y Diseño',
  protectedTabs: ['settings', 'investments']
};

export const defaultTransactions: Transaction[] = [
  {
    id: 'tx-1',
    amount: 3200,
    type: 'income',
    date: '2026-07-01',
    category: 'Ingresos',
    description: 'Factura mensual desarrollo web cliente principal',
    paymentMethod: 'Transferencia Bancaria',
    notes: 'Proyecto ByteCraft'
  },
  {
    id: 'tx-2',
    amount: 650,
    type: 'income',
    date: '2026-07-03',
    category: 'Ingresos',
    description: 'Venta de consultoría adicional API',
    paymentMethod: 'Stripe'
  },
  {
    id: 'tx-3',
    amount: 850,
    type: 'expense',
    date: '2026-07-01',
    category: 'Vivienda',
    description: 'Alquiler apartamento mensual',
    paymentMethod: 'Domiciliación Bancaria'
  },
  {
    id: 'tx-4',
    amount: 32.50,
    type: 'expense',
    date: '2026-07-02',
    category: 'Alimentación',
    description: 'Compra semanal Mercadona',
    paymentMethod: 'Tarjeta Apple Pay'
  },
  {
    id: 'tx-5',
    amount: 80,
    type: 'expense',
    date: '2026-07-02',
    category: 'Transporte',
    description: 'Carga de combustible y peajes',
    paymentMethod: 'Tarjeta Débito'
  },
  {
    id: 'tx-6',
    amount: 14.99,
    type: 'expense',
    date: '2026-07-04',
    category: 'Suscripciones',
    description: 'Suscripción mensual Netflix Premium',
    paymentMethod: 'Tarjeta Crédito'
  },
  {
    id: 'tx-7',
    amount: 120,
    type: 'expense',
    date: '2026-07-03',
    category: 'Ocio',
    description: 'Cena gastronómica amigos de la universidad',
    paymentMethod: 'Tarjeta Apple Pay',
    notes: 'Restaurante El Celler'
  },
  {
    id: 'tx-8',
    amount: 350,
    type: 'investment',
    date: '2026-07-04',
    category: 'Inversiones',
    description: 'Aportación periódica automatizada S&P 500',
    paymentMethod: 'Transferencia'
  },
  {
    id: 'tx-9',
    amount: 250,
    type: 'loan',
    date: '2026-07-02',
    category: 'Deudas',
    description: 'Pago mensual préstamo de coche',
    paymentMethod: 'Domiciliación'
  },
  {
    id: 'tx-10',
    amount: 60,
    type: 'expense',
    date: '2026-06-29',
    category: 'Salud',
    description: 'Sesión mensual de fisioterapia deportiva',
    paymentMethod: 'Tarjeta Apple Pay'
  }
];

export const defaultGoals: Goal[] = [
  {
    id: 'g-1',
    title: 'Entrada Nueva Casa',
    targetAmount: 40000,
    currentAmount: 14500,
    deadline: '2028-12-31',
    category: 'Comprar casa',
    suggestedAction: 'Aumentar ahorro mensual un 5% e invertir a plazo fijo a 2 años.'
  },
  {
    id: 'g-2',
    title: 'Viaje a Japón de 3 semanas',
    targetAmount: 4500,
    currentAmount: 2200,
    deadline: '2027-05-15',
    category: 'Viajar',
    suggestedAction: 'Reservar el dinero variable que ingreses extra por consultorías.'
  }
];

export const defaultBudgets: Budget[] = [
  { category: 'Vivienda', limitAmount: 900, spentAmount: 850 },
  { category: 'Alimentación', limitAmount: 450, spentAmount: 145.80 },
  { category: 'Transporte', limitAmount: 200, spentAmount: 80 },
  { category: 'Suscripciones', limitAmount: 100, spentAmount: 14.99 },
  { category: 'Ocio', limitAmount: 400, spentAmount: 215 },
  { category: 'Educación', limitAmount: 150, spentAmount: 0 },
  { category: 'Salud', limitAmount: 100, spentAmount: 60 }
];

export const defaultChallenges: Challenge[] = [
  {
    id: 'ch-1',
    title: 'Reto de Desintoxicación de Gastos',
    description: 'No realices ningún gasto no esencial en ocio ni compras durante 7 días consecutivos.',
    rewardXP: 150,
    targetAmount: 7,
    currentAmount: 4,
    durationWeeks: 1,
    isCompleted: false,
    category: 'Ocio'
  },
  {
    id: 'ch-2',
    title: 'Ahorro Express de 500€',
    description: 'Consigue acumular un saldo extra de ahorro para emergencias este mes.',
    rewardXP: 300,
    targetAmount: 500,
    currentAmount: 380,
    durationWeeks: 4,
    isCompleted: false,
    category: 'Ahorro'
  }
];

export const defaultInvestments: InvestmentAsset[] = [
  {
    id: 'inv-1',
    assetName: 'Vanguard S&P 500 UCITS ETF',
    assetType: 'etf',
    investedAmount: 15000,
    currentValue: 18250,
    purchaseDate: '2024-01-15'
  },
  {
    id: 'inv-2',
    assetName: 'Apple Inc. (AAPL) Equity',
    assetType: 'stock',
    investedAmount: 4500,
    currentValue: 5320,
    purchaseDate: '2024-05-10'
  },
  {
    id: 'inv-3',
    assetName: 'Bitcoin (BTC)',
    assetType: 'crypto',
    investedAmount: 5000,
    currentValue: 6150,
    purchaseDate: '2025-02-18'
  },
  {
    id: 'inv-4',
    assetName: 'Bonos del Tesoro de España 3.2%',
    assetType: 'bond',
    investedAmount: 2000,
    currentValue: 2280,
    purchaseDate: '2024-10-01'
  }
];

export const defaultVintedListings: VintedListing[] = [
  {
    id: 'v-1',
    title: 'Chaqueta de cuero Vintage 90s',
    purchasePrice: 15.00,
    sellPrice: 48.00,
    commission: 3.36,
    shipping: 4.50,
    advertising: 1.50,
    status: 'sold',
    dateAdded: '2026-06-15'
  },
  {
    id: 'v-2',
    title: 'Zapatillas Retro Running Brand New',
    purchasePrice: 40.00,
    sellPrice: 95.00,
    commission: 6.65,
    shipping: 5.50,
    advertising: 0.00,
    status: 'listed',
    dateAdded: '2026-07-02'
  }
];

export const defaultCalendarEvents: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Alquiler Apartamento',
    amount: 850,
    date: '2026-07-01',
    type: 'rent',
    isPaid: true
  },
  {
    id: 'ev-2',
    title: 'Cuota Préstamo Coche',
    amount: 250,
    date: '2026-07-02',
    type: 'mortgage',
    isPaid: true
  },
  {
    id: 'ev-3',
    title: 'Netflix Premium',
    amount: 14.99,
    date: '2026-07-04',
    type: 'subscription',
    isPaid: true
  },
  {
    id: 'ev-4',
    title: 'Seguro Médico Sanitas',
    amount: 60.50,
    date: '2026-07-10',
    type: 'insurance',
    isPaid: false
  },
  {
    id: 'ev-5',
    title: 'Trimestre IVA Autónomos Model 303',
    amount: 450.00,
    date: '2026-07-20',
    type: 'tax',
    isPaid: false
  },
  {
    id: 'ev-6',
    title: 'Suscripción Spotify Duo',
    amount: 12.99,
    date: '2026-07-15',
    type: 'subscription',
    isPaid: false
  }
];

export const defaultChatHistory = [
  {
    sender: 'assistant' as const,
    text: 'Hola Alejandro, soy tu asesor financiero ALMO AI. He analizado tu perfil de autónomo de 32 años. Veo que mantienes un excelente patrimonio neto de 48,500 € y una tasa de ahorro del 25.1%. ¿En qué puedo asistirte hoy con tus cuentas, simulaciones de inversión o metas de ahorro?',
    timestamp: '09:00'
  }
];

export const defaultFinancialPlans = [
  {
    id: 'plan-default-1',
    title: 'Plan de Retiro e Interés Compuesto Acelerado',
    type: 'investment' as const,
    timeframeMonths: 120,
    actions: [
      'Invertir recurrentemente 400 € mensuales en el fondo Vanguard S&P 500.',
      'Reinvertir automáticamente todos los dividendos acumulados (Interés compuesto).',
      'Minimizar comisiones de custodia contratando brókeres con TER menor al 0.15%.',
      'Incrementar un 5% tu aportación periódica por cada aumento anual de tus ingresos.'
    ],
    progressionPercent: 12,
    simulationScenarios: {
      optimistic: 'Con un crecimiento de renta variable del 10% anual, acumularás un capital proyectado de aproximadamente 68,000 € en 10 años.',
      moderate: 'Con rentabilidad promedio histórica del 7.2% anual, acumularás 57,400 € en el plazo de 10 años de manera sumamente equilibrada.',
      conservative: 'Bajo un mercado bajista o estancado de 3.5% anual, el capital neto acumulado se situará en torno a los 46,200 €, protegiendo tu patrimonio contra la inflación.'
    }
  }
];

export const getSeededState = (): AppState => ({
  userProfile: defaultProfile,
  transactions: defaultTransactions,
  goals: defaultGoals,
  budgets: defaultBudgets,
  challenges: defaultChallenges,
  investments: defaultInvestments,
  vintedListings: defaultVintedListings,
  calendarEvents: defaultCalendarEvents,
  chatHistory: defaultChatHistory,
  financialPlans: defaultFinancialPlans,
  userXP: 450,
  userLevel: 2,
  theme: 'dark'
});
