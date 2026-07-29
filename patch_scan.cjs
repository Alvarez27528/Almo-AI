const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\('\/api\/gemini\/scan', async \(req, res\) => \{[\s\S]*?\n\}\);\n/m;
const replacement = `app.post('/api/gemini/scan', async (req, res) => {
  try {
    const { imageBase64, mockReceiptType } = req.body;
    
    // Si no hay imagen (modo demo/simulación), retornamos datos fijos para no gastar tokens
    if (!imageBase64) {
      if (mockReceiptType === 'restaurant') {
        return res.json({
          merchant: 'Restaurante El Celler',
          date: new Date().toISOString().split('T')[0],
          products: [
            { name: 'Menú Degustación', price: 45.00, quantity: 2 },
            { name: 'Vino Tinto', price: 24.50, quantity: 1 }
          ],
          tax: 11.45,
          total: 114.50,
          category: 'Ocio'
        });
      } else if (mockReceiptType === 'uber') {
        return res.json({
          merchant: 'Uber Rent',
          date: new Date().toISOString().split('T')[0],
          products: [
            { name: 'Viaje Aeropuerto T4', price: 32.40, quantity: 1 }
          ],
          tax: 3.24,
          total: 32.40,
          category: 'Transporte'
        });
      } else if (mockReceiptType === 'cloud') {
        return res.json({
          merchant: 'Amazon Web Services',
          date: new Date().toISOString().split('T')[0],
          products: [
            { name: 'EC2 t3.micro', price: 12.00, quantity: 1 },
            { name: 'RDS PostgreSQL', price: 28.50, quantity: 1 }
          ],
          tax: 8.50,
          total: 49.00,
          category: 'Suscripciones'
        });
      } else {
        return res.json({
          merchant: 'Mercadona Supermercados',
          date: new Date().toISOString().split('T')[0],
          products: [
            { name: 'Fruta variada y verduras', price: 12.40, quantity: 1 },
            { name: 'Pechuga de pollo fileteada', price: 6.50, quantity: 2 }
          ],
          tax: 2.54,
          total: 25.40,
          category: 'Alimentación'
        });
      }
    }

    const ai = getGeminiClient();

    const mimeMatch = imageBase64.match(/^data:(image\\/\\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\\/\\w+;base64,/, '');

    const contentsPart = [{
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    }, {
      text: "Analiza detenidamente esta imagen de ticket/factura comercial. Detecta el nombre de la empresa/comercio, los productos adquiridos con sus precios unitarios, el importe total, el porcentaje e importe de IVA/tasas, la fecha de la compra y clasifica la compra en una de estas categorías financieras: 'Vivienda', 'Alimentación', 'Transporte', 'Suscripciones', 'Ocio', 'Educación', 'Salud', 'Impuestos', 'Otros'. Devuelve un objeto JSON con la estructura del responseSchema."
    }];

    const response = await ai.models.generateContent({
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
            category: { type: Type.STRING, description: 'Categoría sugerida.' }
          },
          required: ['merchant', 'date', 'products', 'tax', 'total', 'category']
        }
      }
    });

    let rawText = response.text || '{}';
    if (rawText.includes('\`\`\`')) {
      rawText = rawText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
    }
    const parsedData = JSON.parse(rawText || '{}');
    res.json(parsedData);
  } catch (error) {
    console.error('Error in Receipt Scan API:', error);
    res.status(500).json({ error: error.message || 'Failed to scan receipt' });
  }
});\n`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
