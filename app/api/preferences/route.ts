import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET colleague preferences
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
        return NextResponse.json(
            { error: 'Name parameter required' },
            { status: 400 }
        );
    }

    try {
        const colleague = await prisma.colleague.findUnique({
            where: { name: name.toLowerCase() },
        });

        if (!colleague) {
            return NextResponse.json(
                { topics: ['autonomous-driving'] }, // Default
                { status: 200 }
            );
        }

        const topics = JSON.parse(colleague.topics);
        return NextResponse.json({ topics });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch preferences' },
            { status: 500 }
        );
    }
}

// POST update colleague preferences
export async function POST(request: Request) {
    try {
        const { name, topics } = await request.json();

        if (!name || !Array.isArray(topics)) {
            return NextResponse.json(
                { error: 'Name and topics array required' },
                { status: 400 }
            );
        }

        const colleague = await prisma.colleague.upsert({
            where: { name: name.toLowerCase() },
            update: {
                topics: JSON.stringify(topics),
            },
            create: {
                name: name.toLowerCase(),
                topics: JSON.stringify(topics),
            },
        });

        return NextResponse.json({ success: true, colleague });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to save preferences' },
            { status: 500 }
        );
    }
}
