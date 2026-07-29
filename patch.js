const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\('\/api\/gemini\/plan', async \(req, res\) => \{[\s\S]*?\n\}\);\n/m;
const replacement = `app.post('/api/gemini/plan', async (req, res) => {
  res.json({
    title: \`Plan de Optimización Financiera Premium (\${req.body?.type === 'saving' ? 'Ahorro' : 'Inversión'})\`,
    actions: [
      'Automatizar una transferencia del 15% del salario neto a una cuenta de ahorros remunerada al inicio del mes.',
      'Auditar y cancelar un 20% de suscripciones de ocio inactivas (ahorro estimado de 45€/mes).',
      'Invertir la aportación sobrante mensual en un fondo indexado global de bajo coste (ej. Vanguard Global Stock Index).',
      'Revisar las pólizas de seguros activos (salud, coche, hogar) para negociar mejores primas antes de la renovación.'
    ],
    simulationScenarios: {
      optimistic: 'Si aumentas tus aportaciones adicionales en un 10% y el mercado rinde a un 9% anual, tu capital proyectado crecerá de forma exponencial superando tu objetivo holgadamente.',
      moderate: 'Siguiendo el plan base de ahorro continuo y rentabilidad del 5.5% anual, lograrás el 100% de tu objetivo en el plazo estimado de forma segura.',
      conservative: 'En caso de imprevistos o estancamiento de mercado con rentabilidad nula, el ahorro neto acumulado te garantizará cubrir al menos el 80% de tu meta planteada.'
    }
  });
});\n`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
