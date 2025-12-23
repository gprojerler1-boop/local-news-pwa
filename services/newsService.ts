

import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem, AppSettings, NewsStatus } from "../types";
import { STORAGE_KEYS } from "../constants";

// Correctly initialize with named parameter and direct environment variable access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fingerprinting: Hash of Title + 200 chars + Source name
export async function generateFingerprint(title: string, content: string, source: string): Promise<string> {
  const data = `${title}|${content.substring(0, 200)}|${source}`;
  const msgBuffer = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function fetchNewsFromSources(settings: AppSettings): Promise<{ items: NewsItem[], logs: string[] }> {
  const results: NewsItem[] = [];
  const logs: string[] = [];
  const storedFingerprints = JSON.parse(localStorage.getItem(STORAGE_KEYS.FINGERPRINTS) || '[]');
  const blacklist = JSON.parse(localStorage.getItem(STORAGE_KEYS.BLACKLIST) || '[]');

  // Prompt configuration for news extraction with Search Grounding
  const prompt = `
    Extract news from the following sources:
    Web: ${settings.webSources.join(', ')}
    Telegram (view as web): ${settings.telegramSources.map(s => `https://t.me/s/${s}`).join(', ')}
    
    CRITICAL RULES:
    1. Only return news published in the LAST 120 MINUTES.
    2. Today's date is ${new Date().toLocaleDateString('en-US')}.
    3. Use Google Search grounding to access the actual content of these URLs.
    4. For each news item, extract: Title, Full Text, Exact Publish Time, Source URL, and Source Name.
    5. ONLY return items containing these keywords: ${settings.keywords.join(', ')}.
    6. For Telegram: Only Original Posts (exclude forwards, replies, edited).
    
    Return the result in JSON array format:
    [{
      "title": string,
      "content": string,
      "source": string,
      "url": string,
      "publishTime": "ISO String",
      "serverTimestamp": "ISO String",
      "isTelegram": boolean,
      "matchedKeywords": string[]
    }]
  `;

  try {
    // Calling generateContent with Gemini 3 Flash and googleSearch tool
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              source: { type: Type.STRING },
              url: { type: Type.STRING },
              publishTime: { type: Type.STRING },
              serverTimestamp: { type: Type.STRING },
              isTelegram: { type: Type.BOOLEAN },
              matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "content", "source", "url", "publishTime", "serverTimestamp", "isTelegram", "matchedKeywords"]
          }
        }
      }
    });

    // Extract grounding chunks as per mandatory guidelines for Search Grounding
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title
      }));

    // Property .text returns the generated string output directly
    const rawData = JSON.parse(response.text || '[]');
    const now = new Date();

    for (const raw of rawData) {
      const pubDate = new Date(raw.publishTime);
      const srvDate = new Date(raw.serverTimestamp);
      
      // 1. Recency check (120 mins)
      const diffMins = (now.getTime() - pubDate.getTime()) / 60000;
      if (diffMins > 120 || diffMins < 0) {
        logs.push(`Rejected: Item too old or future date (${raw.title.substring(0, 20)}...)`);
        continue;
      }

      // 2. Double Verification (Visible vs Server discrepancy < 10 mins)
      const discrepancy = Math.abs(pubDate.getTime() - srvDate.getTime()) / 60000;
      if (discrepancy > 10) {
        logs.push(`Rejected: Time discrepancy (${discrepancy.toFixed(1)} mins) for ${raw.title.substring(0, 20)}`);
        continue;
      }

      // 3. Fingerprint check
      const fp = await generateFingerprint(raw.title, raw.content, raw.source);
      if (storedFingerprints.includes(fp) || blacklist.includes(fp)) {
        logs.push(`Rejected: Duplicate or blacklisted (${raw.title.substring(0, 20)}...)`);
        continue;
      }

      // Passed all checks
      const newItem: NewsItem = {
        ...raw,
        id: crypto.randomUUID(),
        fingerprint: fp,
        groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
        // Simulation of visual proof screenshot by providing a specific stylized container in UI
        screenshot: `https://picsum.photos/seed/${fp}/800/600`
      };
      
      results.push(newItem);
    }

    return { items: results, logs };
  } catch (error) {
    console.error("News Fetch Error:", error);
    return { items: [], logs: [`Error fetching news: ${error}`] };
  }
}