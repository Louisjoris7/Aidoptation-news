import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { ids } = await request.json() as { ids: string[] };
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ articles: [] });
        }

        const articles = await prisma.article.findMany({
            where: { id: { in: ids } },
            orderBy: { publishedAt: 'desc' },
        });

        return NextResponse.json({ articles });
    } catch (error) {
        console.error('Error fetching articles by IDs:', error);
        return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}
