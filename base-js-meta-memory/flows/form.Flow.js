import { addKeyword, EVENTS } from '@builderbot/bot';
import { createEvent } from "../scripts/calendar.js";

// Este es el flujo que recoge los datos del usuario una vez confirmada la fecha
const formFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("Te voy a hacer unas consultas primero para agendar tu turno. Primero, ¿cuál es tu nombre?", { capture: true },
        async (ctx, ctxFn) => {
            console.log("Llegó al primer paso de formFlow con el contexto:", ctx);
            await ctxFn.state.update({ name: ctx.body });
        })
    .addAnswer("Perfecto, ¿cuál es el motivo del turno?", { capture: true },
        async (ctx, ctxFn) => {
            console.log("Llegó al segundo paso de formFlow con el contexto:", ctx);
            await ctxFn.state.update({ motive: ctx.body });
        })
    .addAnswer("¡Genial! Estoy creando la cita con los datos proporcionados.", null,
        async (ctx, ctxFn) => {
            console.log("Llegó al tercer paso de formFlow. Creando cita...");

            // Recuperar la información de la cita
            const userInfo = await ctxFn.state.getMyState();
            const eventName = userInfo.name;
            const description = userInfo.motive;
            const date = userInfo.date;

            // Crear el evento
            const eventId = await createEvent(eventName, description, date);
            console.log("Reunión creada con ID:", eventId);

            // Limpiar el estado
            await ctxFn.state.clear();

            return ctxFn.endFlow("¡Cita agendada con éxito! Te esperamos.");
        });

export { formFlow };
