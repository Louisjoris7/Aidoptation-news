'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshTrigger() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAndRefresh = async () => {
            // 1. Check if we need to refresh (e.g., more than 15 minutes since last fetch)
            const LAST_FETCH_KEY = 'aidoptation_last_fetch';
            const THRESHOLD = 15 * 60 * 1000; // 15 minutes
            const now = Date.now();
            const lastFetch = localStorage.getItem(LAST_FETCH_KEY);

            if (lastFetch && now - parseInt(lastFetch) < THRESHOLD) {
                return; // Too soon
            }

            // 2. Start background refresh
            setIsRefreshing(true);
            try {
                const res = await fetch('/api/cron/trigger', { method: 'POST' });
                if (res.ok) {
                    localStorage.setItem(LAST_FETCH_KEY, now.toString());
                    router.refresh(); // Tells Next.js to re-fetch Server Component data
                }
            } catch (e) {
                console.warn('Background refresh failedsilently');
            } finally {
                // Keep the "✨" visible for a second so user sees it worked
                setTimeout(() => setIsRefreshing(false), 3000);
            }
        };

        checkAndRefresh();
    }, [router]);

    if (!isRefreshing) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] animate-bounce-slow">
            <div className="glass px-4 py-2 rounded-full border border-primary/20 bg-primary/5 flex items-center gap-2 shadow-2xl">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Updating Intelligence
                </span>
            </div>
        </div>
    );
}
