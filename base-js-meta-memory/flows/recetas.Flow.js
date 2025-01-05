import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { addKeyword, EVENTS } from '@builderbot/bot';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CONFIG = {
    temperature: 0.2,
    top_p: 1,
    top_k: 32,
    max_output_tokens: 4096,
};

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: MODEL_CONFIG,
});

const ANALYSIS_PROMPT = `Soy Caresense, un asistente especializado en análisis médicos. Mi objetivo es ayudarte a entender tus medicamentos y resultados de laboratorio de manera simple y clara.

Si la imagen contiene una receta médica, analizaré:
# 💊 Medicamentos Recetados
Por cada medicamento explicaré:
- Nombre del medicamento en **negrita**
- Para qué sirve en *cursiva*
- Cómo tomarlo correctamente:
  • Momento del día (mañana, tarde, noche)
  • Con o sin alimentos
  • Cantidad exacta
  • Duración del tratamiento (si se especifica)
- Consejos prácticos y cuidados importantes

Si la imagen contiene resultados de laboratorio, analizaré:
# 🔬 Resultados de Laboratorio
Por cada resultado:
- Nombre del examen en **negrita**
- El resultado y su valor de referencia
- Explicación simple de qué significa
- Recomendaciones generales si está alterado

Formato de respuesta:
• Usar lenguaje simple y claro
• Enfocarse en información práctica y útil
• Evitar términos médicos complejos
• No mencionar "no hay resultados" si no aparecen en la imagen
• Si solo hay receta, analizar solo medicamentos
• Si solo hay resultados de laboratorio, analizar solo estos

Ejemplo de formato para medicamentos:
**Medicina X 100mg**
*Para: [beneficio principal]*
Tomar: [instrucciones claras]
Consejos: [tips prácticos]

⚠️ Recordatorio final: "Esta información te ayuda a entender mejor tu tratamiento. Sigue siempre las indicaciones de tu médico."`;

// El resto del código permanece igual, solo actualizando la variable ANALYSIS_PROMPT en las funciones

const sendImageToGemini = async (imagePath) => {
    try {
        const imgBuffer = fs.readFileSync(imagePath);
        const base64Image = imgBuffer.toString('base64');
        
        fs.unlink(imagePath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });
        
        const result = await model.generateContent([
            ANALYSIS_PROMPT,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const text = result.response.text();
        return text || '❌ No pude leer claramente la imagen. ¿Podrías enviarla nuevamente?';
    } catch (error) {
        console.error("Error procesando imagen:", error);
        throw error;
    }
};

const analyzePDF = async (filePath) => {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const base64PDF = fileBuffer.toString('base64');
        
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });

        const result = await model.generateContent([
            ANALYSIS_PROMPT,
            {
                inlineData: {
                    data: base64PDF,
                    mimeType: "application/pdf"
                }
            }
        ]);

        return result.response.text();
    } catch (error) {
        console.error("Error processing PDF:", error);
        throw error;
    }
};

const mediaFlow = addKeyword(EVENTS.MEDIA)
    .addAnswer(
        '🔍 Analizando tu documento médico...',
        null,
        async (ctx, { flowDynamic, provider }) => {
            try {
                const tmpDir = path.join(process.cwd(), 'tmp');
                fs.mkdirSync(tmpDir, { recursive: true });

                const filePath = await provider.saveFile(ctx, { path: tmpDir });
                if (!filePath) throw new Error('Error guardando imagen');

                const analysis = await sendImageToGemini(filePath);
                await flowDynamic([
                    { 
                        body: analysis
                    }
                ]);
            } catch (error) {
                console.error('Error:', error);
                await flowDynamic('❌ No pude procesar el documento. ¿Podrías intentar nuevamente?');
            }
        }
    );

const documentFlow = addKeyword(EVENTS.DOCUMENT)
    .addAnswer(
        '📄 Analizando documento...',
        null,
        async (ctx, { flowDynamic, provider }) => {
            try {
                const tmpDir = path.join(process.cwd(), 'tmp');
                fs.mkdirSync(tmpDir, { recursive: true });

                const filePath = await provider.saveFile(ctx, { path: tmpDir });
                
                if (!filePath.toLowerCase().endsWith('.pdf')) {
                    await flowDynamic('❌ Por favor, envía un documento en formato PDF.');
                    return;
                }

                const analysis = await analyzePDF(filePath);
                await flowDynamic([
                    {
                        body: analysis
                    }
                ]);
            } catch (error) {
                console.error('Error:', error);
                await flowDynamic('❌ No pude procesar el documento. ¿Podrías intentar nuevamente?');
            }
        }
    );

export { mediaFlow, documentFlow };