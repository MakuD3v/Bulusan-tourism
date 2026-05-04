export const getDynamicTags = (item: any, allItems: any[]): string[] => {
    const tags: string[] = [];
    
    if (item.featured) tags.push('Featured');
    
    const added = new Date(item.dateAdded || 0).getTime();
    if (Date.now() - added <= 30 * 24 * 3600 * 1000) {
        tags.push('New');
    }

    const maxRating = allItems.length > 0 ? Math.max(...allItems.map(a => a.rating || 0)) : 0;
    if (item.rating >= 4.8 || (item.rating === maxRating && maxRating >= 4.5)) {
        tags.push('Top Rated');
    }

    const maxVisits = allItems.length > 0 ? Math.max(...allItems.map(a => a.visits || 0)) : 0;
    if (item.visits >= 50 || (item.visits === maxVisits && maxVisits > 0)) {
        tags.push('Trending');
    } else if (item.visits >= 30) {
        tags.push('Most Visited');
    }

    return tags;
};
