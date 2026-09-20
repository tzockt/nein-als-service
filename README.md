# ❌ Nein-als-Service

Eine winzige API, die auf Zuruf einen zufälligen, kreativen Grund liefert, „Nein“ zu sagen — für Absagen, Bots, Landingpages oder einfach nur zum Spaß.

Deutscher Fork von [no-as-a-service](https://github.com/hotheadhacker/no-as-a-service): alle Sprüche neu übersetzt und um über 200 eigene, deutsche ergänzt (aktuell **1288 Gründe** in `gruende.json`).

## Nutzung

```http
GET /nein
```

```json
{ "grund": "Mein innerer Schweinehund hat heute Vetorecht, und er nutzt es ausgiebig." }
```

Rate-Limit: 120 Anfragen/Minute/IP.

## Starten

**Mit Docker (empfohlen):**
```bash
docker run -p 3000:3000 ghcr.io/tzockt/nein-als-service:latest
```

**Oder lokal mit Node:**
```bash
npm install
npm start
```

Läuft danach unter `http://localhost:3000/nein` (Port änderbar via `PORT=5000 npm start`).

## Entwicklung

Container wird bei jedem Push auf `main` per GitHub Action automatisch gebaut und nach `ghcr.io/tzockt/nein-als-service` veröffentlicht. In Codespaces/VS Code startet `.devcontainer.json` automatisch die passende Umgebung.

## Lizenz

MIT, siehe [LICENSE](LICENSE). Original von [hotheadhacker](https://github.com/hotheadhacker), deutsche Übersetzung und Erweiterung für dieses Projekt.
