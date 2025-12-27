/**
 * Borate Data Storage Layer
 * 
 * Manages persistent storage for borate test data, chemical additions,
 * purchases, and settings. Uses localStorage in browser, can be mocked for testing.
 * 
 * Data Schema:
 * - borate_tests: Array of {id, date, drops, dropsR0009, ppm, isCalibration}
 * - borate_additions: Array of {id, date, chemical, amount, unit, expectedIncrease, actualIncrease}
 * - borate_purchases: Array of {id, date, item, quantity, unit, price}
 * - borate_poolVolume: string (gallons)
 * - borate_reminderFreq: string (days)
 * - borate_lastTest: string (ISO date)
 */

const BorateStor = {
    // Storage keys
    KEYS: {
        TESTS: 'borate_tests',
        ADDITIONS: 'borate_additions',
        PURCHASES: 'borate_purchases',
        POOL_VOLUME: 'borate_poolVolume',
        REMINDER_FREQ: 'borate_reminderFreq',
        LAST_TEST: 'borate_lastTest'
    },

    // Allow injection of storage backend for testing
    _storage: typeof localStorage !== 'undefined' ? localStorage : null,

    setStorage(storage) {
        this._storage = storage;
    },

    getStorage() {
        if (!this._storage) {
            throw new Error('No storage backend available');
        }
        return this._storage;
    },

    // Tests
    getTests() {
        try {
            const data = this.getStorage().getItem(this.KEYS.TESTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading tests:', e);
            return [];
        }
    },

    getPoolTests() {
        return this.getTests().filter(t => !t.isCalibration);
    },

    saveTest(test) {
        const tests = this.getTests();
        const newTest = {
            id: Date.now(),
            date: new Date().toISOString(),
            drops: test.drops,
            dropsR0009: test.dropsR0009 || 0,
            ppm: test.ppm,
            isCalibration: test.isCalibration || false,
            notes: test.notes || ''
        };
        tests.unshift(newTest);
        this.getStorage().setItem(this.KEYS.TESTS, JSON.stringify(tests));
        this.getStorage().setItem(this.KEYS.LAST_TEST, newTest.date);
        return newTest;
    },

    deleteTest(id) {
        const tests = this.getTests();
        const filtered = tests.filter(t => t.id !== id);
        if (filtered.length === tests.length) return false;
        this.getStorage().setItem(this.KEYS.TESTS, JSON.stringify(filtered));
        return true;
    },

    getLatestTest() {
        const tests = this.getPoolTests();
        return tests.length > 0 ? tests[0] : null;
    },

    getLastTestDate() {
        return this.getStorage().getItem(this.KEYS.LAST_TEST) || null;
    },

    getDaysSinceLastTest() {
        const lastTest = this.getLastTestDate();
        if (!lastTest) return null;
        const days = (new Date() - new Date(lastTest)) / (1000 * 60 * 60 * 24);
        return Math.round(days);
    },

    // Chemical Additions
    getAdditions() {
        try {
            const data = this.getStorage().getItem(this.KEYS.ADDITIONS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading additions:', e);
            return [];
        }
    },

    saveAddition(addition) {
        const additions = this.getAdditions();
        const newAddition = {
            id: Date.now(),
            date: new Date().toISOString(),
            chemical: addition.chemical,
            amount: addition.amount,
            unit: addition.unit,
            expectedIncrease: addition.expectedIncrease || null,
            actualIncrease: addition.actualIncrease || null,
            notes: addition.notes || ''
        };
        additions.unshift(newAddition);
        this.getStorage().setItem(this.KEYS.ADDITIONS, JSON.stringify(additions));
        return newAddition;
    },

    updateAdditionResult(id, actualIncrease) {
        const additions = this.getAdditions();
        const addition = additions.find(a => a.id === id);
        if (!addition) return false;
        addition.actualIncrease = actualIncrease;
        addition.verifiedDate = new Date().toISOString();
        this.getStorage().setItem(this.KEYS.ADDITIONS, JSON.stringify(additions));
        return true;
    },

    deleteAddition(id) {
        const additions = this.getAdditions();
        const filtered = additions.filter(a => a.id !== id);
        if (filtered.length === additions.length) return false;
        this.getStorage().setItem(this.KEYS.ADDITIONS, JSON.stringify(filtered));
        return true;
    },

    // Purchases
    getPurchases() {
        try {
            const data = this.getStorage().getItem(this.KEYS.PURCHASES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading purchases:', e);
            return [];
        }
    },

    savePurchase(purchase) {
        const purchases = this.getPurchases();
        const newPurchase = {
            id: Date.now(),
            date: new Date().toISOString(),
            item: purchase.item,
            quantity: purchase.quantity,
            unit: purchase.unit,
            price: purchase.price,
            vendor: purchase.vendor || '',
            notes: purchase.notes || ''
        };
        purchases.unshift(newPurchase);
        this.getStorage().setItem(this.KEYS.PURCHASES, JSON.stringify(purchases));
        return newPurchase;
    },

    deletePurchase(id) {
        const purchases = this.getPurchases();
        const filtered = purchases.filter(p => p.id !== id);
        if (filtered.length === purchases.length) return false;
        this.getStorage().setItem(this.KEYS.PURCHASES, JSON.stringify(filtered));
        return true;
    },

    getTotalSpending(item = null) {
        const purchases = this.getPurchases();
        const filtered = item ? purchases.filter(p => p.item === item) : purchases;
        return filtered.reduce((sum, p) => sum + (p.price || 0), 0);
    },

    // Settings
    getPoolVolume() {
        return this.getStorage().getItem(this.KEYS.POOL_VOLUME) || '';
    },

    setPoolVolume(volume) {
        this.getStorage().setItem(this.KEYS.POOL_VOLUME, volume.toString());
    },

    getReminderFrequency() {
        return Number(this.getStorage().getItem(this.KEYS.REMINDER_FREQ) || '60');
    },

    setReminderFrequency(days) {
        this.getStorage().setItem(this.KEYS.REMINDER_FREQ, days.toString());
    },

    // Data Management
    exportData() {
        return {
            version: '2.0',
            exportDate: new Date().toISOString(),
            tests: this.getTests(),
            additions: this.getAdditions(),
            purchases: this.getPurchases(),
            settings: {
                poolVolume: this.getPoolVolume(),
                reminderFrequency: this.getReminderFrequency(),
                lastTest: this.getLastTestDate()
            }
        };
    },

    importData(data, merge = false) {
        if (!data || !data.version) {
            throw new Error('Invalid import data format');
        }
        const result = { tests: 0, additions: 0, purchases: 0 };

        if (data.tests) {
            if (merge) {
                const existing = this.getTests();
                const existingIds = new Set(existing.map(t => t.id));
                const newTests = data.tests.filter(t => !existingIds.has(t.id));
                const merged = [...newTests, ...existing];
                this.getStorage().setItem(this.KEYS.TESTS, JSON.stringify(merged));
                result.tests = newTests.length;
            } else {
                this.getStorage().setItem(this.KEYS.TESTS, JSON.stringify(data.tests));
                result.tests = data.tests.length;
            }
        }

        if (data.additions) {
            if (merge) {
                const existing = this.getAdditions();
                const existingIds = new Set(existing.map(a => a.id));
                const newAdditions = data.additions.filter(a => !existingIds.has(a.id));
                const merged = [...newAdditions, ...existing];
                this.getStorage().setItem(this.KEYS.ADDITIONS, JSON.stringify(merged));
                result.additions = newAdditions.length;
            } else {
                this.getStorage().setItem(this.KEYS.ADDITIONS, JSON.stringify(data.additions));
                result.additions = data.additions.length;
            }
        }

        if (data.purchases) {
            if (merge) {
                const existing = this.getPurchases();
                const existingIds = new Set(existing.map(p => p.id));
                const newPurchases = data.purchases.filter(p => !existingIds.has(p.id));
                const merged = [...newPurchases, ...existing];
                this.getStorage().setItem(this.KEYS.PURCHASES, JSON.stringify(merged));
                result.purchases = newPurchases.length;
            } else {
                this.getStorage().setItem(this.KEYS.PURCHASES, JSON.stringify(data.purchases));
                result.purchases = data.purchases.length;
            }
        }

        if (data.settings && !merge) {
            if (data.settings.poolVolume) this.setPoolVolume(data.settings.poolVolume);
            if (data.settings.reminderFrequency) this.setReminderFrequency(data.settings.reminderFrequency);
        }

        return result;
    },

    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            this.getStorage().removeItem(key);
        });
        return true;
    },

    getStats() {
        return {
            tests: this.getTests().length,
            poolTests: this.getPoolTests().length,
            additions: this.getAdditions().length,
            purchases: this.getPurchases().length,
            hasPoolVolume: !!this.getPoolVolume(),
            daysSinceLastTest: this.getDaysSinceLastTest()
        };
    }
};

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BorateStor;
}
