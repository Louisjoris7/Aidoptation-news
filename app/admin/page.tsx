'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import TeamManager from '@/components/TeamManager';
import GlobalSettingsManager from '@/components/GlobalSettingsManager';

interface TeamMember {
    id: string;
    name: string;
}

export default function AdminPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadMembers();
    }, []);

    const loadMembers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/team');
            const data = await res.json();
            setMembers(data.members || []);
        } catch (error) {
            console.error('Failed to load members:', error);
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Header />
            <main className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8 animate-fade-in">
                        <h1 className="text-4xl font-bold mb-2 gradient-text">
                            Platform Admin
                        </h1>
                        <p className="text-foreground/70">
                            Configure the general feed and manage team access
                        </p>
                    </div>

                    {/* General Settings */}
                    <GlobalSettingsManager />

                    {/* Team Management */}
                    {isLoading ? (
                        <div className="text-center py-20">
                            <div className="text-4xl mb-4">⏳</div>
                            <p className="text-foreground/60">Loading team members...</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <TeamManager members={members} onMembersChange={loadMembers} />
                        </div>
                    )}

                    {/* Info Card */}
                    <div className="card my-8 bg-primary/5 border-primary/20 animate-fade-in">
                        <h3 className="text-lg font-semibold mb-2">ℹ️ How it works</h3>
                        <ul className="space-y-2 text-sm text-foreground/80">
                            <li>• Add a team member to create their personal news page</li>
                            <li>• Each member gets a page at <code className="px-2 py-1 bg-background rounded">/[name]</code></li>
                            <li>• They can customize their topic preferences on their page</li>
                            <li>• Remove members to delete their pages</li>
                        </ul>
                    </div>
                </div>
            </main>
        </>
    );
}
