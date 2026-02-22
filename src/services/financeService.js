const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const attributeService = require('./attributeService');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

async function getFinanceData() {
    const database = await getDb();
    const row = await database.get('SELECT * FROM finance WHERE id = 1');
    
    if (!row) {
        return {
            netWorth: '$0',
            emergencyFund: '$0',
            monthlySurplus: '$0',
            cashReserve: '$0',
            income: '$0',
            fixedCosts: '$0',
            burnRate: '$0',
            savingsRate: '0%',
            targets: {
                cashBuffer: 5000,
                emergencyFund: 10000,
                diningLimit: 400
            },
            lastUpdated: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]
        };
    }
    
    return {
        netWorth: row.net_worth,
        emergencyFund: row.emergency_fund,
        monthlySurplus: row.monthly_surplus,
        cashReserve: row.cash_reserve,
        income: row.income,
        fixedCosts: row.fixed_costs,
        burnRate: row.burn_rate,
        savingsRate: row.savings_rate,
        targets: {
            cashBuffer: row.target_cash_buffer,
            emergencyFund: row.target_emergency_fund,
            diningLimit: row.target_dining_limit
        },
        lastUpdated: row.last_updated
    };
}

async function updateFinanceData(data) {
    const database = await getDb();
    const localNow = new Date();
    const today = new Date(localNow.getTime() - (localNow.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    await database.run(`
        UPDATE finance SET
            net_worth = ?,
            emergency_fund = ?,
            monthly_surplus = ?,
            cash_reserve = ?,
            income = ?,
            fixed_costs = ?,
            burn_rate = ?,
            savings_rate = ?,
            target_cash_buffer = ?,
            target_emergency_fund = ?,
            target_dining_limit = ?,
            last_updated = ?
        WHERE id = 1
    `, [
        data.netWorth || data.net_worth,
        data.emergencyFund || data.emergency_fund,
        data.monthlySurplus || data.monthly_surplus,
        data.cashReserve || data.cash_reserve,
        data.income,
        data.fixedCosts || data.fixed_costs,
        data.burnRate || data.burn_rate,
        data.savingsRate || data.savings_rate,
        data.targets?.cashBuffer || data.target_cash_buffer || 5000,
        data.targets?.emergencyFund || data.target_emergency_fund || 10000,
        data.targets?.diningLimit || data.target_dining_limit || 400,
        today
    ]);
    
    // Award 10 DSC XP for financial maintenance
    await attributeService.addXP('DSC', 10);
    
    return { success: true };
}

module.exports = {
    getFinanceData,
    updateFinanceData
};
