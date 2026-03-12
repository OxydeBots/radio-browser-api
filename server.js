const express = require('express');
const app = express();
const logger = require('./logger');
const I18n = require('./i18n');
const baseUrl = 'https://all.api.radio-browser.info';
const port = 3000;
const env = require('dotenv').config({override: true, path: './.env', encoding: 'utf8'})
const defaultLang = env.parsed.DEFAULT_LANGUAGE || 'en';
const i18n = new I18n(defaultLang);

// Server Statistics
let serverStats = {
  startTime: new Date(),
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  deniedRequests: 0
};

// IP whitelist configuration (add allowed IPs)
const allowedIPs = env.parsed.ALLOWED_IPS || ['127.0.0.1', '::1', '::ffff:127.0.0.1'] // Examples: localhost IPv4 and IPv6

const UserAgent = env.parsed.USER_AGENT || 'Oxyde_Bots/1.0';

// Middleware to verify IP whitelist
app.use((req, res, next) => {
  const clientIP = req.ip || req.socket.remoteAddress;
  if (!allowedIPs.includes(clientIP)) {
    logger.log(i18n.get('auth.access_denied', { ip: clientIP }), 'Denied');
    serverStats.deniedRequests++;
    return res.status(403).json({ error: i18n.get('auth.access_denied') });
  }
  logger.log(i18n.get('auth.access_allowed', { ip: clientIP }), 'Logs');
  serverStats.totalRequests++;
  next();
});

// Middleware to handle CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Logging middleware
app.use((req, res, next) => {
  logger.log(`${req.method} ${req.url} from ${req.ip || req.socket.remoteAddress}`, 'Logs');
  
  // Capture the response status code
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      serverStats.successfulRequests++;
    } else if (res.statusCode >= 400) {
      serverStats.failedRequests++;
    }
  });
  
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test external API connection
    const externalApiTest = await fetch(`${baseUrl}/json/countries`, {
      headers: { 'User-Agent': UserAgent }
    }).then(r => r.ok).catch(() => false);

    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    const now = new Date();
    
    const health = {
      status: 'OK',
      timestamp: now.toISOString(),
      server: {
        uptime: Math.floor(uptime),
        startTime: serverStats.startTime.toISOString(),
        runtime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        nodeVersion: process.version,
        platform: process.platform
      },
      statistics: {
        totalRequests: serverStats.totalRequests,
        successfulRequests: serverStats.successfulRequests,
        failedRequests: serverStats.failedRequests,
        deniedRequests: serverStats.deniedRequests,
        requestRate: (serverStats.totalRequests / uptime).toFixed(2) + ' req/s'
      },
      memory: {
        rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        external: (memUsage.external / 1024 / 1024).toFixed(2) + ' MB'
      },
      externalAPI: {
        status: externalApiTest ? 'OK' : 'DOWN',
        baseUrl: baseUrl
      }
    };
    
    res.json(health);
  } catch (err) {
    logger.log(i18n.get('server.health_check', { error: err.message }), 'Error');
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

// Endpoint to search for stations
app.get('/stations/search', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `${baseUrl}/json/stations/search?${queryParams}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.search_error', { error: err.message }), 'Denied');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to search for stations by name (simple)
app.get('/stations/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const url = `${baseUrl}/json/stations/search?name=${encodeURIComponent(name)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.search_by_name_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all stations
app.get('/stations', async (req, res) => {
  try {
    const url = `${baseUrl}/json/stations`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.search_all_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for stations by country
app.get('/stations/bycountry/:country', async (req, res) => {
  try {
    const { country } = req.params;
    const url = `${baseUrl}/json/stations/bycountry/${country}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.search_by_country_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to search for stations in a specific country
app.get('/stations/country/:country/search/:name', async (req, res) => {
  try {
    const { country, name } = req.params;
    const url = `${baseUrl}/json/stations/search?name=${encodeURIComponent(name)}&countrycode=${encodeURIComponent(country.toUpperCase())}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.search_by_name_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for stations by tag
app.get('/stations/bytag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const url = `${baseUrl}/json/stations/bytag/${tag}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.search_by_tag_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for stations by UUID
app.get('/stations/byuuid/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const url = `${baseUrl}/json/stations/byuuid/${uuid}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.search_by_uuid_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for top vote
app.get('/stations/topvote', async (req, res) => {
  try {
    const url = `${baseUrl}/json/stations/topvote`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.topvote_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for top click
app.get('/stations/topclick', async (req, res) => {
  try {
    const url = `${baseUrl}/json/stations/topclick`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.topclick_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for latest changes
app.get('/stations/lastchange', async (req, res) => {
  try {
    const url = `${baseUrl}/json/stations/lastchange`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.lastchange_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for latest clicks
app.get('/stations/lastclick', async (req, res) => {
  try {
    const url = `${baseUrl}/json/stations/lastclick`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.lastclick_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for countries
app.get('/countries', async (req, res) => {
  try {
    const url = `${baseUrl}/json/countries`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('metadata.countries_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for tags
app.get('/tags', async (req, res) => {
  try {
    const url = `${baseUrl}/json/tags`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('metadata.tags_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for languages
app.get('/languages', async (req, res) => {
  try {
    const url = `${baseUrl}/json/languages`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('metadata.languages_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint for states (by country)
app.get('/states/:country', async (req, res) => {
  try {
    const { country } = req.params;
    const url = `${baseUrl}/json/states/${country}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('metadata.states_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});



// Endpoint for station votes
app.get('/stations/votes/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const url = `${baseUrl}/json/votes/${uuid}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.votes_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to check a station
app.get('/stations/check/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const url = `${baseUrl}/json/check/${uuid}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.check_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});


// Endpoint to record a click (POST)
app.post('/stations/click/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const url = `${baseUrl}/json/click/${uuid}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.click_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to vote for a station (POST)
app.post('/stations/vote/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const url = `${baseUrl}/json/vote/${uuid}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'User-Agent': UserAgent }
    });
    if (!response.ok) throw new Error(i18n.get('http.error_prefix', { status: response.status }));
    const data = await response.json();
    res.json(data);
  } catch (err) {
    logger.log(i18n.get('stations.vote_error', { error: err.message }), 'Error');
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  logger.log(i18n.get('server.started', { port: port }), 'Login');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('uncaughtException', (err) => {
    console.error(err);
})

process.on('unhandledRejection', (reason, promise) => {
    console.error(reason);
})












