const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

module.exports = {
    DB_PATH: path.join(ROOT_DIR, 'data/life.db'),
    WEIGHT_LOG_PATH: path.join(ROOT_DIR, 'data/weight.md'),
    QUESTS_PATH: path.join(ROOT_DIR, 'data/quests.md'),
    FINANCE_PATH: path.join(ROOT_DIR, 'data/finance.json'),
    NUTRITION_LOG_PATH: path.join(ROOT_DIR, 'data/nutrition.csv'),
    HABITS_LOG_PATH: path.join(ROOT_DIR, 'data/habits.csv'),
    PORT: 3000
};
