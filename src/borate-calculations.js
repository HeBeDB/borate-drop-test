/**
 * Borate Pool Chemistry Calculations
 * 
 * Core calculation functions for borate testing and chemical dosing.
 * These functions are pure (no side effects) for easy testing.
 * 
 * Key formulas:
 * - Borate PPM = drops × 4 (from Taylor K-2006 drop test)
 * - Borax: 118 oz per 10,000 gallons = 10 ppm increase
 * - Boric Acid: 76 oz per 10,000 gallons = 10 ppm increase
 */

const BorateCaclulations = {
    // Constants
    BORAX_OZ_PER_10K_GAL_PER_10PPM: 118,
    BORIC_ACID_OZ_PER_10K_GAL_PER_10PPM: 76,
    BORAX_OZ_PER_BOX: 76,
    OZ_PER_LB: 16,
    OZ_PER_GALLON: 128,
    
    // Recommended ranges
    MIN_BORATE_PPM: 30,
    MAX_BORATE_PPM: 50,  // EPA maximum
    
    // Prerequisites for adding borax
    MAX_PH_FOR_BORAX: 7.4,
    MAX_TA_FOR_BORAX: 140,
    MAX_CH_FOR_BORAX: 350,

    /**
     * Calculate borate PPM from drop test result
     * @param {number} drops - Number of R-0010 drops used in titration
     * @returns {number} Borate level in PPM
     */
    dropsToPpm(drops) {
        if (typeof drops !== 'number' || drops < 0) {
            throw new Error('Drops must be a non-negative number');
        }
        return drops * 4;
    },

    /**
     * Calculate drops from known PPM (reverse calculation)
     * @param {number} ppm - Borate level in PPM
     * @returns {number} Expected number of drops
     */
    ppmToDrops(ppm) {
        if (typeof ppm !== 'number' || ppm < 0) {
            throw new Error('PPM must be a non-negative number');
        }
        return ppm / 4;
    },

    /**
     * Check if borate level is within recommended range
     * @param {number} ppm - Current borate level
     * @returns {object} Status object with inRange, status, and message
     */
    checkLevel(ppm) {
        if (typeof ppm !== 'number' || ppm < 0) {
            throw new Error('PPM must be a non-negative number');
        }

        if (ppm === 0) {
            return {
                inRange: false,
                status: 'none',
                message: 'No borates detected'
            };
        } else if (ppm < this.MIN_BORATE_PPM) {
            return {
                inRange: false,
                status: 'low',
                message: `Low borate level (${ppm} ppm). Minimum recommended is ${this.MIN_BORATE_PPM} ppm.`
            };
        } else if (ppm > this.MAX_BORATE_PPM) {
            return {
                inRange: false,
                status: 'high',
                message: `High borate level (${ppm} ppm). EPA maximum is ${this.MAX_BORATE_PPM} ppm.`
            };
        } else {
            return {
                inRange: true,
                status: 'optimal',
                message: `Borate level (${ppm} ppm) is within optimal range.`
            };
        }
    },

    /**
     * Calculate borax needed to reach target PPM
     * @param {number} currentPpm - Current borate level
     * @param {number} targetPpm - Desired borate level
     * @param {number} poolGallons - Pool volume in gallons
     * @returns {object|null} Dosage info or null if no increase needed
     */
    calculateBoraxDosage(currentPpm, targetPpm, poolGallons) {
        this._validateDosageInputs(currentPpm, targetPpm, poolGallons);

        const ppmIncrease = targetPpm - currentPpm;
        if (ppmIncrease <= 0) {
            return null;
        }

        const boraxOz = (poolGallons / 10000) * (ppmIncrease / 10) * this.BORAX_OZ_PER_10K_GAL_PER_10PPM;
        const boraxLbs = boraxOz / this.OZ_PER_LB;
        const boxes = boraxOz / this.BORAX_OZ_PER_BOX;
        
        // Muriatic acid needed: approximately half the borax volume in oz
        const acidOz = boraxOz / 2;
        const acidGal = acidOz / this.OZ_PER_GALLON;

        return {
            ppmIncrease: ppmIncrease,
            boraxOz: Math.round(boraxOz * 10) / 10,
            boraxLbs: Math.round(boraxLbs * 10) / 10,
            boxesNeeded: Math.ceil(boxes),
            acidOz: Math.round(acidOz * 10) / 10,
            acidGallons: Math.round(acidGal * 10) / 10
        };
    },

    /**
     * Calculate boric acid needed to reach target PPM
     * @param {number} currentPpm - Current borate level
     * @param {number} targetPpm - Desired borate level
     * @param {number} poolGallons - Pool volume in gallons
     * @returns {object|null} Dosage info or null if no increase needed
     */
    calculateBoricAcidDosage(currentPpm, targetPpm, poolGallons) {
        this._validateDosageInputs(currentPpm, targetPpm, poolGallons);

        const ppmIncrease = targetPpm - currentPpm;
        if (ppmIncrease <= 0) {
            return null;
        }

        const boricAcidOz = (poolGallons / 10000) * (ppmIncrease / 10) * this.BORIC_ACID_OZ_PER_10K_GAL_PER_10PPM;
        const boricAcidLbs = boricAcidOz / this.OZ_PER_LB;

        return {
            ppmIncrease: ppmIncrease,
            boricAcidOz: Math.round(boricAcidOz * 10) / 10,
            boricAcidLbs: Math.round(boricAcidLbs * 10) / 10,
            acidNeeded: false  // Boric acid doesn't require pH adjustment
        };
    },

    /**
     * Check if water chemistry meets prerequisites for adding borax
     * @param {number} ph - Current pH level
     * @param {number} totalAlkalinity - Current TA in ppm
     * @param {number} calciumHardness - Current CH in ppm
     * @returns {object} Validation result with isReady and issues array
     */
    checkBoraxPrerequisites(ph, totalAlkalinity, calciumHardness) {
        const issues = [];

        if (typeof ph === 'number' && ph > this.MAX_PH_FOR_BORAX) {
            issues.push(`pH (${ph}) must be ≤ ${this.MAX_PH_FOR_BORAX}`);
        }

        if (typeof totalAlkalinity === 'number' && totalAlkalinity >= this.MAX_TA_FOR_BORAX) {
            issues.push(`Total Alkalinity (${totalAlkalinity} ppm) must be < ${this.MAX_TA_FOR_BORAX} ppm`);
        }

        if (typeof calciumHardness === 'number' && calciumHardness >= this.MAX_CH_FOR_BORAX) {
            issues.push(`Calcium Hardness (${calciumHardness} ppm) must be < ${this.MAX_CH_FOR_BORAX} ppm`);
        }

        return {
            isReady: issues.length === 0,
            issues: issues
        };
    },

    /**
     * Calculate depletion rate from test history
     * @param {Array} tests - Array of test objects with date and ppm properties
     * @returns {object} Depletion info including rate per month
     */
    calculateDepletionRate(tests) {
        if (!Array.isArray(tests) || tests.length < 2) {
            return {
                hasData: false,
                ratePerMonth: 0,
                message: 'Need at least 2 tests to calculate depletion rate'
            };
        }

        // Sort by date ascending
        const sorted = [...tests].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        
        const daysBetween = (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
        
        if (daysBetween < 1) {
            return {
                hasData: false,
                ratePerMonth: 0,
                message: 'Tests must be at least 1 day apart'
            };
        }

        const ppmChange = last.ppm - first.ppm;
        const ratePerDay = ppmChange / daysBetween;
        const ratePerMonth = ratePerDay * 30;

        return {
            hasData: true,
            ratePerMonth: Math.round(ratePerMonth * 10) / 10,
            ratePerDay: Math.round(ratePerDay * 100) / 100,
            daysBetween: Math.round(daysBetween),
            ppmChange: ppmChange,
            trend: ppmChange < 0 ? 'decreasing' : ppmChange > 0 ? 'increasing' : 'stable'
        };
    },

    /**
     * Estimate days until next addition needed
     * @param {number} currentPpm - Current borate level
     * @param {number} ratePerMonth - Depletion rate (negative for loss)
     * @param {number} minimumPpm - Minimum acceptable level (default 30)
     * @returns {object} Estimate with days and date
     */
    estimateDaysUntilAddition(currentPpm, ratePerMonth, minimumPpm = 30) {
        if (typeof currentPpm !== 'number' || typeof ratePerMonth !== 'number') {
            throw new Error('Invalid input types');
        }

        // If level is increasing or stable, no addition needed
        if (ratePerMonth >= 0) {
            return {
                needed: false,
                message: 'Borate level is stable or increasing'
            };
        }

        // If already below minimum
        if (currentPpm <= minimumPpm) {
            return {
                needed: true,
                daysUntil: 0,
                message: 'Addition needed now - level is below minimum'
            };
        }

        const ppmToLose = currentPpm - minimumPpm;
        const ratePerDay = ratePerMonth / 30;
        const daysUntil = Math.round(ppmToLose / Math.abs(ratePerDay));

        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + daysUntil);

        return {
            needed: true,
            daysUntil: daysUntil,
            estimatedDate: estimatedDate.toISOString().split('T')[0],
            message: `Estimated ${daysUntil} days until level drops below ${minimumPpm} ppm`
        };
    },

    /**
     * Calculate cost comparison between borax and boric acid
     * @param {number} ppmIncrease - Desired PPM increase
     * @param {number} poolGallons - Pool volume in gallons
     * @param {number} boraxPricePerBox - Price per 76oz box of borax
     * @param {number} boricAcidPricePerLb - Price per pound of boric acid
     * @param {number} acidPricePerGallon - Price per gallon of muriatic acid
     * @returns {object} Cost comparison
     */
    compareCosts(ppmIncrease, poolGallons, boraxPricePerBox = 5, boricAcidPricePerLb = 1.10, acidPricePerGallon = 6.50) {
        const borax = this.calculateBoraxDosage(0, ppmIncrease, poolGallons);
        const boricAcid = this.calculateBoricAcidDosage(0, ppmIncrease, poolGallons);

        if (!borax || !boricAcid) {
            return null;
        }

        const boraxCost = (borax.boxesNeeded * boraxPricePerBox) + (borax.acidGallons * acidPricePerGallon);
        const boricAcidCost = boricAcid.boricAcidLbs * boricAcidPricePerLb;

        return {
            borax: {
                productCost: Math.round(borax.boxesNeeded * boraxPricePerBox * 100) / 100,
                acidCost: Math.round(borax.acidGallons * acidPricePerGallon * 100) / 100,
                totalCost: Math.round(boraxCost * 100) / 100
            },
            boricAcid: {
                productCost: Math.round(boricAcidCost * 100) / 100,
                acidCost: 0,
                totalCost: Math.round(boricAcidCost * 100) / 100
            },
            recommendation: boricAcidCost < boraxCost ? 'boric acid' : 'borax',
            savings: Math.round(Math.abs(boraxCost - boricAcidCost) * 100) / 100
        };
    },

    // Private validation helper
    _validateDosageInputs(currentPpm, targetPpm, poolGallons) {
        if (typeof currentPpm !== 'number' || currentPpm < 0) {
            throw new Error('Current PPM must be a non-negative number');
        }
        if (typeof targetPpm !== 'number' || targetPpm < 0) {
            throw new Error('Target PPM must be a non-negative number');
        }
        if (targetPpm > this.MAX_BORATE_PPM) {
            throw new Error(`Target PPM cannot exceed EPA maximum of ${this.MAX_BORATE_PPM}`);
        }
        if (typeof poolGallons !== 'number' || poolGallons <= 0) {
            throw new Error('Pool gallons must be a positive number');
        }
    }
};

// Export for Node.js (testing) and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BorateCaclulations;
}
