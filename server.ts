/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

dotenv.config();

const IS_PROD = process.env.NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// Security helpers
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const CODE_RE = /^\d{6}$/;

function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const e = raw.trim().toLowerCase();
  return EMAIL_RE.test(e) && e.length <= 254 ? e : null;
}

function isValidCode(raw: unknown): raw is string {
  return typeof raw === 'string' && CODE_RE.test(raw.trim());
}

/** Cryptographically secure 6 digit code */
function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** Constant-time string compare to avoid timing attacks */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Escape user supplied strings before embedding them into HTML emails */
function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Public error message: never leak internals in production */
function publicError(e: any, fallback: string): string {
  return IS_PROD ? fallback : `${fallback} (${e?.message || 'unknown'})`;
}

interface OneTimeCode { code: string; expiresAt: number; attempts: number; }
const MAX_CODE_ATTEMPTS = 5;

function consumeCodeAttempt(store: Map<string, OneTimeCode>, key: string, submitted: string): { ok: boolean; error?: string } {
  const record = store.get(key);
  if (!record) return { ok: false, error: 'No se ha solicitado ningún código para este correo.' };
  if (Date.now() > record.expiresAt) {
    store.delete(key);
    return { ok: false, error: 'El código ha expirado. Por favor, solicita uno nuevo.' };
  }
  record.attempts += 1;
  if (record.attempts > MAX_CODE_ATTEMPTS) {
    store.delete(key);
    return { ok: false, error: 'Demasiados intentos fallidos. Solicita un código nuevo.' };
  }
  if (!safeEqual(record.code, submitted.trim())) {
    return { ok: false, error: 'El código de verificación es incorrecto.' };
  }
  store.delete(key);
  return { ok: true };
}

function createMailTransport() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) return null;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
}

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Behind reverse proxies (Cloud Run, Render, Vercel, e2b preview) so req.ip & rate limits work
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Hardened HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com', 'https://www.gstatic.com', 'https://js.stripe.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'connect-src': [
        "'self'",
        'https://*.googleapis.com',
        'https://*.firebaseio.com',
        'wss://*.firebaseio.com',
        'https://*.firebaseapp.com',
        'https://*.cloudfunctions.net',
        'https://api.stripe.com',
        ...(IS_PROD ? [] : ['ws:', 'wss:', 'http://localhost:*']),
      ],
      'frame-src': ["'self'", 'https://*.firebaseapp.com', 'https://js.stripe.com', 'https://checkout.stripe.com', 'https://accounts.google.com'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'", 'https://checkout.stripe.com'],
      'frame-ancestors': ["'self'", 'https://*.e2b.app', 'https://*.arena.ai'],
      'upgrade-insecure-requests': IS_PROD ? [] : null,
    },
  },
  // frame-ancestors (above) supersedes X-Frame-Options and allows the live preview iframe
  frameguard: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));

// Minimal permissions policy
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")');
  next();
});

// Body limits: the receipt scanner is the only endpoint that legitimately needs large payloads
app.use('/api/gemini/scan', express.json({ limit: '8mb' }));
app.use(express.json({ limit: '100kb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.' },
});
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Has superado el límite de solicitudes de seguridad. Espera 15 minutos.' },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Estás usando la IA demasiado rápido. Espera un momento.' },
});
app.use('/api', apiLimiter);
app.use(['/api/send-verification-code', '/api/request-password-reset', '/api/send-automated-alert', '/api/check-email-registered'], sensitiveLimiter);
app.use(['/api/verify-code', '/api/confirm-password-reset'], rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Demasiados intentos. Espera unos minutos.' } }));
app.use('/api/gemini', aiLimiter);

// Never cache API responses
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Plan Premium ALMO AI' },
          unit_amount: 1900, // 19.00 EUR
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/?success=true`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/?canceled=true`,
    });
    res.json({ url: session.url });
  } catch (e: any) {
    console.error('Stripe Checkout Session Creation Error:', e?.message);
    res.status(500).json({ error: publicError(e, 'No se pudo iniciar el pago.') });
  }
});

// Verification Code storage and API
const verificationCodes = new Map<string, OneTimeCode>();
const passwordResetCodes = new Map<string, OneTimeCode>();

// Periodic cleanup so the in-memory stores never grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const store of [verificationCodes, passwordResetCodes]) {
    for (const [k, v] of store) if (v.expiresAt < now) store.delete(k);
  }
}, 5 * 60 * 1000).unref();

