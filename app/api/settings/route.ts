import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CORE_TOPICS } from '@/lib/sources';

export async function GET() {
    try {
        const allSettings = await prisma.globalSetting.findMany();
        const settingsMap = allSettings.reduce((acc: any, curr: any) => {
            acc[curr.key] = JSON.parse(curr.value);
            return acc;
        }, {});

        return NextResponse.json({
            settings: settingsMap,
            presets: {
                core_topics: CORE_TOPICS
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { key, value } = await request.json();

        await prisma.globalSetting.upsert({
            where: { key },
            update: { value: JSON.stringify(value) },
            create: { key, value: JSON.stringify(value) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}
