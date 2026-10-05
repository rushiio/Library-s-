import crypto from 'crypto';
import { prisma } from '../config/db.js';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIService {
  private static geminiApiKey = process.env.GEMINI_API_KEY || '';
  private static geminiModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  private static openrouterApiKey = process.env.OPENROUTER_API_KEY || '';
  private static openrouterModel = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';
  private static openrouterBaseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  /**
   * Checks whether the AI service is configured with a valid API key
   */
  static isConfigured(): boolean {
    return Boolean(
      (this.geminiApiKey && this.geminiApiKey.trim().length > 0) ||
      (this.openrouterApiKey && this.openrouterApiKey.trim().length > 0)
    );
  }

  /**
   * Generates a hash key for caching responses
   */
  private static getCacheKey(type: string, input: string): string {
    return crypto.createHash('sha256').update(`${type}:${input}`).digest('hex');
  }

  /**
   * Calls Google Gemini API directly or falls back to OpenRouter / static academic intelligence
   */
  static async chatCompletion(
    messages: LLMMessage[],
    options: {
      type?: string;
      temperature?: number;
      maxTokens?: number;
      cacheTtlHours?: number;
    } = {}
  ): Promise<{ text: string; cached: boolean; fallback: boolean }> {
    const { type = 'general', temperature = 0.7, maxTokens = 1200, cacheTtlHours = 24 } = options;
    const inputHashString = JSON.stringify(messages);
    const cacheKey = this.getCacheKey(type, inputHashString);

    // 1. Check database cache
    try {
      const cached = await prisma.aICache.findUnique({
        where: { cacheKey },
      });

      if (cached && new Date(cached.expiresAt) > new Date()) {
        return { text: cached.response, cached: true, fallback: false };
      }
    } catch (err) {
      console.warn('Cache lookup warning:', err);
    }

    // 2. Direct Google Gemini API integration
    if (this.geminiApiKey && this.geminiApiKey.trim().length > 0) {
      try {
        const systemMessages = messages.filter((m) => m.role === 'system');
        const nonSystemMessages = messages.filter((m) => m.role !== 'system');

        const systemText = systemMessages.map((m) => m.content).join('\n\n');

        const contents = nonSystemMessages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const payload: any = {
          contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        };

        if (systemText.trim().length > 0) {
          payload.systemInstruction = {
            parts: [{ text: systemText }],
          };
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Google Gemini API error (${response.status}):`, errText);
          throw new Error(`Google Gemini API error: ${response.status}`);
        }

        const data = (await response.json()) as any;
        const candidate = data.candidates?.[0];
        const textParts = candidate?.content?.parts || [];
        const reply = textParts.map((p: any) => p.text).filter(Boolean).join('\n') || 'No response generated.';

        // Save to cache
        const expiresAt = new Date(Date.now() + cacheTtlHours * 3600 * 1000);
        await prisma.aICache
          .upsert({
            where: { cacheKey },
            update: { response: reply, expiresAt },
            create: {
              cacheKey,
              promptType: type,
              response: reply,
              expiresAt,
            },
          })
          .catch((e) => console.warn('Cache save warning:', e));

        return { text: reply, cached: false, fallback: false };
      } catch (geminiErr: any) {
        console.error('Google Gemini API request failed, checking OpenRouter/Fallback:', geminiErr.message || geminiErr);
      }
    }

    // 3. Fallback to OpenRouter if configured
    if (this.openrouterApiKey && this.openrouterApiKey.trim().length > 0) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const response = await fetch(`${this.openrouterBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.openrouterApiKey}`,
            'HTTP-Referer': 'https://libra.ai',
            'X-Title': 'LibraAI LMS',
          },
          body: JSON.stringify({
            model: this.openrouterModel,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = (await response.json()) as any;
          const reply = data.choices?.[0]?.message?.content || 'No response generated.';

          const expiresAt = new Date(Date.now() + cacheTtlHours * 3600 * 1000);
          await prisma.aICache
            .upsert({
              where: { cacheKey },
              update: { response: reply, expiresAt },
              create: {
                cacheKey,
                promptType: type,
                response: reply,
                expiresAt,
              },
            })
            .catch((e) => console.warn('Cache save warning:', e));

          return { text: reply, cached: false, fallback: false };
        }
      } catch (orErr: any) {
        console.warn('OpenRouter fallback failed:', orErr.message);
      }
    }

    // 4. Default Smart Academic Fallback
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()?.content || '';
    let reply = '';

    if (/sql|nosql|database/i.test(lastUserMsg)) {
      reply = `### SQL vs NoSQL for Academic & Engineering Projects

**1. Relational Databases (SQL - e.g., PostgreSQL, MySQL):**
- **Structure:** Structured schema with strict tables, columns, constraints, and ACID transactions.
- **Best For:** Financial records, library management systems (like LibraAI), reservation desks, and complex multi-table joins.
- **Recommended Library Books:** *"Database System Concepts"* by Silberschatz & Korth (Shelf: Rack C-2).

**2. Non-Relational Databases (NoSQL - e.g., MongoDB, Redis):**
- **Structure:** Flexible document models (JSON/BSON), key-value stores, or wide-column graphs.
- **Best For:** Unstructured data, IoT sensor streams, real-time caching, and high-velocity logging.

💡 **Recommendation for your college capstone:** Use PostgreSQL with Prisma ORM for core transactional data, and Redis for high-speed session caching.`;
    } else if (/due|loan|renew|book/i.test(lastUserMsg)) {
      reply = `You currently have active loans in your student profile. You can renew items up to 3 times before the due date through the Dashboard or Bookshelf tab. Let me know if you need help finding specific textbooks in the college catalog!`;
    } else {
      reply = `### AI Academic Assistant Insights
Based on the college engineering curriculum and catalog holdings:
- **Core Principles:** Focus on solid foundational algorithms, clear data modeling, and automated test coverage.
- **Recommended Library Resources:** Check the Computer Engineering and Electronics sections in Rack C & D for standard reference textbooks.
- **Need specific chapters?** Search any title in the Books Catalog to check real-time physical availability!`;
    }

    return {
      text: reply,
      cached: false,
      fallback: true,
    };
  }

  /**
   * Generates a simple fast local semantic vector embedding
   */
  static generateVector(text: string): number[] {
    const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const vector = new Array(64).fill(0);

    for (let i = 0; i < tokens.length; i++) {
      const word = tokens[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const dim = Math.abs(hash) % 64;
      vector[dim] += 1.0;
    }

    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) vector[i] /= norm;
    }

    return vector;
  }

  /**
   * Computes Cosine Similarity between two vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
