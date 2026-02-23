// RSS Feed Sources for Autonomous Driving & Supplier News

export interface RSSSource {
    name: string;
    url: string;
    priority: number; // Higher = better source for deduplication
    defaultTopics: string[];
    isDynamic?: boolean; // If true, URL contains {query} placeholder
}

export const RSS_SOURCES: RSSSource[] = [
    // 🏢 Official Company Blogs (High Priority)
    {
        name: "Waymo Blog",
        url: "https://waymo.com/blog/rss.xml",
        priority: 10,
        defaultTopics: ["waymo", "autonomous-driving"],
    },
    {
        name: "Cruise Generator", // Unofficial, but reliable
        url: "https://medium.com/feed/cruise",
        priority: 9,
        defaultTopics: ["cruise", "autonomous-driving"],
    },
    {
        name: "NVIDIA Blog (Auto)",
        url: "https://blogs.nvidia.com/blog/category/auto/feed/",
        priority: 9,
        defaultTopics: ["nvidia", "autonomous-driving", "ai"],
    },
    {
        name: "Mobileye News",
        url: "https://news.mobileye.com/news-releases?format=rss",
        priority: 9,
        defaultTopics: ["mobileye", "autonomous-driving", "adas"],
    },

    // 📰 Major Tech News (Medium Priority)
    {
        name: "TechCrunch",
        url: "https://techcrunch.com/tag/autonomous-vehicles/feed/",
        priority: 8,
        defaultTopics: ["autonomous-driving", "tech", "startups"],
    },
    {
        name: "The Verge",
        url: "https://www.theverge.com/rss/transportation/index.xml",
        priority: 8,
        defaultTopics: ["autonomous-driving", "transportation", "tech"],
    },
    {
        name: "Electrek",
        url: "https://electrek.co/feed/",
        priority: 7,
        defaultTopics: ["electric-vehicles", "autonomous-driving", "tesla"],
    },
    {
        name: "Ars Technica",
        url: "https://feeds.arstechnica.com/arstechnica/cars",
        priority: 7,
        defaultTopics: ["autonomous-driving", "tech", "automotive"],
    },
    {
        name: "Reuters Technology",
        url: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
        priority: 8,
        defaultTopics: ["tech", "business", "autonomous-driving"],
    },

    // 🏭 Industry & Suppliers
    {
        name: "Automotive News",
        url: "https://www.autonews.com/rss/homepage",
        priority: 6,
        defaultTopics: ["automotive", "suppliers", "industry"],
    },

    // 🔍 Dynamic Fallback (Google News)
    {
        name: "Google News",
        url: "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en",
        priority: 5,
        defaultTopics: [],
        isDynamic: true,
    },
];

// Curated source names for the general feed
export const CURATED_SOURCE_NAMES = RSS_SOURCES
    .filter(s => !s.isDynamic)
    .map(s => s.name);

// Core topics for the general feed
export const CORE_TOPICS = [
    "autonomous-driving",
    "electric-vehicles",
    "waymo",
    "suppliers",
    "tech",
    "automotive",
    "industry",
    "transportation",
    "cruise",
    "nvidia",
    "mobileye",
    "adas"
];

// Topic keywords for classification
export const TOPIC_KEYWORDS: Record<string, string[]> = {
    "autonomous-driving": ["autonomous", "self-driving", "driverless", "waymo", "cruise", "robotaxi", "adas"],
    "tesla": ["tesla", "elon musk", "model 3", "model y", "cybertruck", "fsd"],
    "electric-vehicles": ["electric vehicle", "battery", "charging station", "bev", "evs"], // Removed generic "ev" to avoid false positives
    "waymo": ["waymo", "alphabet", "google car"],
    "suppliers": ["supplier", "bosch", "continental", "denso", "tier 1", "tier 2"],
    "tech": ["technology", "software", "ai", "artificial intelligence", "machine learning"],
    "automotive": ["automotive", "car", "vehicle", "oem"],
};
