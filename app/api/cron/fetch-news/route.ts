import { NextResponse } from 'next/server';
import { fetchAllArticles } from '@/lib/rss-fetcher';
import { deduplicateArticles } from '@/lib/deduplicator';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

export async function GET() {
    try {
        console.log('🔄 Cron job started: Fetching news...');
        const startTime = Date.now();

        // 1. Fetch articles from all RSS sources
        const allArticles = await fetchAllArticles();
        console.log(`✅ Fetched ${allArticles.length} articles`);

        // 2. Deduplicate articles
        const { uniqueArticles, duplicateGroups, stats } = deduplicateArticles(allArticles);
        console.log(`✅ Deduplicated: ${stats.uniqueOutput} unique, ${stats.duplicatesRemoved} removed`);

        // 3. Save unique articles to database
        let savedCount = 0;
        let skippedCount = 0;

        for (const article of uniqueArticles) {
            try {
                await prisma.article.upsert({
                    where: { url: article.url },
                    update: {
                        title: article.title,
                        description: article.description,
                        publishedAt: article.publishedAt,
                        imageUrl: article.imageUrl,
                        topics: JSON.stringify(article.topics),
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
                savedCount++;
            } catch (error) {
                console.error(`Failed to save article: ${article.url}`, error);
                skippedCount++;
            }
        }

        // 4. Save duplicate groups
        for (const group of duplicateGroups) {
            const canonicalArticle = await prisma.article.findUnique({
                where: { url: group.canonicalArticle.url },
            });

            if (canonicalArticle) {
                await prisma.articleGroup.create({
                    data: {
                        canonicalArticleId: canonicalArticle.id,
                        duplicateArticleIds: JSON.stringify(
                            group.duplicates.map(d => d.url)
                        ),
                    },
                });
            }
        }

        const duration = Date.now() - startTime;

        console.log(`✅ Cron job complete in ${duration}ms`);

        return NextResponse.json({
            success: true,
            message: 'News fetched and saved successfully',
            stats: {
                fetched: allArticles.length,
                unique: stats.uniqueOutput,
                saved: savedCount,
                skipped: skippedCount,
                duplicateGroups: duplicateGroups.length,
                duration: `${duration}ms`,
            },
        });
    } catch (error) {
        console.error('❌ Cron job failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: String(error),
            },
            { status: 500 }
        );
    }
}
