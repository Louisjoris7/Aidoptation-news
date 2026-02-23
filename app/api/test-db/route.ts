import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Test database connection and structure
        const articleCount = await prisma.article.count();
        const colleagueCount = await prisma.colleague.count();
        const groupCount = await prisma.articleGroup.count();

        return NextResponse.json({
            status: 'Database connected ✅',
            tables: {
                articles: articleCount,
                colleagues: colleagueCount,
                articleGroups: groupCount,
            },
            message: 'Step 2 verification successful!',
        });
    } catch (error) {
        return NextResponse.json({
            status: 'Database error ❌',
            error: String(error),
        }, { status: 500 });
    }
}
