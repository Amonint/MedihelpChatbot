import { addKeyword, EVENTS } from '@builderbot/bot';
import { createEvent } from "../scripts/calendar.js";

const formFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("¡Excelente! Gracias por confirmar la fecha. Te voy a hacer unas consultas para agendar el turno. Primero ¿Cual es tu nombre?", { capture: true },
        async (ctx, ctxFn) => {
            console.log("Llegó al primer paso de formFlow con el contexto:", ctx);
            await ctxFn.state.update({ name: ctx.body });
        })
    .addAnswer("Perfecto, ¿Cuál es el motivo del turno?", { capture: true },
        async (ctx, ctxFn) => {
            console.log("Llegó al segundo paso de formFlow con el contexto:", ctx);
            await ctxFn.state.update({ motive: ctx.body });
        })
    .addAnswer("¡Excelente! Ya cree la reunión. Te esperamos!", null,
        async (ctx, ctxFn) => {
            console.log("Llegó al tercer paso de formFlow. Creando reunión...");
            const userInfo = await ctxFn.state.getMyState();
            const eventName = userInfo.name;
            const description = userInfo.motive;
            const date = userInfo.date;
            const eventId = await createEvent(eventName, description, date);
            console.log("Reunión creada con ID:", eventId);
            await ctxFn.state.clear();
        });

export { formFlow };
