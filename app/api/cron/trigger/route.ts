import { NextResponse } from 'next/server';
import { fetchAllArticles } from '@/lib/rss-fetcher';
import { prisma } from '@/lib/prisma';
import { deduplicateArticles } from '@/lib/deduplicator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
    try {
        console.log('🔄 Manual fetch triggered from Admin...');

        // 1. Fetch from unified engine
        const articles = await fetchAllArticles();

        // 2. Deduplicate
        const { uniqueArticles } = deduplicateArticles(articles);

        // 3. Save/Update in DB
        let updatedCount = 0;
        for (const article of uniqueArticles) {
            await prisma.article.upsert({
                where: { url: article.url },
                update: {
                    title: article.title,
                    description: article.description,
                    publishedAt: article.publishedAt,
                    imageUrl: article.imageUrl,
                    topics: JSON.stringify(article.topics), // Refresh tags!
                },
                create: {
                    title: article.title,
                    url: article.url,
                    source: article.source,
                    publishedAt: article.publishedAt,
                    description: article.description,
                    imageUrl: article.imageUrl,
                    topics: JSON.stringify(article.topics),
                },
            });
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            count: updatedCount,
            message: `Successfully synchronized ${updatedCount} articles.`
        });
    } catch (error) {
        console.error('❌ Manual fetch failed:', error);
        return NextResponse.json({ error: 'Failed to synchronize intelligence' }, { status: 500 });
    }
}
