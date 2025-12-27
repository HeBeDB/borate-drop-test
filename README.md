# Borate Management System

A comprehensive pool borate testing and management application designed for salt water chlorine generator (SWG) pools.

![CI](https://github.com/yourusername/borate-manager/actions/workflows/ci.yml/badge.svg)

## Overview

This application helps pool owners:
- Perform accurate borate drop tests using Taylor K-2006 reagents
- Track borate levels over time with trend analysis
- Calculate exact dosages for borax or boric acid additions
- Monitor costs and calculate ROI on borate maintenance

## Why Borates?

Borates provide significant benefits for pool water, especially for salt water pools:

| Benefit | Description |
|---------|-------------|
| **pH Buffering** | Prevents pH from rising, reducing acid usage |
| **Algae Prevention** | Reduces minimum chlorine requirements by ~33% |
| **Water Feel** | Creates softer, silkier water |
| **Long-Lasting** | Stays in water 6-12 months, only lost through draining/backwashing |

**Target Range:** 30-50 ppm (50 ppm is EPA maximum and optimal for SWG pools)

## Quick Start

### Option 1: Use GitHub Pages (Recommended)

Visit: `https://yourusername.github.io/borate-manager/`

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/borate-manager.git
cd borate-manager

# Install dependencies (for development/testing)
npm install

# Start local server
npm start
```

Open `http://localhost:8080` in your browser.

## Application Modules

| Module | Description |
|--------|-------------|
| **Dashboard** (`index.html`) | Central hub with quick stats and navigation |
| **Drop Test** (`borate-drop-test.html`) | Step-by-step test guide with color references |
| **Analytics** (`borate-analytics.html`) | Trend charts and predictive analysis |
| **Chemical Log** (`borate-chemicals.html`) | Track chemical additions |
| **Cost Tracking** (`borate-costs.html`) | Monitor expenses and ROI |
| **Calculator** (`borate-calculator.html`) | Dosage calculations |
| **Settings** (`borate-settings.html`) | Data management and preferences |

## The Borate Drop Test

### Formula
```
Borate (ppm) = R-0010 drops × 4
```

### Prerequisites for Testing
**None!** Unlike adding chemicals, you can test borate levels at any time regardless of chlorine or pH levels.

### Prerequisites for Adding Borax
Before adding borax or boric acid, ensure:
- pH ≤ 7.4
- Total Alkalinity < 140 ppm (ideally 80-90 ppm)
- Calcium Hardness < 350 ppm

### Dosage Formulas

**Borax (20 Mule Team):**
- 118 oz per 10,000 gallons = 10 ppm increase
- Requires muriatic acid (approx. half the borax volume in oz)

**Boric Acid (Recommended):**
- 76 oz per 10,000 gallons = 10 ppm increase
- No pH adjustment needed

## Development

### Project Structure

```
borate-manager/
├── src/
│   ├── borate-calculations.js   # Core calculation functions
│   └── borate-storage.js        # Data persistence layer
├── tests/
│   ├── borate-calculations.test.js
│   └── borate-storage.test.js
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions configuration
├── index.html                   # Main dashboard
├── borate-drop-test.html        # Drop test module
├── package.json
└── README.md
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Validate HTML
npm run validate
```

### Continuous Integration

Every push to `main` triggers:
1. ESLint code analysis
2. Jest unit tests
3. Coverage report generation
4. HTML validation

## Data Storage

All data is stored locally in your browser's localStorage:

| Key | Description |
|-----|-------------|
| `borate_tests` | Array of test results |
| `borate_additions` | Chemical addition log |
| `borate_purchases` | Purchase history |
| `borate_poolVolume` | Your pool size in gallons |
| `borate_reminderFreq` | Days between test reminders |
| `borate_lastTest` | Date of most recent test |

### Export/Import

Use the Settings module to:
- Export all data as JSON backup
- Import data from a backup file
- Clear all data

## API Reference

### BorateCaclulations

```javascript
// Convert drops to PPM
BorateCaclulations.dropsToPpm(12);  // Returns: 48

// Check if level is in range
BorateCaclulations.checkLevel(45);  // Returns: { inRange: true, status: 'optimal', ... }

// Calculate borax dosage
BorateCaclulations.calculateBoraxDosage(20, 50, 36000);
// Returns: { boraxLbs: 79.7, boxesNeeded: 17, acidGallons: 5.0, ... }

// Calculate boric acid dosage
BorateCaclulations.calculateBoricAcidDosage(20, 50, 36000);
// Returns: { boricAcidLbs: 51.3, acidNeeded: false, ... }

// Check prerequisites for adding chemicals
BorateCaclulations.checkBoraxPrerequisites(7.2, 100, 300);
// Returns: { isReady: true, issues: [] }

// Calculate depletion rate
BorateCaclulations.calculateDepletionRate(testsArray);
// Returns: { ratePerMonth: -3.2, trend: 'decreasing', ... }
```

### BorateStor

```javascript
// Save a test result
BorateStor.saveTest({ drops: 12, dropsR0009: 4, ppm: 48 });

// Get all tests
const tests = BorateStor.getTests();

// Get latest test
const latest = BorateStor.getLatestTest();

// Export all data
const backup = BorateStor.exportData();

// Import data
BorateStor.importData(backupData, merge = false);
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Taylor Technologies for the K-2006 test kit methodology
- TFP (Trouble Free Pool) community for pool chemistry knowledge
- The borate testing formulas are based on established pool chemistry standards
