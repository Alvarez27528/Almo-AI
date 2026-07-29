import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, WorkType, RiskLevel } from '../types';
import { Landmark, ArrowRight, User, Briefcase, TrendingUp, PieChart, ShieldAlert, Award, Search, X } from 'lucide-react';

const ALL_CURRENCIES = [
  { key: '€', label: 'Euro', code: 'EUR' },
  { key: '$', label: 'Dólar Estadounidense', code: 'USD' },
  { key: '£', label: 'Libra Esterlina', code: 'GBP' },
  { key: 'MXN$', label: 'Peso Mexicano', code: 'MXN' },
  { key: 'ARS$', label: 'Peso Argentino', code: 'ARS' },
  { key: 'CLP$', label: 'Peso Chileno', code: 'CLP' },
  { key: 'COL$', label: 'Peso Colombiano', code: 'COP' },
  { key: 'UYU$', label: 'Peso Uruguayo', code: 'UYU' },
  { key: 'PEN', label: 'Sol Peruano', code: 'PEN' },
  { key: 'PYG', label: 'Guaraní Paraguayo', code: 'PYG' },
  { key: 'BOB', label: 'Boliviano', code: 'BOB' },
  { key: 'CRC', label: 'Colón Costarricense', code: 'CRC' },
  { key: 'DOP$', label: 'Peso Dominicano', code: 'DOP' },
  { key: 'GTQ', label: 'Quetzal Guatemalteco', code: 'GTQ' },
  { key: 'HNL', label: 'Lempira Hondureña', code: 'HNL' },
  { key: 'NIO', label: 'Córdoba Nicaragüense', code: 'NIO' },
  { key: 'PAB', label: 'Balboa Panameño', code: 'PAB' },
  { key: 'VES', label: 'Bolívar Venezolano', code: 'VES' },
  { key: '¥', label: 'Yen Japonés', code: 'JPY' },
  { key: 'CN¥', label: 'Yuan Chino', code: 'CNY' },
  { key: 'CHF', label: 'Franco Suizo', code: 'CHF' },
  { key: 'C$', label: 'Dólar Canadiense', code: 'CAD' },
  { key: 'A$', label: 'Dólar Australiano', code: 'AUD' },
  { key: 'S$', label: 'Dólar Singapurense', code: 'SGD' },
  { key: 'HK$', label: 'Dólar Hongkonés', code: 'HKD' },
  { key: 'NZ$', label: 'Dólar Neozelandés', code: 'NZD' },
  { key: '₩', label: 'Won Surcoreano', code: 'KRW' },
  { key: '฿', label: 'Baht Tailandés', code: 'THB' },
  { key: 'Rp', label: 'Rupiah Indonesia', code: 'IDR' },
  { key: '₹', label: 'Rupia India', code: 'INR' },
  { key: 'R$', label: 'Real Brasileño', code: 'BRL' },
  { key: '₽', label: 'Rublo Ruso', code: 'RUB' },
  { key: 'R', label: 'Rand Sudafricano', code: 'ZAR' },
  { key: '₺', label: 'Lira Turca', code: 'TRY' },
  { key: '₪', label: 'Shekel Israelí', code: 'ILS' },
  { key: '₱', label: 'Peso Filipino', code: 'PHP' },
  { key: 'AED', label: 'Dirham (EAU)', code: 'AED' },
  { key: 'SAR', label: 'Riyal Saudí', code: 'SAR' },
  { key: 'RM', label: 'Ringgit Malayo', code: 'MYR' },
  { key: 'lei', label: 'Leu Rumano', code: 'RON' },
  { key: '₫', label: 'Dong Vietnamita', code: 'VND' },
  { key: 'Ft', label: 'Forint Húngaro', code: 'HUF' },
  { key: 'Kč', label: 'Corona Checa', code: 'CZK' },
  { key: 'zł', label: 'Zloty Polaco', code: 'PLN' },
  { key: 'QR', label: 'Riyal Qatarí', code: 'QAR' },
  { key: 'KD', label: 'Dinar Kuwaití', code: 'KWD' },
  { key: 'BD', label: 'Dinar Bareiní', code: 'BHD' },
  { key: 'DKK', label: 'Corona Danesa', code: 'DKK' },
  { key: 'NOK', label: 'Corona Noruega', code: 'NOK' },
  { key: 'kr', label: 'Corona Sueca', code: 'SEK' },
  { key: 'ISK', label: 'Corona Islandesa', code: 'ISK' },
  { key: 'TWD', label: 'Dólar Taiwanés', code: 'TWD' },
  { key: 'UAH', label: 'Grivna Ucraniana', code: 'UAH' },
  { key: 'EGP', label: 'Libra Egipcia', code: 'EGP' },
  { key: 'NGN', label: 'Naira Nigeriana', code: 'NGN' },
  { key: 'KES', label: 'Chelín Keniano', code: 'KES' },
  { key: 'GHS', label: 'Cedi Ghanés', code: 'GHS' },
  { key: 'MAD', label: 'Dirham Marroquí', code: 'MAD' },
  { key: 'DZD', label: 'Dinar Argelino', code: 'DZD' },
  { key: 'TND', label: 'Dinar Tunecino', code: 'TND' },
];

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [country, setCountry] = useState('España');
  const [currency, setCurrency] = useState('€');
  const [profession, setProfession] = useState('');
  const [company, setCompany] = useState('');
  const [workType, setWorkType] = useState<WorkType>('Empleado');
  const [businessSector, setBusinessSector] = useState('');

  // Incomes
  const [incomeFixed, setIncomeFixed] = useState<number>(2000);
  const [incomeVariable, setIncomeVariable] = useState<number>(0);
  const [incomeBusiness, setIncomeBusiness] = useState<number>(0);
  const [incomeOther, setIncomeOther] = useState<number>(0);

  // Expenses
  const [expenseHousing, setExpenseHousing] = useState<number>(750);
  const [expenseFood, setExpenseFood] = useState<number>(300);
  const [expenseTransport, setExpenseTransport] = useState<number>(120);
  const [expenseSubscriptions, setExpenseSubscriptions] = useState<number>(50);
  const [expenseLeisure, setExpenseLeisure] = useState<number>(200);
  const [expenseEducation, setExpenseEducation] = useState<number>(50);
  const [expenseHealth, setExpenseHealth] = useState<number>(40);
  const [expenseTaxes, setExpenseTaxes] = useState<number>(200);
  const [expenseOther, setExpenseOther] = useState<number>(100);

  // Capital & Risk
  const [currentSavings, setCurrentSavings] = useState<number>(5000);
  const [currentInvestments, setCurrentInvestments] = useState<number>(2000);
  const [debts, setDebts] = useState<number>(0);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('Medio');

  // New States
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [otherWorkType, setOtherWorkType] = useState('');

  // Goals
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);

  const availableGoals = [
    'Comprar coche',
    'Comprar casa',
    'Viajar',
    'Crear empresa',
    'Jubilarse',
    'Libertad financiera',
    'Otro'
  ];

  const friendlyGoalLabels: { [key: string]: string } = {
    'Comprar coche': '🚙 Comprar un coche',
    'Comprar casa': '🏠 Tener mi casa propia',
    'Viajar': '✈️ Hacer un gran viaje',
    'Crear empresa': '💼 Montar mi propio negocio',
    'Jubilarse': '👵 Jubilarme tranquilo',
    'Libertad financiera': '🔓 Vivir sin trabajar',
    'Otro': '✨ Otro sueño especial'
  };

  const toggleGoal = (g: string) => {
    if (primaryGoals.includes(g)) {
      setPrimaryGoals(primaryGoals.filter(item => item !== g));
    } else {
      setPrimaryGoals([...primaryGoals, g]);
    }
  };

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      const finalProfile: UserProfile = {
        name: name.trim() || 'Inversor Inteligente',
        age: Number(age) || 30,
        country: country.trim() || 'España',
        currency,
        profession: profession.trim() || 'Profesional',
        company: company.trim() || undefined,
        workType: workType === 'Otro' ? (otherWorkType as any) : workType,
        incomeFixed: Number(incomeFixed) || 0,
        incomeVariable: Number(incomeVariable) || 0,
        incomeBusiness: Number(incomeBusiness) || 0,
        incomeOther: Number(incomeOther) || 0,
        expenseHousing: Number(expenseHousing) || 0,
        expenseFood: Number(expenseFood) || 0,
        expenseTransport: Number(expenseTransport) || 0,
        expenseSubscriptions: Number(expenseSubscriptions) || 0,
        expenseLeisure: Number(expenseLeisure) || 0,
        expenseEducation: Number(expenseEducation) || 0,
        expenseHealth: Number(expenseHealth) || 0,
        expenseTaxes: Number(expenseTaxes) || 0,
        expenseOther: Number(expenseOther) || 0,
        currentSavings: Number(currentSavings) || 0,
        currentInvestments: Number(currentInvestments) || 0,
        debts: Number(debts) || 0,
        riskLevel,
        primaryGoals,
        businessSector: workType === 'Autónomo' || workType === 'Empresario' ? (businessSector || 'E-Commerce / Digital') : undefined,
        protectedTabs: ['settings', 'investments']
      };
      onComplete(finalProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const filteredCurrencies = useMemo(() => {
    return ALL_CURRENCIES.filter(c => 
      c.label.toLowerCase().includes(currencySearch.toLowerCase()) || 
      c.code.toLowerCase().includes(currencySearch.toLowerCase())
    );
  }, [currencySearch]);

  const renderProgress = () => {
    return (
      <div className="flex justify-between items-center space-x-2 mb-10">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} className="flex-1 h-1.5 rounded-full bg-[#1C1C1E] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                idx <= step ? 'bg-gradient-to-r from-[#00FF66] to-[#10B981]' : 'bg-transparent'
              }`}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div id="onboarding-container" className="min-h-screen bg-[#050505] text-[#F5F5F7] flex flex-col justify-center items-center px-4 py-12 font-sans selection:bg-[#00FF66]/20 selection:text-[#00FF66]">
      
      {/* Background soft glowing lights */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.06)_0,transparent_60%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#121214] border border-[#ffffff08] rounded-3xl p-8 shadow-2xl relative"
      >
        {/* Upper Brand Badge */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#00FF66] to-[#10B981] text-black shadow-[0_0_15px_rgba(0,255,102,0.2)]">
            <Landmark size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-[#00FF66] to-white bg-clip-text text-transparent">ALMO AI</h1>
            <p className="text-[9px] text-[#8E8E93] font-mono uppercase tracking-widest">Asistente de Dinero Inteligente</p>
          </div>
        </div>

        {renderProgress()}

        {/* STEP 1: PERSONAL INFORMATION */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center space-x-2 text-[#00FF66] font-mono text-xs uppercase tracking-widest">
              <User size={14} />
              <span>Paso 1 de 6: Tu Identidad</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">¡Hola! Vamos a empezar a organizar tu dinero</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Dinos cómo te llamas y dónde vives para poder personalizar las monedas y adaptar todo a tu país de la forma más sencilla posible.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">¿Cómo quieres que te llamemos?</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Alejandro Gómez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl px-4 py-3.5 text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/10 transition-all font-sans text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">¿Qué edad tienes?</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/10 transition-all font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">¿En qué país vives?</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/10 transition-all font-sans text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">¿Qué moneda usas normalmente?</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: '€', label: 'Euro (€)' },
                    { key: '$', label: 'Dólar ($)' },
                    { key: '£', label: 'Libra (£)' },
                  ].map((cur) => (
                    <button
                      key={cur.key}
                      type="button"
                      onClick={() => setCurrency(cur.key)}
                      className={`py-3.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                        currency === cur.key
                          ? 'bg-[#00FF66]/10 border-[#00FF66] text-[#00FF66] font-bold'
                          : 'bg-[#050505] border-[#ffffff10] text-[#8E8E93] hover:border-white/20'
                      }`}
                    >
                      {cur.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCurrencyModal(true)}
                    className={`py-3.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                      !['€', '$', '£'].includes(currency)
                        ? 'bg-[#00FF66]/10 border-[#00FF66] text-[#00FF66] font-bold'
                        : 'bg-[#050505] border-[#ffffff10] text-[#8E8E93] hover:border-white/20'
                    }`}
                  >
                    {!['€', '$', '£'].includes(currency) ? `${currency} (${currency})` : 'Más...'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: PROFESSIONAL PROFILE */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center space-x-2 text-[#00FF66] font-mono text-xs uppercase tracking-widest">
              <Briefcase size={14} />
              <span>Paso 2 de 6: Tu Trabajo</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">¿A qué te dedicas habitualmente?</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Dinos cómo consigues dinero. Esto sirve para que nuestro asistente inteligente te sugiera presupuestos, ayudas o ideas perfectas para ti.
            </p>

            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'Empleado', label: 'Trabajo fijo (Nómina)' },
                  { key: 'Autónomo', label: 'Soy Autónomo' },
                  { key: 'Empresario', label: 'Negocio / Empresa' },
                  { key: 'Estudiante', label: 'Estudiante' },
                  { key: 'Desempleado', label: 'Sin empleo' },
                  { key: 'Otro', label: 'Otro...' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setWorkType(item.key as WorkType)}
                    className={`p-3 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center ${
                      workType === item.key
                        ? 'bg-[#00FF66]/10 border-[#00FF66] text-[#00FF66] font-bold'
                        : 'bg-[#050505] border-[#ffffff10] text-[#8E8E93] hover:border-white/20'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {workType === 'Otro' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">Especifica tu tipo de ocupación</label>
                    <input
                      type="text"
                      placeholder="Ej. Inversor, Jubilado, Freelance, etc."
                      value={otherWorkType}
                      onChange={(e) => setOtherWorkType(e.target.value)}
                      className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl px-4 py-3.5 text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/10 transition-all font-sans text-sm"
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">¿Cuál es tu oficio o profesión?</label>
                  <input
                    type="text"
                    placeholder="Ej. Camarero, Ingeniero, Estudiante de Derecho, Diseñador"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl px-4 py-3.5 text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/10 transition-all font-sans text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">Nombre de tu empresa o lugar de trabajo (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Particular, Hospital Central, ByteCraft"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl px-4 py-3.5 text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/10 transition-all font-sans text-sm"
                  />
                </div>

                {(workType === 'Autónomo' || workType === 'Empresario') && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">¿De qué es tu negocio o sector?</label>
                    <input
                      type="text"
                      placeholder="Ej. Venta de ropa online, Cafetería, Consultoría de diseño"
                      value={businessSector}
                      onChange={(e) => setBusinessSector(e.target.value)}
                      className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl px-4 py-3.5 text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/10 transition-all font-sans text-sm"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: INCOMES */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center space-x-2 text-[#00FF66] font-mono text-xs uppercase tracking-widest">
              <TrendingUp size={14} />
              <span>Paso 3 de 6: Tus Ingresos Fijos</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">¿Cuánto dinero recibes cada mes?</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Dinos qué dinero te entra normalmente. <span className="text-[#00FF66] font-medium">Este dinero se añadirá automáticamente a tu saldo cada mes</span> para que no tengas que anotarlo a mano.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">Tu sueldo o nómina fija</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] text-sm font-mono">{currency}</span>
                  <input
                    type="number"
                    value={incomeFixed}
                    onChange={(e) => setIncomeFixed(Number(e.target.value))}
                    className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/10 transition-all font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-[#8E8E93] mt-2 italic">Se sumará solo cada día 1 de mes.</p>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">Otros ingresos recurrentes</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] text-sm font-mono">{currency}</span>
                  <input
                    type="number"
                    value={incomeVariable}
                    onChange={(e) => setIncomeVariable(Number(e.target.value))}
                    className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-10 pr-4 py-3.5 text-white focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/10 transition-all font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-[#8E8E93] mt-2 italic">Alquileres, ayudas o pensiones.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 4: EXPENSES */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center space-x-2 text-[#00FF66] font-mono text-xs uppercase tracking-widest">
              <PieChart size={14} />
              <span>Paso 4 de 6: Tus Gastos Previstos</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">¿Cuánto estimas gastar en cada cosa?</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Esto no se resta solo. <span className="text-[#00FF66] font-medium">Sirve para ponerte un límite</span> y que la IA te avise si estás gastando demasiado en comida, ocio o facturas.
            </p>

            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4 pt-2 scrollbar-thin scrollbar-thumb-[#1C1C1E]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: '🏠 Alquiler o Hipoteca (Gasto fijo)', value: expenseHousing, set: setExpenseHousing },
                  { label: '🛒 Supermercado (Límite deseado)', value: expenseFood, set: setExpenseFood },
                  { label: '🚗 Coche y Gasolina (Estimación)', value: expenseTransport, set: setExpenseTransport },
                  { label: '🍿 Suscripciones y Ocio (Límite)', value: expenseLeisure, set: setExpenseLeisure },
                  { label: '💸 Otros e Imprevistos', value: expenseOther, set: setExpenseOther },
                ].map((item, index) => (
                  <div key={index}>
                    <label className="block text-xs text-[#8E8E93] mb-1.5">{item.label}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] text-xs font-mono">{currency}</span>
                      <input
                        type="number"
                        value={item.value}
                        onChange={(e) => item.set(Number(e.target.value))}
                        className="w-full bg-[#050505] border border-[#ffffff10] rounded-xl pl-8 pr-3 py-2.5 text-white focus:outline-none focus:border-[#00FF66]/50 transition-all font-mono text-base"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: ASSETS & RISKS */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center space-x-2 text-[#00FF66] font-mono text-xs uppercase tracking-widest">
              <ShieldAlert size={14} />
              <span>Paso 5 de 6: Tu Saldo Bancario</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white text-center">¿Cuál es tu saldo bancario actual?</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed text-center max-w-md mx-auto">
              Introduce el dinero que tienes disponible actualmente en tu cuenta bancaria para que podamos calcular tu balance inicial.
            </p>

            <div className="space-y-5 pt-2">
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2 text-center">Dinero en el banco</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] text-sm font-mono">{currency}</span>
                    <input
                      type="number"
                      value={currentSavings}
                      onChange={(e) => setCurrentSavings(Number(e.target.value))}
                      className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-9 pr-4 py-3.5 text-white focus:outline-none focus:border-[#00FF66]/50 transition-all font-mono text-sm text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">¿Cómo prefieres hacer crecer tu dinero?</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'Bajo', label: 'Tranquilo (Riesgo Bajo)', desc: 'Prefiero asegurar mi dinero, odio los sustos y las bajadas.' },
                    { key: 'Medio', label: 'Equilibrado (Riesgo Medio)', desc: 'Quiero que mi dinero crezca poco a poco arriesgando lo justo.' },
                    { key: 'Alto', label: 'Atrevido (Riesgo Alto)', desc: 'Busco las mayores ganancias aunque el mercado suba y baje.' }
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setRiskLevel(lvl.key as RiskLevel)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        riskLevel === lvl.key
                          ? 'bg-[#00FF66]/10 border-[#00FF66] text-white shadow-md shadow-[#00FF66]/5'
                          : 'bg-[#050505] border-[#ffffff10] text-[#8E8E93] hover:border-white/20'
                      }`}
                    >
                      <div className={`text-xs font-bold ${riskLevel === lvl.key ? 'text-[#00FF66]' : 'text-slate-300'}`}>{lvl.label}</div>
                      <div className="text-[10px] text-[#8E8E93] mt-1.5 leading-relaxed">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 6: FINANCIAL GOALS */}
        {step === 6 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center space-x-2 text-[#00FF66] font-mono text-xs uppercase tracking-widest">
              <Award size={14} />
              <span>Paso 6 de 6: Tus Sueños</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">¿Cuáles son tus mayores metas o ilusiones?</h2>
            <p className="text-sm text-[#8E8E93] leading-relaxed">
              Selecciona uno o varios objetivos que te hagan ilusión. Te ayudaremos a calcular cuánto ahorrar al mes para lograrlos sin esfuerzo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {availableGoals.map((goal) => {
                const isSelected = primaryGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#00FF66]/10 border-[#00FF66] text-white font-bold'
                        : 'bg-[#050505] border-[#ffffff10] text-[#8E8E93] hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-medium">{friendlyGoalLabels[goal] || goal}</span>
                    {isSelected && (
                      <span className="text-[10px] font-mono bg-[#00FF66] text-black px-1.5 py-0.5 rounded font-bold">ACTIVO</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Bottom controls */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-[#ffffff08]">
          <button
            type="button"
            onClick={handleBack}
            className={`px-5 py-3 rounded-xl text-xs font-semibold border border-[#ffffff10] text-[#8E8E93] hover:text-white hover:border-white/20 transition-all cursor-pointer ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            Atrás
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,255,102,0.15)]"
          >
            <span>{step === 6 ? '¡Comenzar ya!' : 'Siguiente'}</span>
            <ArrowRight size={14} className="stroke-[2.5]" />
          </button>
        </div>

        {/* CURRENCY MODAL */}
        <AnimatePresence>
          {showCurrencyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-lg bg-[#121214] border border-[#ffffff10] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
              >
                <div className="p-6 border-b border-[#ffffff08] flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">Todas las Monedas</h3>
                    <p className="text-xs text-[#8E8E93] mt-1">Busca y selecciona tu moneda local</p>
                  </div>
                  <button 
                    onClick={() => setShowCurrencyModal(false)}
                    className="p-2 hover:bg-white/5 rounded-full text-[#8E8E93] hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o código (Ej: USD, Peso...)"
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-10 pr-4 py-3 text-white placeholder-[#8E8E93] focus:outline-none focus:border-[#00FF66]/30 transition-all text-sm"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-1 scrollbar-thin scrollbar-thumb-[#1C1C1E]">
                  {filteredCurrencies.length > 0 ? (
                    filteredCurrencies.map((cur) => (
                      <button
                        key={cur.code}
                        onClick={() => {
                          setCurrency(cur.key);
                          setShowCurrencyModal(false);
                          setCurrencySearch('');
                        }}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${
                          currency === cur.key
                            ? 'bg-[#00FF66]/10 text-[#00FF66]'
                            : 'hover:bg-white/5 text-[#F5F5F7]'
                        }`}
                      >
                        <div className="flex items-center space-x-4 text-left">
                          <div className="w-12 h-10 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 shrink-0">
                            <span className={`font-mono font-bold text-[#00FF66] ${cur.key.length > 2 ? 'text-[10px]' : 'text-sm'}`}>
                              {cur.key}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{cur.label}</p>
                            <p className="text-[10px] text-[#8E8E93] font-mono uppercase tracking-wider">{cur.code}</p>
                          </div>
                        </div>
                        {currency === cur.key && <div className="w-2 h-2 rounded-full bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />}
                      </button>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-[#8E8E93] text-sm">No hemos encontrado ninguna moneda con ese nombre</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
