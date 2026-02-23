import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { CURATED_SOURCE_NAMES, RSS_SOURCES } from '@/lib/sources';
import { normalizeTopic } from '@/lib/topics';

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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const topics = searchParams.get('topics');
    const limit = parseInt(searchParams.get('limit') || '100');

    try {
        let finalTopics: string[] | null = null;
        let useCuratedSources = false;

        if (topics) {
            finalTopics = topics.split(',');
        } else {
            const setting = await (prisma as any).globalSetting.findUnique({ where: { key: 'core_topics' } });
            if (setting) {
                const raw = JSON.parse(setting.value);
                if (Array.isArray(raw)) {
                    finalTopics = raw
                        .map(t => {
                            const n = normalizeTopic(t);
                            return n.active ? n.name : null;
                        })
                        .filter((t): t is string => t !== null);
                }
            }

            if (!finalTopics || finalTopics.length === 0) {
                useCuratedSources = true;
            }
        }

        let articles;

        const whereClause: any = {};
        if (useCuratedSources) {
            whereClause.source = { in: CURATED_SOURCE_NAMES };
        } else if (finalTopics) {
            whereClause.OR = finalTopics.map(topic => ({
                topics: { contains: topic },
            }));
        }

        articles = (await prisma.article.findMany({
            where: whereClause,
            orderBy: [
                { publishedAt: 'desc' },
            ],
            take: limit * 2, // Fetch more for in-memory ranking
        })) as any as Article[];

        // Smart Ranking
        // Score = (SourcePriority * 10) + (visitCount * 2) + (freshness score)
        const sourcePriorityMap = RSS_SOURCES.reduce((acc, s) => {
            acc[s.name] = s.priority;
            return acc;
        }, {} as Record<string, number>);

        // Identify company topics for boost
        const companyTopics = new Set<string>();
        const coreSetting = await (prisma as any).globalSetting.findUnique({ where: { key: 'core_topics' } });
        if (coreSetting) {
            const raw = JSON.parse(coreSetting.value);
            if (Array.isArray(raw)) {
                raw.forEach(t => {
                    const n = normalizeTopic(t);
                    if (n.active && n.isCompany) {
                        companyTopics.add(n.name.toLowerCase());
                    }
                });
            }
        }

        const now = Date.now();
        const scoredArticles = articles.map(article => {
            const priority = sourcePriorityMap[article.source] || 5;
            const hoursOld = (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
            const freshness = Math.max(0, 48 - hoursOld) / 2; // Decay over 48 hours

            // Company matching boost
            let companyBoost = 0;
            const articleTopics = JSON.parse(article.topics) as string[];
            if (articleTopics.some(t => companyTopics.has(t.toLowerCase()))) {
                companyBoost = 25;
            }

            const score = (priority * 10) + (article.visitCount * 5) + freshness + companyBoost;
            return { ...article, score };
        });

        scoredArticles.sort((a, b) => b.score - a.score);

        return NextResponse.json({
            articles: scoredArticles.slice(0, limit)
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch articles' },
            { status: 500 }
        );
    }
}
