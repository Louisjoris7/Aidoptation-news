import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const junkPatterns = [
    'google.com/logos',
    'google.com/news/badges',
    'googleusercontent.com',
    'follow_on_google_news',
    'add_to_google',
    'google-news',
    'google_news',
    'follow-us',
    'google-logo',
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
    console.log('🧹 Starting deep junk image cleanup...');
    console.log('💡 I will be very verbose to show you exactly what I am looking at.');

    const articles = await prisma.article.findMany({
        where: {
            imageUrl: { not: null }
        }
    });

    console.log(`🔍 Scanning ${articles.length} articles for junk images...\n`);

    let cleanedCount = 0;

    for (const article of articles) {
        const url = article.imageUrl as string;
        const lowUrl = url.toLowerCase();

        // Broad search for banners
        const isJunk = junkPatterns.some(pattern => lowUrl.includes(pattern)) ||
            (lowUrl.includes('google') && (lowUrl.includes('news') || lowUrl.includes('banner') || lowUrl.includes('badge')));

        if (isJunk) {
            console.log(`🗑️ MATCH! Removing junk banner from: "${article.title}"`);

            await prisma.article.update({
                where: { id: article.id },
                data: { imageUrl: null }
            });
            cleanedCount++;
        }
    }

    console.log(`\n✅ Finished! Successfully removed ${cleanedCount} junk images.`);

    // FINAL CHECK: Show me what articles still HAVE images
    const remaining = await prisma.article.findMany({
        where: { imageUrl: { not: null } },
        orderBy: { publishedAt: 'desc' },
        take: 10
    });

    console.log(`\n📸 PREVIEW: Here are the latest 10 articles that still HAVE images:`);
    remaining.forEach(article => {
        console.log(`🖼️ "${article.title}"`);
        console.log(`   URL: ${article.imageUrl}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
