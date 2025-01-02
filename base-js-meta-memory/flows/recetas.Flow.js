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

const PHARMACIST_PROMPT = `Eres un farmacéutico experto y amable. Tu tarea es analizar recetas médicas y proporcionar información clara y útil para el paciente.

Para cada medicamento en la receta:
1. Identifica el nombre y la forma de administración (oral, spray, tópico, etc.)
2. Explica brevemente para qué se usa este medicamento
3. Si la receta incluye instrucciones específicas de dosificación, repítelas claramente
4. Menciona las contraindicaciones importantes y precauciones
5. Indica si hay interacciones relevantes con otros medicamentos o alimentos

Formato de respuesta:
- Usa emojis apropiados
- Estructura la información de manera clara
- Usa un tono amigable pero profesional
- Evita especular sobre dosificación si no está en la receta
- Enfatiza la importancia de seguir las instrucciones del médico

IMPORTANTE: No sugieras dosificación si no está especificada en la receta.`;

const sendImageToGemini = async (imagePath) => {
    try {
        const imgBuffer = fs.readFileSync(imagePath);
        const base64Image = imgBuffer.toString('base64');
        
        fs.unlink(imagePath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });
        
        const result = await model.generateContent([
            PHARMACIST_PROMPT,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            }
        ]);

        const text = result.response.text();
        return text || '❌ No se pudo detectar texto en la receta médica';
    } catch (error) {
        console.error("Error procesando imagen:", error);
        throw error;
    }
};

const mediaFlow = addKeyword(EVENTS.MEDIA)
    .addAnswer(
        '🔍 Analizando tu receta médica...',
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
                        body: `${analysis}\n\n⚕️ Recuerda: Esta información es solo educativa. Siempre sigue las instrucciones específicas de tu médico.`
                    }
                ]);
            } catch (error) {
                console.error('Error:', error);
                await flowDynamic('❌ Error procesando la receta. Por favor, intenta nuevamente.');
            }
        }
    );
    const analyzePDF = async (filePath) => {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const base64PDF = fileBuffer.toString('base64');
            
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
    
            const result = await model.generateContent([
                PHARMACIST_PROMPT,
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
                            body: `${analysis}\n\n⚕️ Recuerda: Esta información es educativa. Sigue las instrucciones de tu médico.`
                        }
                    ]);
                } catch (error) {
                    console.error('Error:', error);
                    await flowDynamic('❌ Error procesando el documento. Intenta nuevamente.');
                }
            }
        );

export { mediaFlow, documentFlow };