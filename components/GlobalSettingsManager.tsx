'use client';

import { useState, useEffect } from 'react';
import { ManagedTopic, normalizeTopic } from '@/lib/topics';

export default function GlobalSettingsManager() {
    const [topics, setTopics] = useState<ManagedTopic[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isCompany, setIsCompany] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();

            let fetchedTopics: ManagedTopic[] = [];

            // Handle migration from string[] to ManagedTopic[] and normalize
            if (data.settings && data.settings.core_topics) {
                const raw = data.settings.core_topics;
                if (Array.isArray(raw)) {
                    fetchedTopics = raw.map((t: any) => normalizeTopic(t));
                }
            }

            // If empty, initialize with presets from the API
            if (fetchedTopics.length === 0 && data.presets && data.presets.core_topics) {
                fetchedTopics = data.presets.core_topics.map((t: string) => normalizeTopic(t));
            }

            setTopics(fetchedTopics);
        } catch (error) {
            console.error('Failed to fetch settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (updatedTopics: ManagedTopic[]) => {
        setIsSaving(true);
        setMessage('');
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'core_topics', value: updatedTopics }),
            });
            if (res.ok) {
                setMessage('✅ Settings updated!');
            }
        } catch (error) {
            setMessage('❌ Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTopic = (index: number) => {
        const newTopics = [...topics];
        newTopics[index].active = !newTopics[index].active;
        setTopics(newTopics);
        handleSave(newTopics);
    };

    const removeTopic = (index: number) => {
        const topicName = topics[index].name;
        if (!confirm(`Delete "${topicName}" from the list?`)) return;

        const newTopics = topics.filter((_, i) => i !== index);
        setTopics(newTopics);
        handleSave(newTopics);
    };

    const addCustomTopic = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            const normalized = normalizeTopic({ name: trimmed, active: true, isCompany });
            if (!topics.find(t => t.name === normalized.name)) {
                const newTopics = [...topics, normalized];
                setTopics(newTopics);
                setInputValue('');
                setIsCompany(false);
                handleSave(newTopics);
            }
        }
    };

    const triggerRefresh = async () => {
        setIsRefreshing(true);
        setMessage('🔄 Refreshing news feed...');
        try {
            const res = await fetch('/api/cron/trigger', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                setMessage(`✅ Success! ${data.message}`);
            } else {
                setMessage('❌ Refresh failed');
            }
        } catch (error) {
            setMessage('❌ Network error during refresh');
        } finally {
            setIsRefreshing(false);
        }
    };

    if (isLoading) return <div className="animate-pulse h-64 bg-primary/5 rounded-xl"></div>;

    const companies = topics.filter(t => t.isCompany);
    const generalTopics = topics.filter(t => !t.isCompany);

    return (
        <div className="card glass p-8 mb-12 animate-reveal overflow-visible">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter mb-2">
                        Control <span className="gradient-text">Center</span>
                    </h2>
                    <p className="text-sm font-medium text-foreground/40 uppercase tracking-[0.2em]">
                        Global Intelligence configuration
                    </p>
                </div>
                <button
                    onClick={triggerRefresh}
                    disabled={isRefreshing}
                    className={`btn ${isRefreshing ? 'btn-secondary opacity-50' : 'btn-primary'} flex items-center gap-3 px-8 shadow-xl`}
                >
                    {isRefreshing ? '🔄 Processing...' : '🔄 Refresh All Intelligence'}
                </button>
            </div>

            {/* Structured Topics List */}
            <div className="space-y-10 mb-10">
                {/* Companies Section */}
                <div>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary">
                            🏢 Strategic Firms
                        </h3>
                        <span className="text-[10px] font-bold text-foreground/20 px-3 py-1 glass rounded-full">{companies.length} TRACKED</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {companies.map((topic) => {
                            const index = topics.findIndex(t => t.name === topic.name);
                            return (
                                <div
                                    key={topic.name}
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${topic.active
                                        ? 'glass bg-primary/10 border-primary/20 text-primary'
                                        : 'glass opacity-30 grayscale'
                                        }`}
                                >
                                    <div
                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                        onClick={() => toggleTopic(index)}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${topic.active ? 'bg-primary border-primary' : 'bg-transparent border-border'
                                            }`}>
                                            {topic.active && <span className="text-[10px] text-white">✓</span>}
                                        </div>
                                        <span className={`text-sm font-semibold capitalize ${!topic.active && 'line-through opacity-50'}`}>
                                            {topic.name.replace(/-/g, ' ')}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => removeTopic(index)}
                                        className="p-1.5 text-foreground/20 hover:text-red-400 transition-colors"
                                        title="Remove topic"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            );
                        })}
                        {companies.length === 0 && (
                            <p className="col-span-full text-xs text-foreground/30 italic text-center py-4 bg-primary/5 rounded-xl border border-dashed border-border/50">
                                No companies tracked yet.
                            </p>
                        )}
                    </div>
                </div>

                {/* General Topics Section */}
                <div>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-secondary">
                            🏷️ Sector Topics
                        </h3>
                        <span className="text-[10px] font-bold text-foreground/20 px-3 py-1 glass rounded-full">{generalTopics.length} TRACKED</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {generalTopics.map((topic) => {
                            const index = topics.findIndex(t => t.name === topic.name);
                            return (
                                <div
                                    key={topic.name}
                                    className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${topic.active
                                        ? 'glass bg-secondary/10 border-secondary/20 text-foreground'
                                        : 'glass opacity-30 grayscale'
                                        }`}
                                >
                                    <div
                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                        onClick={() => toggleTopic(index)}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${topic.active ? 'bg-secondary border-secondary' : 'bg-transparent border-border'
                                            }`}>
                                            {topic.active && <span className="text-[10px] text-white">✓</span>}
                                        </div>
                                        <span className={`text-sm font-semibold capitalize ${!topic.active && 'line-through opacity-50'}`}>
                                            {topic.name.replace(/-/g, ' ')}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => removeTopic(index)}
                                        className="p-1.5 text-foreground/20 hover:text-red-400 transition-colors"
                                        title="Remove topic"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            );
                        })}
                        {generalTopics.length === 0 && (
                            <p className="col-span-full text-xs text-foreground/30 italic text-center py-4 bg-background border border-dashed border-border/50 rounded-xl">
                                No topics added yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Add New Topic */}
            <div className="pt-10 border-t border-white/5">
                <form onSubmit={addCustomTopic} className="space-y-6">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Add global target..."
                            className="flex-1 glass px-6 py-4 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none placeholder:text-foreground/20"
                        />
                        <button
                            type="submit"
                            className="btn btn-primary px-10 shadow-xl"
                            disabled={isSaving || !inputValue.trim()}
                        >
                            {isSaving ? 'Updating...' : 'Add Topic'}
                        </button>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group w-fit select-none">
                        <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${isCompany ? 'bg-primary border-primary shadow-lg shadow-primary/30' : 'border-white/10 group-hover:border-white/20'}`}>
                            <input
                                type="checkbox"
                                checked={isCompany}
                                onChange={(e) => setIsCompany(e.target.checked)}
                                className="hidden"
                            />
                            {isCompany && <span className="text-sm text-white">✓</span>}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/40 group-hover:text-foreground/80 transition-colors">
                            🏢 Global Strategic Entity
                        </span>
                    </label>
                </form>
            </div>

            {message && (
                <div className="mt-8 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-primary animate-fade-in">
                    {message}
                </div>
            )}
        </div>
    );
}
