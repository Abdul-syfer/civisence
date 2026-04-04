// trendingScore = confirmCount + recentActivityWeight
module.exports = function calculateTrendingScore(issue) {
    const now = Date.now();
    const recentActivityWeight = Math.max(0, 10 - Math.floor((now - issue.reportedAt) / (1000 * 60 * 60 * 24))); // 10 points for today, decays daily
    return (issue.confirmCount || 0) + recentActivityWeight;
};
