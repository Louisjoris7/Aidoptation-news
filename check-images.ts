
import { prisma } from './lib/prisma';

async function check() {
    const articles = await prisma.article.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' }
    });

    console.log('--- Image Verification ---');
    articles.forEach(a => {
        console.log(`Title: ${a.title.substring(0, 30)}...`);
        console.log(`Source: ${a.source}`);
        console.log(`Image URL: ${a.imageUrl || 'NULL'}`);
        console.log('---');
    });

    const withImages = await prisma.article.count({ where: { imageUrl: { not: null } } });
    const total = await prisma.article.count();
    console.log(`Summary: ${withImages}/${total} articles have images.`);
    process.exit(0);
}

check();
