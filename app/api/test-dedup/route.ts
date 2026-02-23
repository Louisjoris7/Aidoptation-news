import { NextResponse } from 'next/server';
import { fetchAllArticles } from '@/lib/rss-fetcher';
import { deduplicateArticles } from '@/lib/deduplicator';

export async function GET() {
    try {
        console.log('Testing deduplication...');

        // Fetch all articles
        const allArticles = await fetchAllArticles();

        // Deduplicate
        const result = deduplicateArticles(allArticles);

        return NextResponse.json({
            status: 'Deduplication working ✅',
            stats: result.stats,
            duplicateExamples: result.duplicateGroups.slice(0, 3).map(group => ({
                canonical: {
                    title: group.canonicalArticle.title,
                    source: group.canonicalArticle.source,
                    priority: group.canonicalArticle.priority,
                },
                duplicates: group.duplicates.map(d => ({
                    title: d.title,
                    source: d.source,
                    priority: d.priority,
                })),
            })),
            message: 'Step 4 verification successful!',
        });
    } catch (error) {
        return NextResponse.json({
            status: 'Deduplication error ❌',
            error: String(error),
        }, { status: 500 });
    }
}
