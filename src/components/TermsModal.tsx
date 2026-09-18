import { X, ShieldCheck, Scale, Zap, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div id="terms-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        id="terms-modal-card"
        className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-[#0A0E17] border border-white/[0.08] rounded-[28px] flex flex-col shadow-[0_10px_50px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="text-md font-bold text-white font-sans">Términos y Condiciones</h3>
              <p className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider">Acuerdo Legal y Uso del Servicio (ALMO AI)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#ffffff05] hover:bg-[#ffffff10] text-[#8E8E93] hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed font-sans max-h-[calc(85vh-140px)]">
          
          {/* Welcome Disclaimer */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-[#ffffff05] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Info size={16} className="text-[#00FF66]" />
              <span>1. Introducción y Aceptación</span>
            </div>
            <p>
              Bienvenido a <strong>ALMO AI</strong>. Al registrarte, iniciar sesión o utilizar cualquiera de nuestros servicios, aceptas plenamente estar sujeto a los presentes Términos y Condiciones. Si no estás de acuerdo con alguna parte, no deberás acceder al software ni utilizar los servicios interactivos de inteligencia financiera.
            </p>
          </div>

          {/* AI Terms - The VIP Limit is here */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Zap size={16} className="text-[#00FF66]" />
              <span>2. Uso de la Inteligencia Artificial y Plan Premium (VIP)</span>
            </div>
            <p>
              ALMO AI proporciona análisis predictivos, simulación y categorización financiera mediante modelos avanzados de procesamiento de lenguaje natural y visión artificial.
            </p>
            <div className="p-4 rounded-2xl bg-[#00FF66]/5 border border-[#00FF66]/15 space-y-2 text-slate-300">
              <p className="font-bold text-white">Política de Uso Justo (Fair Use Policy):</p>
              <p>
                El "Plan Premium" se promociona comercialmente como de uso ilimitado para garantizar una experiencia fluida y sin fricciones para la inmensa mayoría de los usuarios humanos en su día a día.
              </p>
              <p>
                No obstante, con el fin de proteger la estabilidad e integridad de la infraestructura de red, mitigar costes abusivos de computación y evitar ataques automatizados, bots o scripts de scraping, se aplica un límite de control de <strong>3,000,000 de tokens de entrada/salida de IA al mes por usuario</strong>.
              </p>
              <p>
                En caso de detectarse un comportamiento inusual que supere este límite razonable, ALMO AI se reserva el derecho de ajustar la velocidad de procesamiento (throttling), limitar temporalmente el uso o pausar el acceso al chat inteligente hasta el siguiente ciclo de facturación.
              </p>
            </div>
          </div>

          {/* Privacy and Database Security */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <ShieldCheck size={16} className="text-[#00FF66]" />
              <span>3. Privacidad, Seguridad y Firebase Firestore</span>
            </div>
            <p>
              Nos tomamos muy en serio la seguridad de tu información. Todos tus datos financieros (transacciones, activos, calendario de pagos y metas) se guardan de forma segura y permanente en la base de datos distribuida <strong>Firebase Firestore de Google Cloud</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[#8E8E93]">
              <li>El acceso está protegido de forma rigurosa mediante tokens de sesión y autenticación segura por correo electrónico (OTP de 6 dígitos) o Google OAuth.</li>
              <li>Tus datos financieros jamás serán vendidos ni compartidos con terceros con fines comerciales o publicitarios.</li>
              <li>Puedes eliminar tu cuenta y todos sus registros asociados de forma definitiva en cualquier momento desde la sección de Configuración de la aplicación.</li>
            </ul>
          </div>

          {/* Stripe & Payments */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Scale size={16} className="text-[#00FF66]" />
              <span>4. Planes, Pagos y Suscripciones (Stripe)</span>
            </div>
            <p>
              La contratación del Plan Premium se efectúa de forma externa y segura a través de la pasarela de pagos integrada de <strong>Stripe</strong>.
            </p>
            <p>
              El cobro se procesará según la tarifa elegida. El usuario puede cancelar su renovación de suscripción recurrente cuando lo desee sin penalización alguna. En caso de canjear códigos promocionales o códigos especiales autorizados (como el código de cortesía), el acceso se activará sin cargos adicionales bajo estos mismos términos de uso razonable.
            </p>
          </div>

          {/* Modifications */}
          <div className="pt-4 border-t border-[#ffffff05] text-[10px] text-[#8E8E93]">
            Última actualización: Julio de 2026. ALMO AI se reserva el derecho de modificar estos términos de uso informando debidamente a los usuarios en la web.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white text-black hover:bg-[#E5E5EA] font-semibold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_15px_rgba(0,255,102,0.1)]"
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  );
}
