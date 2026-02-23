'use client';

import { useState, useEffect } from 'react';
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

export default function SavedPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookmarkCount, setBookmarkCount] = useState(0);

    useEffect(() => {
        const ids = JSON.parse(localStorage.getItem('bookmarks') || '[]') as string[];
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
    }, []);

    const clearAll = () => {
        localStorage.removeItem('bookmarks');
        setArticles([]);
        setBookmarkCount(0);
    };

    return (
        <>
            <Header />
            <main className="min-h-screen relative pb-20">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="mb-12 animate-reveal flex items-end justify-between">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black mb-3 tracking-tighter">
                                Saved <span className="gradient-text">Articles</span>
                            </h1>
                            <p className="text-foreground/40 font-medium tracking-wide uppercase text-xs">
                                {bookmarkCount} bookmarked article{bookmarkCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                        {articles.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="btn btn-secondary text-xs mb-1"
                            >
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
                            emptyMessage="No saved articles yet. Hit the 🔖 on any article to save it here!"
                        />
                    )}
                </div>
            </main>
        </>
    );
}
