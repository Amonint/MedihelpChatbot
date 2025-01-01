import { addKeyword, EVENTS } from '@builderbot/bot';

const welcomeFlow = addKeyword(EVENTS.ACTION)  
    .addAction(async (ctx, ctxFn) => {  
        await ctxFn.endFlow(`
🌟 ¡Bienvenido a este chatbot! 🌟
Por favor elige una de las siguientes opciones escribiendo el texto correspondiente:

- 🗓️ Agendar cita
- 📂 Revisar su historial médico
- 💊 Consulta sobre recetas
- 🧪 Consulta sobre pedidos de laboratorio
- 🩺 Preguntas sobre la diabetes

Estamos aquí para ayudarte. 😊
        `);  
    });  

export { welcomeFlow };
