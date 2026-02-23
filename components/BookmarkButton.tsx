'use client';

import { useState, useEffect } from 'react';

interface BookmarkButtonProps {
    articleId: string;
    articleTitle: string;
    username?: string; // if provided, saves under that user's key
}

export default function BookmarkButton({ articleId, articleTitle, username }: BookmarkButtonProps) {
    const storageKey = username ? `bookmarks-${username}` : 'bookmarks';
    const [isBookmarked, setIsBookmarked] = useState(false);

    useEffect(() => {
        const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]') as string[];
        setIsBookmarked(bookmarks.includes(articleId));
    }, [articleId, storageKey]);

    const toggleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const bookmarks = JSON.parse(localStorage.getItem(storageKey) || '[]') as string[];
        let updated: string[];
        if (bookmarks.includes(articleId)) {
            updated = bookmarks.filter((id) => id !== articleId);
        } else {
            updated = [...bookmarks, articleId];
        }
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setIsBookmarked(!isBookmarked);
    };

    return (
        <button
            onClick={toggleBookmark}
            title={isBookmarked ? 'Remove bookmark' : 'Save article'}
            className={`text-sm transition-all duration-300 hover:scale-125 ${isBookmarked
                ? 'text-primary drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                : 'text-foreground/20 hover:text-primary/60'
                }`}
        >
            🔖
            <span className="sr-only">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
        </button>
    );
}
