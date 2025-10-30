import { RestorationStep } from '../types';

interface LogPayload {
    userPrompt: string;
    steps: RestorationStep[];
}

/**
 * Invia un log del processo di restauro.
 * In un'applicazione reale, questo farebbe una chiamata API a un servizio di backend.
 * Per questa demo, registra i dettagli nella console per sviluppatori.
 * @param logData I dati da registrare.
 */
export const sendLog = async (logData: LogPayload): Promise<void> => {
    console.log("--- LOG DI UTILIZZO APP ---");
    console.log("Un restauro è stato completato con successo.");
    console.log("Dati del restauro:", logData);

    // In un'applicazione reale, qui si farebbe una richiesta POST a un endpoint del backend
    // per inviare l'email o salvare il log in un database.
    // Esempio:
    /*
    try {
        const response = await fetch('/api/log-usage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData),
        });
        if (!response.ok) {
            console.error("Failed to send log to server.");
        }
    } catch (error) {
        console.error("Error sending log:", error);
    }
    */
    
    // Simula un'operazione asincrona
    await new Promise(resolve => setTimeout(resolve, 100));
};
