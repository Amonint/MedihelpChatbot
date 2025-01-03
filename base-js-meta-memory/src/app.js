import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { MetaProvider as Provider } from '@builderbot/provider-meta';
import { dateFlow } from '../flows/date.Flow.js';
import { welcomeFlow } from '../flows/welcome.Flow.js';
import { formFlow } from '../flows/form.Flow.js';
import {  documentFlow, mediaFlow } from '../flows/recetas.Flow.js';
import {  locationFlow} from '../flows/location.Flow.js'; // Ajuste aquí
import path from 'path';


const PORT = process.env.PORT ?? 3008;

const flowPrincipal = addKeyword(EVENTS.WELCOME).addAction(async (ctx, ctxFn) => {
    const bodyText = ctx.body.toLowerCase();
    const fileExtension = ctx.event?.file ? path.extname(ctx.event.file.name).toLowerCase() : null;

    const actions = [
        { 
            condition: () => ['hola', 'buenas', 'ola'].some(k => bodyText.includes(k)) && ctx.body.length < 8,
            action: () => ctxFn.gotoFlow(welcomeFlow)
        },
        {
            condition: () => ['agendar', 'cita', 'turno'].some(k => bodyText.includes(k)),
            action: () => ctxFn.gotoFlow(dateFlow)
        },
        {
            condition: () => ['receta', 'recetas', 'pastillas', 'pastilla', 'leer receta', 'medicacion'].some(k => bodyText.includes(k)),
            action: () => ctxFn.endFlow(
                '📄 Por favor, envía un archivo con la receta médica en formato PDF o una foto de la receta para continuar con el análisis.'
            )
        },
        {
            condition: () => fileExtension === '.pdf',
            action: () => ctxFn.gotoFlow(documentFlow)
        },
        {
            condition: () => ['.jpg', '.jpeg', '.png'].includes(fileExtension),
            action: () => ctxFn.gotoFlow(mediaFlow)
        },
        {
            condition: () => fileExtension,
            action: () => ctxFn.endFlow('❌ Por favor, envía un archivo válido (imagen o PDF).')
        }
    ];

    const match = actions.find(({ condition }) => condition());
    return match ? match.action() : ctxFn.endFlow('No entiendo tu mensaje. ¿Podrías ser más específico?');
});



const main = async () => {
    const database = new Database();

    const adapterFlow = createFlow([
        flowPrincipal,
        dateFlow,
        formFlow,
        welcomeFlow,documentFlow,mediaFlow,locationFlow // Incluido aquí
    ]);
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
