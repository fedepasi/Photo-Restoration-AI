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

    // Calcola dimensioni payload
    const originalSize = (logData.originalImage.length * 3) / 4 / (1024 * 1024);
    const finalSize = (logData.finalImage.length * 3) / 4 / (1024 * 1024);
    const totalSize = originalSize + finalSize;

    console.log(`📊 Dimensioni immagini:
    - Originale: ${originalSize.toFixed(2)} MB
    - Finale: ${finalSize.toFixed(2)} MB
    - Totale: ${totalSize.toFixed(2)} MB
    - Limite Vercel: ~4.5 MB`);

    if (totalSize > 4.5) {
        console.warn("⚠️ ATTENZIONE: Il payload supera il limite di Vercel (4.5MB)!");
    }

    try {
        const payload = {
            originalImage: logData.originalImage,
            finalImage: logData.finalImage,
            userPrompt: logData.userPrompt,
            steps: logData.steps.map(s => ({
                objective: s.objective,
                prompt: s.prompt
            }))
        };

        console.log("📤 Invio richiesta a /api/log-execution...");

        const response = await fetch('/api/log-execution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        console.log(`📥 Risposta ricevuta: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error("❌ Failed to send log to server:", {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Log salvato con successo:", {
            executionId: result.executionId,
            timestamp: result.timestamp,
            urls: result.urls
        });
        console.log("🔗 Link immagini:");
        console.log("  - Originale:", result.urls?.original);
        console.log("  - Finale:", result.urls?.final);
        console.log("  - Metadata:", result.urls?.metadata);
    } catch (error) {
        console.error("❌ Error sending log:", error);
        if (error instanceof Error) {
            console.error("  Dettagli:", error.message);
            console.error("  Stack:", error.stack);
        }
        throw error;
    }
};
