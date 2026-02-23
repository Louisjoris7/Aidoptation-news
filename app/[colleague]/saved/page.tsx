'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import NewsFeed from '@/components/NewsFeed';

interface Article {
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: Date | string;
    description: string | null;
    imageUrl: string | null;
    visitCount: number;
    topics: string;
}

export default function ColleagueSavedPage() {
    const params = useParams();
    const colleague = params.colleague as string;
    const storageKey = `bookmarks-${colleague}`;

    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookmarkCount, setBookmarkCount] = useState(0);

    useEffect(() => {
        const ids = JSON.parse(localStorage.getItem(storageKey) || '[]') as string[];
        setBookmarkCount(ids.length);

        if (ids.length === 0) {
            setLoading(false);
            return;
        }

        fetch('/api/articles/by-ids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        })
            .then((r) => r.json())
            .then((data) => setArticles(data.articles || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [storageKey]);

    const clearAll = () => {
        localStorage.removeItem(storageKey);
        setArticles([]);
        setBookmarkCount(0);
    };

    return (
        <>
            <Header />
            <main className="min-h-screen relative pb-20">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="mb-12 animate-reveal flex items-end justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <Link
                                    href={`/${colleague}`}
                                    className="text-foreground/30 hover:text-foreground/60 transition-colors text-sm font-semibold capitalize"
                                >
                                    ← {colleague}&apos;s Feed
                                </Link>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black mb-3 tracking-tighter capitalize">
                                {colleague}&apos;s <span className="gradient-text">Saved</span>
                            </h1>
                            <p className="text-foreground/40 font-medium tracking-wide uppercase text-xs">
                                {bookmarkCount} bookmarked article{bookmarkCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                        {articles.length > 0 && (
                            <button onClick={clearAll} className="btn btn-secondary text-xs mb-1">
                                🗑 Clear all
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="card animate-pulse h-64 bg-white/[0.02]" />
                            ))}
                        </div>
                    ) : (
                        <NewsFeed
                            articles={articles}
                            emptyMessage={`No saved articles yet. Browse ${colleague}'s feed and hit 🔖 to save articles here!`}
                        />
                    )}
                </div>
            </main>
        </>
    );
}