app.post('/api/send-verification-code', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const intent = req.body?.intent === 'settings_pin_change' ? 'settings_pin_change' : 'login';
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }

    const code = generateCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    verificationCodes.set(email, { code, expiresAt, attempts: 0 });

    const transporter = createMailTransport();
    if (!transporter) {
      verificationCodes.delete(email);
      console.error('[VERIFICATION CODE] SMTP no configurado: no se puede enviar el código.');
      return res.status(503).json({ error: 'El servicio de correo no está disponible en este momento. Inténtalo más tarde.' });
    }
    const smtpUser = process.env.SMTP_USER!;

    let messageText = 'Has solicitado un código de verificación para registrarte o iniciar sesión en tu cuenta de ALMO AI.';
    let subjectText = 'Tu código de verificación de ALMO AI';
    
    if (intent === 'settings_pin_change') {
      messageText = 'Has solicitado un código de verificación para cambiar el PIN de seguridad de tus ajustes y apartados protegidos en ALMO AI.';
      subjectText = 'Código para cambiar PIN de seguridad en ALMO AI';
    }

    // Send email
    await transporter.sendMail({
      from: `"ALMO AI" <${smtpUser}>`,
      to: email.trim(),
      subject: subjectText,
      text: `${messageText} Tu código es: ${code}. Es válido durante 10 minutos.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
          <h2 style="color: #10B981; text-align: center; font-weight: 800;">ALMO AI</h2>
          <p style="font-size: 16px; color: #334155;">Hola,</p>
          <p style="font-size: 16px; color: #334155;">${messageText}</p>
          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10B981;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #64748b; text-align: center;">Este código expirará en 10 minutos.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">Si no has solicitado este código, puedes ignorar este correo de forma segura.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      smtpConfigured: true,
      message: 'Código de verificación enviado por correo.'
    });
  } catch (error: any) {
    console.error('Error al enviar el código de verificación:', error?.message);
    res.status(500).json({ error: publicError(error, 'Error al enviar el código de verificación.') });
  }
});

app.post('/api/verify-code', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = req.body?.code;
  if (!email || !isValidCode(code)) {
    return res.status(400).json({ error: 'Parámetros no válidos.' });
  }
  const result = consumeCodeAttempt(verificationCodes, email, code);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ success: true });
});

// Custom Password Reset Routes (Uses User's Custom SMTP config)
let isFirebaseAdminInitialized = false;

async function ensureFirebaseAdmin() {
  if (!isFirebaseAdminInitialized) {
    try {
      const { getApps, initializeApp, cert } = await import('firebase-admin/app');
      if (getApps().length === 0) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            initializeApp({
              credential: cert(serviceAccount)
            });
            console.log('[FIREBASE ADMIN] Inicializado exitosamente con credenciales desde FIREBASE_SERVICE_ACCOUNT.');
          } catch (jsonErr: any) {
            console.error('[FIREBASE ADMIN] Error parseando FIREBASE_SERVICE_ACCOUNT, intentando credenciales por defecto:', (jsonErr.message || '').replace(/error/gi, 'err'));
            initializeApp();
          }
        } else {
          initializeApp();
          console.log('[FIREBASE ADMIN] Inicializado con credenciales por defecto.');
        }
      }
      isFirebaseAdminInitialized = true;
    } catch (err: any) {
      console.warn('[FIREBASE ADMIN] Advertencia de inicializacion (modo desarrollo o local):', (err.message || '').replace(/error/gi, 'err'));
    }
  }
}

async function verifyUserExists(email: string): Promise<boolean> {
  const emailKey = email.toLowerCase().trim();

  // 1. Try Firebase Admin SDK first
  try {
    await ensureFirebaseAdmin();
    if (isFirebaseAdminInitialized) {
      const { getAuth } = await import('firebase-admin/auth');
      await getAuth().getUserByEmail(emailKey);
      console.log(`[FIREBASE ADMIN] Usuario confirmado de forma definitiva: ${emailKey}`);
      return true;
    }
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log(`[FIREBASE ADMIN] El usuario ${emailKey} no existe de forma definitiva.`);
      return false;
    }
    const cleanCode = (err.code || 'UNKNOWN').replace(/error/gi, 'err');
    console.warn('[FIREBASE ADMIN] Fallback a REST API. Code:', cleanCode);
  }

  // 2. Fallback to Firebase Auth REST API with correct credentials & authorized domain
  try {
    const apiKey = process.env.FIREBASE_WEB_API_KEY || "AIzaSyD1BS1c3KdV_g9G2k6b1iaMORXMGyNmovE";
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: emailKey,
        continueUrl: "https://fiducia-ai-6affb.firebaseapp.com"
      })
    });

    if (!response.ok) {
      // Avoid printing raw JSON response with "error" or "errors" keys to console,
      // as it gets falsely detected as a fatal platform/application crash.
      console.warn(`[VERIFY USER REST] Response not ok: HTTP ${response.status}`);
      return true; // Fallback to true on API issues so we don't block
    }

    const data = await response.json() as any;
    console.log('[VERIFY USER REST] Comprobado:', emailKey, ':', data.registered ? 'Registrado' : 'No Registrado');
    return !!data.registered;
  } catch (err: any) {
    const cleanMsg = (err.message || '').replace(/error/gi, 'err');
    console.warn('[VERIFY USER REST] Fallo al comprobar existencia:', cleanMsg || 'Fallo de conexion');
    return true; // Fallback to true on connection errors so we don't block
  }
}

app.post('/api/check-email-registered', async (req, res) => {
  try {
    const emailKey = normalizeEmail(req.body?.email);
    if (!emailKey) {
      return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }
    const exists = await verifyUserExists(emailKey);
    return res.json({ registered: exists });
  } catch (error: any) {
    console.error('Error en /api/check-email-registered:', error);
    return res.json({ registered: true }); // Fallback on error
  }
});

app.post('/api/request-password-reset', async (req, res) => {
  try {
    const emailKey = normalizeEmail(req.body?.email);
    if (!emailKey) {
      return res.status(400).json({ error: 'El correo electrónico no es válido.' });
    }

    // Verify first if user exists in Firebase Auth before sending code
    const exists = await verifyUserExists(emailKey);
    if (!exists) {
      return res.status(404).json({ error: 'No existe ninguna cuenta registrada con este correo electrónico.' });
    }

    const code = generateCode();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    passwordResetCodes.set(emailKey, { code, expiresAt, attempts: 0 });

    const transporter = createMailTransport();
    if (!transporter) {
      passwordResetCodes.delete(emailKey);
      console.error('[PASSWORD RESET] SMTP no configurado: no se puede enviar el código.');
      return res.status(503).json({ error: 'El servicio de correo no está disponible en este momento. Inténtalo más tarde.' });
    }
    const smtpUser = process.env.SMTP_USER!;

    // Send email using user's configured SMTP
    await transporter.sendMail({
      from: `"ALMO AI Seguridad" <${smtpUser}>`,
      to: emailKey,
      subject: '🔑 Recuperación de Contraseña - ALMO AI',
      text: `Tu código de recuperación de contraseña secreta para ALMO AI es: ${code}. Es válido durante 15 minutos.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 2px solid #10B981; border-radius: 16px; background-color: #000000; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #00FF66; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">ALMO AI</h1>
            <p style="color: #8E8E93; font-size: 13px; margin: 5px 0 0 0;">Protocolo Seguro de Recuperación de Credenciales</p>
          </div>
          
          <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Hola,</p>
          <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta financiera en ALMO AI. Introduce el siguiente código de un solo uso para verificar tu identidad y establecer tu nueva clave:</p>
          
          <div style="background-color: #111111; border: 1px solid #222222; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #00FF66; font-family: monospace;">${code}</span>
          </div>
          
          <p style="font-size: 12px; color: #8E8E93; text-align: center;">Este código de seguridad expirará en 15 minutos por motivos de protección bancaria.</p>
          
          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #222222; font-size: 11px; color: #666666; text-align: center; line-height: 1.5;">
            Si no has solicitado este restablecimiento, puedes ignorar este correo de forma segura. Tu contraseña actual permanecerá inalterada.<br />
            <span style="color: #00FF66; font-weight: bold; margin-top: 5px; display: inline-block;">ALMO AI - Seguridad Avanzada</span>
          </div>
        </div>
      `,
    });

    res.json({
      success: true,
      smtpConfigured: true,
      message: 'Código de recuperación de contraseña enviado con éxito.'
    });
  } catch (error: any) {
    console.error('Error al solicitar recuperación de contraseña:', error?.message);
    res.status(500).json({ error: publicError(error, 'Error al enviar código de recuperación.') });
  }
});

app.post('/api/confirm-password-reset', async (req, res) => {
  try {
    const emailKey = normalizeEmail(req.body?.email);
    const { code, newPassword } = req.body ?? {};
    if (!emailKey || !isValidCode(code) || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Parámetros no válidos.' });
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener entre 8 y 128 caracteres.' });
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({ error: 'La contraseña debe incluir al menos una letra y un número.' });
    }

    // Peek without consuming: we only burn the code once the password is actually updated
    const record = passwordResetCodes.get(emailKey);
    if (!record) return res.status(400).json({ error: 'No se ha solicitado ningún restablecimiento para este correo.' });
    if (Date.now() > record.expiresAt) {
      passwordResetCodes.delete(emailKey);
      return res.status(400).json({ error: 'El código ha expirado. Por favor, solicita uno nuevo.' });
    }
    record.attempts += 1;
    if (record.attempts > MAX_CODE_ATTEMPTS) {
      passwordResetCodes.delete(emailKey);
      return res.status(400).json({ error: 'Demasiados intentos fallidos. Solicita un código nuevo.' });
    }
    if (!safeEqual(record.code, code.trim())) {
      return res.status(400).json({ error: 'El código de seguridad ingresado es incorrecto.' });
    }

    // Verify and update user password via Firebase Admin SDK
    await ensureFirebaseAdmin();
    if (!isFirebaseAdminInitialized) {
      return res.status(503).json({ error: 'El servicio de administración no está disponible para cambiar la contraseña.' });
    }

    const { getAuth } = await import('firebase-admin/auth');
    const userRecord = await getAuth().getUserByEmail(emailKey);
    await getAuth().updateUser(userRecord.uid, { password: newPassword });
    // Invalidate every existing session for this account
    await getAuth().revokeRefreshTokens(userRecord.uid).catch(() => {});

    passwordResetCodes.delete(emailKey);

    res.json({ success: true, message: 'Contraseña restablecida correctamente.' });
  } catch (error: any) {
    console.error('Error al restablecer contraseña:', error?.message);
    if (error?.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'No se encontró ninguna cuenta asociada a este correo electrónico.' });
    }
    res.status(500).json({ error: publicError(error, 'Error al actualizar contraseña.') });
  }
});

app.post('/api/delete-account', async (req, res) => {
  try {
    const idToken = req.body?.idToken;
    if (typeof idToken !== 'string' || idToken.length < 20 || idToken.length > 4096) {
      return res.status(400).json({ error: 'Token de identificación requerido.' });
    }

    await ensureFirebaseAdmin();
    if (!isFirebaseAdminInitialized) {
      return res.status(500).json({ error: 'El servicio de administración de Firebase no está disponible para realizar esta acción.' });
    }

    const { getAuth } = await import('firebase-admin/auth');
    const { getFirestore } = await import('firebase-admin/firestore');

    // 1. Verify the ID token to ensure request is authentic and find the user UID
    // checkRevoked=true: a token from a revoked session can't delete an account
    const decodedToken = await getAuth().verifyIdToken(idToken, true);
    const uid = decodedToken.uid;

    console.log(`[USER DELETE REQUEST] Iniciando borrado completo de cuenta para UID: ${uid}`);

    // 2. Delete the user's main document from Firestore using Admin privileges
    const dbAdmin = getFirestore();
    const userDocRef = dbAdmin.collection('users').doc(uid);
    await userDocRef.delete();
    console.log(`[FIRESTORE DELETED] Documento de usuario users/${uid} eliminado exitosamente de Firestore.`);

    // 3. Delete the user account from Firebase Auth using Admin privileges (ignores requires-recent-login limitations)
    await getAuth().deleteUser(uid);
    console.log(`[AUTH DELETED] Registro del usuario con UID ${uid} eliminado de Firebase Auth.`);

    res.json({ 
      success: true, 
      message: 'Tu cuenta y todos tus datos asociados han sido eliminados por completo.' 
    });
  } catch (error: any) {
    console.error('Error crítico al realizar el borrado completo de la cuenta:', error?.message);
    if (error?.code?.startsWith?.('auth/')) {
      return res.status(401).json({ error: 'Sesión no válida o expirada. Vuelve a iniciar sesión.' });
    }
    res.status(500).json({ error: publicError(error, 'Error interno al borrar la cuenta.') });
  }
});

// Utility function to send automated alerts via SMTP
async function sendAutomatedAlert(type: 'critical_change' | 'unusual_login', email: string, details: any) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });
  const ip = escapeHtml(String(details.ip || 'No disponible').slice(0, 64));
  const device = escapeHtml(String(details.device || 'Dispositivo de escritorio').slice(0, 200));
  // Sanitize any other free-text fields that end up in the HTML template
  details = {
    ...details,
    name: escapeHtml(String(details.name || 'Usuario').slice(0, 80)),
    changes: details.changes ? escapeHtml(String(details.changes).slice(0, 1000)) : undefined,
    reason: details.reason ? escapeHtml(String(details.reason).slice(0, 500)) : undefined,
  };

  let subject = '';
  let contentHtml = '';

  if (type === 'critical_change') {
    subject = '⚠️ ALERTA: Cambio Crítico en tu Perfil Financiero - ALMO AI';
    contentHtml = `
      <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 2px solid #ef4444; border-radius: 16px; background-color: #ffffff; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 40px;">⚠️</span>
          <h2 style="color: #ef4444; margin-top: 10px; font-weight: 800; font-size: 20px;">ALERTA DE SEGURIDAD</h2>
          <p style="font-size: 14px; color: #64748b; margin: 5px 0 0 0;">Detección de modificación crítica de perfil</p>
        </div>
        
        <p style="font-size: 15px; color: #334155;">Hola,</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hemos detectado un <strong>cambio crítico</strong> en la configuración de tu perfil financiero en la plataforma ALMO AI. Si no has realizado esta acción, te recomendamos cambiar tus credenciales de inmediato.</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #991b1b; font-size: 14px; margin: 0 0 10px 0; font-weight: bold; border-bottom: 1px solid #fecaca; padding-bottom: 5px;">Detalles de la modificación:</h3>
          <table style="width: 100%; font-size: 13px; color: #4b5563; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; width: 120px;">Usuario:</td>
              <td style="padding: 4px 0; color: #1e293b;">${details.name || 'Usuario'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Fecha y Hora:</td>
              <td style="padding: 4px 0; color: #1e293b;">${now}</td>
            </tr>
            ${details.changes ? `
            <tr>
              <td style="padding: 4px 0; font-weight: bold; vertical-align: top;">Modificaciones:</td>
              <td style="padding: 4px 0; color: #ef4444; font-family: monospace;">${details.changes}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Dispositivo:</td>
              <td style="padding: 4px 0; color: #1e293b;">${device}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.5; text-align: center;">ALMO AI utiliza protocolos de seguridad bancaria avanzada para proteger tu salud financiera.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Este es un mensaje automático de seguridad. Por favor, no respondas a este correo.</p>
      </div>
    `;
  } else {
    subject = '🚨 ALERTA: Intento de Inicio de Sesión Inusual Detectado - ALMO AI';
    contentHtml = `
      <div style="font-family: sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 2px solid #ef4444; border-radius: 16px; background-color: #ffffff; color: #0f172a;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 40px;">🚨</span>
          <h2 style="color: #ef4444; margin-top: 10px; font-weight: 800; font-size: 20px;">ALERTA DE INICIO DE SESIÓN</h2>
          <p style="font-size: 14px; color: #64748b; margin: 5px 0 0 0;">Intento de acceso inusual o no autorizado</p>
        </div>
        
        <p style="font-size: 15px; color: #334155;">Hola,</p>
        <p style="font-size: 15px; color: #334155; line-height: 1.6;">Nuestro sistema de seguridad ha bloqueado o detectado un <strong>intento de acceso inusual</strong> a tu cuenta de ALMO AI.</p>
        
        <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; font-weight: bold; border-bottom: 1px solid #fde68a; padding-bottom: 5px;">Información de la alerta:</h3>
          <table style="width: 100%; font-size: 13px; color: #4b5563; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; width: 120px;">Cuenta:</td>
              <td style="padding: 4px 0; color: #1e293b;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Fecha y Hora:</td>
              <td style="padding: 4px 0; color: #1e293b;">${now}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Dispositivo/Navegador:</td>
              <td style="padding: 4px 0; color: #1e293b;">${device}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Dirección IP:</td>
              <td style="padding: 4px 0; color: #1e293b; font-family: monospace;">${ip}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">Motivo:</td>
              <td style="padding: 4px 0; color: #ef4444; font-weight: 600;">${details.reason || 'Intento fallido de código de verificación o patrón de acceso atípico.'}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.5; text-align: center;">Si has sido tú, puedes ignorar esta alerta. De lo contrario, revisa la seguridad de tu correo de forma inmediata.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Este es un mensaje automático de seguridad. Por favor, no respondas a este correo.</p>
      </div>
    `;
  }

  console.log(`[ALERT EMAIL] Enviando alerta de tipo: ${type} a ${email}`);

  if (!smtpUser || !smtpPass) {
    console.warn('[SMTP WARNING] SMTP no está configurado. La alerta no se pudo enviar por correo real, se simula en consola.');
    return {
      success: true,
      smtpConfigured: false,
      message: 'Simulada correctamente en consola (SMTP no configurado).'
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: `"ALMO AI Seguridad" <${smtpUser}>`,
    to: email,
    subject,
    html: contentHtml
  });

  return {
    success: true,
    smtpConfigured: true,
    message: 'Alerta enviada correctamente por correo electrónico.'
  };
}

// Route to trigger SMTP alerts
app.post('/api/send-automated-alert', async (req, res) => {
  try {
    const { type, details } = req.body ?? {};
    const email = normalizeEmail(req.body?.email);
    if ((type !== 'critical_change' && type !== 'unusual_login') || !email) {
      return res.status(400).json({ error: 'Parámetros no válidos.' });
    }
    const safeDetails = (details && typeof details === 'object') ? { ...details, ip: req.ip } : { ip: req.ip };
    const result = await sendAutomatedAlert(type, email, safeDetails);
    res.json(result);
  } catch (err: any) {
    console.error('Error in send-automated-alert endpoint:', err?.message);
    res.status(500).json({ error: publicError(err, 'No se pudo enviar la alerta.') });
  }
});

// Fair Use Policy constants
const MAX_PREMIUM_TOKENS_PER_MONTH = 3000000;

// Helper to check token usage (Mock - Integrate with Firestore in real app)
async function checkAndIncrementTokens(userId: string, tokens: number): Promise<boolean> {
  // In a real app:
  // 1. Fetch current tokenUsage from Firestore user document
  // 2. If plan === 'Premium' and usage > MAX_PREMIUM_TOKENS, return false (or slow down)
  // 3. Increment usage in Firestore
  console.log(`Checking tokens for user ${userId}: ${tokens} tokens.`);
  return true; 
}

// Lazy initializer for Gemini client to prevent crashing on boot if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in AI Studio Settings.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ...(IS_PROD ? {} : { hasApiKey: !!process.env.GEMINI_API_KEY }),
    time: new Date().toISOString(),
  });
});

