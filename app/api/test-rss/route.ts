import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { fetchAllArticles } from '@/lib/rss-fetcher';

export async function GET() {
    try {
        console.log('Testing RSS fetcher...');
        const articles = await fetchAllArticles();

        return NextResponse.json({
            status: 'RSS fetcher working ✅',
            totalArticles: articles.length,
            sources: Array.from(new Set(articles.map(a => a.source))),
            sampleArticles: articles.slice(0, 5).map(a => ({
                title: a.title,
                source: a.source,
                topics: a.topics,
                publishedAt: a.publishedAt,
            })),
            message: 'Step 3 verification successful!',
        });
    } catch (error) {
        return NextResponse.json({
            status: 'RSS fetcher error ❌',
            error: String(error),
        }, { status: 500 });
    }
}
