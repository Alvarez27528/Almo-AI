/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AppState, UserProfile, WorkType, RiskLevel } from '../types';
import TermsModal from './TermsModal';
import { auth } from '../firebase';
import { hashPin } from '../utils/pin';
import { 
  Settings as SettingsIcon, 
  User, 
  HelpCircle, 
  Sparkles, 
  CheckCircle, 
  RefreshCw, 
  Download, 
  Trash2,
  Lock,
  Globe,
  LogOut,
  Scale
} from 'lucide-react';

interface SettingsProps {
  state: AppState;
  onUpdateProfile: (p: UserProfile) => void;
  onResetData: () => void;
  onLogout: () => void;
}

export default function Settings({ state, onUpdateProfile, onResetData, onLogout }: SettingsProps) {
  const profile = state.userProfile!;
  
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [country, setCountry] = useState(profile.country);
  const [currency, setCurrency] = useState(profile.currency);
  const [workType, setWorkType] = useState<WorkType>(profile.workType);
  const [profession, setProfession] = useState(profile.profession);
  const [company, setCompany] = useState(profile.company || '');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(profile.riskLevel);
  const [securityPin, setSecurityPin] = useState(profile.securityPin || '');
  const [protectedTabs, setProtectedTabs] = useState<string[]>(profile.protectedTabs || ['settings', 'investments']);
  const [resetPinEmailSent, setResetPinEmailSent] = useState(false);
  const [pinMode, setPinMode] = useState<'create' | 'locked'>(profile.securityPin ? 'locked' : 'create');
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const [saved, setSaved] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (protectedTabs.length > 0 && pinMode === 'create' && securityPin.length !== 4) {
      alert('Debes configurar un PIN de seguridad de exactamente 4 dígitos para proteger apartados.');
      return;
    }
    if (pinMode === 'create' && securityPin && /^(\d)\1{3}$|^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)$/.test(securityPin)) {
      alert('Ese PIN es demasiado predecible. Elige otra combinación.');
      return;
    }
    // Never store the PIN in plain text
    const newPin = pinMode === 'locked'
      ? profile.securityPin
      : (securityPin.trim() ? await hashPin(securityPin.trim()) : undefined);

    const updatedProfile: UserProfile = {
      ...profile,
      name: name.trim() || profile.name,
      age: Number(age) || profile.age,
      country: country.trim() || profile.country,
      currency,
      workType,
      profession: profession.trim() || profile.profession,
      company: company.trim() ? company.trim() : undefined,
      riskLevel,
      securityPin: newPin,
      protectedTabs
    };

    onUpdateProfile(updatedProfile);
    if (pinMode === 'create' && newPin) { setPinMode('locked'); setSecurityPin(''); }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRequestPinReset = async () => {
    const email = auth.currentUser?.email;
    if (!email) {
      alert('Debes iniciar sesión con correo para cambiar el PIN.');
      return;
    }

    setResetPinEmailSent(true);
    try {
      const res = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, intent: 'settings_pin_change' })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar código');
      }

      if (data.smtpConfigured === false && data.code) {
        // Fallback para desarrollo si SMTP no está configurado
        alert(`Modo desarrollo: El código es ${data.code} (revisa la consola)`);
      }

      setTimeout(() => {
        setResetPinEmailSent(false);
        setShowVerification(true);
      }, 1500);

    } catch (error: any) {
      alert(error.message);
      setResetPinEmailSent(false);
    }
  };

  const handleVerifyPinCode = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;

    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setPinMode('create');
        setSecurityPin('');
        setShowVerification(false);
        setVerificationCode('');
      } else {
        alert(data.error || 'Código incorrecto');
      }
    } catch (error: any) {
      alert('Error al verificar el código');
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fiducia_ai_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="settings-view" className="space-y-6 font-sans">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <SettingsIcon className="text-emerald-400" size={24} />
          Configuración Global del Sistema
        </h1>
        <p className="text-xs text-slate-400">
          Modifica tus coeficientes, perfiles de riesgo, parámetros demográficos y gestiona tus copias de seguridad de datos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2 cols span): Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          
          <form onSubmit={handleSaveSettings} className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-5">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
              <User size={16} className="text-emerald-400" />
              Editar Información de Perfil
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Edad</label>
                <input
                  type="number"
                  required
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">País de Residencia</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Profesión / Cargo</label>
                <input
                  type="text"
                  required
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Empresa</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Perfil de Riesgo Inversor</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Bajo">Conservador (Preservar capital)</option>
                  <option value="Medio">Moderado (Crecimiento estable)</option>
                  <option value="Alto">Decidido (Maximizar volatilidad/TIR)</option>
                </select>
              </div>
            </div>

            <div className="relative flex items-center justify-center py-2">
              <div className="w-full border-t border-slate-850"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Moneda Preferida</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="€">Euro (€)</option>
                  <option value="$">Dólar ($)</option>
                  <option value="£">Libra (£)</option>
                  <option value="MXN$">Peso Mexicano ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Régimen Laboral</label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value as WorkType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Empleado">Empleado por cuenta ajena</option>
                  <option value="Autónomo">Autónomo / Freelancer</option>
                  <option value="Empresario">Empresario / Propietario</option>
                  <option value="Estudiante">Estudiante</option>
                  <option value="Desempleado">Búsqueda activa o jubilado</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-4 mt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Lock size={16} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-200 mb-1">Protección por PIN local</h4>
                  <p className="text-xs text-slate-400 mb-3">
                    Solicita un PIN de 4 dígitos al acceder a los apartados que elijas para mayor privacidad en tu dispositivo.
                  </p>
                  
                  <div className="space-y-6 mt-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Apartados Protegidos</label>
                      <p className="text-xs text-slate-500 mb-3">Si no quieres usar el PIN, simplemente desmarca todas las casillas.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: 'dashboard', label: 'Panel Principal' },
                          { key: 'transactions', label: 'Movimientos' },
                          { key: 'investments', label: 'Cartera Inversión' },
                          { key: 'settings', label: 'Configuración' },
                          { key: 'plans', label: 'Planes Estratégicos' },
                        ].map(tab => (
                          <div key={tab.key} className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
                            <input
                              type="checkbox"
                              id={`protect-${tab.key}`}
                              checked={protectedTabs.includes(tab.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setProtectedTabs([...protectedTabs, tab.key]);
                                } else {
                                  setProtectedTabs(protectedTabs.filter(t => t !== tab.key));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                            />
                            <label htmlFor={`protect-${tab.key}`} className="text-sm text-slate-300 cursor-pointer flex-1">{tab.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-5">
                      {pinMode === 'locked' ? (
                        <div className="flex flex-col items-start gap-4 bg-slate-900/50 p-4 rounded-xl border border-emerald-500/10">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-emerald-400" />
                            <span className="text-sm text-emerald-400 font-medium">PIN de seguridad configurado</span>
                          </div>
                          
                          {showVerification ? (
                            <div className="w-full bg-slate-950 border border-emerald-500/30 p-4 rounded-xl mt-2 animate-in fade-in">
                              <p className="text-sm text-slate-300 mb-3">
                                Hemos enviado un código de 6 dígitos a tu correo electrónico registrado. Por favor, introdúcelo para autorizar el cambio de PIN.
                              </p>
                              <div className="flex flex-wrap items-center gap-3">
                                <input 
                                  type="text"
                                  maxLength={6}
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                  placeholder="000000"
                                  className="w-32 bg-black border border-slate-700 rounded-lg px-3 py-2 text-center tracking-widest text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                                />
                                <button 
                                  type="button"
                                  onClick={handleVerifyPinCode}
                                  className="px-4 py-2 bg-white hover:bg-[#E5E5EA] text-black font-bold rounded-lg text-sm transition-colors"
                                >
                                  Verificar Código
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setShowVerification(false)}
                                  className="px-3 py-2 text-slate-400 hover:text-white text-sm"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRequestPinReset}
                              className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                                resetPinEmailSent 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-white hover:bg-[#E5E5EA] text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                              }`}
                            >
                              {resetPinEmailSent ? '📧 Enviando correo...' : '🔒 Cambiar PIN de seguridad'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Configurar PIN Inicial (4 dígitos)</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={4}
                            placeholder="••••"
                            value={securityPin}
                            onChange={(e) => setSecurityPin(e.target.value.replace(/\D/g, ''))}
                            className="w-full sm:w-40 bg-[#0E0E10] border border-white/[0.06] rounded-xl px-4 py-3 text-center text-lg tracking-[0.5em] text-emerald-400 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {saved ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-xs flex items-center justify-center gap-2">
                <CheckCircle size={14} />
                <span>Perfil actualizado con éxito</span>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-white hover:bg-[#E5E5EA] font-semibold text-black text-xs transition-all shadow-md mt-4"
              >
                Guardar Ajustes de Perfil
              </button>
            )}

          </form>

        </div>

        {/* Right column: Backup, GDPR, Reset */}
        <div className="space-y-6">
          
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-5">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Globe size={16} className="text-indigo-400" />
              Gestión de Datos y Copias
            </h3>

            <div className="space-y-3 text-xs leading-normal">
              <p className="text-slate-400">
                Tus datos financieros se encriptan y guardan de forma segura de acuerdo con normativas europeas GDPR. Puedes descargar una copia completa en formato estructurado JSON.
              </p>

              <button
                onClick={handleExportData}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-750"
              >
                <Download size={14} />
                <span>Exportar Copia de Seguridad</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTermsOpen(true)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-800 cursor-pointer"
              >
                <Scale size={14} />
                <span>Ver Términos y Condiciones de Uso</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-slate-850"></div>
            </div>

            {/* Session Management */}
            <div className="space-y-3 text-xs leading-normal">
              <span className="text-[10px] font-mono text-[#00FF66] uppercase tracking-widest block">Sesión de Usuario</span>
              <p className="text-slate-400">
                Puedes cerrar sesión cuando quieras. Todos tus datos financieros seguirán guardados a buen recaudo en la nube de Firebase.
              </p>

              <button
                onClick={onLogout}
                className="w-full py-2.5 rounded-xl bg-[#00FF66]/10 hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-[#00FF66]/20 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Cerrar Sesión Segura</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-slate-850"></div>
            </div>

            {/* Reset data */}
            <div className="space-y-3 text-xs leading-normal">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest block">Zona de Peligro</span>
              
              {!showResetConfirm ? (
                <>
                  <p className="text-slate-500">
                    Si deseas eliminar tu cuenta permanentemente y empezar de cero, puedes ejecutar un restablecimiento total. Se borrarán todos tus datos de la nube y tu cuenta de usuario.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 border border-red-500/20 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar Cuenta y Datos (Restablecer)</span>
                  </button>
                </>
              ) : (
                <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2 text-red-400">
                    <Trash2 size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs">¿Confirmas la eliminación permanente?</h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Esta acción es irreversible. Se borrarán tus transacciones, inversiones, retos y tu usuario en ALMO AI. Deberás registrarte de nuevo.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-medium block">
                      Escribe <strong className="text-red-400 select-all">ELIMINAR</strong> para confirmar:
                    </label>
                    <input
                      type="text"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      placeholder="Escribe ELIMINAR"
                      className="w-full px-3 py-2 bg-black/60 border border-red-500/30 rounded-xl text-base text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetConfirm(false);
                        setConfirmInput('');
                      }}
                      className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition-all cursor-pointer text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={confirmInput !== 'ELIMINAR'}
                      onClick={() => {
                        onResetData();
                        setShowResetConfirm(false);
                        setConfirmInput('');
                      }}
                      className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs transition-all cursor-pointer text-center"
                    >
                      Sí, Borrar Todo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-indigo-950/10 border border-indigo-500/20 p-5 rounded-[28px] space-y-3">
            <div className="flex items-center space-x-1.5 text-indigo-400 font-mono text-xs uppercase tracking-wider">
              <Lock size={14} />
              <span>Garantía de Privacidad ALMO AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              "ALMO AI procesa tus API Keys de Gemini y registros estrictamente en tu servidor local, protegiendo tu patrimonio de fugas, rastreadores o publicidad intrusiva. Navega con absoluta confianza y libertad."
            </p>
          </div>

        </div>

      </div>

      {/* Terms and Conditions Modal */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

    </div>
  );
}
