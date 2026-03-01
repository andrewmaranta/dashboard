function isDateConsecutive(newerDate, olderDate) {
    const diffDays = getDateDiff(newerDate, olderDate);
    return diffDays === 1;
}

function getDateDiff(newerDate, olderDate) {
    const d1 = new Date(newerDate);
    const d2 = new Date(olderDate);
    const diffTime = d1 - d2;
    return diffTime / (1000 * 60 * 60 * 24);
}

module.exports = {
    isDateConsecutive,
    getDateDiff
};
