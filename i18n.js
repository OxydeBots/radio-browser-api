const fs = require('fs');
const path = require('path');
const logger = require('./logger');
class I18n {
  constructor(defaultLanguage = 'en') {
    this.defaultLanguage = defaultLanguage;
    this.currentLanguage = defaultLanguage;
    this.messages = {};
    this.availableLanguages = [];
    this.loadLanguages();
  }

  // Load all language files from the languages directory
  loadLanguages() {
    const languagesDir = path.join(__dirname, 'languages');
    
    try {
      const files = fs.readdirSync(languagesDir);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const lang = file.replace('.json', '');
          const filePath = path.join(languagesDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          this.messages[lang] = JSON.parse(content);
          this.availableLanguages.push(lang);
        }
      });
       logger.log(`✓ Loaded languages: ${this.availableLanguages.join(', ')}`, 'Loading');
    } catch (err) {
     logger.log('Error loading language files:', 'Error');
    logger.log(err.message, 'Error');;
    }
  }

  // Set the current language
  setLanguage(lang) {
    if (this.availableLanguages.includes(lang)) {
      this.currentLanguage = lang;
      return true;
    } else {
      logger.log(`Language "${lang}" not available. Using default: ${this.defaultLanguage}`, 'Denied');
      this.currentLanguage = this.defaultLanguage;
      return false;
    }
  }

  // Get a message with placeholder replacement
  // Usage: i18n.get('stations.search_error', { error: 'Connection failed' })
  get(path, replacements = {}) {
    const keys = path.split('.');
    let message = this.messages[this.currentLanguage];

    // Navigate through the nested object
    for (let key of keys) {
      if (message && typeof message === 'object' && key in message) {
        message = message[key];
      } else {
        console.warn(`Missing translation key: ${path} for language: ${this.currentLanguage}`);
        return path; // Return the key path if not found
      }
    }

    // Replace placeholders
    if (typeof message === 'string') {
      return message.replace(/\{(\w+)\}/g, (match, key) => {
        return replacements[key] !== undefined ? replacements[key] : match;
      });
    }

    return message;
  }

  // Get all available languages
  getAvailableLanguages() {
    return this.availableLanguages;
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }
}

module.exports = I18n;

