import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import TermsModal from './TermsModal';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  Landmark, 
  Mail, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  CheckCircle,
  HelpCircle,
  Key
} from 'lucide-react';

export default function AuthView() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password Recovery States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: email, 2: code & new password, 3: success
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryDevCode, setRecoveryDevCode] = useState('');

  // Flow control states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSmtpConfigured, setIsSmtpConfigured] = useState(true);
  const [devVerificationCode, setDevVerificationCode] = useState('');

  const [rememberMe, setRememberMe] = useState(false);
  
  useEffect(() => {
    const forceRegister = localStorage.getItem('forceRegister');
    if (forceRegister === 'true') {
      setIsSignUp(true);
      localStorage.removeItem('forceRegister');
    } else {
      const savedEmail = localStorage.getItem('savedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  // Terms and conditions states
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleInitialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('Debes leer y aceptar los Términos y Condiciones para continuar.');
      return;
    }

    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 letras o números.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Compruébalas de nuevo.');
      return;
    }

    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('savedEmail', email);
      // Set persistence to LOCAL if "Remember me" is checked
      await setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error:", err));
    } else {
      localStorage.removeItem('savedEmail');
      // Set persistence to SESSION if "Remember me" is NOT checked
      await setPersistence(auth, browserSessionPersistence).catch(err => console.error("Persistence error:", err));
    }

    try {
      if (isSignUp) {
        // Verificar primero si el correo ya está registrado antes de enviar códigos de verificación
        const res = await fetch('/api/check-email-registered', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
        const data = await res.json();
        if (data.registered) {
          setError('Este correo electrónico ya está registrado en ALMO AI. Por favor, inicia sesión.');
          setLoading(false);
          return;
        }
      } else {
        // Si estamos en modo de inicio de sesión, verificamos PRIMERO si el correo y contraseña son correctos
        // Hacemos un intento de login de prueba
        await signInWithEmailAndPassword(auth, email, password);
        // Desconectamos de inmediato para exigir la verificación por código de 6 dígitos
        await auth.signOut();
      }
      
      // Enviar el código de verificación INMEDIATAMENTE tras verificar los datos del usuario
      const sendRes = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        throw new Error(sendData.error || 'No se pudo enviar el código de verificación.');
      }

      setIsSmtpConfigured(sendData.smtpConfigured !== false);
      if (sendData.smtpConfigured === false && sendData.code) {
        setDevVerificationCode(sendData.code);
      } else {
        setDevVerificationCode('');
      }

      setVerificationStep(true);
    } catch (err: any) {
      console.error('Error al comprobar credenciales:', err);
      let msg = 'El correo o la contraseña introducidos no son correctos.';
      if (err.code === 'auth/invalid-email') {
        msg = 'El formato del correo electrónico no es válido.';
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'El correo o la contraseña no son correctos. Compruébalos bien.';
      } else if (err.code === 'auth/wrong-password') {
        msg = 'Contraseña incorrecta. Compruébala de nuevo u obtén una nueva.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Cuenta bloqueada temporalmente por demasiados intentos. Por favor, restablece tu contraseña o inténtalo más tarde.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!recoveryEmail) {
      setError('Por favor, introduce tu correo electrónico.');
      setLoading(false);
      return;
    }

    try {
      // Verificar si el correo está registrado en el sistema antes de disparar el correo de recuperación
      const checkRes = await fetch('/api/check-email-registered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim() })
      });
      const checkData = await checkRes.json();
      
      if (!checkData.registered) {
        setError('No existe ninguna cuenta registrada en ALMO AI con este correo electrónico.');
        setLoading(false);
        return;
      }

      // Solicitar código de recuperación seguro al backend (usando SMTP configurado)
      const res = await fetch('/api/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo generar el código de recuperación.');
      }

      setIsSmtpConfigured(data.smtpConfigured !== false);
      if (data.smtpConfigured === false && data.code) {
        setRecoveryDevCode(data.code);
      } else {
        setRecoveryDevCode('');
      }

      setRecoveryStep(2); // Ir al paso de ingresar el código y nueva contraseña
    } catch (err: any) {
      console.error('Error al solicitar recuperación de contraseña:', err);
      let msg = err.message;
      if (err.code === 'auth/user-not-found') {
        msg = 'No existe ninguna cuenta registrada con este correo electrónico.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'El formato del correo electrónico no es válido.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Hemos bloqueado todas las solicitudes de este dispositivo debido a actividad inusual. Inténtalo más tarde.';
      }
      setError(msg || 'No se pudo enviar el correo de restablecimiento. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!recoveryCode || !newPassword) {
      setError('Por favor, completa todos los campos.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 letras o números.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/confirm-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail.trim(),
          code: recoveryCode,
          newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'El código ingresado es incorrecto o ha expirado.');
      }

      setRecoveryStep(3); // Mostrar pantalla de éxito
    } catch (err: any) {
      console.error('Error al restablecer contraseña:', err);
      setError(err.message || 'Error al restablecer la contraseña. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!verificationCode) {
      setError('Por favor, introduce el código de verificación.');
      setLoading(false);
      return;
    }

    try {
      // Verify the 6-digit code on the backend
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Trigger unusual login alert via SMTP
        fetch('/api/send-automated-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'unusual_login',
            email: email,
            details: {
              reason: 'Código de verificación de 6 dígitos incorrecto ingresado en la pantalla de verificación.',
              device: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido',
              ip: '127.0.0.1'
            }
          })
        }).catch(err => console.error('Error al enviar alerta de inicio inusual:', err));

        throw new Error(data.error || 'El código de verificación es incorrecto.');
      }

      // Code matches, set persistence and perform the real Firebase signup or login
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence).catch(err => console.error("Persistence error:", err));
      
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Prueba a iniciar sesión.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('El correo o la contraseña no son correctos. Compruébalos bien.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo no parece válido. Escríbelo de nuevo.');
      } else {
        setError(err.message || 'Error de autenticación. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Set persistence for Google Login too
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence).catch(err => console.error("Persistence error:", err));
      
      // Sugerencia: Usar un prompt para forzar selección de cuenta si es necesario
      provider.setCustomParameters({ prompt: 'select_account' });
      
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Error Google Login:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // El usuario cerró el popup, no mostramos error crítico
        return;
      }
      
      let msg = 'No se pudo conectar con Google.';
      if (err.code === 'auth/unauthorized-domain') {
        msg = `Este dominio (${window.location.hostname}) no está autorizado en Firebase. Por favor, añádelo en la consola de Firebase > Autenticación > Ajustes > Dominios autorizados.`;
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'El navegador ha bloqueado la ventana emergente. Por favor, permite las ventanas emergentes para este sitio o usa correo y contraseña.';
      } else if (isInIframe) {
        msg = 'Google Sign-In suele fallar dentro de la vista previa por restricciones de seguridad. Por favor, haz clic en el botón superior derecho para abrir la app en una pestaña nueva y vuelve a intentarlo.';
      } else {
        msg = `Error: ${err.message || 'Error desconocido al conectar con Google'}.`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-[#050505] text-[#F5F5F7] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans selection:bg-[#00FF66]/20 selection:text-[#00FF66]">
      {/* Glow ambient background lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.06)_0,transparent_60%)] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.03)_0,transparent_60%)] pointer-events-none rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#121214] border border-[#ffffff08] rounded-3xl p-8 shadow-2xl relative z-10"
      >
        {/* Brand Logo and Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-[#00FF66] to-[#10B981] text-black shadow-[0_0_20px_rgba(0,255,102,0.25)] flex items-center justify-center mb-4">
            <Landmark size={28} className="stroke-[2.5]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-[#00FF66] to-white bg-clip-text text-transparent">
            ALMO AI
          </h1>
          <p className="text-xs text-[#00FF66] font-mono uppercase tracking-widest mt-1.5 flex items-center gap-1 justify-center">
            <Sparkles size={12} />
            Tu dinero, seguro y ordenado
          </p>
        </div>

        {/* Dynamic headings for simple understanding */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-medium text-white">
            {isForgotPassword 
              ? recoveryStep === 1
                ? 'Recuperar Contraseña'
                : recoveryStep === 2
                  ? 'Verifica tu Identidad'
                  : 'Contraseña Actualizada'
              : showConfirmation 
                ? '¿Son correctos tus datos?' 
                : verificationStep 
                  ? 'Código de Verificación' 
                  : isSignUp 
                    ? 'Crea tu cuenta de ahorro' 
                    : 'Inicia sesión'}
          </h2>
          <p className="text-sm text-[#8E8E93] mt-1.5 leading-relaxed">
            {isForgotPassword
              ? recoveryStep === 1
                ? 'Introduce tu correo para recibir un código de recuperación seguro.'
                : recoveryStep === 2
                  ? 'Ingresa el código que te hemos enviado y define tu nueva contraseña.'
                  : 'Tu contraseña secreta de ALMO AI ha sido actualizada correctamente.'
              : showConfirmation
                ? 'Por favor, comprueba que has escrito tu correo y contraseña correctamente antes de continuar.'
                : verificationStep 
                  ? 'Por seguridad, ingresa el código enviado para verificar la propiedad de tu correo.'
                  : isSignUp 
                    ? 'Guarda todo tu progreso en la nube de forma segura para no perder nada aunque cierres la app.' 
                    : 'Bienvenido de vuelta. Introduce tus datos para ver tus metas, gastos y ahorros actualizados.'
            }
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium leading-relaxed"
          >
            {error}
          </motion.div>
        )}

        {isForgotPassword ? (
          /* Password Recovery Flow */
          recoveryStep === 1 ? (
            <form onSubmit={handlePasswordRecovery} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">
                    Tu Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                    <input 
                      type="email"
                      required
                      placeholder="ejemplo@correo.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-[#8E8E93] text-base focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/20 transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#ffffff03] border border-white/5 text-[11px] text-[#8E8E93] leading-relaxed space-y-1">
                  <span className="font-semibold text-white block">📌 Información importante:</span>
                  <p>Recibirás un correo oficial de restablecimiento de contraseña de ALMO AI.</p>
                  <p>Si no lo encuentras en unos minutos, revisa tu carpeta de <strong>Spam o Correo No Deseado</strong>.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,102,0.15)] disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enviar código de recuperación</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError('');
                  }}
                  className="w-full text-center text-xs text-[#8E8E93] hover:text-white transition-all bg-transparent border-none py-2 cursor-pointer"
                >
                  Cancelar y volver atrás
                </button>
              </div>
            </form>
          ) : recoveryStep === 2 ? (
            <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Hemos generado un código de recuperación seguro para <strong className="text-white">{recoveryEmail}</strong>.
              </p>

              {!isSmtpConfigured && recoveryDevCode && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed space-y-1">
                  <p className="font-bold text-amber-300">ℹ️ Código de recuperación generado:</p>
                  <p>Para probar en desarrollo sin correo configurado, introduce este código:</p>
                  <div className="font-mono text-center text-lg font-bold bg-slate-950/80 p-2 rounded-lg text-white tracking-widest mt-2 border border-white/5 select-all">
                    {recoveryDevCode}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">
                    Código de 6 dígitos
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                    <input 
                      type="text"
                      required
                      maxLength={6}
                      placeholder="000000"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-[#8E8E93] text-base focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/20 transition-all font-mono tracking-widest text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">
                    Nueva Contraseña Secreta
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                    <input 
                      type="password"
                      required
                      placeholder="Al menos 6 letras o números"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-[#8E8E93] text-base focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/20 transition-all font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,102,0.15)] disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Restablecer Contraseña</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecoveryStep(1);
                    setError('');
                  }}
                  className="w-full text-center text-xs text-[#8E8E93] hover:text-white transition-all bg-transparent border-none py-2 cursor-pointer"
                >
                  Volver atrás
                </button>
              </div>
            </form>
          ) : (
            /* recoveryStep === 3 */
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/20 flex items-center justify-center text-[#00FF66]">
                <CheckCircle size={24} />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm text-slate-200 font-medium">¡Contraseña restablecida!</p>
                <p className="text-xs text-[#8E8E93] max-w-xs mx-auto leading-relaxed">
                  Tu contraseña secreta de ALMO AI ha sido actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setRecoverySuccess(false);
                  setRecoveryStep(1);
                  setRecoveryEmail('');
                  setRecoveryCode('');
                  setNewPassword('');
                  setError('');
                }}
                className="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_20px_rgba(0,255,102,0.15)]"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )
        ) : verificationStep ? (
          /* Verification Code Screen */
          <form onSubmit={handleVerifyAndAuth} className="space-y-4">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              Hemos generado un código de verificación para <strong className="text-white">{email}</strong>.
            </p>

            {!isSmtpConfigured && devVerificationCode && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed space-y-1">
                <p className="font-bold text-amber-300">ℹ️ Código de verificación generado:</p>
                <p>Para probar en desarrollo sin correo configurado, introduce este código:</p>
                <div className="font-mono text-center text-lg font-bold bg-slate-950/80 p-2 rounded-lg text-white tracking-widest mt-2 border border-white/5 select-all">
                  {devVerificationCode}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2 text-center">
                Código de 6 dígitos
              </label>
              <input 
                type="text"
                required
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl px-4 py-3.5 text-center text-white placeholder-[#8E8E93] text-lg font-mono tracking-widest focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,102,0.15)] disabled:opacity-50 disabled:cursor-not-allowed mt-6 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verificar y {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setVerificationStep(false);
                setError('');
              }}
              className="w-full text-center text-xs text-[#8E8E93] hover:text-white transition-all bg-transparent border-none py-2 cursor-pointer"
            >
              Volver atrás
            </button>
          </form>
        ) : (
          /* Normal Login/Register Form */
          <form onSubmit={handleInitialSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">
                Tu Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                <input 
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-[#8E8E93] text-base focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/20 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest">
                  Tu Contraseña secreta
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setRecoveryEmail(email);
                      setError('');
                      setRecoverySuccess(false);
                      setRecoveryStep(1);
                      setRecoveryCode('');
                      setNewPassword('');
                    }}
                    className="text-[10px] text-[#00FF66] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    ¿La has olvidado?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                <input 
                  type="password"
                  required
                  placeholder="Al menos 6 letras o números"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-[#8E8E93] text-base focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/20 transition-all font-sans"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-2">
                  Repite tu Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                  <input 
                    type="password"
                    required
                    placeholder="Repite exactamente la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#050505] border border-[#ffffff10] rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-[#8E8E93] text-base focus:outline-none focus:border-[#00FF66]/50 focus:ring-1 focus:ring-[#00FF66]/20 transition-all font-sans"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-4 mb-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#ffffff20] bg-black text-[#00FF66] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#00FF66] w-4 h-4"
              />
              <label htmlFor="rememberMe" className="text-xs text-[#8E8E93] cursor-pointer font-sans">Mantener sesión iniciada</label>
            </div>

            {/* Términos y Condiciones Checkbox (Discreto y Elegante) */}
            <div className="flex items-start gap-2.5 px-1 mt-4">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-[#ffffff20] bg-black text-[#00FF66] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#00FF66] w-3.5 h-3.5"
              />
              <label htmlFor="terms-checkbox" className="text-[11px] text-[#8E8E93] leading-tight select-none cursor-pointer font-sans">
                He leído y acepto los{" "}
                <button
                  type="button"
                  onClick={() => setIsTermsOpen(true)}
                  className="text-[#00FF66] hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer inline"
                >
                  Términos, Condiciones y Política de Uso Justo de IA
                </button>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,102,0.15)] disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Empezar a ahorrar' : 'Entrar a mi cuenta'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Divider & Google sign-in only if not verifying, not in confirmation step, and not recovering password */}
        {!verificationStep && !showConfirmation && !isForgotPassword && (
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-[#ffffff08]" />
              <span className="px-3 text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider">o bien</span>
              <div className="flex-1 h-px bg-[#ffffff08]" />
            </div>

            {isInIframe && (
              <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed font-sans shadow-lg">
                <p className="mb-3 flex items-center gap-2">
                  <HelpCircle size={14} className="text-amber-400 shrink-0" />
                  <span><strong>Google Sign-In restringido:</strong> Los popups de Google están bloqueados dentro de la vista previa por seguridad del navegador.</span>
                </p>
                <button
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowRight size={14} />
                  Abrir App en Pestaña Nueva para Google
                </button>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#050505] border border-[#ffffff10] text-[#F5F5F7] font-semibold text-xs hover:bg-[#121214] hover:border-white/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-7.989 0-4.41 3.529-7.989 7.859-7.989 2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.29 1.144 15.56 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.89 11.57-11.79 0-.795-.085-1.4-.195-1.925H12.24z"/>
              </svg>
              <span>Acceder con Google</span>
            </button>
          </>
        )}

        {/* Toggle between Iniciar Sesión / Registrarse */}
        {!verificationStep && !showConfirmation && !isForgotPassword && (
          <div className="mt-8 text-center text-xs text-[#8E8E93]">
            {isSignUp ? (
              <p>
                ¿Ya tienes cuenta guardada?{' '}
                <button 
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                  }} 
                  className="text-[#00FF66] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Inicia sesión aquí
                </button>
              </p>
            ) : (
              <p>
                ¿Es tu primera vez aquí?{' '}
                <button 
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                  }} 
                  className="text-[#00FF66] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Regístrate gratis
                </button>
              </p>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-[#ffffff05] flex items-center justify-center gap-1.5 text-[10px] text-[#8E8E93] font-mono">
          <ShieldCheck size={14} className="text-[#00FF66]" />
          <span>Tus datos están protegidos en la nube</span>
        </div>
      </motion.div>

      {/* Terms and Conditions Modal */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
}

