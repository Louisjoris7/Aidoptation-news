import { prisma } from '@/lib/prisma';
import { extractArticle } from '@/lib/article-extractor';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import VisitTracker from '@/components/VisitTracker';

interface ArticlePageProps {
    params: {
        id: string;
    };
}

interface Article {
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: Date;
    description: string | null;
    imageUrl: string | null;
    visitCount: number;
    topics: string;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const article = (await prisma.article.findUnique({
        where: { id: params.id },
    })) as Article | null;

    if (!article) {
        notFound();
    }

    const fullArticle = await extractArticle(article.url);

    // Process content to remove duplicate hero image
    let processedContent = fullArticle?.content || '';
    if (article.imageUrl && processedContent) {
        // Remove the first image if it appears within the first 500 characters
        // (common for hero images embedded in content)
        const firstImgIndex = processedContent.indexOf('<img');
        if (firstImgIndex !== -1 && firstImgIndex < 500) {
            processedContent = processedContent.replace(/<img[^>]+>/i, '<!-- Removed duplicate hero image -->');
        }
    }

    return (
        <>
            <VisitTracker id={params.id} />
            <Header />
            <main className="min-h-screen pb-20 pt-16">
                <div className="container max-w-3xl mx-auto px-4">
                    {/* Navigation Back */}
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-primary hover:underline mb-8 group"
                    >
                        <span className="mr-2 transition-transform group-hover:-translate-x-1">←</span>
                        Back to Feed
                    </Link>

                    <article className="animate-fade-in">
                        {/* Source Info */}
                        <div className="flex items-center gap-3 mb-6 text-sm text-foreground/60">
                            <span className="font-semibold text-primary uppercase tracking-wider">{article.source}</span>
                            <span>•</span>
                            <span>{new Date(article.publishedAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })}</span>
                            {article.visitCount > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">🔥 {article.visitCount} visits</span>
                                </>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                            {fullArticle?.title || article.title}
                        </h1>

                        {article.imageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-2xl mb-12 shadow-2xl border border-border/50">
                                <img
                                    src={article.imageUrl}
                                    alt={article.title}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        )}

                        {fullArticle?.byline && (
                            <p className="text-lg text-foreground/70 mb-8 italic">
                                By {fullArticle.byline}
                            </p>
                        )}

                        {/* Main Content */}
                        <div className="prose prose-invert prose-lg max-w-none">
                            {fullArticle ? (
                                <div
                                    dangerouslySetInnerHTML={{ __html: processedContent }}
                                    className="article-content"
                                />
                            ) : (
                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
                                    <p className="text-lg mb-6">
                                        We couldn't extract the full content of this article.
                                        You can read it directly on the publisher's website.
                                    </p>
                                    <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                    >
                                        Read Original on {article.source}
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="mt-16 pt-8 border-t border-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <Link href="/" className="text-sm text-foreground/50 hover:text-primary transition-colors">
                                ← Back to Feed
                            </Link>
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                View Original Source →
                            </a>
                        </div>
                    </article>
                </div>
            </main>
        </>
    );
}
