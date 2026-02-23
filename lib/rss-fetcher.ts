import Parser from 'rss-parser';
import { RSS_SOURCES, TOPIC_KEYWORDS } from './sources';
import { prisma } from './prisma';
import { normalizeTopic } from './topics';

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
function classifyTopics(title: string, description: string | null): string[] {
    const text = `${title} ${description || ''}`.toLowerCase();
    const topics: string[] = [];

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
            topics.push(topic);
        }
    }

    // Default topic if no matches
    if (topics.length === 0) {
        topics.push('general');
    }

    return topics;
}

/**
 * Fetch articles from a single RSS source
 */
async function fetchFromSource(source: typeof RSS_SOURCES[0]): Promise<ParsedArticle[]> {
    try {
        const feed = await parser.parseURL(source.url);
        const articles: ParsedArticle[] = [];

        for (const item of feed.items) {
            if (!item.title || !item.link) continue;

            const title = normalizeTitle(item.title);
            const description = item.contentSnippet || item.content || null;
            const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

            // Skip very old articles (older than 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            if (publishedAt < sevenDaysAgo) continue;

            // Classify topics
            const classifiedTopics = classifyTopics(title, description);
            const topics = [...source.defaultTopics, ...classifiedTopics];

            // Extract image URL - more robust logic
            let imageUrl: string | null = null;

            // 1. Check Media Content (often used by major publishers)
            if (item['media:content'] && item['media:content'].$) {
                imageUrl = item['media:content'].$.url;
            }
            // 2. Check Enclosures
            else if (item.enclosure && item.enclosure.url) {
                imageUrl = item.enclosure.url;
            }
            // 3. Check Media Thumbnail
            else if (item['media:thumbnail'] && item['media:thumbnail'].$) {
                imageUrl = item['media:thumbnail'].$.url;
            }
            // 4. Fallback to scraping first image from content
            if (!imageUrl) {
                const searchContent = (item['content:encoded'] || item.content || item.description || "");
                const imgMatch = searchContent.match(/<img[^>]+src=["']([^"'>]+)["']/i);
                if (imgMatch) {
                    imageUrl = imgMatch[1];
                }
            }

            // Cleanup URL (strip query params if needed, but usually keep them for CDN images)
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
                topics: Array.from(new Set(topics)), // Remove duplicates
                priority: source.priority,
            });
        }

        return articles;
    } catch (error) {
        // Silent fail for individual sources
        // console.error(`Error fetching from ${source.name}:`, error);
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
                // Refine search query for companies
                let query = topic.name;
                if (topic.isCompany) {
                    query = `"${topic.name}" news OR "${topic.name}" official`;
                }

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
    const results = await Promise.allSettled(
        sourcesToFetch.map(source => fetchFromSource(source))
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
