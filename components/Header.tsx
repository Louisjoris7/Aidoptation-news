'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Header() {
    const [colleagues, setColleagues] = useState<{ id: string, name: string }[]>([]);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const fetchColleagues = async () => {
            try {
                const res = await fetch('/api/team');
                const data = await res.json();
                setColleagues(data.members || []);
            } catch (e) {
                console.error('Failed to fetch colleagues');
            }
        };
        fetchColleagues();
    }, []);

    const handleAddColleague = async () => {
        const name = prompt('Enter new colleague name:');
        if (!name) return;

        try {
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.toLowerCase().trim() }),
            });

            if (res.ok) {
                const data = await res.json();
                setColleagues([...colleagues, { id: Date.now().toString(), name: name.toLowerCase() }]);
                router.push(`/${name.toLowerCase()}`);
            }
        } catch (e) {
            alert('Failed to add colleague');
        }
    };

    return (
        <header className="glass sticky top-0 z-50 border-b-0 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="max-w-7xl mx-auto px-6 pt-2">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
                    {/* Logo Area */}
                    <Link href="/" className="group relative z-20">
                        <div className="relative w-64 h-20 -ml-4 -top-2 transition-transform duration-500 group-hover:scale-105">
                            <Image
                                src="/Aidoptation_Logos-03.PNG"
                                alt="Aidoptation Logo"
                                fill
                                className="object-contain object-left brightness-0 invert drop-shadow-xl"
                                priority
                            />
                        </div>
                    </Link>
                    {/* Admin Link */}
                    <Link href="/admin" className="btn btn-secondary text-xs">
                        ⚙️ Admin Settings
                    </Link>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                    <Link
                        href="/"
                        className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-all duration-300 border-b-2 ${pathname === '/'
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-transparent text-foreground/40 hover:text-foreground hover:bg-white/5'
                            }`}
                    >
                        General Feed
                    </Link>

                    {colleagues.map((colleague) => (
                        <Link
                            key={colleague.id}
                            href={`/${colleague.name}`}
                            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-all duration-300 border-b-2 capitalize ${pathname === `/${colleague.name}`
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-foreground/40 hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            {colleague.name}
                        </Link>
                    ))}

                    <button
                        onClick={handleAddColleague}
                        className="px-3 py-2 text-sm font-medium rounded-t-lg text-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors border-b-2 border-transparent"
                        title="Add Colleague"
                    >
                        +
                    </button>
                </div>
            </div>
        </header>
    );
}
