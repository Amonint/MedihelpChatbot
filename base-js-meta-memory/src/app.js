import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { MetaProvider as Provider } from '@builderbot/provider-meta';
import { dateFlow } from '../flows/date.Flow.js';
import { welcomeFlow } from '../flows/welcome.Flow.js';
import formFlow from '../flows/form.Flow.js';

const PORT = process.env.PORT ?? 3008;

const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, ctxFn) => {
        
        const bodyText = ctx.body.toLowerCase();
        // El usuario esta saludando?  
        const keywords = ["hola", "buenas", "ola"];
        const containsKeyword = keywords.some(keyword => bodyText.includes(keyword));
        if (containsKeyword && ctx.body.length < 8) {
            return await ctxFn.gotoFlow(welcomeFlow);
        }

        // El usuario quiere agendar una cita?  
        const keywordsDate = ["agendar", "cita", "reunion", "turno"];
        const containsKeywordDate = keywordsDate.some(keyword => bodyText.includes(keyword));
        if (containsKeywordDate) {
            return ctxFn.gotoFlow(dateFlow);
        } else {
            return ctxFn.endFlow("No te entiendo");
        }
    });

const main = async () => {
    const database = new Database();
    
    const adapterFlow = createFlow([flowPrincipal, dateFlow, formFlow, welcomeFlow]);
    const adapterProvider = createProvider(Provider, {
        jwtToken: process.env.JWT_TOKEN,
        numberId: process.env.NUMBER_ID,
        verifyToken: process.env.VERIFY_TOKEN,
        version: 'v21.0',
    });

    const { httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: database,
    });

    httpServer(+PORT);
};

main();