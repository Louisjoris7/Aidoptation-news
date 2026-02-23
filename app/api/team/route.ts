import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all team members
export async function GET() {
    try {
        const members = await prisma.colleague.findMany({
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ members });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch members' },
            { status: 500 }
        );
    }
}

// POST create new team member
export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        const normalizedName = name.toLowerCase().trim();

        // Check if member already exists
        const existing = await prisma.colleague.findUnique({
            where: { name: normalizedName },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Member already exists' },
                { status: 409 }
            );
        }

        const member = await prisma.colleague.create({
            data: {
                name: normalizedName,
                topics: JSON.stringify(['autonomous-driving']), // Default topic
            },
        });

        return NextResponse.json({ member });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to create member' },
            { status: 500 }
        );
    }
}

// DELETE remove team member
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        await prisma.colleague.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete member' },
            { status: 500 }
        );
    }
}
