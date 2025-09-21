Test Data Generator
===================

This repository includes a small test-data generator for checkbox inputs used by test engineers to produce multiple records of checkbox combinations for bulk testing.

- Module: `src/scripts/test-data/checkboxData.js` — functions: `generateCheckboxData(spec)`, `generateMultiple(specs)`, `toCSV(rows)`
- Page Object: `src/scripts/pages/CheckboxPage.js` — methods: `inspect()` and `applyRow(row)` to map generated data to the page.
- Feature: `features/checkbox.feature` — Gherkin scenarios showing example usage and expected tabular output.

Quick usage (in extension dev tools):

```javascript
import { generateCheckboxData, toCSV } from './src/scripts/test-data/checkboxData.js';
const rows = generateCheckboxData({ name: 'interests', inspectedCount: 4, selectedCount: 2, records: 5 });
console.log(toCSV(rows));
```

Output format: CSV with headers `fieldName,options,selected` where `options` and `selected` values are pipe-separated lists.
