'use client';

import { useState } from 'react';
import ArticleCard from './ArticleCard';
import SearchBar from './SearchBar';

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

interface NewsFeedProps {
    articles: Article[];
    emptyMessage?: string;
}

export default function NewsFeed({ articles, emptyMessage = "No articles found" }: NewsFeedProps) {
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? articles.filter((a) => {
            const q = search.toLowerCase();
            const topics = JSON.parse(a.topics) as string[];
            return (
                a.title.toLowerCase().includes(q) ||
                a.source.toLowerCase().includes(q) ||
                (a.description?.toLowerCase().includes(q) ?? false) ||
                topics.some((t) => t.toLowerCase().includes(q))
            );
        })
        : articles;

    return (
        <div>
            <SearchBar value={search} onChange={setSearch} />

            {filtered.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">{search ? '🔍' : '📭'}</div>
                    <p className="text-foreground/60 text-lg">
                        {search ? `No articles matching "${search}"` : emptyMessage}
                    </p>
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="mt-4 btn btn-secondary text-sm"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {search && (
                        <p className="text-xs text-foreground/30 uppercase tracking-widest font-bold mb-6">
                            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {filtered.map((article, index) => (
                            <div
                                key={article.id}
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <ArticleCard article={article} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
