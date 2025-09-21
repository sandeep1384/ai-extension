import { generateFormData, toCSVFromObjects } from '../test-data/checkboxData.js';

function el(id) { return document.getElementById(id); }

function renderTable(rows) {
  if (!rows || rows.length === 0) return '<div>No rows generated</div>';
  const headers = ['fieldName','options','selected'];
  let html = '<table style="width:100%; border-collapse:collapse; font-size:12px;">';
  html += '<thead><tr>' + headers.map(h => `<th style="text-align:left; padding:6px; border-bottom:1px solid var(--border-color);">${h}</th>`).join('') + '</tr></thead>';
  html += '<tbody>';
  for (const r of rows) {
    html += '<tr>' +
      `<td style="padding:6px; border-bottom:1px solid rgba(0,0,0,0.05);">${r.fieldName}</td>` +
      `<td style="padding:6px; border-bottom:1px solid rgba(0,0,0,0.05);">${(r.options||[]).join(' | ')}</td>` +
      `<td style="padding:6px; border-bottom:1px solid rgba(0,0,0,0.05);">${(r.selected||[]).join(' | ')}</td>` +
      '</tr>';
  }
  html += '</tbody></table>';
  return html;
}

document.addEventListener('DOMContentLoaded', () => {
  const out = el('td-output');
  const nameIn = el('td-name');
  const inspectedIn = el('td-inspected');
  const selectedIn = el('td-selected');
  const recordsIn = el('td-records');
  const btn = el('td-generate');
  const useBtn = el('td-use-inspect');

  let lastInspectedContent = null;
  let fieldSpecs = null;

  chrome.runtime.onMessage.addListener((msg) => {
    try {
      if (msg?.type === 'SELECTED_DOM_CONTENT') {
        lastInspectedContent = msg.content;
      }
    } catch (e) {
      console.error('ui-checkbox: message handler error', e);
    }
  });

  useBtn.addEventListener('click', () => {
    if (!lastInspectedContent) {
      out.textContent = 'No inspected DOM content found. Use Inspect and click elements on the page first.';
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(lastInspectedContent, 'text/html');

      // collect fields of interest
      const inputs = Array.from(doc.querySelectorAll('input, select, textarea, button'));
      if (inputs.length === 0) {
        out.textContent = 'No form controls found in the inspected selection.';
        return;
      }

      const specs = [];
      const seen = new Set();

      inputs.forEach(elm => {
        const tag = elm.tagName.toLowerCase();
        let type = elm.getAttribute('type') || '';
        type = type.toLowerCase();
        let name = elm.name || elm.getAttribute('data-name') || elm.id || null;
        if (!name) {
          // fallback: build a name from tag + index to keep unique
          name = `${tag}_${Math.random().toString(36).substring(2,6)}`;
        }
        if (seen.has(name)) return; // prefer first occurrence per name
        seen.add(name);

        const spec = { name };
        if (tag === 'select') {
          spec.type = 'select';
          spec.multiple = elm.multiple || false;
          spec.options = Array.from(elm.querySelectorAll('option')).map(o => o.value || o.textContent.trim());
        } else if (tag === 'textarea') {
          spec.type = 'textarea';
        } else if (tag === 'button') {
          spec.type = 'button';
          spec.label = elm.textContent.trim() || elm.value || 'button';
        } else if (tag === 'input') {
          if (type === 'checkbox') {
            spec.type = 'checkbox';
            // collect all checkboxes with same name inside the inspected snippet
            const group = Array.from(doc.querySelectorAll(`input[type="checkbox"][name="${name}"]`));
            spec.options = group.map(i => i.value || i.id || i.getAttribute('value') || 'on');
            spec.selectedCount = group.filter(i => i.checked).length;
          } else if (type === 'radio') {
            spec.type = 'radio';
            const group = Array.from(doc.querySelectorAll(`input[type="radio"][name="${name}"]`));
            spec.options = group.map(i => i.value || i.id || i.getAttribute('value') || 'on');
          } else if (type === 'number') {
            spec.type = 'number';
          } else {
            spec.type = 'text';
          }
        }
        specs.push(spec);
      });

      // attach default generator setting (auto) to each spec
      fieldSpecs = specs.map(s => ({ ...s, generator: 'auto' }));

      const chooser = document.getElementById('td-field-chooser');
      if (chooser) {
        chooser.style.display = 'block';
        chooser.innerHTML = '';
        const list = document.createElement('div');
        list.style.display = 'flex'; list.style.flexDirection = 'column'; list.style.gap = '6px';
        fieldSpecs.forEach((fs, idx) => {
          const row = document.createElement('div');
          row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px';
          const chk = document.createElement('input'); chk.type='checkbox'; chk.checked=true; chk.dataset.idx=idx;
          const lbl = document.createElement('div'); lbl.textContent = `${fs.name} (${fs.type}${fs.options?` ${fs.options.length} opts`:''})`;
          lbl.style.flex='1';
          const sel = document.createElement('select'); sel.dataset.idx=idx;
          ['auto','name','email','phone','date','address','text','number'].forEach(opt=>{ const o=document.createElement('option'); o.value=opt; o.textContent=opt; sel.appendChild(o); });
          sel.value = 'auto';
          row.appendChild(chk); row.appendChild(lbl); row.appendChild(sel);
          list.appendChild(row);
        });
        chooser.appendChild(list);
      }

      if (fieldSpecs.length === 1) {
        const s = specs[0];
        nameIn.value = s.name;
        inspectedIn.value = (s.options && s.options.length) || 1;
        selectedIn.value = s.selectedCount || 0;
        out.innerHTML = `<div>Detected single field: <strong>${s.name}</strong> (type: ${s.type})</div>`;
      } else {
        const listHtml = specs.map(s => `<li>${s.name} — ${s.type}${s.options?` (${s.options.length} options)` : ''}</li>`).join('');
        out.innerHTML = `<div>Detected ${specs.length} fields:</div><ul style="margin:6px 0 0 14px;">${listHtml}</ul><div style="margin-top:8px; font-size:12px; color:var(--muted-color, #888);">Click Generate to create random test rows for all detected fields (uses records value).</div>`;
      }
    } catch (err) {
      out.textContent = `Failed to parse inspected content: ${err.message}`;
    }
  });

  btn.addEventListener('click', () => {
    const recordsVal = parseInt(recordsIn.value,10) || 1;

    if (fieldSpecs && fieldSpecs.length > 0) {
      // Read chooser selections (include + generator override) if present
      const chooser = document.getElementById('td-field-chooser');
      let effectiveSpecs = fieldSpecs.map(s => ({ ...s }));
      if (chooser) {
        effectiveSpecs.forEach((fs, idx) => {
          const sel = chooser.querySelector(`select[data-idx="${idx}"]`);
          const chk = chooser.querySelector(`input[type="checkbox"][data-idx="${idx}"]`);
          if (sel && sel.value) fs.generator = sel.value;
          fs._include = chk ? chk.checked : true;
        });
        effectiveSpecs = effectiveSpecs.filter(f => f._include).map(f => { const c = { ...f }; delete c._include; return c; });
      }

      if (!effectiveSpecs || effectiveSpecs.length === 0) {
        out.textContent = 'No fields selected for generation. Use the field chooser to include fields.';
        return;
      }

      const objRows = generateFormData(effectiveSpecs, recordsVal);
      const csv = toCSVFromObjects(objRows, effectiveSpecs);

      // prepare a simple table view: each row becomes a single row with key=val pairs
      const tableRows = objRows.map(o => ({ fieldName: 'form-row', options: [], selected: Object.entries(o).map(([k,v]) => `${k}=${Array.isArray(v)?v.join('|'):v}`) }));

      out.innerHTML = '';
      const btns = document.createElement('div'); btns.style.display='flex'; btns.style.gap='8px'; btns.style.marginBottom='8px';

      // result container to preserve button listeners and allow swapping views
      const resultDiv = document.createElement('div'); resultDiv.className = 'td-result';

      const tableBtn = document.createElement('button'); tableBtn.textContent='Show Table'; tableBtn.className='inspector-toggle'; tableBtn.addEventListener('click', ()=> { resultDiv.innerHTML = renderTable(tableRows); });
      const csvBtn = document.createElement('button'); csvBtn.textContent='Show CSV'; csvBtn.className='inspector-toggle'; csvBtn.addEventListener('click', ()=> { resultDiv.textContent = csv; });
      const copyBtn = document.createElement('button'); copyBtn.textContent='Copy CSV'; copyBtn.className='inspector-toggle'; copyBtn.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(csv); copyBtn.textContent='Copied!'; setTimeout(()=>copyBtn.textContent='Copy CSV',1500);}catch(e){copyBtn.textContent='Copy Failed'; setTimeout(()=>copyBtn.textContent='Copy CSV',1500);} });
      const dlBtn = document.createElement('button'); dlBtn.textContent='Download CSV'; dlBtn.className='inspector-toggle'; dlBtn.addEventListener('click', ()=>{ const filename='form-data.csv'; const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); });

      btns.appendChild(tableBtn); btns.appendChild(csvBtn); btns.appendChild(copyBtn); btns.appendChild(dlBtn);
      out.appendChild(btns);
      resultDiv.innerHTML = renderTable(tableRows);
      out.appendChild(resultDiv);
      return;
    }

    // fallback: generate for single checkbox group using name/inspected/selected
    const spec = { name: nameIn.value.trim() || 'checkbox', inspectedCount: parseInt(inspectedIn.value,10) || 1, selectedCount: parseInt(selectedIn.value,10) || 0, records: recordsVal };
    // build a single-field form spec and reuse generator
    const simpleField = { name: spec.name, type: 'checkbox', options: Array.from({length: spec.inspectedCount}).map((_,i)=>`val_${i+1}`), selectedCount: spec.selectedCount };
    const objRows = generateFormData([simpleField], recordsVal);
    const csv = toCSVFromObjects(objRows, [simpleField]);
    const tableRows = objRows.map(o => ({ fieldName:'form-row', options:[], selected: Object.entries(o).map(([k,v])=>`${k}=${Array.isArray(v)?v.join('|'):v}`) }));

  out.innerHTML = '';
  const btns = document.createElement('div'); btns.style.display='flex'; btns.style.gap='8px'; btns.style.marginBottom='8px';
  // result container to preserve buttons and allow swapping views
  const resultDiv = document.createElement('div'); resultDiv.className = 'td-result';
  const tableBtn = document.createElement('button'); tableBtn.textContent='Show Table'; tableBtn.className='inspector-toggle'; tableBtn.addEventListener('click', ()=> { resultDiv.innerHTML = renderTable(tableRows); });
  const csvBtn = document.createElement('button'); csvBtn.textContent='Show CSV'; csvBtn.className='inspector-toggle'; csvBtn.addEventListener('click', ()=> { resultDiv.textContent = csv; });
  const copyBtn = document.createElement('button'); copyBtn.textContent='Copy CSV'; copyBtn.className='inspector-toggle'; copyBtn.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(csv); copyBtn.textContent='Copied!'; setTimeout(()=>copyBtn.textContent='Copy CSV',1500);}catch(e){copyBtn.textContent='Copy Failed'; setTimeout(()=>copyBtn.textContent='Copy CSV',1500);} });
  const dlBtn = document.createElement('button'); dlBtn.textContent='Download CSV'; dlBtn.className='inspector-toggle'; dlBtn.addEventListener('click', ()=>{ const filename=`${spec.name || 'checkbox'}-data.csv`; const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); });
  btns.appendChild(tableBtn); btns.appendChild(csvBtn); btns.appendChild(copyBtn); btns.appendChild(dlBtn);
  out.appendChild(btns);
  resultDiv.innerHTML = renderTable(tableRows);
  out.appendChild(resultDiv);
  });
});
