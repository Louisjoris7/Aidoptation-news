import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create initial team members
    const teamMembers = [
        'louis',
        'giovanni',
        'raffaele',
        'rodrigo',
        'adam',
        'lotte',
        'andrea',
    ];

    for (const name of teamMembers) {
        await prisma.colleague.upsert({
            where: { name },
            update: {},
            create: {
                name,
                topics: JSON.stringify(['autonomous-driving', 'tech']),
            },
        });
        console.log(`✅ Created team member: ${name}`);
    }

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
