const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');
const INDEX_FILE = path.join(__dirname, 'index.html');

async function ensureStorage() {
  await fsp.mkdir(DATA_DIR, { recursive: true });
  try {
    await fsp.access(DATA_FILE, fs.constants.F_OK);
  } catch (_) {
    await fsp.writeFile(DATA_FILE, '[]', 'utf8');
  }
}

async function readSubmissions() {
  await ensureStorage();
  const raw = await fsp.readFile(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}

async function writeSubmissions(entries) {
  await fsp.writeFile(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

function aggregateStats(entries) {
  const stats = {
    totalSubmissions: entries.length,
    ageRanges: {},
    familySituations: {},
  };

  for (const entry of entries) {
    if (entry.ageRange) {
      stats.ageRanges[entry.ageRange] = (stats.ageRanges[entry.ageRange] || 0) + 1;
    }

    if (entry.familySituation) {
      stats.familySituations[entry.familySituation] =
        (stats.familySituations[entry.familySituation] || 0) + 1;
    }
  }

  return stats;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, stream) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  stream.pipe(res);
}

function sendNotFound(res) {
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ message: 'Ressource introuvable.' }));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!body) {
        return resolve({});
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

function validateSubmission(payload) {
  const errors = [];
  if (!payload.ageRange) {
    errors.push("La tranche d'âge est obligatoire.");
  }
  if (!payload.profession) {
    errors.push('La profession est obligatoire.');
  }
  if (!payload.familySituation) {
    errors.push('La situation de famille est obligatoire.');
  }
  if (!payload.feeling) {
    errors.push('Le ressenti est obligatoire.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function handleTestimonialsPost(req, res) {
  try {
    const payload = await parseJsonBody(req);
    const { valid, errors } = validateSubmission(payload);

    if (!valid) {
      return sendJson(res, 400, { errors });
    }

    const submissions = await readSubmissions();
    const entry = {
      id: crypto.randomUUID(),
      ageRange: payload.ageRange,
      profession: payload.profession,
      familySituation: payload.familySituation,
      feeling: payload.feeling,
      submittedAt: new Date().toISOString(),
    };

    submissions.push(entry);
    await writeSubmissions(submissions);

    return sendJson(res, 201, {
      message: 'Merci pour votre témoignage !',
      entry,
    });
  } catch (error) {
    if (error.message === 'Payload too large') {
      return sendJson(res, 413, { message: 'Données trop volumineuses.' });
    }
    return sendJson(res, 400, { message: 'Requête invalide.' });
  }
}

async function handleStats(req, res) {
  const submissions = await readSubmissions();
  const stats = aggregateStats(submissions);
  sendJson(res, 200, stats);
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'text/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

function serveStaticFile(res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return sendNotFound(res);
    }
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, {
      'Content-Type': getContentType(filePath),
      'Cache-Control': 'no-store',
    });
    stream.pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = parsedUrl;

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    const stream = fs.createReadStream(INDEX_FILE);
    return sendHtml(res, stream);
  }

  if (req.method === 'GET' && pathname === '/api/stats') {
    return handleStats(req, res);
  }

  if (req.method === 'POST' && pathname === '/api/testimonials') {
    return handleTestimonialsPost(req, res);
  }

  const filePath = path.join(__dirname, pathname);
  if (filePath.startsWith(__dirname)) {
    return serveStaticFile(res, filePath);
  }

  return sendNotFound(res);
});

server.listen(PORT, () => {
  console.log(`Serveur Les Petites Attentions prêt sur http://localhost:${PORT}`);
});