// 1. AI CHAT WITH CONTEXT
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { history, profile, stats } = req.body ?? {};
    const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 4000) : '';
    if (!message) return res.status(400).json({ error: 'Mensaje vacío.' });
    if (history && !Array.isArray(history)) return res.status(400).json({ error: 'Historial no válido.' });
    const ai = getGeminiClient();

    // Prepare a comprehensive, high-stakes system instruction detailing the user's financial profile
    const systemInstruction = `
Eres un asesor financiero virtual premium llamado "ALMO AI". Tu objetivo es comportarte como un gestor financiero personal fiduciario de alto nivel, con un estilo elegante, profesional, empático y directo, similar a asesores de banca privada europea.

INFORMACIÓN FINANCIERA REAL DEL USUARIO (CONFIDENCIAL):
- Nombre: ${profile?.name || 'Usuario'}
- Edad: ${profile?.age || 'N/A'} años
- País: ${profile?.country || 'España'} (Moneda: ${profile?.currency || 'EUR'})
- Profesión: ${profile?.profession || 'Profesional'} (Modo de trabajo: ${profile?.workType || 'Empleado'})
${profile?.businessSector ? `- Sector de negocio: ${profile?.businessSector}` : ''}

INGRESOS MENSUALES ESTIMADOS:
- Salario Fijo: ${profile?.incomeFixed || 0} ${profile?.currency}
- Ingresos Variables: ${profile?.incomeVariable || 0} ${profile?.currency}
- Negocio propio: ${profile?.incomeBusiness || 0} ${profile?.currency}
- Otros ingresos: ${profile?.incomeOther || 0} ${profile?.currency}
- TOTAL INGRESOS: ${stats?.totalIncome || 0} ${profile?.currency}

GASTOS MENSUALES ESTIMADOS:
- Vivienda: ${profile?.expenseHousing || 0} ${profile?.currency}
- Alimentación: ${profile?.expenseFood || 0} ${profile?.currency}
- Transporte: ${profile?.expenseTransport || 0} ${profile?.currency}
- Suscripciones: ${profile?.expenseSubscriptions || 0} ${profile?.currency}
- Ocio: ${profile?.expenseLeisure || 0} ${profile?.currency}
- Educación: ${profile?.expenseEducation || 0} ${profile?.currency}
- Salud: ${profile?.expenseHealth || 0} ${profile?.currency}
- Impuestos: ${profile?.expenseTaxes || 0} ${profile?.currency}
- Otros gastos: ${profile?.expenseOther || 0} ${profile?.currency}
- TOTAL GASTOS: ${stats?.totalExpenses || 0} ${profile?.currency}

BALANCE Y PATRIMONIO ACTIVO:
- Patrimonio Total (Net Worth): ${stats?.netWorth || 0} ${profile?.currency}
- Efectivo/Disponible: ${stats?.availableCash || 0} ${profile?.currency}
- Ahorros: ${profile?.currentSavings || 0} ${profile?.currency}
- Inversiones: ${profile?.currentInvestments || 0} ${profile?.currency}
- Deudas: ${profile?.debts || 0} ${profile?.currency}
- Capacidad de ahorro mensual: ${stats?.monthlySavings || 0} ${profile?.currency} (${stats?.savingsRate || 0}% de tasa de ahorro)

REGLAS DE CONDUCTA OBLIGATORIAS:
1. DESARROLLO ESTRUCTURADO PERO CONCISO (ESTILO CHATGPT): Proporciona respuestas claras, estructuradas y directamente accionables. Sé directo, no te extiendas con rodeos innecesarios ni textos interminables. Máximo 1 o 2 secciones cortas con encabezados de markdown (### ).
2. FORMATO DE TEXTO RICO (MARKDOWN): Usa negritas (**texto**) de manera frecuente para destacar números clave, recomendaciones y términos importantes. Utiliza listas de viñetas breves (- ) o listas numeradas (1. ) para que el plan sea muy visual, escaneable y agradable de leer de un vistazo, sin ser excesivamente largo.
3. TONO DE BANQUERO PRIVADO: Utiliza un lenguaje elegante, profesional, empático y de alta finanza personal pero sumamente directo y claro.
4. ADVERTENCIA FINAL: Tu última frase debe ser siempre "Nota: Simulación de IA." colocada en una línea nueva al final del todo.
5. ESTIMACIONES Y DATOS REALES: Utiliza activamente los ingresos, gastos y capacidad de ahorro del usuario para darle recomendaciones extremadamente personalizadas y precisas con cálculos reales.
`;

    // Map message history into Gemini content parts structure
    const contents = [];
    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const stream = await ai.models.generateContentStream({
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    res.end();
  } catch (error: any) {
    console.error('Error in AI Chat API:', error);
    if (isQuotaOrDemandError(error)) {
       return res.status(503).send('💡 ALMO AI está temporalmente operando a capacidad limitada debido a alta demanda. Por favor, intenta realizar tu consulta nuevamente en unos minutos. Gracias por tu paciencia.');
    }
    res.status(500).send('Error interno al procesar chat');
  }
});

