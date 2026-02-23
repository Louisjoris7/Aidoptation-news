import { compareTwoStrings } from 'string-similarity';
import { ParsedArticle, normalizeTitle } from './rss-fetcher';

const SIMILARITY_THRESHOLD = 0.75; // 75% similarity = duplicate

export interface ArticleWithId extends ParsedArticle {
    id?: string;
}

export interface DeduplicationResult {
    uniqueArticles: ArticleWithId[];
    duplicateGroups: Array<{
        canonicalArticle: ArticleWithId;
        duplicates: ArticleWithId[];
    }>;
    stats: {
        totalInput: number;
        uniqueOutput: number;
        duplicatesRemoved: number;
    };
}

/**
 * Check if two articles are duplicates based on title similarity
 */
function areDuplicates(article1: ParsedArticle, article2: ParsedArticle): boolean {
    const title1 = normalizeTitle(article1.title).toLowerCase();
    const title2 = normalizeTitle(article2.title).toLowerCase();

    const similarity = compareTwoStrings(title1, title2);
    return similarity >= SIMILARITY_THRESHOLD;
}

/**
 * Select the best article from a group of duplicates based on:
 * 1. Source priority (higher is better)
 * 2. Description availability (articles with descriptions are better)
 * 3. Most recent publication date
 */
function selectBestArticle(articles: ParsedArticle[]): ParsedArticle {
    return articles.reduce((best, current) => {
        // Priority is most important
        if (current.priority > best.priority) return current;
        if (current.priority < best.priority) return best;

        // If priority is equal, prefer articles with descriptions
        if (current.description && !best.description) return current;
        if (!current.description && best.description) return best;

        // If both have/don't have descriptions, prefer more recent
        if (current.publishedAt > best.publishedAt) return current;
        return best;
    });
}

/**
 * Deduplicate articles using similarity matching
 */
export function deduplicateArticles(articles: ParsedArticle[]): DeduplicationResult {
    const totalInput = articles.length;
    const processed: boolean[] = new Array(articles.length).fill(false);
    const uniqueArticles: ArticleWithId[] = [];
    const duplicateGroups: Array<{
        canonicalArticle: ArticleWithId;
        duplicates: ArticleWithId[];
    }> = [];

    for (let i = 0; i < articles.length; i++) {
        if (processed[i]) continue;

        const duplicates: ParsedArticle[] = [articles[i]];
        processed[i] = true;

        // Find all duplicates of this article
        for (let j = i + 1; j < articles.length; j++) {
            if (processed[j]) continue;

            if (areDuplicates(articles[i], articles[j])) {
                duplicates.push(articles[j]);
                processed[j] = true;
            }
        }

        // Select the best version
        const bestArticle = selectBestArticle(duplicates);

        // Track duplicates if any were found
        if (duplicates.length > 1) {
            const otherVersions = duplicates.filter(a => a !== bestArticle);
            duplicateGroups.push({
                canonicalArticle: bestArticle,
                duplicates: otherVersions,
            });
        }

        uniqueArticles.push(bestArticle);
    }

    return {
        uniqueArticles,
        duplicateGroups,
        stats: {
            totalInput,
            uniqueOutput: uniqueArticles.length,
            duplicatesRemoved: totalInput - uniqueArticles.length,
        },
    };
}

/**
 * Group articles by similarity and return only unique ones
 */
export function getUniqueArticles(articles: ParsedArticle[]): ParsedArticle[] {
    const result = deduplicateArticles(articles);
    return result.uniqueArticles;
}
