'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import NewsFeed from '@/components/NewsFeed';
import TopicSelector from '@/components/TopicSelector';
import { ManagedTopic, normalizeTopic } from '@/lib/topics';

interface Article {
    id: string;
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    description: string | null;
    imageUrl: string | null;
    visitCount: number;
    topics: string;
}

interface PageProps {
    params: {
        colleague: string;
    };
}

export default function ColleaguePage({ params }: PageProps) {
    const { colleague } = params;
    const [articles, setArticles] = useState<Article[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<ManagedTopic[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load colleague preferences and articles
    useEffect(() => {
        loadPreferences();
    }, [colleague]);

    useEffect(() => {
        if (selectedTopics.length > 0) {
            loadArticles();
        }
    }, [selectedTopics]);

    const loadPreferences = async () => {
        try {
            const res = await fetch(`/api/preferences?name=${colleague}`);
            const data = await res.json();

            // Support migration from string[] to ManagedTopic[]
            const raw = data.topics || ['autonomous-driving'];
            const migrated = raw.map((t: any) => normalizeTopic(t));

            setSelectedTopics(migrated);
        } catch (error) {
            console.error('Failed to load preferences:', error);
            setSelectedTopics([{ name: 'autonomous-driving', active: true, isCompany: false }]);
        }
    };

    const loadArticles = async () => {
        setIsLoading(true);
        try {
            // Flatten topic names for the API
            const topicNames = selectedTopics.map(t => t.name).join(',');
            const topicQuery = topicNames ? `?topics=${topicNames}` : '';
            const res = await fetch(`/api/news${topicQuery}`);
            const data = await res.json();
            setArticles(data.articles || []);
        } catch (error) {
            console.error('Failed to load articles:', error);
            setArticles([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopicsChange = async (newTopics: (string | ManagedTopic)[]) => {
        const normalized = newTopics.map(t => normalizeTopic(t));
        setSelectedTopics(normalized);

        // Save to database
        try {
            await fetch('/api/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: colleague, topics: normalized }),
            });
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    };

    return (
        <>
            <Header />
            <main className="min-h-screen relative pb-20">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Page Header */}
                    <div className="mb-8 animate-reveal flex items-end justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter capitalize mb-4">
                                {colleague}'s <span className="gradient-text">Feed</span>
                            </h1>
                            <p className="text-foreground/40 font-medium tracking-wide uppercase text-xs">
                                Personalized feed based on {selectedTopics.length} tracked targets
                            </p>
                        </div>
                        <Link href={`/${colleague}/saved`} className="btn btn-secondary text-sm flex items-center gap-2">
                            🔖 Saved Articles
                        </Link>
                    </div>

                    {/* Topic Selector */}
                    <TopicSelector
                        selectedTopics={selectedTopics}
                        onTopicsChange={handleTopicsChange}
                    />

                    {/* News Feed */}
                    {isLoading ? (
                        <div className="text-center py-32 glass rounded-[3rem]">
                            <div className="text-6xl mb-6 animate-spin duration-[3000ms]">⏳</div>
                            <p className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Calibrating Feed...</p>
                        </div>
                    ) : (
                        <div className="mt-8">
                            <NewsFeed
                                articles={articles}
                                emptyMessage={`No intelligence found for ${colleague}'s current targets.`}
                            />
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
