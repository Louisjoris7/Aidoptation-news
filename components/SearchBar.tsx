'use client';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
    return (
        <div className="relative group mb-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg
                    className="w-4 h-4 text-foreground/30 group-focus-within:text-primary transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Search articles, topics, sources..."
                className="w-full glass rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-foreground placeholder:text-foreground/25 outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all duration-300"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute inset-y-0 right-4 flex items-center text-foreground/30 hover:text-foreground/60 transition-colors"
                >
                    ✕
                </button>
            )}
        </div>
    );
}
