export const getDynamicTags = (item: any, allItems: any[]): string[] => {
    const tags: string[] = [];
    const now = Date.now();
    const THREE_WEEKS = 21 * 24 * 3600 * 1000;
    const ONE_WEEK = 7 * 24 * 3600 * 1000;

    if (item.featured) tags.push('Featured');

    // "New" label: only for the first 3 weeks after being added
    const added = new Date(item.dateAdded || 0).getTime();
    if (now - added <= THREE_WEEKS) {
        tags.push('New');
    }

    // "Top Rated" label: must have at least 10 reviews AND rating >= 4.5
    const reviewCount = Array.isArray(item.reviews) ? item.reviews.length : 0;
    if (reviewCount >= 10 && (item.rating || 0) >= 4.5) {
        tags.push('Top Rated');
    }

    // "Trending" label: must have 50+ visits AND the item was added/visited within the last 7 days
    // We use dateAdded as a weekly rolling window proxy — resets if item is older than 1 week
    const isTrendingWindow = now - added <= ONE_WEEK;
    if ((item.visits || 0) >= 50 && isTrendingWindow) {
        tags.push('Trending');
    }

    return tags;
};