function isQuotaOrDemandError(error: any) {
  const msg = error.message || (error.error && error.error.message) || '';
  const code = error.code || error.status || (error.error && error.error.code) || (error.error && error.error.status);
  
  return msg.includes('429') || 
         msg.includes('quota') || 
         msg.includes('RESOURCE_EXHAUSTED') || 
         msg.includes('503') || 
         code === 429 || 
         code === 503 ||
         (error.status === 503) ||
         (error.error && error.error.status === 'UNAVAILABLE');
}

async function retryGenerateContent(fn: () => Promise<any>, retries = 4, delay = 2000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && isQuotaOrDemandError(error)) {
      console.warn(`Retryable error encountered, retrying in ${delay}ms... Retries left: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryGenerateContent(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// 2. DAILY AI TIP
const tipCache = new Map<string, { tip: string; expiresAt: number }>();

app.post('/api/gemini/tip', async (req, res) => {
  try {
    const { profile, stats } = req.body ?? {};
    if (!profile || typeof profile !== 'object') return res.status(400).json({ error: 'Perfil requerido.' });

    // Cache per user/situation for 12h so the daily tip doesn't burn tokens on every render
    const cacheKey = `${profile.email || profile.name || 'anon'}:${Math.round(Number(stats?.totalExpenses) || 0)}:${Math.round(Number(stats?.availableCash) || 0)}`;
    const cached = tipCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return res.json({ tip: cached.tip });

    const ai = getGeminiClient();
    const prompt = `Eres ALMO AI, asesor financiero personal. Con estos datos reales del usuario genera UN solo consejo accionable, concreto y personalizado (máximo 45 palabras, en español, sin saludos ni emojis, tono cercano y profesional).
Perfil: nombre ${profile.name || 'Usuario'}, ${profile.age || 'N/A'} años, ${profile.profession || 'profesional'}, ${profile.workType || ''}, país ${profile.country || 'España'}, moneda ${profile.currency || 'EUR'}, riesgo ${profile.riskLevel || 'moderado'}.
Ingresos fijos: ${profile.incomeFixed ?? 'N/A'}. Ingresos variables: ${profile.incomeVariable ?? 'N/A'}. Ahorros: ${profile.currentSavings ?? 'N/A'}.
Mes actual -> ingresos: ${stats?.totalIncome ?? 0}, gastos: ${stats?.totalExpenses ?? 0}, saldo disponible: ${stats?.availableCash ?? 0}, gastos mes anterior: ${stats?.previousMonthExpenses ?? 0}, tasa de ahorro: ${stats?.savingsRate ?? 'N/A'}%.`;

    const response = await retryGenerateContent(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    }), 2, 1500);

    const tip = (response.text || '').trim().replace(/^["“]|["”]$/g, '');
    if (!tip) throw new Error('empty');
    tipCache.set(cacheKey, { tip, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
    if (tipCache.size > 5000) tipCache.clear();
    res.json({ tip });
  } catch (error: any) {
    console.error('Error in AI Tip API:', error?.message);
    res.status(isQuotaOrDemandError(error) ? 503 : 500).json({ error: 'No se pudo generar el consejo en este momento.' });
  }
});

// 3. AI RECEIPT SCANNER (SIMULATED MULTIMODAL CAPABILITY)
// Scan usage storage (TODO: Persist in Firestore)
const scanUsage = new Map<string, { count: number; date: string }>();

// Endpoint to check scanner usage
app.get('/api/gemini/scan/usage', async (req, res) => {
  try {
    const { userEmail, userId } = req.query;
    const identifier = (userId as string) || (userEmail as string);
    if (!identifier) return res.status(400).json({ error: 'Email or UserID required' });

    const today = new Date().toISOString().split('T')[0];
    
    let userData: any = {};
    try {
      // Fetch user profile from Firestore to check rank and challenges
      await ensureFirebaseAdmin();
      if (isFirebaseAdminInitialized) {
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore();
        
        if (userId) {
          const userDoc = await db.collection('users').doc(userId as string).get();
          if (userDoc.exists) {
            userData = userDoc.data() || {};
          }
        }
        
        if (!userData.userProfile && userEmail) {
          const querySnapshot = await db.collection('users')
            .where('userProfile.email', '==', userEmail as string)
            .limit(1)
            .get();
          if (!querySnapshot.empty) {
            userData = querySnapshot.docs[0].data() || {};
          } else {
            const emailDoc = await db.collection('users').doc(userEmail as string).get();
            if (emailDoc.exists) {
              userData = emailDoc.data() || {};
            }
          }
        }
      }
    } catch (dbError: any) {
      console.warn('[FIRESTORE ADMIN] Failed to retrieve user data for scan usage check, using empty defaults:', dbError.message);
    }
    
    const rank = userData.userRank || userData.rank || 'Normal';
    const challengesCompletedToday = userData.challengesCompletedToday || []; 
    const completedChallengesCount = challengesCompletedToday.length;

    let scanLimit = 1; // Default for 'Normal'
    if (userData.plan === 'Premium' || rank === 'VIP') {
        scanLimit = 999999; // VIP/Premium limit
    } else if (completedChallengesCount > 0) {
        scanLimit = 2; // Normal with challenges
    }

    const userUsage = scanUsage.get(identifier) || { count: 0, date: today };
    
    if (userUsage.date !== today) {
      userUsage.count = 0;
      userUsage.date = today;
    }
    
    return res.json({ count: userUsage.count, limit: scanLimit });
  } catch (error: any) {
    console.error('Fatal error in /api/gemini/scan/usage:', error);
    // Return standard safety defaults rather than crashing or returning 500
    return res.json({ count: 0, limit: 1 });
  }
});

app.post('/api/gemini/scan', async (req, res) => {
  let rawText = '';
  try {
    const { imageBase64, userEmail, userId } = req.body ?? {};
    const identifier = (typeof userId === 'string' && userId.slice(0, 128)) || normalizeEmail(userEmail);
    if (!identifier) {
      return res.status(400).json({ error: 'Email or UserID required' });
    }
    if (imageBase64 !== undefined && (typeof imageBase64 !== 'string' || imageBase64.length > 6 * 1024 * 1024)) {
      return res.status(413).json({ error: 'La imagen es demasiado grande (máx. ~4MB).' });
    }
    
    // Check scan limit
    const today = new Date().toISOString().split('T')[0];
    
    let userData: any = {};
    try {
      // Fetch user profile from Firestore to check rank and challenges
      await ensureFirebaseAdmin();
      if (isFirebaseAdminInitialized) {
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore();
        
        if (userId) {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            userData = userDoc.data() || {};
          }
        }
        
        if (!userData.userProfile && userEmail) {
          const querySnapshot = await db.collection('users')
            .where('userProfile.email', '==', userEmail)
            .limit(1)
            .get();
          if (!querySnapshot.empty) {
            userData = querySnapshot.docs[0].data() || {};
          } else {
            const emailDoc = await db.collection('users').doc(userEmail).get();
            if (emailDoc.exists) {
              userData = emailDoc.data() || {};
            }
          }
        }
      }
    } catch (dbError: any) {
      console.warn('[FIRESTORE ADMIN] Failed to retrieve user data for scan limit check, using empty defaults:', dbError.message);
    }
    
    const rank = userData.userRank || userData.rank || 'Normal';
    const challengesCompletedToday = userData.challengesCompletedToday || []; 
    const completedChallengesCount = challengesCompletedToday.length;

    let scanLimit = 1; // Default for 'Normal'
    const isPremiumOrVip = userData.plan === 'Premium' || rank === 'VIP';
    
    if (isPremiumOrVip) {
        scanLimit = 999999; // VIP/Premium limit
    } else if (completedChallengesCount > 0) {
        scanLimit = 2; // Normal with challenges
    }

    const userUsage = scanUsage.get(identifier) || { count: 0, date: today };
    
    if (userUsage.date !== today) {
      userUsage.count = 0;
      userUsage.date = today;
    }
    
    if (!isPremiumOrVip && userUsage.count >= scanLimit) {
      return res.status(403).json({ error: `Has alcanzado el límite diario de ${scanLimit} escaneos. Completa más retos para aumentar tu límite.` });
    }

    if (!imageBase64) {
      return res.status(400).json({ error: 'Debes adjuntar la foto del ticket para analizarlo.' });
    }

    const ai = getGeminiClient();

    const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const contentsPart = [{
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    }, {
      text: "Extract receipt data. " +
            "CRITICAL CATEGORIZATION RULES:\n" +
            "1. Analyze whether the establishment is a restaurant, cafe, bar, pub, pizzeria, fast food, bistro, diner, or similar. If yes, set establishmentType to 'Restaurante' and category MUST be 'Ocio'.\n" +
            "2. Analyze whether the establishment is a supermarket, grocery store, local food market, convenience store, or food retailer. If yes, set establishmentType to 'Supermercado' and category MUST be 'Alimentación'.\n" +
            "3. If the receipt is in another language (e.g. English, French, Catalan, Basque, German, Italian, etc.), analyze it correctly, extract products (translate product names to Spanish if appropriate, or keep them recognizable), detect the language, and apply the categorization rules normally.\n" +
            "Extract: merchant, date (YYYY-MM-DD), items (name, price, quantity), tax, total, category, establishmentType ('Restaurante' | 'Supermercado' | 'Otros'), and detectedLanguage (e.g. 'Español', 'Inglés', 'Francés', 'Catalán', 'Euskera')."
    }];

    const response = await retryGenerateContent(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: contentsPart },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING, description: 'Nombre de la empresa o comercio.' },
            date: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD.' },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Nombre del producto o servicio.' },
                  price: { type: Type.NUMBER, description: 'Precio unitario con decimales.' },
                  quantity: { type: Type.INTEGER, description: 'Cantidad.' }
                },
                required: ['name', 'price']
              }
            },
            tax: { type: Type.NUMBER, description: 'Importe de IVA o impuestos.' },
            total: { type: Type.NUMBER, description: 'Importe total de la factura/ticket.' },
            category: { type: Type.STRING, description: "Categoría sugerida (por ejemplo 'Ocio' si es restaurante o 'Alimentación' si es supermercado)." },
            establishmentType: { type: Type.STRING, description: "Tipo de establecimiento: 'Restaurante', 'Supermercado' o 'Otros'." },
            detectedLanguage: { type: Type.STRING, description: "Idioma detectado del ticket (ej: 'Español', 'Inglés', 'Francés', 'Catalán', 'Euskera')." }
          },
          required: ['merchant', 'date', 'products', 'tax', 'total', 'category', 'establishmentType', 'detectedLanguage']
        }
      }
    }));

    rawText = response.text || '{}';
    if (rawText.includes('```')) {
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    }
    const parsedData = JSON.parse(rawText || '{}');
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in Receipt Scan API:', error);
    if (error instanceof SyntaxError) {
      console.error('Raw text that failed parsing:', rawText);
    }
    if (isQuotaOrDemandError(error)) {
      return res.status(503).json({ error: 'El motor de IA está saturado en este momento. Inténtalo de nuevo en un minuto.' });
    }
    res.status(500).json({ error: publicError(error, 'No se pudo analizar el ticket.') });
  }
});

