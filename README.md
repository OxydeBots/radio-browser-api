# Radio-Browser API Proxy

This Node.js API with Express acts as a proxy for the radio-browser.info API, providing multiple endpoints to access radio station data.

## 🌍 Multi-Language (i18n)

The server supports multi-language for all messages and errors. **Currently supported:** English (en), French (fr), Spanish (es), German (de), Italian (it), Portugal (pt).

### Language Configuration

#### At Server Startup
```bash
# English (default)
node index.js

# French
set DEFAULT_LANGUAGE=fr& node index.js

# Spanish
set DEFAULT_LANGUAGE=es& node index.js

# German
set DEFAULT_LANGUAGE=de& node index.js

# Italian
set DEFAULT_LANGUAGE=it& node index.js
```

#### Per HTTP Request
```bash
# Add ?lang=en / ?lang=fr / ?lang=es / ?lang=de / ?lang=it / ?lang=pt to endpoints
curl http://localhost:3000/health?lang=fr
curl http://localhost:3000/stations?lang=de
curl http://localhost:3000/countries?lang=it
curl http://localhost:3000/countries?lang=pt
```

### Adding a New Language
1. Create `languages/[code].json` (ex: `languages/de.json` for German)
2. Copy the structure from `languages/[code].json` and translate the messages
3. Restart the server - the language is loaded automatically

## Configuration

- **IP Whitelist**: Modify the `allowedIPs` array in `index.js` to authorize only certain IP addresses. By default, localhost is allowed.
- **Default Language**: Set `DEFAULT_LANGUAGE` as an environment variable or modify `.env`

## Security

- **Anti-crash Protection**: A basic anti-crash system is in place to ensure server stability.

## Installation

1. Clone or download the project.
2. Install dependencies: `npm i`
3. Rename .env.example by .env
4. Start the server: `node index.js`

The server will run on `http://localhost:3000`.

## Endpoints

### Health Check
- `GET /health` - Server status check (status, uptime, statistics)
  
### Station Search
- `GET /stations/search` - Advanced search with parameters (name, countrycode, etc)
- `GET /stations/search/:name` - Simple search by name
- `GET /stations/country/:country/search/:name` - Search within a specific country

### Stations by Criteria
- `GET /stations` - All stations
- `GET /stations/bycountry/:country` - Stations by country
- `GET /stations/bytag/:tag` - Stations by tag
- `GET /stations/byuuid/:uuid` - Specific station by UUID

### Popular Stations
- `GET /stations/topvote` - Most voted stations
- `GET /stations/topclick` - Most clicked stations
- `GET /stations/lastchange` - Recently modified stations
- `GET /stations/lastclick` - Recently clicked stations

### Station Information
- `GET /stations/votes/:uuid` - Retrieve votes for a station
- `GET /stations/check/:uuid` - Check/test a station

### Station Actions
- `POST /stations/click/:uuid` - Record a click for a station
- `POST /stations/vote/:uuid` - Vote for a station

### Metadata
- `GET /countries` - List of all countries
- `GET /tags` - List of all tags
- `GET /languages` - List of all languages
- `GET /states/:country` - States/regions of a country

## Usage Examples

### Basic Search
```bash
# Search for NRJ in France
GET /stations/search?name=nrj&countrycode=FR

# Search by simple name
GET /stations/search/nrj?lang=fr

# Search within a specific country
GET /stations/country/fr/search/nrj?lang=es
```

### Navigation
```bash
# French stations
GET /stations/bycountry/france?lang=en

# Stations with "rock" tag
GET /stations/bytag/rock?lang=fr

# Retrieve station by UUID
GET /stations/byuuid/[uuid]?lang=en
```

### Rankings
```bash
# Top 10 most voted stations
GET /stations/topvote?lang=fr

# Top 10 most clicked stations
GET /stations/topclick?lang=en

# Latest modifications
GET /stations/lastchange?lang=es
```

### Actions
```bash
# Record a click
POST /stations/click/[uuid]

# Vote for a station
POST /stations/vote/[uuid]
```

### Metadata
```bash
# Retrieve all countries
GET /countries?lang=fr

# Retrieve all tags
GET /tags?lang=en

# Retrieve states of a country
GET /states/france?lang=es
```

## Security

- The API uses an **IP whitelist** to restrict access. Configure `allowedIPs` in `index.js` to add authorized IPs.
  - Default: `127.0.0.1` (localhost) and `::1` (IPv6 localhost)
  - To find your IP: https://www.mon-ip.com/
- **CORS** is enabled for cross-origin requests
- **Logging** of requests for monitoring and debugging

## Monitoring

- `GET /health` returns detailed information:
  - Server status (uptime, Node.js version, platform)
  - Statistics (total requests, successful, failed, denied)
  - Memory usage (RSS, heap, etc)
  - External API status

## Translation Files

Translation files are stored in the `languages/` folder:
- `languages/en.json` - English
- `languages/fr.json` - French
- `languages/es.json` - Spanish
- `languages/de.json` - German
- `languages/it.json` - Italian
- `languages/pt.json` - Portugal


Each file contains messages for all endpoints and errors.</content>


