/**
 * Tests for Borate Calculations Module
 * 
 * Run with: npm test
 */

const BorateCaclulations = require('../src/borate-calculations');

describe('BorateCaclulations', () => {
    
    // ==================== dropsToPpm ====================
    describe('dropsToPpm', () => {
        test('converts drops to PPM correctly (drops × 4)', () => {
            expect(BorateCaclulations.dropsToPpm(0)).toBe(0);
            expect(BorateCaclulations.dropsToPpm(5)).toBe(20);
            expect(BorateCaclulations.dropsToPpm(10)).toBe(40);
            expect(BorateCaclulations.dropsToPpm(12.5)).toBe(50);
        });

        test('handles typical test results', () => {
            expect(BorateCaclulations.dropsToPpm(7)).toBe(28);
            expect(BorateCaclulations.dropsToPpm(8)).toBe(32);
            expect(BorateCaclulations.dropsToPpm(12)).toBe(48);
        });

        test('throws error for negative drops', () => {
            expect(() => BorateCaclulations.dropsToPpm(-1)).toThrow('Drops must be a non-negative number');
        });

        test('throws error for non-numeric input', () => {
            expect(() => BorateCaclulations.dropsToPpm('five')).toThrow('Drops must be a non-negative number');
            expect(() => BorateCaclulations.dropsToPpm(null)).toThrow('Drops must be a non-negative number');
            expect(() => BorateCaclulations.dropsToPpm(undefined)).toThrow('Drops must be a non-negative number');
        });
    });

    // ==================== ppmToDrops ====================
    describe('ppmToDrops', () => {
        test('converts PPM to expected drops correctly', () => {
            expect(BorateCaclulations.ppmToDrops(0)).toBe(0);
            expect(BorateCaclulations.ppmToDrops(20)).toBe(5);
            expect(BorateCaclulations.ppmToDrops(40)).toBe(10);
            expect(BorateCaclulations.ppmToDrops(50)).toBe(12.5);
        });

        test('is inverse of dropsToPpm', () => {
            const drops = 8;
            const ppm = BorateCaclulations.dropsToPpm(drops);
            expect(BorateCaclulations.ppmToDrops(ppm)).toBe(drops);
        });

        test('throws error for negative PPM', () => {
            expect(() => BorateCaclulations.ppmToDrops(-10)).toThrow('PPM must be a non-negative number');
        });
    });

    // ==================== checkLevel ====================
    describe('checkLevel', () => {
        test('identifies zero/no borates', () => {
            const result = BorateCaclulations.checkLevel(0);
            expect(result.inRange).toBe(false);
            expect(result.status).toBe('none');
        });

        test('identifies low borate levels', () => {
            const result = BorateCaclulations.checkLevel(20);
            expect(result.inRange).toBe(false);
            expect(result.status).toBe('low');
            expect(result.message).toContain('Low');
        });

        test('identifies optimal borate levels', () => {
            expect(BorateCaclulations.checkLevel(30).inRange).toBe(true);
            expect(BorateCaclulations.checkLevel(30).status).toBe('optimal');
            expect(BorateCaclulations.checkLevel(40).inRange).toBe(true);
            expect(BorateCaclulations.checkLevel(50).inRange).toBe(true);
        });

        test('identifies high borate levels', () => {
            const result = BorateCaclulations.checkLevel(60);
            expect(result.inRange).toBe(false);
            expect(result.status).toBe('high');
            expect(result.message).toContain('EPA maximum');
        });

        test('boundary values are correct', () => {
            expect(BorateCaclulations.checkLevel(29).status).toBe('low');
            expect(BorateCaclulations.checkLevel(30).status).toBe('optimal');
            expect(BorateCaclulations.checkLevel(50).status).toBe('optimal');
            expect(BorateCaclulations.checkLevel(51).status).toBe('high');
        });
    });

    // ==================== calculateBoraxDosage ====================
    describe('calculateBoraxDosage', () => {
        const poolGallons = 36000;

        test('calculates correct borax amount for 36,000 gallon pool', () => {
            const result = BorateCaclulations.calculateBoraxDosage(0, 50, poolGallons);
            expect(result).not.toBeNull();
            expect(result.ppmIncrease).toBe(50);
            expect(result.boraxOz).toBeCloseTo(2124, 0);
            expect(result.boraxLbs).toBeCloseTo(132.8, 0);
        });

        test('calculates acid needed (half of borax oz)', () => {
            const result = BorateCaclulations.calculateBoraxDosage(0, 50, poolGallons);
            expect(result.acidOz).toBeCloseTo(result.boraxOz / 2, 0);
        });

        test('calculates correct box count', () => {
            const result = BorateCaclulations.calculateBoraxDosage(0, 50, poolGallons);
            expect(result.boxesNeeded).toBe(28);
        });

        test('returns null when no increase needed', () => {
            expect(BorateCaclulations.calculateBoraxDosage(50, 50, poolGallons)).toBeNull();
            expect(BorateCaclulations.calculateBoraxDosage(50, 40, poolGallons)).toBeNull();
        });

        test('calculates partial increases correctly', () => {
            const result = BorateCaclulations.calculateBoraxDosage(30, 50, poolGallons);
            expect(result.ppmIncrease).toBe(20);
        });

        test('throws error for invalid pool volume', () => {
            expect(() => BorateCaclulations.calculateBoraxDosage(0, 50, 0)).toThrow();
            expect(() => BorateCaclulations.calculateBoraxDosage(0, 50, -1000)).toThrow();
        });

        test('throws error for target above EPA maximum', () => {
            expect(() => BorateCaclulations.calculateBoraxDosage(0, 60, poolGallons)).toThrow('EPA maximum');
        });
    });

    // ==================== calculateBoricAcidDosage ====================
    describe('calculateBoricAcidDosage', () => {
        const poolGallons = 36000;

        test('calculates correct boric acid amount', () => {
            const result = BorateCaclulations.calculateBoricAcidDosage(0, 50, poolGallons);
            expect(result).not.toBeNull();
            expect(result.ppmIncrease).toBe(50);
            expect(result.boricAcidOz).toBeCloseTo(1368, 0);
            expect(result.boricAcidLbs).toBeCloseTo(85.5, 0);
        });

        test('indicates no acid is needed', () => {
            const result = BorateCaclulations.calculateBoricAcidDosage(0, 50, poolGallons);
            expect(result.acidNeeded).toBe(false);
        });

        test('requires less product than borax option', () => {
            const borax = BorateCaclulations.calculateBoraxDosage(0, 50, poolGallons);
            const boricAcid = BorateCaclulations.calculateBoricAcidDosage(0, 50, poolGallons);
            expect(boricAcid.boricAcidLbs).toBeLessThan(borax.boraxLbs);
        });
    });

    // ==================== checkBoraxPrerequisites ====================
    describe('checkBoraxPrerequisites', () => {
        test('approves when all parameters are good', () => {
            const result = BorateCaclulations.checkBoraxPrerequisites(7.2, 100, 300);
            expect(result.isReady).toBe(true);
            expect(result.issues).toHaveLength(0);
        });

        test('flags high pH', () => {
            const result = BorateCaclulations.checkBoraxPrerequisites(7.6, 100, 300);
            expect(result.isReady).toBe(false);
        });

        test('flags high total alkalinity', () => {
            const result = BorateCaclulations.checkBoraxPrerequisites(7.2, 150, 300);
            expect(result.isReady).toBe(false);
        });

        test('flags high calcium hardness', () => {
            const result = BorateCaclulations.checkBoraxPrerequisites(7.2, 100, 400);
            expect(result.isReady).toBe(false);
        });

        test('reports multiple issues', () => {
            const result = BorateCaclulations.checkBoraxPrerequisites(7.8, 160, 400);
            expect(result.isReady).toBe(false);
            expect(result.issues).toHaveLength(3);
        });
    });

    // ==================== calculateDepletionRate ====================
    describe('calculateDepletionRate', () => {
        test('returns no data for insufficient tests', () => {
            expect(BorateCaclulations.calculateDepletionRate([]).hasData).toBe(false);
            expect(BorateCaclulations.calculateDepletionRate([{date: '2024-01-01', ppm: 50}]).hasData).toBe(false);
        });

        test('calculates decreasing rate correctly', () => {
            const tests = [
                { date: '2024-01-01', ppm: 50 },
                { date: '2024-02-01', ppm: 45 }
            ];
            const result = BorateCaclulations.calculateDepletionRate(tests);
            expect(result.hasData).toBe(true);
            expect(result.trend).toBe('decreasing');
        });

        test('identifies stable levels', () => {
            const tests = [
                { date: '2024-01-01', ppm: 50 },
                { date: '2024-02-01', ppm: 50 }
            ];
            const result = BorateCaclulations.calculateDepletionRate(tests);
            expect(result.trend).toBe('stable');
        });
    });

    // ==================== estimateDaysUntilAddition ====================
    describe('estimateDaysUntilAddition', () => {
        test('returns not needed when level is increasing', () => {
            const result = BorateCaclulations.estimateDaysUntilAddition(40, 1, 30);
            expect(result.needed).toBe(false);
        });

        test('returns needed now when below minimum', () => {
            const result = BorateCaclulations.estimateDaysUntilAddition(25, -2, 30);
            expect(result.needed).toBe(true);
            expect(result.daysUntil).toBe(0);
        });

        test('calculates days correctly', () => {
            const result = BorateCaclulations.estimateDaysUntilAddition(45, -5, 30);
            expect(result.needed).toBe(true);
            expect(result.daysUntil).toBe(90);
        });
    });

    // ==================== compareCosts ====================
    describe('compareCosts', () => {
        const poolGallons = 36000;

        test('calculates costs for both options', () => {
            const result = BorateCaclulations.compareCosts(50, poolGallons);
            expect(result).not.toBeNull();
            expect(result.borax.totalCost).toBeGreaterThan(0);
            expect(result.boricAcid.totalCost).toBeGreaterThan(0);
        });

        test('boric acid includes no acid cost', () => {
            const result = BorateCaclulations.compareCosts(50, poolGallons);
            expect(result.boricAcid.acidCost).toBe(0);
        });

        test('borax includes acid cost', () => {
            const result = BorateCaclulations.compareCosts(50, poolGallons);
            expect(result.borax.acidCost).toBeGreaterThan(0);
        });
    });

    // ==================== Constants ====================
    describe('Constants', () => {
        test('has correct EPA maximum', () => {
            expect(BorateCaclulations.MAX_BORATE_PPM).toBe(50);
        });

        test('has correct minimum recommended level', () => {
            expect(BorateCaclulations.MIN_BORATE_PPM).toBe(30);
        });
    });
});
