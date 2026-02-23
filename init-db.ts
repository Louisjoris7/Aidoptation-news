
import { prisma } from './lib/prisma';
import { fetchAllArticles } from './lib/rss-fetcher';
import { CORE_TOPICS } from './lib/sources';

async function main() {
    console.log('--- Database Initialization ---');

    // 1. Initialize Core Topics if missing
    console.log('Initializing core topics...');
    const existingSetting = await prisma.globalSetting.findUnique({ where: { key: 'core_topics' } });
    if (!existingSetting) {
        await prisma.globalSetting.create({
            data: {
                key: 'core_topics',
                value: JSON.stringify(CORE_TOPICS)
            }
        });
        console.log('✅ Created default core topics setting.');
    } else {
        console.log('ℹ️ Core topics already exist.');
    }

    // 2. Fetch fresh articles with images
    console.log('Fetching fresh articles...');
    const articles = await fetchAllArticles();
    console.log(`Fetched ${articles.length} articles.`);

    for (const article of articles) {
        await prisma.article.upsert({
            where: { url: article.url },
            update: {
                imageUrl: article.imageUrl,
                publishedAt: article.publishedAt,
            },
            create: {
                title: article.title,
                url: article.url,
                source: article.source,
                publishedAt: article.publishedAt,
                description: article.description,
                topics: JSON.stringify(article.topics),
                imageUrl: article.imageUrl,
            },
        });
    }
    console.log('✅ Articles updated in database.');
    process.exit(0);
}

main().catch(err => {
    console.error('Fatal error during init:', err);
    process.exit(1);
});
