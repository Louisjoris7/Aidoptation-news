
import { prisma } from './lib/prisma';
import { CURATED_SOURCE_NAMES } from './lib/sources';

async function check() {
    console.log('--- Curated Sources Image Check ---');
    for (const source of CURATED_SOURCE_NAMES) {
        const withImages = await prisma.article.count({
            where: {
                source,
                imageUrl: { not: null }
            }
        });
        const total = await prisma.article.count({ where: { source } });
        console.log(`${source}: ${withImages}/${total} articles have images.`);
    }
    process.exit(0);
}

check();
