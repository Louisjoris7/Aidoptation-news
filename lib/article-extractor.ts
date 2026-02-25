import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ExtractedArticle {
    title: string;
    content: string;
    textContent: string;
    excerpt: string;
    byline: string;
    siteName: string;
    heroImage: string | null;
}

/**
 * Specifically hunts for a "Hero" image in the HTML head (using meta tags)
 */
export async function getHeroImage(html: string, url: string): Promise<string | null> {
    try {
        const dom = new JSDOM(html, { url });
        const doc = dom.window.document;

        // 1. Check Meta-tag priority list
        const selectors = [
            'meta[property="og:image"]',
            'meta[name="twitter:image"]',
            'meta[itemprop="image"]',
            'link[rel="image_src"]',
            'link[rel="preload"][as="image"]'
        ];

        for (const selector of selectors) {
            const el = doc.querySelector(selector);
            let content = el?.getAttribute('content') || el?.getAttribute('href');

            if (content) {
                // Resolve relative URLs (e.g. /img/hero.jpg -> https://example.com/img/hero.jpg)
                try {
                    return new URL(content, url).href;
                } catch (e) {
                    return content;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error hunting for hero image:', error);
        return null;
    }
}

/**
 * Fetches and extracts the main content from a URL
 */
export async function extractArticle(url: string): Promise<ExtractedArticle | null> {
    const REAL_BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': REAL_BROWSER_UA,
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

        // Hunt for hero image if readability didn't give one we like
        const heroImage = await getHeroImage(html, url);

        return {
            title: article.title || '',
            content: article.content || '',
            textContent: article.textContent || '',
            excerpt: article.excerpt || '',
            byline: article.byline || '',
            siteName: article.siteName || '',
            heroImage: heroImage || null
        };
    } catch (error) {
        console.error('Error extracting article:', error);
        return null;
    }
}
