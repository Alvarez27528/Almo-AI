/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Transaction } from '../types';
import { formatCurrency } from '../utils/finance';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  Scan, 
  Camera, 
  Upload, 
  Sparkles, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Save, 
  AlertCircle 
} from 'lucide-react';

interface AIScannerProps {
  state: AppState;
  onSaveScannedTransaction: (t: Transaction) => void;
  onNavigateToRegistry: () => void;
}

interface ScanResult {
  merchant: string;
  date: string;
  products: { name: string; price: number; quantity?: number }[];
  tax: number;
  total: number;
  category: string;
  establishmentType?: string;
  detectedLanguage?: string;
}

export default function AIScanner({ state, onSaveScannedTransaction, onNavigateToRegistry }: AIScannerProps) {
  const profile = state.userProfile!;
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [usage, setUsage] = useState({ count: 0, limit: 1 });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        const uid = firebaseUser.uid;
        if (email && uid) {
          fetch(`/api/gemini/scan/usage?userEmail=${encodeURIComponent(email)}&userId=${uid}`)
            .then(res => res.json())
            .then(data => setUsage(data))
            .catch(console.error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startScanning = async () => {
    setScanning(true);
    setResult(null);
    setError(null);
    setSaved(false);

    // High-fidelity scan steps animation
    const steps = [
      'Iniciando OCR y procesamiento de imagen...',
      'Estructurando semántica de líneas...',
      'Leyendo artículos y precios unitarios...',
      'Calculando impuestos indirectos (IVA)...',
      'Asignando categoría financiera óptima...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setScanStatus(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    try {
      const response = await fetch('/api/gemini/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageFile,
          userEmail: auth.currentUser?.email || 'anonymous',
          userId: auth.currentUser?.uid || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API scanner error');
      }

      const data = await response.json();
      setResult(data);
      setUsage(prev => ({ ...prev, count: prev.count + 1 }));
    } catch (error: any) {
      console.error('Scan failed:', error);
      setError(`Error al escanear el ticket: ${error.message || 'Error desconocido'}`);
    } finally {
      setScanning(false);
    }
  };

  const handleSaveResult = () => {
    if (!result) return;

    const newTx: Transaction = {
      id: `tx-scanned-${Date.now()}`,
      amount: result.total,
      type: 'expense',
      date: result.date || new Date().toISOString().split('T')[0],
      category: result.category || 'Alimentación',
      description: result.merchant || 'Gasto Escaneado IA',
      paymentMethod: 'Tarjeta Apple Pay',
      notes: `Escaneado por ALMO AI OCR. Tipo: ${result.establishmentType || 'Otros'}. Idioma: ${result.detectedLanguage || 'Desconocido'}. Detalle: ${result.products.map(p => p.name).join(', ')}`
    };

    onSaveScannedTransaction(newTx);
    setSaved(true);
  };

  const isPremiumUser = state.plan === 'Premium' || state.userRank === 'VIP';

  return (
    <div id="ai-scanner-view" className="space-y-6">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Scan className="text-emerald-400" size={24} />
          Escáner de Tickets Inteligente
        </h1>
        {isPremiumUser ? (
          <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 mt-2">
            <Sparkles size={11} className="animate-pulse text-emerald-400" />
            Escaneo Ilimitado Premium
          </div>
        ) : (
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded inline-block mt-2">
            Escaneos hoy: {usage.count} / {usage.limit}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">
          Sube la foto de cualquier ticket o factura. Nuestra IA reconocerá de forma inmediata el comercio, productos, IVA e importes para registrarlo al instante.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Receipt selector & image viewport */}
        <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-6">
          <h2 className="text-md font-bold text-slate-200">1. Sube el Ticket</h2>
          
          {/* File Upload zone */}
          <div className="border border-dashed border-slate-800 rounded-2xl p-6 hover:border-emerald-500/50 bg-slate-950/40 text-center transition-all relative">
            {imageFile ? (
              <div className="space-y-3">
                <img src={imageFile} alt="Uploaded Receipt" className="max-h-48 mx-auto rounded-lg object-contain" />
                <button
                  onClick={() => setImageFile(null)}
                  className="text-xs font-mono text-red-400 hover:text-red-300 underline block mx-auto"
                >
                  Quitar imagen
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block space-y-3">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-800">
                  <Camera size={20} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 block">Sube un ticket o arrástralo</span>
                  <span className="text-[10px] text-slate-500 block mt-1 font-mono">Formatos admitidos: PNG, JPG</span>
                </div>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* Spacer */}
          <div className="pt-2"></div>

          <button
            onClick={() => startScanning()}
            disabled={scanning || !imageFile}
            className="w-full py-4 rounded-xl bg-white hover:bg-[#E5E5EA] text-slate-950 hover:shadow-lg hover:shadow-emerald-500/20 font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Sparkles size={16} />
            <span>{scanning ? 'Escaneando con IA...' : 'Comenzar Escaneo Inteligente'}</span>
          </button>
        </div>

        {/* Right Side: Scan progression and OCR results */}
        <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] flex flex-col justify-between min-h-[480px]">
          
          <AnimatePresence mode="wait">
            
            {/* 1. SCANNINNG OVERLAY */}
            {scanning && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-12"
              >
                {/* Simulated laser scan viewport */}
                <div className="w-48 h-64 border-2 border-emerald-500/30 rounded-xl relative overflow-hidden bg-slate-950/40 flex items-center justify-center">
                  <FileText className="text-slate-700 animate-pulse" size={48} />
                  
                  {/* Laser green bar */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_rgba(52,211,153,1)]"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="animate-spin text-emerald-400" size={14} />
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">ALMO AI OCR Activo</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">{scanStatus}</p>
                </div>
              </motion.div>
            )}

            {/* 2. SCAN RESULT DISPLAY */}
            {error && !scanning && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                  <AlertCircle size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-bold text-slate-200">Error de Escaneo</h3>
                  <p className="text-xs text-slate-400 max-w-[240px] mt-1 mx-auto">{error}</p>
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    setImageFile(null);
                  }}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Intentar otro ticket
                </button>
              </motion.div>
            )}
            {result && !scanning && !error && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col justify-between space-y-6"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">Lectura Completada</span>
                      <h3 className="text-xl font-bold text-white mt-2">{result.merchant}</h3>
                    </div>
                    <FileText className="text-slate-500" size={24} />
                  </div>

                  {/* Receipt metadata table */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 mt-4">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Fecha Detectada</span>
                      <span className="text-xs font-semibold text-slate-200">{result.date}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase block">Categoría Financiera</span>
                      <span className="text-xs font-semibold text-emerald-400">{result.category}</span>
                    </div>
                    {result.establishmentType && (
                      <div className="pt-2 border-t border-slate-800/40">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Establecimiento</span>
                        <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                          {result.establishmentType === 'Restaurante' ? '🍴 Restaurante (Ocio)' : result.establishmentType === 'Supermercado' ? '🛒 Supermercado (Alim.)' : `🏢 ${result.establishmentType}`}
                        </span>
                      </div>
                    )}
                    {result.detectedLanguage && (
                      <div className="pt-2 border-t border-slate-800/40">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">Idioma Detectado</span>
                        <span className="text-xs font-semibold text-sky-400 flex items-center gap-1">
                          🌐 {result.detectedLanguage}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Products Details list */}
                  <div className="mt-6 space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Artículos Detallados</span>
                    <div className="divide-y divide-slate-800/40 max-h-36 overflow-y-auto pr-1">
                      {result.products.map((p, idx) => (
                        <div key={idx} className="py-2 flex justify-between text-xs text-slate-300">
                          <span>{p.name} {p.quantity ? `(x${p.quantity})` : ''}</span>
                          <span className="font-mono">{formatCurrency(p.price, profile.currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mt-6 pt-4 border-t border-slate-800 space-y-1.5 text-right">
                    <div className="text-xs text-slate-500 font-mono flex justify-between items-center">
                      <span>Base + IVA de ley:</span>
                      <span>{formatCurrency(result.tax, profile.currency)}</span>
                    </div>
                    <div className="text-lg font-semibold text-white flex justify-between items-center font-mono">
                      <span>Total Factura:</span>
                      <span>{formatCurrency(result.total, profile.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Save actions */}
                <div className="space-y-2">
                  {saved ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-xs flex items-center justify-center gap-2">
                      <CheckCircle size={14} />
                      <span>¡Movimiento registrado con éxito en tu cartera!</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleSaveResult}
                      className="w-full py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Save size={16} />
                      <span>Registrar Gasto Automáticamente</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setResult(null);
                      setImageFile(null);
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white font-semibold text-xs transition-all text-center"
                  >
                    Escanear otro ticket
                  </button>
                </div>

              </motion.div>
            )}

            {/* 3. DEFAULT PLACEHOLDER SCREEN */}
            {!result && !scanning && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-12"
              >
                <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-800 shadow-inner">
                  <Scan size={28} />
                </div>
                <div>
                  <h3 className="text-md font-bold text-slate-300">Esperando origen</h3>
                  <p className="text-xs text-slate-500 max-w-[240px] mt-1 mx-auto">
                    Sube una captura real para ver el OCR inteligente.
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
