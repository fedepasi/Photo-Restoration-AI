import { RestorationStep } from '../types';

interface LogPayload {
    userPrompt: string;
    steps: RestorationStep[];
    originalImage: string;
    finalImage: string;
}

/**
 * Invia un log del processo di restauro al server Vercel.
 * Salva l'immagine originale, finale e i metadati su Vercel Blob Storage.
 * @param logData I dati da registrare (immagine originale, finale, steps, prompt).
 */
export const sendLog = async (logData: LogPayload): Promise<void> => {
    console.log("--- LOG DI UTILIZZO APP ---");
    console.log("Invio log al server...");

    try {
        const response = await fetch('/api/log-execution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                originalImage: logData.originalImage,
                finalImage: logData.finalImage,
                userPrompt: logData.userPrompt,
                steps: logData.steps.map(s => ({
                    objective: s.objective,
                    prompt: s.prompt
                }))
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Failed to send log to server:", errorData);
            throw new Error(errorData.error || 'Failed to log execution');
        }

        const result = await response.json();
        console.log("✅ Log salvato con successo:", result);
    } catch (error) {
        console.error("Error sending log:", error);
        throw error;
    }
};
