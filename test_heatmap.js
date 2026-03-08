const { getHeatmapData } = require('./src/services/healthService');

async function test() {
    const data = await getHeatmapData();
    const todayData = data[data.length - 1]; // Actually it returns a week ending on Saturday.
    // Let's print all 7 days
    console.log(JSON.stringify(data, null, 2));
}
test();