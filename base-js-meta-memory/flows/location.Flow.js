import { addKeyword, EVENTS } from '@builderbot/bot';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const NUMBER_ID = process.env.NUMBER_ID;
const JWT_TOKEN = process.env.JWT_TOKEN;

// Función para obtener hospitales/clínicas cercanas
const getNearbyClinics = async (latitude, longitude) => {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
    const params = {
        location: `${latitude},${longitude}`, // Coordenadas del usuario
        radius: 5000, // Radio de búsqueda en metros (5 km)
        type: 'hospital', // Tipo de lugar
        key: GOOGLE_API_KEY,
    };

    try {
        const response = await axios.get(url, { params });
        const results = response.data.results.slice(0, 3); // Tomar los 3 primeros resultados
        return results.map((place) => ({
            name: place.name,
            address: place.vicinity,
            location: place.geometry.location,
            type: 'hospital',
        }));
    } catch (error) {
        console.error('Error al llamar a Google Places API:', error);
        return [];
    }
};

// Función para enviar ubicación a través de WhatsApp API
const sendLocationToWhatsApp = async (phoneNumber, location) => {
    const url = `https://graph.facebook.com/v21.0/${NUMBER_ID}/messages`;
    const data = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'location',
        location: {
            latitude: location.lat,
            longitude: location.lng,
            name: location.name,
            address: location.address,
        },
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                Authorization: `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('Ubicación enviada exitosamente:', response.data);
    } catch (error) {
        console.error('Error al enviar ubicación a WhatsApp:', error.response?.data || error.message);
    }
};

const locationFlow = addKeyword(EVENTS.LOCATION)
    .addAnswer('Buscando establecimientos cercanos...', null, async (ctx, ctxFn) => {
        try {
            const latitude = ctx.latitude;
            const longitude = ctx.longitude;
            const phoneNumber = ctx.from; // Número de teléfono del usuario

            if (!latitude || !longitude) {
                console.log('Error: Coordenadas no encontradas en el contexto:', ctx);
                await ctxFn.flowDynamic('No se pudieron obtener las coordenadas. Verifica que has compartido tu ubicación correctamente.');
                return;
            }

            console.log('Datos extraídos:', { latitude, longitude });

            // Obtener lugares cercanos usando Google Places API
            const clinics = await getNearbyClinics(latitude, longitude);

            if (clinics.length === 0) {
                console.log('No se encontraron lugares cercanos.');
                await ctxFn.flowDynamic('No se encontraron establecimientos cercanos. Intenta de nuevo más tarde.');
                return;
            }

            console.log('Resultados de Google Places API:', clinics);

            // Enviar cada clínica al usuario como una ubicación
            for (const clinic of clinics) {
                const location = {
                    lat: clinic.location.lat,
                    lng: clinic.location.lng,
                    name: clinic.name,
                    address: clinic.address,
                };
                await sendLocationToWhatsApp(phoneNumber, location);
            }

            await ctxFn.flowDynamic('Te hemos enviado las ubicaciones de los establecimientos cercanos.');
        } catch (error) {
            console.error('Error completo:', error);
            await ctxFn.flowDynamic('Error al procesar la ubicación. Por favor, intenta nuevamente.');
        }
    });

export { locationFlow };
