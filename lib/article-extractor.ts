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
 * Filters out common junk images (badges, social icons, tracking pixels)
 */
function isJunk(url: string | null): boolean {
    if (!url) return true;
    const lowUrl = url.toLowerCase();
    const junkPatterns = [
        'google.com/logos', 'google.com/news/badges', 'googleusercontent.com',
        'follow_on_google_news', 'add_to_google', 'google-news-logo',
        'facebook.com/tr', 'pixel', 'favicon', 'logo', 'button', 'badge',
        'social-share', 'newsletter-signup', 'banner-ad', 'doubleclick',
        'ads-by-google', 'wp-content/themes', 'placeholder', 'avatar',
        '1x1', 'transparent', 'spacer', 'icon'
    ];
    return junkPatterns.some(pattern => lowUrl.includes(pattern));
}

/**
 * Specifically hunts for a "Hero" image in the HTML head or body
 */
export async function getHeroImage(html: string, url: string): Promise<string | null> {
    try {
        const dom = new JSDOM(html, { url });
        const doc = dom.window.document;

        // 1. Check Meta-tag priority list (The Head Hunter)
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

            if (content && !isJunk(content)) {
                try {
                    return new URL(content, url).href;
                } catch (e) {
                    return content;
                }
            }
        }

        // 2. Fallback: Scan the Body (The Body Scan)
        // Look for the first meaningful image in the body
        const bodyImages = Array.from(doc.querySelectorAll('article img, main img, .content img, #content img, img'));
        for (const img of bodyImages) {
            const src = img.getAttribute('src') || img.getAttribute('data-src');
            if (src && !isJunk(src)) {
                // Heuristic: Ignore tiny images (icons) if dimensions are known
                const width = parseInt(img.getAttribute('width') || '0');
                const height = parseInt(img.getAttribute('height') || '0');
                if ((width > 0 && width < 100) || (height > 0 && height < 100)) continue;

                try {
                    return new URL(src, url).href;
                } catch (e) {
                    return src;
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
