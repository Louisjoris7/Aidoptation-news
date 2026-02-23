'use client';

import { useState } from 'react';

interface TeamMember {
    id: string;
    name: string;
}

interface TeamManagerProps {
    members: TeamMember[];
    onMembersChange: () => void;
}

export default function TeamManager({ members, onMembersChange }: TeamManagerProps) {
    const [newMemberName, setNewMemberName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const addMember = async () => {
        if (!newMemberName.trim()) return;

        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newMemberName.toLowerCase().trim() }),
            });

            if (response.ok) {
                setMessage(`✅ Added ${newMemberName}!`);
                setNewMemberName('');
                onMembersChange();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.error || 'Failed to add member'}`);
            }
        } catch (error) {
            setMessage('❌ Network error');
        } finally {
            setIsLoading(false);
        }
    };

    const removeMember = async (id: string, name: string) => {
        if (!confirm(`Remove ${name} from the team?`)) return;

        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/team', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                setMessage(`✅ Removed ${name}`);
                onMembersChange();
            } else {
                const data = await response.json();
                setMessage(`❌ ${data.error || 'Failed to remove member'}`);
            }
        } catch (error) {
            setMessage('❌ Network error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <h2 className="text-2xl font-bold mb-6">Team Members</h2>

            {/* Add new member */}
            <div className="mb-6">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addMember()}
                        placeholder="Enter name (e.g., sofia)"
                        className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={addMember}
                        disabled={isLoading || !newMemberName.trim()}
                        className="btn btn-primary"
                    >
                        {isLoading ? '...' : '+ Add Member'}
                    </button>
                </div>
                {message && (
                    <p className="mt-2 text-sm">{message}</p>
                )}
            </div>

            {/* Member list */}
            <div className="space-y-3">
                {members.length === 0 ? (
                    <p className="text-foreground/60">No team members yet</p>
                ) : (
                    members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">👤</div>
                                <div>
                                    <p className="font-medium">{member.name}</p>
                                    <a
                                        href={`/${member.name}`}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        View page →
                                    </a>
                                </div>
                            </div>
                            <button
                                onClick={() => removeMember(member.id, member.name)}
                                disabled={isLoading}
                                className="px-3 py-1 text-sm rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
