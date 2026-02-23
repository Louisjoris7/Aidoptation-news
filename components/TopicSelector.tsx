'use client';

import { useState, useMemo } from 'react';
import { ManagedTopic, normalizeTopic } from '@/lib/topics';

interface TopicSelectorProps {
    selectedTopics: (string | ManagedTopic)[];
    onTopicsChange: (topics: (string | ManagedTopic)[]) => void;
}

const DEFAULT_TOPICS: ManagedTopic[] = [
    { name: 'autonomous-driving', active: true, isCompany: false },
    { name: 'tesla', active: true, isCompany: true },
    { name: 'waymo', active: true, isCompany: true },
    { name: 'electric-vehicles', active: true, isCompany: false },
    { name: 'suppliers', active: true, isCompany: false },
    { name: 'tech', active: true, isCompany: false },
    { name: 'automotive', active: true, isCompany: false },
];

export default function TopicSelector({ selectedTopics, onTopicsChange }: TopicSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isCompany, setIsCompany] = useState(false);

    // Normalize selectedTopics into ManagedTopic objects
    const managedTopics = useMemo(() => {
        return selectedTopics.map(t => normalizeTopic(t));
    }, [selectedTopics]);

    const activeNames = new Set(managedTopics.map(t => t.name));

    const toggleTopic = (topic: ManagedTopic) => {
        if (activeNames.has(topic.name)) {
            onTopicsChange(managedTopics.filter(t => t.name !== topic.name));
        } else {
            onTopicsChange([...managedTopics, { ...topic, active: true }]);
        }
    };

    const addCustomTopic = (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmed = inputValue.trim();
        if (trimmed) {
            const normalized = normalizeTopic({ name: trimmed, active: true, isCompany });
            if (!activeNames.has(normalized.name)) {
                onTopicsChange([...managedTopics, normalized]);
                setInputValue('');
                setIsCompany(false);
            }
        }
    };

    const companies = managedTopics.filter(t => t.isCompany);
    const generalTopics = managedTopics.filter(t => !t.isCompany);

    const availablePresets = DEFAULT_TOPICS.filter(p => !activeNames.has(p.name));

    return (
        <div className="mb-12">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`btn ${isOpen ? 'btn-secondary shadow-inner' : 'btn-primary'} mb-8 shadow-xl relative z-10`}
            >
                {isOpen ? '✕ Close Settings' : '🪄 Customize Intelligence Feed'}
            </button>

            {isOpen && (
                <div className="card glass animate-reveal p-8 md:p-12 mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                        <span className="text-[12rem]">🪄</span>
                    </div>

                    <h3 className="text-3xl font-black mb-10 tracking-tighter">
                        Feed <span className="gradient-text">Personalization</span>
                    </h3>

                    <div className="space-y-10">
                        {/* Companies Section */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                🏢 Companies I Follow
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {companies.map((topic) => (
                                    <button
                                        key={topic.name}
                                        onClick={() => toggleTopic(topic)}
                                        className="btn glass glass-hover text-primary py-2 px-5 text-sm ring-1 ring-primary/20 hover:ring-primary/40"
                                    >
                                        <span className="capitalize">{topic.name.replace(/-/g, ' ')}</span>
                                        <span className="ml-3 text-[10px] opacity-40">✕</span>
                                    </button>
                                ))}
                                {companies.length === 0 && <p className="text-sm text-foreground/40 italic">No companies selected.</p>}
                            </div>
                        </div>

                        {/* Topics Section */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                                🏷️ Topics I Follow
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {generalTopics.map((topic) => (
                                    <button
                                        key={topic.name}
                                        onClick={() => toggleTopic(topic)}
                                        className="btn glass glass-hover text-foreground/70 py-2 px-5 text-sm ring-1 ring-white/10 hover:ring-white/20"
                                    >
                                        <span className="capitalize">{topic.name.replace(/-/g, ' ')}</span>
                                        <span className="ml-3 text-[10px] opacity-40">✕</span>
                                    </button>
                                ))}
                                {generalTopics.length === 0 && <p className="text-sm text-foreground/40 italic">No topics selected.</p>}
                            </div>
                        </div>

                        {/* Presets (Quick Add) */}
                        {availablePresets.length > 0 && (
                            <div className="pt-6 border-t border-border/50">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-4">
                                    Suggested Recommendations
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {availablePresets.map((preset) => (
                                        <button
                                            key={preset.name}
                                            onClick={() => toggleTopic(preset)}
                                            className="btn btn-secondary py-1.5 px-4 text-xs font-bold uppercase tracking-wider scale-90 opacity-60 hover:opacity-100 hover:scale-100"
                                        >
                                            + {preset.name.replace(/-/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Custom */}
                        <div className="pt-8 border-t border-border/50">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/40 mb-4">
                                Add Custom Interest
                            </h4>
                            <form onSubmit={addCustomTopic} className="space-y-4">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="e.g. Robotaxi, Lidar, Rivian..."
                                        className="flex-1 glass px-6 py-3 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim()}
                                        className="btn btn-primary px-8"
                                    >
                                        Add
                                    </button>
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer group w-fit select-none">
                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isCompany ? 'bg-primary border-primary' : 'border-white/10 group-hover:border-white/20'}`}>
                                        <input
                                            type="checkbox"
                                            checked={isCompany}
                                            onChange={(e) => setIsCompany(e.target.checked)}
                                            className="hidden"
                                        />
                                        {isCompany && <span className="text-xs text-white">✓</span>}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-foreground/40 group-hover:text-foreground/80 transition-colors">
                                        🏢 Mark as Company
                                    </span>
                                </label>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
