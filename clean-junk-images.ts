import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const junkPatterns = [
    'google.com/logos',
    'google.com/news/badges',
    'follow_on_google_news',
    'add_to_google',
    'google-news-logo',
    'facebook.com/tr',
    'pixel',
    'favicon',
    'logo',
    'button',
    'badge',
    'social-share',
    'newsletter-signup',
    'banner-ad',
    'doubleclick',
    'ads-by-google',
    'wp-content/themes',
    'placeholder',
    '1x1',
    'transparent'
];

async function main() {
    console.log('🧹 Starting junk image cleanup...');

    const articles = await prisma.article.findMany({
        where: {
            imageUrl: {
                not: null
            }
        }
    });

    console.log(`🔍 Scanning ${articles.length} articles for junk images...`);

    let cleanedCount = 0;

    for (const article of articles) {
        if (!article.imageUrl) continue;

        const lowUrl = article.imageUrl.toLowerCase();
        if (junkPatterns.some(pattern => lowUrl.includes(pattern))) {
            console.log(`🗑️ Cleaning junk image from article: "${article.title}"`);
            // console.log(`   URL: ${article.imageUrl}`);

            await prisma.article.update({
                where: { id: article.id },
                data: { imageUrl: null }
            });
            cleanedCount++;
        }
    }

    console.log(`✅ Cleanup complete! Removed ${cleanedCount} junk images.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
