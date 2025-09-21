// Test data generator for checkbox inputs
// Generates random test data for inspected and selected checkbox fields

/**
 * Generate random boolean with probability
 */
function randBool(prob = 0.5) {
  return Math.random() < prob;
}

/**
 * Generate a random label-like string
 */
function randLabel(prefix = 'opt') {
  return `${prefix}_${Math.random().toString(36).substring(2,8)}`;
}

/**
 * Generate test data for a single checkbox/group input
 * @param {Object} spec - { name, inspectedCount, selectedCount, records }
 * @returns {Array<Object>} rows for each record
 */
export function generateCheckboxData(spec) {
  const { name, inspectedCount = 1, selectedCount = 0, records = 1 } = spec || {};
  const options = [];
  for (let i = 0; i < inspectedCount; i++) {
    options.push({ value: `val_${i+1}`, label: randLabel(name || 'chk') });
  }

  // clamp selectedCount
  const sel = Math.max(0, Math.min(selectedCount, options.length));

  const rows = [];
  for (let r = 0; r < records; r++) {
    // For each record, choose selected items. Distribute selection probabilistically
    const selected = new Set();
    // If selectedCount specified, pick that many deterministically (random unique picks)
    if (sel > 0) {
      const indices = [...Array(options.length).keys()];
      for (let s = 0; s < sel; s++) {
        const pickIdx = Math.floor(Math.random() * indices.length);
        const chosen = indices.splice(pickIdx,1)[0];
        selected.add(options[chosen].value);
      }
    } else {
      // random selection between 0 and inspectedCount
      for (let i = 0; i < options.length; i++) {
        if (randBool(0.3)) selected.add(options[i].value);
      }
    }

    const row = {
      fieldName: name || 'checkbox',
      options: options.map(o => o.value),
      selected: Array.from(selected)
    };
    rows.push(row);
  }
  return rows;
}

/**
 * Generate tabular CSV string for array of rows
 */
export function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = ['fieldName','options','selected'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const opts = `"${r.options.join('|')}"`;
    const sel = `"${r.selected.join('|')}"`;
    lines.push([r.fieldName, opts, sel].join(','));
  }
  return lines.join('\n');
}

/**
 * Convenience: generate multiple specs and return map
 */
export function generateMultiple(specs = []) {
  const result = {};
  for (const s of specs) {
    result[s.name || `checkbox_${Object.keys(result).length+1}`] = generateCheckboxData(s);
  }
  return result;
}

// ----------------------------
// Form-wide test data generation
// ----------------------------

function randomString(len = 8) {
  return Math.random().toString(36).substring(2, 2 + len);
}

function randomNumber(min = 0, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function chooseRandom(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Realistic generators ---
function randomName() {
  const first = ['Alex','Sam','Jordan','Taylor','Chris','Pat','Morgan','Riley','Casey','Jamie'];
  const last = ['Smith','Johnson','Brown','Williams','Jones','Davis','Miller','Wilson','Taylor','Anderson'];
  return `${chooseRandom(first)} ${chooseRandom(last)}`;
}

function randomEmail(name) {
  const domains = ['example.com','test.com','mail.com','example.org'];
  const local = (name ? name.split(' ')[0].toLowerCase() : randomString(6)).replace(/[^a-z]/g,'');
  return `${local}.${Math.floor(Math.random()*9000+1000)}@${chooseRandom(domains)}`;
}

function randomPhone() {
  const a = Math.floor(Math.random()*900+100).toString();
  const b = Math.floor(Math.random()*900+100).toString();
  const c = Math.floor(Math.random()*9000+1000).toString();
  return `${a}-${b}-${c}`;
}

function randomDate(startYear = 1970, endYear = 2023) {
  const start = new Date(startYear,0,1).getTime();
  const end = new Date(endYear,11,31).getTime();
  const d = new Date(start + Math.random()*(end-start));
  return d.toISOString().split('T')[0];
}

function randomAddress() {
  const streets = ['Main St','Oak Ave','Pine Rd','Maple Dr','Cedar Ln','Elm St'];
  return `${Math.floor(Math.random()*9999+1)} ${chooseRandom(streets)}, Suite ${Math.floor(Math.random()*900+100)}`;
}

/**
 * Generate form-style rows for an array of field specs
 * specs: [{ name, type, options, selectedCount, multiple }]
 * returns array of objects where keys are field names
 */
export function generateFormData(specs = [], records = 1) {
  const rows = [];
  for (let r = 0; r < records; r++) {
    const row = {};
    for (const s of specs) {
      const name = s.name || 'field';
      // allow an explicit generator override per field
      const generator = (s.generator || '').toLowerCase();
      if (generator && generator !== 'auto') {
        switch (generator) {
          case 'name': row[name] = randomName(); break;
          case 'email': row[name] = randomEmail(s.exampleName || randomName()); break;
          case 'phone': row[name] = randomPhone(); break;
          case 'date': row[name] = randomDate(1970, 2025); break;
          case 'address': row[name] = randomAddress(); break;
          case 'number': row[name] = String(randomNumber(0, 9999)); break;
          case 'text': row[name] = randomString(8); break;
          default: row[name] = randomString(6); break;
        }
        continue;
      }

      switch ((s.type || 'text').toLowerCase()) {
        case 'text':
        case 'textarea':
          row[name] = randomString(8);
          break;
        case 'number':
          row[name] = String(randomNumber(0, 9999));
          break;
        case 'select':
          if (s.multiple) {
            // pick 1..n random options
            const picks = [];
            const options = s.options || [];
            const pickCount = Math.max(1, Math.floor(Math.random() * Math.min(options.length, 3)));
            const pool = options.slice();
            for (let i = 0; i < pickCount && pool.length > 0; i++) {
              const idx = Math.floor(Math.random() * pool.length);
              picks.push(pool.splice(idx,1)[0]);
            }
            row[name] = picks;
          } else {
            row[name] = chooseRandom(s.options || []);
          }
          break;
        case 'radio':
          row[name] = chooseRandom(s.options || []);
          break;
        case 'checkbox':
          // For checkbox group, return array of selected option values
          const options = s.options || [];
          const selCount = s.selectedCount != null ? s.selectedCount : Math.floor(Math.random() * (options.length + 1));
          const picks = [];
          const pool = options.slice();
          for (let i = 0; i < selCount && pool.length > 0; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            picks.push(pool.splice(idx,1)[0]);
          }
          row[name] = picks;
          break;
        case 'button':
          // indicate presence or label
          row[name] = s.label || 'button';
          break;
        default:
          row[name] = randomString(6);
      }
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Convert array of object rows to CSV with header order based on specs
 */
export function toCSVFromObjects(rows = [], specs = []) {
  if (!rows || rows.length === 0) return '';
  // Determine headers: use specs order when provided, otherwise union of keys
  let headers = [];
  if (specs && specs.length > 0) headers = specs.map(s => s.name);
  else headers = Array.from(rows.reduce((acc, r) => { Object.keys(r).forEach(k => acc.add(k)); return acc; }, new Set()));

  const escapeCell = (val) => {
    if (val == null) return '';
    if (Array.isArray(val)) return `"${val.join('|')}"`;
    const str = String(val);
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];
  for (const r of rows) {
    const rowVals = headers.map(h => escapeCell(r[h]));
    lines.push(rowVals.join(','));
  }
  return lines.join('\n');
}
