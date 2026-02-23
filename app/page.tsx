import Header from '@/components/Header';
import NewsFeed from '@/components/NewsFeed';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CURATED_SOURCE_NAMES, RSS_SOURCES } from '@/lib/sources';

export const dynamic = 'force-dynamic';

interface Article {
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: Date;
    description: string | null;
    imageUrl: string | null;
    visitCount: number;
    topics: string;
}

export default async function HomePage() {
    // 1. Get dynamic core topics from database settings
    let activeTopics: string[] = [];
    try {
        const setting = await (prisma as any).globalSetting.findUnique({
            where: { key: 'core_topics' }
        });
        if (setting) {
            const raw = JSON.parse(setting.value);
            if (Array.isArray(raw)) {
                // Support both old string[] and new ManagedTopic[] formats
                activeTopics = raw
                    .map(t => typeof t === 'string' ? t : (t.active ? t.name : null))
                    .filter((t): t is string => t !== null);
            }
        }
    } catch (e) {
        console.error('Failed to fetch core topics from settings', e);
    }

    // 2. Build the where clause for fetching
    const whereClause: any = {};
    if (activeTopics.length > 0) {
        whereClause.OR = activeTopics.map(topic => ({
            topics: { contains: topic },
        }));
    } else {
        // Fallback to curated sources if no active topics are defined
        whereClause.source = { in: CURATED_SOURCE_NAMES };
    }

    // 3. Fetch articles
    const articles = (await prisma.article.findMany({
        where: whereClause,
        orderBy: { publishedAt: 'desc' },
        take: 100, // Fetch more to allow for better scoring variety
    })) as any as Article[];

    if (articles.length === 0) {
        return (
            <>
                <Header />
                <main className="min-h-screen p-8 relative">
                    <div className="max-w-7xl mx-auto text-center py-32 glass rounded-[3rem]">
                        <div className="text-6xl mb-6 animate-bounce">📭</div>
                        <h2 className="text-3xl font-bold mb-4">No articles found</h2>
                        <p className="text-foreground/40 max-w-md mx-auto mb-8">It looks like our robotaxis haven&apos;t delivered any news yet. Try updating your core topics in the Admin panel.</p>
                        <Link href="/admin" className="btn btn-primary">
                            Manage Topics
                        </Link>
                    </div>
                </main>
            </>
        );
    }

    // 4. Implement Smart Ranking (Trust + Popularity + Freshness)
    const sourcePriorityMap = RSS_SOURCES.reduce((acc, s) => {
        acc[s.name] = s.priority;
        return acc;
    }, {} as Record<string, number>);

    // Identified company topics for boosting
    const companyTopics = new Set<string>();
    try {
        const setting = await (prisma as any).globalSetting.findUnique({
            where: { key: 'core_topics' }
        });
        if (setting) {
            const raw = JSON.parse(setting.value);
            if (Array.isArray(raw)) {
                raw.forEach(t => {
                    if (typeof t !== 'string' && t.active && t.isCompany) {
                        companyTopics.add(t.name.toLowerCase());
                    }
                });
            }
        }
    } catch (e) { }

    const now = Date.now();
    const scoredArticles = articles.map(article => {
        const priority = sourcePriorityMap[article.source] || 5;
        const hoursOld = (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);

        // freshness decays over 48 hours
        const freshness = Math.max(0, 48 - hoursOld) / 2;

        // Company matching boost
        let companyBoost = 0;
        const articleTopics = JSON.parse(article.topics) as string[];
        if (articleTopics.some(t => companyTopics.has(t.toLowerCase()))) {
            companyBoost = 25; // Significant boost for company topics
        }

        // Smart Score
        const score = (priority * 10) + (article.visitCount * 5) + freshness + companyBoost;

        return { ...article, score };
    });

    // Sort by score descending and take top 50
    const sortedArticles = (scoredArticles as any[])
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

    return (
        <>
            <Header />
            <main className="min-h-screen relative pb-20">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="mb-8 animate-reveal">
                        <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tighter">
                            Autonomous <span className="gradient-text">News</span>
                        </h1>
                        <p className="text-foreground/40 font-medium tracking-wide uppercase text-xs">
                            Curated news for the Aidoptation team • {sortedArticles.length} stories found
                        </p>
                    </div>

                    <NewsFeed articles={sortedArticles} />
                </div>
            </main>
        </>
    );
}
