const axios = require('axios');
const config = require('../config/config');

class N8nService {
  constructor() {
    this.webhookUrl = config.N8N_WEBHOOK_URL;
  }

  // Export data to n8n webhook with retry logic
  async exportToN8n(data, retries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Export attempt ${attempt}/${retries}`);
        
        const response = await axios.post(this.webhookUrl, data, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });

        console.log('Export successful:', response.status);
        return response.data;
      } catch (error) {
        console.error(`Export attempt ${attempt} failed:`, error.message);
        lastError = error;
        
        // Wait 2 seconds before retry (except on last attempt)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError;
  }
}

module.exports = new N8nService();
