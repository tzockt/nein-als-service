const express = require('express');
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const net = require('net');

const app = express();
app.use(cors());
// Kein 'trust proxy': req.ip bleibt die echte TCP-Peer-Adresse und ist nicht per Header spoofbar.
const PORT = process.env.PORT || 3000;

// Gründe aus der JSON-Datei laden
const gruende = JSON.parse(fs.readFileSync('./gruende.json', 'utf-8'));

// Offizielle Cloudflare-IP-Bereiche (Stand: cloudflare.com/ips). Nur wenn die tatsächliche
// TCP-Verbindung von einer dieser IPs kommt, darf dem client-seitigen Header cf-connecting-ip
// vertraut werden – sonst könnte jeder Angreifer den Header frei setzen und das Rate-Limit umgehen.
const CLOUDFLARE_CIDRS = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32',
  '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
];

function normalizeIp(ip) {
  return ip && ip.startsWith('::ffff:') && net.isIP(ip.slice(7)) === 4 ? ip.slice(7) : ip;
}

function ipToBigInt(ip) {
  if (net.isIP(ip) === 4) {
    return ip.split('.').reduce((acc, part) => (acc << 8n) | BigInt(part), 0n);
  }
  if (net.isIP(ip) === 6) {
    const [head, tail = ''] = ip.split('::');
    const headParts = head ? head.split(':') : [];
    const tailParts = tail ? tail.split(':') : [];
    const middle = new Array(8 - headParts.length - tailParts.length).fill('0');
    return [...headParts, ...middle, ...tailParts]
      .reduce((acc, part) => (acc << 16n) | BigInt(parseInt(part || '0', 16)), 0n);
  }
  return null;
}

function isIpInCidr(ip, cidr) {
  const [range, bitsStr] = cidr.split('/');
  const ipValue = ipToBigInt(ip);
  const rangeValue = ipToBigInt(range);
  const totalBits = net.isIP(range) === 4 ? 32 : 128;
  if (ipValue === null || rangeValue === null || net.isIP(ip) !== net.isIP(range)) return false;
  const shift = BigInt(totalBits - parseInt(bitsStr, 10));
  return (ipValue >> shift) === (rangeValue >> shift);
}

function isCloudflareIp(ip) {
  return CLOUDFLARE_CIDRS.some((cidr) => isIpInCidr(ip, cidr));
}

// Rate-Limiter: 120 Anfragen pro Minute pro IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 Minute
  max: 120,
  keyGenerator: (req) => {
    const peerIp = normalizeIp(req.ip);
    const cfHeader = req.headers['cf-connecting-ip'];
    // cf-connecting-ip nur vertrauen, wenn die Verbindung wirklich von Cloudflare kommt.
    return (cfHeader && isCloudflareIp(peerIp)) ? cfHeader : peerIp;
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
