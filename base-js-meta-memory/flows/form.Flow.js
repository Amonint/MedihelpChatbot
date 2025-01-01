import { addKeyword, EVENTS } from '@builderbot/bot';
import { createEvent } from "../scripts/calendar.js";

const formFlow = addKeyword(EVENTS.ACTION)
    .addAnswer("¡Excelente! Gracias por confirmar la fecha. Te voy a hacer unas consultas para agendar el turno. Primero ¿Cual es tu nombre?", { capture: true },
        async (ctx, ctxFn) => {
            try {
                const currentState = await ctxFn.state.getMyState();
                console.log("Estado actual en formFlow:", currentState);
                await ctxFn.state.update({ name: ctx.body });
            } catch (error) {
                console.error("Error al guardar nombre:", error);
                return ctxFn.endFlow("Hubo un error. Por favor, intenta nuevamente.");
            }
        })
    .addAnswer("Perfecto, ¿Cuál es el motivo del turno?", { capture: true },
        async (ctx, ctxFn) => {
            try {
                await ctxFn.state.update({ motive: ctx.body });
            } catch (error) {
                console.error("Error al guardar motivo:", error);
                return ctxFn.endFlow("Hubo un error. Por favor, intenta nuevamente.");
            }
        })
    .addAnswer("¡Excelente! Ya cree la reunión. Te esperamos!", null,
        async (ctx, ctxFn) => {
            try {
                const userInfo = await ctxFn.state.getMyState();
                console.log("Información final para crear evento:", userInfo);

                if (!userInfo.date || !userInfo.name || !userInfo.motive) {
                    throw new Error("Falta información necesaria");
                }

                const eventId = await createEvent(userInfo.name, userInfo.motive, userInfo.date);
                await ctxFn.state.clear();
                return ctxFn.flowDynamic(`Turno confirmado con ID: ${eventId}`);
            } catch (error) {
                console.error("Error al crear evento:", error);
                return ctxFn.endFlow("Hubo un error al crear el turno. Por favor, intenta nuevamente.");
            }
        });
export default formFlow; 