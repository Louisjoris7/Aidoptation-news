import Parser from 'rss-parser';
import { RSS_SOURCES, TOPIC_KEYWORDS } from './sources';
import { prisma } from './prisma';
import { normalizeTopic } from './topics';
import { JSDOM } from 'jsdom';
import { getHeroImage } from './article-extractor';

const REAL_BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

const parser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'Aidoptation-News/1.0',
    },
});

export interface ParsedArticle {
    title: string;
    url: string;
    source: string;
    publishedAt: Date;
    description: string | null;
    imageUrl: string | null;
    topics: string[];
    priority: number;
}

/**
 * Classify article into topics based on title and description
 */
function classifyTopics(title: string, description: string | null, managedTopics: string[] = []): string[] {
    const text = `${title} ${description || ''}`.toLowerCase();
    const topics: string[] = [];

    // 1. Matches from hardcoded TOPIC_KEYWORDS
    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
            topics.push(topic);
        }
    }

    // 2. Matches from dynamic managed topics (ManagedTopic.name)
    for (const managedTopic of managedTopics) {
        const keyword = managedTopic.toLowerCase().replace(/-/g, ' ');
        if (text.includes(keyword) && !topics.includes(managedTopic)) {
            topics.push(managedTopic);
        }
    }

    // Default topic if no matches
    if (topics.length === 0) {
        topics.push('general');
    }

    return topics;
}

/**
 * Filters out common junk images (badges, social icons, tracking pixels)
 */
function isJunkImage(url: string | null): boolean {
    if (!url) return true;

    // Convert to lowercase for comparison
    const lowUrl = url.toLowerCase();

    // 1. Common marketing/social icons patterns
    const junkPatterns = [
        'google.com/logos',
        'google.com/news/badges',
        'googleusercontent.com', // Added to block banners
        'follow_on_google_news',
        'add_to_google', // This is what the user is seeing
        'google-news-logo',
        'facebook.com/tr', // FB tracking
        'pixel',
        'favicon',
        'logo',
        'button',
        'badge',
        'social-share',
        'newsletter-signup',
        'banner-ad',
        'doubleclick',
        'ads-by-google',
        'wp-content/themes', // Often generic theme assets
        'placeholder'
    ];

    if (junkPatterns.some(pattern => lowUrl.includes(pattern))) {
        return true;
    }

    // 2. Extension check (ignore tiny icons/transparent pixels if possible by naming)
    if (lowUrl.includes('1x1') || lowUrl.includes('transparent')) {
        return true;
    }

    return false;
}

/**
 * Fetch articles from a single RSS source
 */
async function fetchFromSource(source: any, managedTopicNames: string[] = []): Promise<ParsedArticle[]> {
    try {
        const feed = await parser.parseURL(source.url);
        console.log(`📊 [Parser] Raw items from "${source.name}": ${feed.items?.length || 0}`);
        const articles: ParsedArticle[] = [];

        for (const item of feed.items) {
            if (!item.title || !item.link) continue;

            const title = normalizeTitle(item.title);
            const description = item.contentSnippet || item.content || null;
            const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

            // Skip very old articles (older than 14 days - relaxed to catch more niche news)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 14);
            if (publishedAt < cutoffDate) continue;

            // Classify topics
            const classifiedTopics = classifyTopics(title, description, managedTopicNames);

            // Formula 1 Synonym matching
            if (managedTopicNames.some(t => t.toLowerCase().includes('formula-1') || t.toLowerCase() === 'f1')) {
                const text = `${title} ${description || ''}`.toLowerCase();
                if (text.includes('formula 1') || text.includes(' f1 ')) {
                    if (!classifiedTopics.includes('formula-1')) classifiedTopics.push('formula-1');
                }
            }

            const topics = [...source.defaultTopics, ...classifiedTopics];

            // Extract image URL - more robust logic
            let imageUrl: string | null = null;

            // 0. Preliminary Media Content check
            if (item.enclosure?.url) imageUrl = item.enclosure.url;
            else if (item['media:content']?.$?.url) imageUrl = item['media:content'].$.url;
            else if (item['media:thumbnail']?.$?.url) imageUrl = item['media:thumbnail'].$.url;

            // 1. Fallback to scraping image from content/description (Common in Google News RSS)
            if (!imageUrl || isJunkImage(imageUrl)) {
                const searchContent = (item['content:encoded'] || item.content || item.description || "");
                // Google News often hides the thumbnail in a table/img in description
                const imgMatch = searchContent.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch && imgMatch[1]) {
                    imageUrl = imgMatch[1];
                }
            }

            // Double check final URL
            if (imageUrl && isJunkImage(imageUrl)) {
                imageUrl = null;
            }

            // Cleanup URL
            if (imageUrl && imageUrl.startsWith('//')) {
                imageUrl = 'https:' + imageUrl;
            }

            articles.push({
                title,
                url: item.link,
                source: source.name,
                publishedAt,
                description: description ? description.substring(0, 500) : null,
                imageUrl,
                topics: Array.from(new Set(topics)),
                priority: source.priority,
            });
        }

        // 5. Deep Extraction Pass: Hunt for missing images in parallel
        const articlesMissingImages = articles.filter(a => !a.imageUrl);
        if (articlesMissingImages.length > 0) {
            // Increase to top 10 for better variety
            const targets = articlesMissingImages.slice(0, 10);
            console.log(`🕵️ [Hero Hunt] Searching for up to ${targets.length} images for "${source.name}"...`);

            await Promise.allSettled(targets.map(async (article) => {
                try {
                    const res = await fetch(article.url, {
                        headers: { 'User-Agent': REAL_BROWSER_UA },
                        signal: AbortSignal.timeout(5000) // 5s timeout (some sites are slow)
                    });
                    if (res.ok) {
                        const html = await res.text();
                        const heroImage = await getHeroImage(html, article.url);

                        if (heroImage && !isJunkImage(heroImage)) {
                            article.imageUrl = heroImage;
                        }
                    }
                } catch (e) {
                    // Silently ignore failures in the background hunter
                }
            }));
        }

        if (articles.length > 0) {
            console.log(`✅ ${source.name}: Found ${articles.length} articles`);
        } else {
            console.log(`⚠️ ${source.name}: No recent articles found`);
        }

        return articles;
    } catch (error) {
        console.error(`❌ Error fetching from ${source.name}:`, error);
        return [];
    }
}

