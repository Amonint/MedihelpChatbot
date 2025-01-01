import { addKeyword, EVENTS } from '@builderbot/bot';

const welcomeFlow = addKeyword(EVENTS.ACTION)  
    .addAction(async (ctx, ctxFn) => {  
        await ctxFn.endFlow("Bienvenido a este chatbot! \nPuedes escribir 'Agendar cita' para reservar");  
    });  

    export  {welcomeFlow };