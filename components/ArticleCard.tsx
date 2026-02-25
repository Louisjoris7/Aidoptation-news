'use client';

import Link from 'next/link';
import Image from 'next/image';
import BookmarkButton from './BookmarkButton';

interface Article {
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: Date | string;
    description: string | null;
    imageUrl: string | null;
    visitCount: number;
    topics: string; // JSON string
}

interface ArticleCardProps {
    article: Article;
}

function getSourceFavicon(url: string): string {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
        return '';
    }
}

export default function ArticleCard({ article }: ArticleCardProps) {
    const topics = JSON.parse(article.topics) as string[];
    const date = new Date(article.publishedAt);
    const timeAgo = getTimeAgo(date);
    const favicon = getSourceFavicon(article.url);

    return (
        <article className="article-card group animate-reveal">
            {article.imageUrl && (
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
                    <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity flex items-end p-6">
                        <div className="btn btn-primary text-xs scale-90 -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                            Read Full Story
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {favicon && (
                            <Image
                                src={favicon}
                                alt={article.source}
                                width={16}
                                height={16}
                                className="rounded-sm opacity-80"
                                unoptimized
                            />
                        )}
                        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary uppercase tracking-widest">
                            {article.source}
                        </span>
                    </div>
                    <time className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">
                        {timeAgo}
                    </time>
                </div>

                <Link href={`/article/${article.id}`} className="block mb-2">
                    <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                    </h3>
                </Link>

                <p className="text-sm text-foreground/50 line-clamp-3 mb-4 flex-1 leading-relaxed">
                    {article.description}
                </p>

                <div className="flex flex-wrap gap-x-3 gap-y-1 mb-6">
                    {topics.map((topic) => (
                        <span
                            key={topic}
                            className="text-[10px] uppercase tracking-[0.15em] font-bold text-foreground/20 hover:text-primary/60 transition-colors cursor-default"
                        >
                            #{topic}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold uppercase tracking-wider text-foreground/30 hover:text-primary transition-colors flex items-center gap-2"
                    >
                        Visit Source <span className="opacity-50">↗</span>
                    </a>

                    <div className="flex items-center gap-3">
                        {article.visitCount > 0 && (
                            <span className="text-[10px] font-bold text-orange-500/60 flex items-center gap-1">
                                🔥 {article.visitCount}
                            </span>
                        )}
                        <BookmarkButton articleId={article.id} articleTitle={article.title} />
                        <Link
                            href={`/article/${article.id}`}
                            className="text-xs font-bold text-foreground/40 hover:text-primary transition-colors"
                        >
                            Read Full →
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ago`;
    }
    if (seconds < 86400) {
        const hours = Math.floor(seconds / 3600);
        return `${hours}h ago`;
    }
    const days = Math.floor(seconds / 86400);
    return `${days}d ago`;
}
