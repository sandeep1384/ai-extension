// Page Object for checkbox inputs
// Provides helper methods to inspect checkbox groups and to apply generated test data

export default class CheckboxPage {
  constructor(root = document) {
    this.root = root;
  }

  /**
   * Inspect checkbox groups and return summary for each group
   * Returns array of { name, inspectedCount, selectedCount, labels }
   */
  inspect() {
    const groups = [];
    const inputs = Array.from(this.root.querySelectorAll('input[type="checkbox"]'));
    if (inputs.length === 0) return groups;

    // Group by name attribute
    const map = new Map();
    inputs.forEach(inp => {
      const name = inp.name || inp.getAttribute('data-name') || 'checkbox';
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(inp);
    });

    for (const [name, nodes] of map.entries()) {
      const inspectedCount = nodes.length;
      const selectedCount = nodes.filter(n => n.checked).length;
      const labels = nodes.map(n => {
        const lab = this._findLabelText(n);
        return lab || n.value || n.id || '';
      });
      groups.push({ name, inspectedCount, selectedCount, labels });
    }
    return groups;
  }

  _findLabelText(el) {
    // Try associated label via for attribute
    try {
      if (el.id) {
        const lab = this.root.querySelector(`label[for="${el.id}"]`);
        if (lab) return lab.textContent.trim();
      }
      // Try parent label
      if (el.parentElement && el.parentElement.tagName.toLowerCase() === 'label') {
        return el.parentElement.textContent.trim();
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  /**
   * Apply a single generated row of data to the page
   * row: { fieldName, selected: [values] }
   */
  applyRow(row) {
    const name = row.fieldName;
    const values = new Set(row.selected || []);
    const nodes = Array.from(this.root.querySelectorAll(`input[type="checkbox"][name="${name}"]`));
    if (nodes.length === 0) return false;
    nodes.forEach(n => {
      const val = n.value || n.getAttribute('value') || '';
      n.checked = values.has(val);
    });
    return true;
  }
}
