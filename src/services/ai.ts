import { AIProfile, Article } from '../types';
import { invoke } from '@/utils/tauri';

export function estimateTokens(content: string): number {
  // Simple estimation: ~4 characters per token for English, ~1-2 for Chinese
  // This is a rough heuristic
  return Math.ceil(content.length / 3);
}

export async function translateArticle(content: string, profile: AIProfile, targetLanguage: string = 'Chinese'): Promise<string> {
  if (!profile.apiKey) {
    throw new Error('API key is missing');
  }

  // Truncate content if it's too long
  const truncatedContent = content.length > 12000 ? content.slice(0, 12000) : content;

  const systemPrompt = `You are a professional translator. Translate the following content into ${targetLanguage}. Maintain the original tone and formatting. Only return the translated text.`;

  try {
    if (profile.provider === 'anthropic') {
      // Anthropic Logic
      const baseUrl = profile.baseUrl || 'https://api.anthropic.com/v1';
      const endpoint = baseUrl.endsWith('/messages') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/messages`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': profile.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: profile.model,
          messages: [
            {
              role: 'user',
              content: truncatedContent
            }
          ],
          system: systemPrompt,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const textBlock = data.content?.find((block: any) => block.type === 'text');
      return textBlock?.text || 'Translation failed.';
    } else {
      // OpenAI Logic (Default)
      const response = await fetch(`${profile.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: profile.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: truncatedContent
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Translation failed.';
    }
  } catch (error) {
    console.error('Error translating article:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Failed to translate article');
  }
}

export async function summarizeArticle(content: string, profile: AIProfile): Promise<string> {
  if (!profile.apiKey) {
    throw new Error('API key is missing');
  }

  // Truncate content if it's too long
  const truncatedContent = content.length > 12000 ? content.slice(0, 12000) : content;

  try {
    if (profile.provider === 'anthropic') {
      // Anthropic Logic
      const baseUrl = profile.baseUrl || 'https://api.anthropic.com/v1';
      const endpoint = baseUrl.endsWith('/messages') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/messages`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': profile.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: profile.model,
          messages: [
            {
              role: 'user',
              content: truncatedContent
            }
          ],
          system: profile.prompt,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const textBlock = data.content?.find((block: any) => block.type === 'text');
      return textBlock?.text || 'No summary generated.';
    } else {
      // OpenAI Logic (Default)
      const response = await fetch(`${profile.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${profile.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: profile.model,
          messages: [
            {
              role: 'system',
              content: profile.prompt || 'You are a helpful assistant that summarizes articles. Please provide a concise summary of the following content.'
            },
            {
              role: 'user',
              content: truncatedContent
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No summary generated.';
    }
  } catch (error) {
    console.error('Error summarizing article:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Failed to summarize article');
  }
}

export async function batchSummarize(
  articles: Article[],
  mode: 'one-shot' | 'separate',
  profile: AIProfile,
  onProgress?: (current: number, total: number) => void
): Promise<string | void> {
  if (!profile.apiKey) {
    throw new Error('API key is missing');
  }

  if (mode === 'one-shot') {
    // Combine articles into a single prompt
    const combinedContent = articles.map((a, i) => {
      const content = a.summary || a.content || '';
      // Truncate individual article content to avoid hitting limits too quickly
      const truncated = content.length > 1000 ? content.slice(0, 1000) + '...' : content;
      return `Article ${i + 1}: ${a.title}\n${truncated}\n`;
    }).join('\n---\n\n');

    const systemPrompt = `You are a helpful assistant. Please provide a digest summary of the following ${articles.length} articles. Group related topics together if possible. Format the output with clear headings and bullet points.`;

    // Re-use summarize logic or call API directly
    // Using a simplified version of the logic in summarizeArticle but with different prompt
    // For simplicity, we'll construct the request here as it's similar but the prompt is different
    
    // Check token limit roughly (4 chars per token)
    // If too long, we might need to truncate or error. 
    // For now, let's just truncate the whole thing if it's massive.
    const finalContent = combinedContent.length > 50000 ? combinedContent.slice(0, 50000) + '... (truncated)' : combinedContent;

    try {
        if (profile.provider === 'anthropic') {
            const baseUrl = profile.baseUrl || 'https://api.anthropic.com/v1';
            const endpoint = baseUrl.endsWith('/messages') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/messages`;
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'x-api-key': profile.apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    model: profile.model,
                    messages: [{ role: 'user', content: finalContent }],
                    system: systemPrompt,
                    max_tokens: 4096,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            const textBlock = data.content?.find((block: any) => block.type === 'text');
            return textBlock?.text || 'No summary generated.';
        } else {
            // OpenAI
            const response = await fetch(`${profile.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${profile.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: profile.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: finalContent }
                    ],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || 'No summary generated.';
        }
    } catch (error) {
        console.error('Error in batch summary (one-shot):', error);
        throw error;
    }

  } else {
    // Separate mode
    let completed = 0;
    const total = articles.length;

    // Process sequentially to avoid rate limits
    for (const article of articles) {
      try {
        const content = article.content || article.summary || article.title || '';
        const summary = await summarizeArticle(content, profile);
        
        // Save summary to DB
        await invoke('update_article_summary', { id: article.id, summary });
        
        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }
      } catch (error) {
        console.error(`Failed to summarize article ${article.id}:`, error);
        // Continue with next article even if one fails
      }
    }
  }
}
