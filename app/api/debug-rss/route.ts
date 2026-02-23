import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const topic = 'cinema';

    try {
        // 1. Check DB for custom topics
        const colleagues = await prisma.colleague.findMany();
        const allTopics = colleagues.flatMap(c => JSON.parse(c.topics));

        // 2. SEARCH ARTICLES
        const articles = await prisma.article.findMany({
            where: {
                topics: {
                    contains: topic,
                },
            },
            take: 5,
        });

        // 3. Check ANY articles
        const totalArticles = await prisma.article.count();

        return NextResponse.json({
            status: 'Database Check',
            userTopics: Array.from(new Set(allTopics)),
            totalArticlesInDb: totalArticles,
            cinemaArticlesFound: articles.length,
            samples: articles.map(a => ({
                title: a.title,
                topics: a.topics
            }))
        });

    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
