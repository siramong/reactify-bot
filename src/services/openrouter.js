const axios = require('axios');
const config = require('../config/config');

class OpenRouterService {
  constructor() {
    this.apiKey = config.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  // Summarize a single documentation resource
  async summarizeResource(resource) {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: 'meta-llama/llama-3.1-8b-instruct',
          messages: [
            {
              role: 'system',
              content: 'Eres un asistente educativo.'
            },
            {
              role: 'user',
              content: `Resume el siguiente recurso en 2-3 oraciones para estudiantes de bachillerato: ${resource}`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      throw error;
    }
  }

  // Summarize multiple documentation resources
  async summarizeDocumentation(docs) {
    try {
      // Split by comma and trim
      const docList = docs.split(',').map(doc => doc.trim()).filter(doc => doc.length > 0);
      
      if (docList.length === 0) {
        return 'No se proporcionó documentación.';
      }

      // Summarize each document
      const summaries = [];
      for (const doc of docList) {
        try {
          const summary = await this.summarizeResource(doc);
          summaries.push(`• ${doc}\n  ${summary}`);
        } catch (error) {
          console.error(`Error summarizing ${doc}:`, error);
          summaries.push(`• ${doc}\n  (No se pudo generar resumen)`);
        }
      }

      return summaries.join('\n\n');
    } catch (error) {
      console.error('Error summarizing documentation:', error);
      throw error;
    }
  }
}

module.exports = new OpenRouterService();
