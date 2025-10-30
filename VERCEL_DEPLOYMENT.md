# Guida al Deployment su Vercel

Questa app è configurata per essere deployata gratuitamente su Vercel con tracking persistente delle esecuzioni.

## Caratteristiche

- **100 foto gratuite** (limite globale condiviso tra tutti gli utenti)
- **Tracking completo**: ogni esecuzione viene salvata con immagine originale, finale e metadati
- **Storage persistente**: usa Vercel KV (Redis) per il conteggio e Vercel Blob per le immagini
- **Nessun reset al deploy**: i dati persistono tra i deployment

## Requisiti

1. Account Vercel (gratuito)
2. Google Gemini API Key

## Passaggi per il Deployment

### 1. Preparazione Repository

```bash
# Installa le dipendenze
npm install

# Testa localmente
npm run dev
```

### 2. Deploy su Vercel

#### Opzione A: Deploy da CLI

```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Segui il prompt e configura il progetto
```

#### Opzione B: Deploy da Dashboard Vercel

1. Vai su [vercel.com](https://vercel.com)
2. Clicca su "Add New Project"
3. Importa il repository da GitHub/GitLab/Bitbucket
4. Vercel rileverà automaticamente che è un progetto Vite

### 3. Configurazione Environment Variables

Nel dashboard Vercel, vai su **Settings → Environment Variables** e aggiungi:

```
GEMINI_API_KEY=your_google_gemini_api_key_here
```

**Importante**: L'API key deve avere accesso a:
- `gemini-2.5-pro` (per la pianificazione)
- `gemini-2.5-flash-image` (per la generazione immagini)

### 4. Attivazione Vercel KV (Redis)

1. Nel dashboard del progetto, vai su **Storage**
2. Clicca su **Create Database**
3. Seleziona **KV (Redis)**
4. Scegli il piano **Hobby** (gratuito)
5. Clicca su **Create**

Vercel collegherà automaticamente il database al progetto aggiungendo le variabili d'ambiente necessarie:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 5. Attivazione Vercel Blob Storage

1. Nel dashboard del progetto, vai su **Storage**
2. Clicca su **Create Database**
3. Seleziona **Blob**
4. Scegli il piano **Hobby** (gratuito)
5. Clicca su **Create**

Vercel collegherà automaticamente il blob storage aggiungendo:
- `BLOB_READ_WRITE_TOKEN`

### 6. Re-deploy

Dopo aver configurato KV e Blob, fai un re-deploy:

```bash
vercel --prod
```

O dalla dashboard: **Deployments → ... → Redeploy**

## Limiti del Piano Gratuito

### Vercel KV (Redis)
- ✅ 256 MB storage
- ✅ 100,000 comandi/mese
- ✅ Sufficiente per tracking del conteggio

### Vercel Blob Storage
- ✅ 100 GB bandwidth/mese
- ✅ Spazio illimitato (pay-per-use, ma molto economico)
- ✅ Sufficiente per ~100 immagini/mese

### Vercel Hosting
- ✅ 100 GB bandwidth/mese
- ✅ Serverless Function invocations illimitate
- ✅ 100 ore compute/mese

## Struttura API

L'app include 3 endpoint serverless:

### GET /api/remaining-uses
Ritorna il numero di utilizzi rimanenti
```json
{
  "remainingUses": 95,
  "totalUses": 5,
  "maxUses": 100
}
```

### POST /api/use-photo
Decrementa il conteggio di 1 utilizzo
```json
{
  "success": true,
  "remainingUses": 94,
  "totalUses": 6,
  "maxUses": 100
}
```

### POST /api/log-execution
Salva l'esecuzione (immagine originale + finale + metadati)
```json
{
  "success": true,
  "executionId": "execution-1234567890-abc123",
  "timestamp": "2025-10-30T12:34:56.789Z",
  "urls": {
    "original": "https://blob.vercel-storage.com/...",
    "final": "https://blob.vercel-storage.com/...",
    "metadata": "https://blob.vercel-storage.com/..."
  }
}
```

## Monitoraggio

### Controllare il conteggio usi
```bash
# Da Vercel KV dashboard
# Cerca la key: photo-restoration-global-uses
```

### Visualizzare le esecuzioni salvate
1. Vai su **Storage → Blob**
2. Naviga in `executions/`
3. Ogni esecuzione ha una cartella con:
   - `original.jpg` - immagine caricata
   - `final.jpg` - immagine restaurata
   - `metadata.json` - dettagli (timestamp, prompt, steps)

## Reset del Conteggio (se necessario)

Se vuoi resettare il conteggio a 0 (es. all'inizio del mese):

1. Vai su **Storage → KV**
2. Trova la key `photo-restoration-global-uses`
3. Cancellala o modifica il valore

## Troubleshooting

### "Failed to fetch remaining uses"
- Verifica che Vercel KV sia attivo
- Controlla che le env variables `KV_*` siano configurate
- Guarda i logs in **Deployments → Function Logs**

### "Failed to log execution"
- Verifica che Vercel Blob sia attivo
- Controlla che `BLOB_READ_WRITE_TOKEN` sia configurato
- Verifica che l'immagine non superi i 4.5 MB (limite serverless function payload)

### Errori CORS
- Le API hanno già i headers CORS configurati
- Se vedi errori, verifica che le richieste vengano fatte allo stesso dominio

## Ottimizzazioni Future

Per ridurre i costi se l'app diventa popolare:

1. **Compressione immagini**: ridurre la qualità/dimensione prima del salvataggio
2. **Retention policy**: cancellare automaticamente esecuzioni dopo X giorni
3. **Rate limiting**: limitare utilizzi per IP
4. **Cache**: cachare il conteggio rimanente per qualche minuto

## Link Utili

- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
