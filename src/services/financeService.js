const fs = require('fs');
const path = require('path');
const { DB_PATH } = require('../config');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const attributeService = require('./attributeService');

const TRANSACTIONS_DIR = path.join(path.dirname(DB_PATH), 'transactions');
const NOTES_PATH = path.join(TRANSACTIONS_DIR, 'financial_notes.md');

let db;
async function getDb() {
    if (!db) {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    }
    return db;
}

async function getFinanceData() {
    const database = await getDb();
    const row = await database.get('SELECT * FROM finance ORDER BY last_updated DESC, id DESC LIMIT 1');
    
    let notes = '';
    if (fs.existsSync(NOTES_PATH)) {
        notes = fs.readFileSync(NOTES_PATH, 'utf8');
    }

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
            notes,
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
        netWorthChangePct: row.net_worth_change_pct,
        notes,
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
    
    // Always INSERT new row for history
    await database.run(`
        INSERT INTO finance (
            net_worth, emergency_fund, monthly_surplus, cash_reserve,
            income, fixed_costs, burn_rate, savings_rate, net_worth_change_pct,
            target_cash_buffer, target_emergency_fund, target_dining_limit,
            last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        data.netWorth || data.net_worth || '$0',
        data.emergencyFund || data.emergency_fund || '$0',
        data.monthlySurplus || data.monthly_surplus || '$0',
        data.cashReserve || data.cash_reserve || '$0',
        data.income || '$0',
        data.fixedCosts || data.fixed_costs || '$0',
        data.burnRate || data.burn_rate || '$0',
        data.savingsRate || data.savings_rate || '0%',
        data.netWorthChangePct || data.net_worth_change_pct || 0,
        data.targets?.cashBuffer || data.target_cash_buffer || 5000,
        data.targets?.emergencyFund || data.target_emergency_fund || 10000,
        data.targets?.diningLimit || data.target_dining_limit || 400,
        today
    ]);
    
    // Award 10 DSC XP for financial maintenance
    await attributeService.addXP('DSC', 10);
    
    return { success: true };
}

async function syncTransactions() {
    if (!fs.existsSync(TRANSACTIONS_DIR)) {
        fs.mkdirSync(TRANSACTIONS_DIR, { recursive: true });
        return { error: 'No transaction files found.' };
    }

    const files = fs.readdirSync(TRANSACTIONS_DIR)
        .filter(f => f.endsWith('.csv'))
        .map(f => ({ name: f, time: fs.statSync(path.join(TRANSACTIONS_DIR, f)).mtime.getTime() }))
        .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
        return { error: 'No transaction CSV files found in the vault.' };
    }

    const latestFile = path.join(TRANSACTIONS_DIR, files[0].name);
    const content = fs.readFileSync(latestFile, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    
    // Basic CSV Parsing (assuming columns like: Date, Description, Amount, Category, Account)
    // We'll calculate:
    // 1. Total Income (positive amounts in specific categories)
    // 2. Total Burn (negative amounts)
    // 3. Cash Reserve (Total balance from specific accounts if available, else sum of amounts)
    
    let totalIncome = 0;
    let totalBurn = 0;
    
    // Simple heuristic: Negative amounts are burn, Positive are income (excluding transfers)
    // This depends on the CSV format. Let's assume standard Monarch/Mint export.
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
    const amountIdx = headers.indexOf('amount');
    const categoryIdx = headers.indexOf('category');
    
    if (amountIdx === -1) return { error: 'CSV missing "Amount" column.' };

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(r => r.trim().replace(/"/g, ''));
        const amount = parseFloat(row[amountIdx]);
        const category = categoryIdx !== -1 ? row[categoryIdx].toLowerCase() : '';
        
        if (isNaN(amount)) continue;
        
        // Skip transfers to avoid double counting
        if (category.includes('transfer') || category.includes('credit card payment')) continue;

        if (amount > 0) {
            totalIncome += amount;
        } else {
            totalBurn += Math.abs(amount);
        }
    }

    const data = await getFinanceData();
    
    // Update data with new calculations (averages or latest month)
    // For now, let's just update the income and burn rate fields.
    const updatedData = {
        ...data,
        income: `$${totalIncome.toLocaleString()}`,
        burnRate: `$${totalBurn.toLocaleString()}`,
        savingsRate: totalIncome > 0 ? `${Math.round(((totalIncome - totalBurn) / totalIncome) * 100)}%` : '0%',
        monthlySurplus: `$${(totalIncome - totalBurn).toLocaleString()}`,
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    await updateFinanceData(updatedData);
    
    // Bonus XP for syncing!
    await attributeService.addXP('DSC', 10);

    return { success: true, file: files[0].name, data: updatedData };
}

module.exports = {
    getFinanceData,
    updateFinanceData,
    syncTransactions
};