/**
 * Fetch articles from all RSS sources + dynamic topics
 */
export async function fetchAllArticles(): Promise<ParsedArticle[]> {
    console.log(`Fetching from standard RSS sources...`);

    // 1. Get all custom topics (Colleagues + General Feed Core Topics)
    let allManagedTopics: { name: string, isCompany: boolean }[] = [];
    try {
        // From Colleagues
        const colleagues = await prisma.colleague.findMany();
        colleagues.forEach(c => {
            const rawTopics = JSON.parse(c.topics);
            if (Array.isArray(rawTopics)) {
                rawTopics.forEach(t => {
                    const normalized = normalizeTopic(t);
                    const existing = allManagedTopics.find(mt => mt.name === normalized.name);
                    if (!existing) {
                        allManagedTopics.push({ name: normalized.name, isCompany: normalized.isCompany });
                    } else if (normalized.isCompany) {
                        existing.isCompany = true;
                    }
                });
            }
        });

        // From General Feed Core Topics
        const setting = await (prisma as any).globalSetting.findUnique({ where: { key: 'core_topics' } });
        if (setting) {
            const raw = JSON.parse(setting.value);
            if (Array.isArray(raw)) {
                raw.forEach(t => {
                    const normalized = normalizeTopic(t);
                    const existing = allManagedTopics.find(mt => mt.name === normalized.name);
                    if (!existing) {
                        allManagedTopics.push({ name: normalized.name, isCompany: normalized.isCompany });
                    } else if (normalized.isCompany) {
                        existing.isCompany = true; // Upgrade to company if marked in core
                    }
                });
            }
        }
    } catch (e) {
        console.warn('Could not fetch managed topics from DB', e);
    }

    // 2. Prepare list of sources
    const sourcesToFetch = [...RSS_SOURCES.filter(s => !s.isDynamic)];

    // 3. Add dynamic Google News sources
    const defaultKeywords = ['autonomous-driving', 'tesla', 'waymo', 'tech', 'automotive', 'suppliers', 'electric-vehicles'];
    const dynamicTopics = allManagedTopics.filter(t => !defaultKeywords.includes(t.name) || t.isCompany);

    if (dynamicTopics.length > 0) {
        const googleNewsTemplate = RSS_SOURCES.find(s => s.isDynamic);

        if (googleNewsTemplate) {
            dynamicTopics.forEach(topic => {
                // Refine search query: Replace hyphens with spaces
                let name = topic.name.toLowerCase().replace(/-/g, ' ');
                let query = name;

                // Aggressive synonyms for specific targets
                if (name.includes('formula 1') || name === 'f1') {
                    query = `"formula 1" OR "formula-1" OR "f1"`;
                } else if (topic.isCompany) {
                    query = `"${name}" news OR "${name}" official`;
                } else {
                    // For broad topics like 'cinema', keep it simple and broad
                    query = `${name} news`;
                }

                console.log(`🔍 [Intelligence] Searching Google News for: "${query}" (Target: ${topic.name})`);

                sourcesToFetch.push({
                    ...googleNewsTemplate,
                    name: `Google News (${topic.name})`,
                    url: googleNewsTemplate.url.replace('{query}', encodeURIComponent(query)),
                    defaultTopics: [topic.name],
                });
            });
        }
    }

    console.log(`Fetching from ${sourcesToFetch.length} total sources...`);

    // 4. Fetch all in parallel
    const managedTopicNames = allManagedTopics.map(t => t.name);
    const results = await Promise.allSettled(
        sourcesToFetch.map(source => fetchFromSource(source, managedTopicNames))
    );

    const allArticles: ParsedArticle[] = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allArticles.push(...result.value);
        }
    }

    console.log(`Fetched ${allArticles.length} articles total`);
    return allArticles;
}

/**
 * Clean and normalize article title
 */
export function normalizeTitle(title: string): string {
    return title
        .replace(/\s+/g, ' ')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '') // Remove (Source Name) pattern common in Google News
        .replace(/ - .*$/g, '')   // Remove trailing source dash
        .trim();
}
