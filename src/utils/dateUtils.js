function isDateConsecutive(newerDate, olderDate) {
    const d1 = new Date(newerDate);
    const d2 = new Date(olderDate);
    const diffTime = d1 - d2;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays === 1;
}

module.exports = {
    isDateConsecutive
};
