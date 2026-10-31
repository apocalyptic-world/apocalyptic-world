/*
 * Library: its size (books already read + unread books on the shelves) and the librarian job.
 * With a librarian at work, every night anyone who makes skill progress (garden, kitchen, forest,
 * scavenging, evening class) has a chance of +1 extra progress: +1% per 2 books, up to 25%.
 */
setup.library = {
    BOOKS_PER_PERCENT: 2,
    MAX_PERCENT: 25,

    isBuilt: function () {
        return !!(variables().game?.location?.library ?? false);
    },

    size: function () {
        return (variables().player?.stats?.books_read ?? 0) + setup.cabinInventory.count('book');
    },

    /** The guest working as librarian tonight (not sick, not resting), or null */
    librarian: function () {
        return (variables().guests ?? []).find(function (g) {
            return g.assignedTo === 'librarian' && typeof g.sick === 'undefined' && typeof g.rest === 'undefined';
        }) ?? null;
    },

    bonusPercent: function () {
        if (!this.isBuilt() || !this.librarian()) {
            return 0;
        }
        return Math.min(this.MAX_PERCENT, Math.floor(this.size() / this.BOOKS_PER_PERCENT));
    },

    /** Extra skill progress (0 or 1) for one night of learning */
    learnBonus: function () {
        const pct = this.bonusPercent();
        return pct > 0 && setup.percentageChance(pct) ? 1 : 0;
    }
};
