import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ExtractedArticle {
    title: string;
    content: string;
    textContent: string;
    excerpt: string;
    byline: string;
    siteName: string;
}

/**
 * Fetches and extracts the main content from a URL
 */
export async function extractArticle(url: string): Promise<ExtractedArticle | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch article: ${response.statusText}`);
        }

        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            return null;
        }

        return {
            title: article.title || '',
            content: article.content || '',
            textContent: article.textContent || '',
            excerpt: article.excerpt || '',
            byline: article.byline || '',
            siteName: article.siteName || '',
        };
    } catch (error) {
        console.error('Error extracting article:', error);
        return null;
    }
}
