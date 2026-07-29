import { Challenge } from '../types';

export const CHALLENGES_POOL: Omit<Challenge, 'currentAmount' | 'isCompleted' | 'progressionPercent'>[] = [
  { id: 'ch-1', title: 'Primeros Pasos de Ahorro', description: 'Registra tu primera transacción del día para activar el control de tus finanzas.', rewardXP: 100, targetAmount: 1, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-2', title: 'Hucha Fiel Constante', description: 'Registra 3 movimientos de ingresos o gastos en tus cuentas locales.', rewardXP: 250, targetAmount: 3, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-3', title: 'Mente Activa Inversora', description: 'Añade tu primer activo o inversión en tu cartera de inversión local.', rewardXP: 300, targetAmount: 1, durationWeeks: 1, category: 'Inversión' },
  { id: 'ch-4', title: 'Escáner Inteligente OCR', description: 'Sube y escanea un ticket de compra usando el lector automático de IA.', rewardXP: 200, targetAmount: 1, durationWeeks: 1, category: 'IA' },
  { id: 'ch-5', title: 'Planificador Consecuente', description: 'Diseña tu primer plan de ahorro estratégico fiduciario a largo plazo.', rewardXP: 250, targetAmount: 1, durationWeeks: 1, category: 'Planificación' },
  { id: 'ch-6', title: 'Consultor de Finanzas AI', description: 'Envía un mensaje o consulta de salud financiera al Chat de ALMO AI.', rewardXP: 150, targetAmount: 1, durationWeeks: 1, category: 'IA' },
  { id: 'ch-7', title: 'Limpieza de Gastos Ocio', description: 'Registra un gasto en vivienda o alimentación para equilibrar tu canasta básica.', rewardXP: 150, targetAmount: 1, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-8', title: 'Hucha de Control Hormiga', description: 'Registra un gasto menor de 15 € detectando y tapando fugas innecesarias.', rewardXP: 100, targetAmount: 1, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-9', title: 'Disciplina de Registros', description: 'Consigue registrar 5 movimientos en tu historial para consolidar tu constancia.', rewardXP: 400, targetAmount: 5, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-10', title: 'Planificador Previsor', description: 'Crea un plan fiduciario de jubilación o amortización en Planes Estratégicos.', rewardXP: 300, targetAmount: 1, durationWeeks: 1, category: 'Planificación' },
  { id: 'ch-11', title: 'Cartera Diversificada', description: 'Registra un activo de inversión en bolsa, índices o cripto para proteger tu valor.', rewardXP: 350, targetAmount: 1, durationWeeks: 1, category: 'Inversión' },
  { id: 'ch-12', title: 'Sintonía de Diagnóstico', description: 'Pregúntale a ALMO AI en el chat inteligente cuánto puedes gastar hoy.', rewardXP: 120, targetAmount: 1, durationWeeks: 1, category: 'IA' },
  { id: 'ch-13', title: 'Archivo Digital OCR', description: 'Escanea dos facturas o recibos para archivar tus comprobantes físicos.', rewardXP: 250, targetAmount: 2, durationWeeks: 1, category: 'IA' },
  { id: 'ch-14', title: 'Hucha Protectora Inflación', description: 'Registra un activo financiero de bajo riesgo o renta fija en Inversiones.', rewardXP: 300, targetAmount: 1, durationWeeks: 1, category: 'Inversión' },
  { id: 'ch-15', title: 'Inyección de Flujo de Caja', description: 'Registra un movimiento de tipo ingreso fiduciario en tu historial.', rewardXP: 150, targetAmount: 1, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-16', title: 'Control de Facturas Fijas', description: 'Registra un gasto en suministros o internet para vigilar las facturas mensuales.', rewardXP: 120, targetAmount: 1, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-17', title: 'Simulación del Mañana', description: 'Pídele una simulación de compra importante o de hucha al Chat de la IA.', rewardXP: 150, targetAmount: 1, durationWeeks: 1, category: 'IA' },
  { id: 'ch-18', title: 'Horizonte de Riqueza', description: 'Diseña tu meta de acumulación de capital a medio plazo en Planes Estratégicos.', rewardXP: 250, targetAmount: 1, durationWeeks: 1, category: 'Planificación' },
  { id: 'ch-19', title: 'Ocio Bajo Vigilancia', description: 'Registra un gasto de tipo ocio para comprobar el cumplimiento de tus presupuestos.', rewardXP: 100, targetAmount: 1, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-20', title: 'Hucha de Doble Ingreso', description: 'Registra dos ingresos consecutivos para subir tus balances de efectivo.', rewardXP: 180, targetAmount: 2, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-21', title: 'Inversor Sistemático', description: 'Registra un nuevo activo con rentabilidad estimada superior al 5%.', rewardXP: 250, targetAmount: 1, durationWeeks: 1, category: 'Inversión' },
  { id: 'ch-22', title: 'Lectura OCR Avanzada', description: 'Sube una factura al escáner IA para desglosar tus impuestos.', rewardXP: 180, targetAmount: 1, durationWeeks: 1, category: 'IA' },
  { id: 'ch-23', title: 'Vigilancia de Vivienda', description: 'Registra tu pago mensual de alquiler o hipoteca para sincerar tus gastos fijos.', rewardXP: 120, targetAmount: 1, durationWeeks: 1, category: 'Ahorro' },
  { id: 'ch-24', title: 'Consejero de Libertad', description: 'Pregúntale a ALMO AI en el Chat sobre cómo diversificar activos de forma segura.', rewardXP: 150, targetAmount: 1, durationWeeks: 1, category: 'IA' }
];

export function getDailyChallengeIds(): string[] {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  
  // Choose two distinct indices from 0 to CHALLENGES_POOL.length - 1
  const idx1 = dayOfYear % CHALLENGES_POOL.length;
  // Ensure we pick a different challenge (e.g., offset by 5 and wrap)
  let idx2 = (dayOfYear + 5) % CHALLENGES_POOL.length;
  if (idx1 === idx2) {
    idx2 = (idx2 + 1) % CHALLENGES_POOL.length;
  }
  
  return [CHALLENGES_POOL[idx1].id, CHALLENGES_POOL[idx2].id];
}
