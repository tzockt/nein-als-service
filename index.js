const express = require('express');
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const app = express();
app.use(cors());
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Gründe aus der JSON-Datei laden
const gruende = JSON.parse(fs.readFileSync('./gruende.json', 'utf-8'));

// Rate-Limiter: 120 Anfragen pro Minute pro IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 120,
  keyGenerator: (req, res) => {
    return req.headers['cf-connecting-ip'] || req.ip; // Fallback falls Header fehlt (oder für Nicht-CF)
  },
  message: { error: "Zu viele Anfragen, bitte später erneut versuchen. (120 Anfragen/Minute/IP)" }
});

app.use(limiter);

// Endpoint für einen zufälligen Ablehnungsgrund
app.get('/nein', (req, res) => {
  const grund = gruende[Math.floor(Math.random() * gruende.length)];
  res.json({ grund });
});

// Server starten
app.listen(PORT, () => {
  console.log(`Nein-als-Service läuft auf Port ${PORT}`);
});