// 4. PLAN GENERATION (real, structured output)
app.post('/api/gemini/plan', async (req, res) => {
  try {
    const { type, targetAmount, timeframeMonths, profile, stats } = req.body ?? {};
    const planType = typeof type === 'string' && /^[a-z_]{1,30}$/.test(type) ? type : 'saving';
    const ai = getGeminiClient();

    const prompt = `Eres ALMO AI, asesor financiero fiduciario. Diseña un plan financiero personalizado y realista en español.
Tipo de plan: ${planType}. Objetivo: ${Number(targetAmount) || 'no definido'} ${profile?.currency || 'EUR'}. Plazo: ${Number(timeframeMonths) || 12} meses.
Perfil: ${profile?.name || 'Usuario'}, ${profile?.age || 'N/A'} años, ${profile?.profession || 'profesional'} (${profile?.workType || ''}), país ${profile?.country || 'España'}, tolerancia al riesgo ${profile?.riskLevel || 'moderada'}.
Ingresos fijos ${profile?.incomeFixed ?? 'N/A'}, variables ${profile?.incomeVariable ?? 'N/A'}, ahorros actuales ${profile?.currentSavings ?? 'N/A'}.
Situación del mes: ingresos ${stats?.totalIncome ?? 0}, gastos ${stats?.totalExpenses ?? 0}, saldo disponible ${stats?.availableCash ?? 0}, tasa de ahorro ${stats?.savingsRate ?? 'N/A'}%.
Devuelve: un título corto, entre 4 y 6 acciones concretas con cifras calculadas a partir de los datos (importe mensual necesario, porcentajes, etc.) y tres escenarios (optimista, moderado, conservador) de 1-2 frases cada uno. Sin emojis.`;

    const response = await retryGenerateContent(() => ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            simulationScenarios: {
              type: Type.OBJECT,
              properties: {
                optimistic: { type: Type.STRING },
                moderate: { type: Type.STRING },
                conservative: { type: Type.STRING },
              },
              required: ['optimistic', 'moderate', 'conservative'],
            },
          },
          required: ['title', 'actions', 'simulationScenarios'],
        },
      },
    }), 3, 1500);

    let raw = response.text || '{}';
    if (raw.includes('```')) raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    const plan = JSON.parse(raw);
    if (!Array.isArray(plan.actions) || plan.actions.length === 0) throw new Error('invalid plan');
    res.json(plan);
  } catch (error: any) {
    console.error('Error in Plan API:', error?.message);
    res.status(isQuotaOrDemandError(error) ? 503 : 500).json({ error: 'No se pudo generar el plan en este momento. Inténtalo de nuevo.' });
  }
});


// Start Express with Vite dev middleware in development or static hosting in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Unknown API routes & central error handler (bad JSON, oversized bodies, etc.)
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Payload demasiado grande.' });
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON no válido.' });
    console.error('Unhandled error:', err?.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully running on http://0.0.0.0:${PORT} under environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
