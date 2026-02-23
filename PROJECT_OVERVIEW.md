# Aidoptation News - Project Overview

## 🎯 Goal

Create a personalized news aggregation platform for Louis and colleagues to stay updated on autonomous driving and supplier news. The platform will:

- Aggregate free news articles from reliable RSS sources
- Deduplicate articles to show each story only once (from the best source)
- Provide a general news page for all team members
- Offer personalized pages for each colleague with customizable topic preferences
- Update automatically every 6 hours with the latest news
- Be accessible via open link (no authentication required)

---

## 🛠️ Tech Stack

### Frontend & Framework
- **Next.js 14** (App Router) - React framework with server-side rendering
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework (dark mode)

### Database
- **SQLite** - Lightweight, file-based database
- **Prisma ORM** - Type-safe database client and migrations

### News Aggregation
- **RSS Parser** (rss-parser npm package) - Parse RSS feeds from news sources
- **String Similarity** (string-similarity npm package) - Deduplicate articles

### Background Jobs
- **Vercel Cron Jobs** - Scheduled tasks to fetch news every 6 hours

### Deployment
- **Vercel** - Free hosting platform with automatic deployments
- **Domain**: `aidoptation-news.vercel.app` (free subdomain)

---

## 📁 Project Structure

```
aidoptation-news/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage (general news feed)
│   ├── layout.tsx                # Root layout (dark mode theme)
│   ├── globals.css               # Global styles + Tailwind
│   ├── admin/                    # Admin page for managing team
│   │   └── page.tsx              # Add/remove team members
│   ├── [colleague]/              # Dynamic routes for colleagues
│   │   └── page.tsx              # Personal news page
│   └── api/                      # API routes
│       ├── news/
│       │   └── route.ts          # Fetch news from database
│       ├── preferences/
│       │   └── route.ts          # Save/update colleague preferences
│       ├── team/
│       │   └── route.ts          # Add/remove team members
│       └── cron/
│           └── fetch-news/
│               └── route.ts      # Cron job to fetch RSS feeds
│
├── lib/                          # Utility functions
│   ├── prisma.ts                 # Prisma client singleton
│   ├── rss-fetcher.ts            # RSS feed parsing logic
│   ├── deduplicator.ts           # Article deduplication algorithm
│   └── sources.ts                # RSS feed URLs configuration
│
├── components/                   # React components
│   ├── ArticleCard.tsx           # Article display component
│   ├── NewsFeed.tsx              # News feed list component
│   ├── TopicSelector.tsx         # Topic/company selection UI
│   ├── TeamManager.tsx           # Add/remove team members UI
│   └── Header.tsx                # Navigation header
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
│
├── public/                       # Static assets
│   └── icons/                    # Icons and images
│
├── vercel.json                   # Vercel configuration (cron jobs)
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── next.config.js                # Next.js configuration
└── .env                          # Environment variables
```

---

## 🗄️ Database Schema

### Tables

**articles**
- `id` - Unique identifier
- `title` - Article title
- `url` - Article link
- `source` - Publisher name (e.g., "TechCrunch")
- `publishedAt` - Publication date
- `description` - Article summary
- `topics` - Array of topics (e.g., ["autonomous-driving", "tesla"])
- `createdAt` - When fetched

**colleagues**
- `id` - Unique identifier
- `name` - Colleague name (e.g., "louis", "giovanni")
- `topics` - JSON array of tracked topics/companies

**article_groups** (for deduplication)
- `id` - Unique identifier
- `canonicalArticleId` - ID of the "best" article to show
- `duplicateArticleIds` - JSON array of similar article IDs
- `createdAt` - When grouped

---

## 📰 RSS News Sources (Initial)

### Autonomous Driving & Tech
1. **TechCrunch** - Autonomous vehicles tag
2. **The Verge** - Transportation section
3. **Electrek** - EV and self-driving news
4. **Reuters Technology** - Tech news feed
5. **Ars Technica** - Automotive technology
6. **Google News RSS** - Custom autonomous driving feed

### Suppliers & Industry
7. **Automotive News** - Industry updates
8. **Supply Chain Dive** - Supplier news

*More sources can be easily added in `lib/sources.ts`*

---

## 🔄 Architecture Flow

### 1. Background News Fetching (Every 6 Hours)
```
Vercel Cron → /api/cron/fetch-news
              ↓
          RSS Fetcher (lib/rss-fetcher.ts)
              ↓
          Fetch from 6-8 RSS feeds
              ↓
          Deduplicator (lib/deduplicator.ts)
              ↓
          Store unique articles in SQLite
```

### 2. User Visits Homepage
```
User → / (app/page.tsx)
       ↓
   Fetch latest 100 articles from DB
       ↓
   Filter by default topics (autonomous driving)
       ↓
   Display in NewsFeed component
```

### 3. User Visits Personal Page
```
User → /louis (app/[colleague]/page.tsx)
       ↓
   Fetch colleague's saved topics
       ↓
   Filter articles by those topics
       ↓
   Display personalized feed
       ↓
   Allow topic editing via TopicSelector
```

---

## 👥 Team Members (Personal Pages)

**Initial Team Members** (can be managed via `/admin` page):
- `/louis` - Louis
- `/giovanni` - Giovanni
- `/raffaele` - Raffaele
- `/rodrigo` - Rodrigo
- `/adam` - Adam
- `/lotte` - Lotte
- `/andrea` - Andrea

**Adding Team Members**:
- Visit `/admin` to add or remove team members
- Each new member gets a personal page at `/{name}`
- No limit on team size in the free tier!

---

## ✨ Key Features

### Phase 1 (MVP)
- ✅ General news page with latest articles
- ✅ Personal pages for colleagues
- ✅ **Team member management** - Add/remove team members dynamically
- ✅ RSS feed aggregation (6-8 sources)
- ✅ Basic deduplication (title similarity)
- ✅ Dark mode UI
- ✅ Automatic 6-hour updates

### Phase 2 (Future Enhancements)
- 📌 Search functionality
- 📌 Date range filtering
- 📌 Email digest (daily/weekly)
- 📌 Article bookmarking
- 📌 More RSS sources
- 📌 Advanced deduplication (content similarity)

---

## 🎨 Design Aesthetic

- **Theme**: Dark mode by default
- **Style**: Modern, clean, minimalist
- **Typography**: Google Fonts (Inter or Outfit)
- **Colors**: Sleek gradients, vibrant accent colors
- **Layout**: Card-based article grid, responsive design
- **Animations**: Subtle hover effects, smooth transitions

---

## 💰 Cost Breakdown

| Component | Provider | Cost |
|-----------|----------|------|
| Hosting | Vercel (Free tier) | **$0/month** |
| Database | SQLite (file-based) | **$0/month** |
| Domain | Vercel subdomain | **$0/month** |
| RSS Feeds | Free public feeds | **$0/month** |
| Cron Jobs | Vercel (2 free jobs) | **$0/month** |
| **TOTAL** | | **$0/month** |

---

## 🚀 Deployment Plan

1. **Development**: Build locally with hot-reload
2. **Testing**: Test RSS fetching and deduplication
3. **Deploy**: Push to GitHub → Auto-deploy to Vercel
4. **Verify**: Check cron jobs are running
5. **Share**: Send `aidoptation-news.vercel.app` link to team

---

## 📝 Next Steps

1. Initialize Next.js project with TypeScript
2. Set up Tailwind CSS and dark mode theme
3. Create database schema with Prisma
4. Build RSS fetcher and deduplication logic
5. Create UI components and pages
6. Configure Vercel cron jobs
7. Deploy and test

**Estimated build time**: 4-5 days
