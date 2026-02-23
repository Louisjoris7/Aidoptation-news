import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    try {
        await prisma.article.update({
            where: { id },
            data: {
                visitCount: {
                    increment: 1
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to increment visit count' }, { status: 500 });
    }
}
