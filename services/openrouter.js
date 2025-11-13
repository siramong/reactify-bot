const axios = require('axios');
const config = require('../config/config');
const log = require('../utils/consoleLogger');

class OpenRouterService {
  constructor() {
    this.apiKey = config.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    // FREE MODEL - No cost at all!
    this.freeModel = 'google/gemini-flash-1.5';
    log.info('OPENROUTER', `Usando modelo GRATUITO: ${this.freeModel}`);
  }

  // Summarize a single documentation resource
  async summarizeResource(resource) {
    try {
      log.api('OpenRouter', `Generando resumen (Modelo GRATIS: ${this.freeModel})`);
      const response = await axios.post(
        this.baseUrl,
        {
          // USING FREE MODEL - google/gemini-flash-1.5 is completely FREE on OpenRouter
          model: this.freeModel,
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
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/siramong/reactify-bot',
            'X-Title': 'Reactify Bot'
          }
        }
      );

      log.api('OpenRouter', 'Resumen generado exitosamente', 'success');
      return response.data.choices[0].message.content;
    } catch (error) {
      log.error('OPENROUTER', 'Error al generar resumen', error);
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
          log.error('OPENROUTER', `Error resumiendo: ${doc}`, error);
          summaries.push(`• ${doc}\n  (No se pudo generar resumen)`);
        }
      }

      return summaries.join('\n\n');
    } catch (error) {
      log.error('OPENROUTER', 'Error al resumir documentación', error);
      throw error;
    }
  }
}

module.exports = new OpenRouterService();
