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

        console.log(`🧐 Scanning: "${article.title}"`);
        console.log(`   URL: ${url}`);

        // Broad search for banners
        const isJunk = junkPatterns.some(pattern => lowUrl.includes(pattern)) ||
            (lowUrl.includes('google') && (lowUrl.includes('news') || lowUrl.includes('banner') || lowUrl.includes('badge')));

        if (isJunk) {
            console.log(`   🗑️ MATCH! Removing junk banner.`);

            await prisma.article.update({
                where: { id: article.id },
                data: { imageUrl: null }
            });
            cleanedCount++;
        }
    }

    console.log(`\n✅ Finished! Successfully removed ${cleanedCount} junk images.`);
    if (cleanedCount === 0) {
        console.log('\n❌ I still found 0 junk images. This means the images you see have a URL that doesn\'t look like our filters.');
        console.log('👉 To fix this, please run the script again after uncommenting the "DEBUG" line in the code to show all URLs.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
