import axios from 'axios';
import config from '../config/config';
import consoleLogger from '../utils/consoleLogger';

class OpenRouterService {
  private apiKey: string | undefined;
  private baseUrl: string;
  private freeModel: string;

  constructor() {
    this.apiKey = config.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    // FREE MODEL - No cost at all!
    this.freeModel = 'google/gemma-3n-e4b-it:free';
    consoleLogger.info('OPENROUTER', `Usando modelo: ${this.freeModel}`);
  }

  // Summarize a single documentation resource
  async summarizeResource(resource: string): Promise<string> {
    try {
      consoleLogger.api('OpenRouter', `Generando resumen (Modelo: ${this.freeModel})`);
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

      // Check if response has the expected structure
      if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
        consoleLogger.error('OPENROUTER', 'Respuesta inesperada de OpenRouter', response.data);
        throw new Error('Respuesta inesperada de OpenRouter');
      }

      consoleLogger.api('OpenRouter', 'Resumen generado exitosamente', 'success');
      return response.data.choices[0].message.content;
    } catch (error) {
      consoleLogger.error('OPENROUTER', 'Error al generar resumen', error as Error);
      throw error;
    }
  }

  // Summarize multiple documentation resources
  async summarizeDocumentation(docs: string): Promise<string> {
    try {
      // Split by comma and trim
      const docList = docs.split(',').map(doc => doc.trim()).filter(doc => doc.length > 0);
      
      if (docList.length === 0) {
        return 'No se proporcionó documentación.';
      }

      // Summarize each document
      const summaries: string[] = [];
      for (const doc of docList) {
        try {
          const summary = await this.summarizeResource(doc);
          summaries.push(`• ${doc}\n  ${summary}`);
        } catch (error) {
          consoleLogger.error('OPENROUTER', `Error resumiendo: ${doc}`, error as Error);
          summaries.push(`• ${doc}\n  (No se pudo generar resumen)`);
        }
      }

      return summaries.join('\n\n');
    } catch (error) {
      consoleLogger.error('OPENROUTER', 'Error al resumir documentación', error as Error);
      throw error;
    }
  }
}

export default new OpenRouterService();
