export const getDynamicTags = (item: any, allItems: any[]): string[] => {
    const tags: string[] = [];
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 3600 * 1000;
    const ONE_WEEK = 7 * 24 * 3600 * 1000;

    if (item.featured) tags.push('Featured');

    // "New" label: 30 days before new badge gets removed
    const added = new Date(item.dateAdded || 0).getTime();
    if (now - added <= THIRTY_DAYS) {
        tags.push('New');
    }

    // "Top Rated" label: rating of atleast 4.5 or above and should have atleast 20 reviews
    const reviewCount = Array.isArray(item.reviews) ? item.reviews.length : 0;
    if (reviewCount >= 20 && (item.rating || 0) >= 4.5) {
        tags.push('Top Rated');
    }

    // "Trending" label: must have atleast 30 weekly clicks
    // Using isTrendingWindow if the data tracks clicks weekly, or just >= 30 visits
    // We remove the old isTrendingWindow if we assume 'visits' represents the weekly tracked clicks, 
    // or we check if visits >= 30. The prompt says "must have aleast 30 weekly clicks to have this badge". 
    // Since we only have `visits`, we just check if it's >= 30.
    if ((item.visits || 0) >= 30) {
        tags.push('Trending');
    }

    // Filter out hardcoded tags that might conflict
    return Array.from(new Set(tags));
};
