import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { fetchAllArticles } from '@/lib/rss-fetcher';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        console.log('Manual fetch triggered from Admin...');
        const articles = await fetchAllArticles();

        // Save to database (copy-pasted from cron job logic for consistency)
        for (const article of articles) {
            await prisma.article.upsert({
                where: { url: article.url },
                update: {
                    imageUrl: article.imageUrl,
                },
                create: {
                    title: article.title,
                    url: article.url,
                    source: article.source,
                    publishedAt: article.publishedAt,
                    description: article.description,
                    topics: JSON.stringify(article.topics),
                    imageUrl: article.imageUrl,
                },
            });
        }

        return NextResponse.json({
            success: true,
            count: articles.length,
            message: `Successfully updated ${articles.length} articles.`
        });
    } catch (error) {
        console.error('Manual fetch failed:', error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
