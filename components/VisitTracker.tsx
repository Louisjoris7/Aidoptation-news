'use client';

import { useEffect } from 'react';

export default function VisitTracker({ id }: { id: string }) {
    useEffect(() => {
        // Track visit after a short delay to avoid counting incidental loads
        const timer = setTimeout(() => {
            fetch(`/api/news/${id}/visit`, { method: 'POST' })
                .catch(err => console.error('Failed to track visit', err));
        }, 2000);

        return () => clearTimeout(timer);
    }, [id]);

    return null;
}
