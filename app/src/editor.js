// Vice Cover Studio — editor wiring.
// Owns the state, loads photos (upload or built-in samples), lets the user
// drag a photo inside its panel to reposition it, and exports the cover as PNG.

import { defaultState, drawCoverArt, panelAt, LAYOUTS, GRADES, TITLE_STYLES } from './cover.js';

export const EXPORT_SIZES = {
  square: { label: '1080 × 1080 · square post', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350 · portrait post', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080 · wide post', w: 1920, h: 1080 },
};

const SAMPLES = [
  { file: './samples/sunset-figure.jpg', name: 'Sunset figure (illustration)' },
  { file: './samples/boulevard.jpg', name: 'Boulevard (kit sample)' },
  { file: './samples/pier.jpg', name: 'Pier (kit sample)' },
];

export function createEditor(doc) {
  const state = defaultState();
  const canvas = doc.getElementById('preview');
  const statusEl = doc.getElementById('status');
  let selectedPanel = 0;
  let exportSize = 'square';
  let drag = null; // { panel, startX, startY, ox, oy }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function previewSize() {
    const size = EXPORT_SIZES[exportSize];
    const scale = Math.min(640 / size.w, 520 / size.h);
    return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
  }

  function render() {
    const { w, h } = previewSize();
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    drawCoverArt(canvas, state);
    doc.getElementById('panel-label').textContent =
      `Panel ${selectedPanel + 1} of ${(LAYOUTS[state.layout].panels.length)}`;
    const slot = state.slots[selectedPanel];
    doc.getElementById('zoom').value = String(slot.zoom);
    doc.getElementById('zoom-value').textContent = `${Math.round(slot.zoom * 100)}%`;
    refreshPhotoButtons();
  }

  function refreshPhotoButtons() {
    const wrap = doc.getElementById('panel-photos');
    wrap.querySelectorAll('button[data-photo]').forEach((btn) => {
      const idx = Number(btn.dataset.photo);
      btn.classList.toggle('active', state.slots[selectedPanel].photo === idx);
      btn.disabled = !state.photos[idx];
    });
  }

  function loadImage(src, name) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ img, name });
      img.onerror = () => reject(new Error(`Could not load ${name}`));
      img.src = src;
    });
  }

  async function addPhoto(src, name, fromFile) {
    try {
      const photo = await loadImage(src, name);
      state.photos.push(photo);
      const idx = state.photos.length - 1;
      // The new photo fills the selected panel; other panels keep theirs.
      state.slots[selectedPanel].photo = idx;
      state.slots[selectedPanel].zoom = 1;
      state.slots[selectedPanel].ox = 0;
      state.slots[selectedPanel].oy = 0;
      if (state.photos.length === 1) {
        // First photo fills every panel until the user adds more.
        state.slots.forEach((s) => { s.photo = 0; });
      }
      addPhotoChip(idx, name, fromFile);
      render();
      setStatus(`Loaded “${name}” — drag it inside a panel to reposition, scroll to zoom.`);
    } catch (err) {
      setStatus(err.message);
    }
  }

  function addPhotoChip(idx, name) {
    const list = doc.getElementById('photo-list');
    const chip = doc.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = `${idx + 1} · ${name}`;
    chip.title = `Use this photo in panel ${selectedPanel + 1}`;
    chip.addEventListener('click', () => {
      state.slots[selectedPanel].photo = idx;
      state.slots[selectedPanel].zoom = 1;
      state.slots[selectedPanel].ox = 0;
      state.slots[selectedPanel].oy = 0;
      render();
    });
    list.appendChild(chip);
  }

  function buildPanelPhotoButtons() {
    const wrap = doc.getElementById('panel-photos');
    wrap.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.dataset.photo = String(i);
      btn.textContent = `Photo ${i + 1}`;
      btn.disabled = true;
      btn.addEventListener('click', () => {
        if (!state.photos[i]) return;
        state.slots[selectedPanel].photo = i;
        render();
      });
      wrap.appendChild(btn);
    }
  }

  function buildOptionButtons(elId, entries, current, onPick) {
    const wrap = doc.getElementById(elId);
    wrap.innerHTML = '';
    Object.entries(entries).forEach(([key, def]) => {
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.textContent = def.label;
      btn.classList.toggle('active', key === current);
      btn.addEventListener('click', () => {
        onPick(key);
        wrap.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
      wrap.appendChild(btn);
    });
  }

  function bindControls() {
    buildPanelPhotoButtons();
    buildOptionButtons('layout-buttons', LAYOUTS, state.layout, (k) => {
      state.layout = k;
      selectedPanel = 0;
      render();
    });
    buildOptionButtons('grade-buttons', GRADES, state.grade, (k) => {
      state.grade = k;
      render();
    });
    buildOptionButtons('title-style-buttons', TITLE_STYLES, state.titleStyle, (k) => {
      state.titleStyle = k;
      render();
    });
    buildOptionButtons('size-buttons', EXPORT_SIZES, exportSize, (k) => {
      exportSize = k;
      render();
    });

    doc.getElementById('caption').addEventListener('input', (e) => {
      state.caption = e.target.value;
      render();
    });
    doc.getElementById('subtitle').addEventListener('input', (e) => {
      state.subtitle = e.target.value;
      render();
    });
    doc.getElementById('title-scale').addEventListener('input', (e) => {
      state.titleScale = Number(e.target.value);
      render();
    });
    doc.getElementById('halftone').addEventListener('change', (e) => {
      state.halftone = e.target.checked;
      render();
    });
    doc.getElementById('grain').addEventListener('change', (e) => {
      state.grain = e.target.checked;
      render();
    });
    doc.getElementById('gutter-dark').addEventListener('change', (e) => {
      state.gutter = e.target.checked ? 'dark' : 'light';
      render();
    });

    doc.getElementById('zoom').addEventListener('input', (e) => {
      state.slots[selectedPanel].zoom = Number(e.target.value);
      render();
    });
    doc.getElementById('reset-panel').addEventListener('click', () => {
      const s = state.slots[selectedPanel];
      s.zoom = 1; s.ox = 0; s.oy = 0;
      render();
    });

    const fileInput = doc.getElementById('photo-file');
    fileInput.addEventListener('change', () => {
      [...fileInput.files].forEach((file) => {
        addPhoto(URL.createObjectURL(file), file.name, true);
      });
      fileInput.value = '';
    });

    const sampleWrap = doc.getElementById('sample-buttons');
    SAMPLES.forEach((s) => {
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.textContent = `Try: ${s.name}`;
      btn.addEventListener('click', () => addPhoto(s.file, s.name));
      sampleWrap.appendChild(btn);
    });

    doc.getElementById('fill-all').addEventListener('click', () => {
      state.slots.forEach((s) => { s.photo = state.slots[selectedPanel].photo; });
      render();
      setStatus('One photo now fills every panel.');
    });

    // Drag to pan the photo inside the panel under the pointer; wheel zooms it.
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const panel = panelAt(state, x, y, canvas.width, canvas.height);
      if (panel < 0) return;
      selectedPanel = panel;
      const slot = state.slots[panel];
      drag = { panel, startX: x, startY: y, ox: slot.ox, oy: slot.oy, moved: false };
      canvas.setPointerCapture(e.pointerId);
      render();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      const slot = state.slots[drag.panel];
      slot.ox = drag.ox + (x - drag.startX) / canvas.width;
      slot.oy = drag.oy + (y - drag.startY) / canvas.height;
      if (Math.abs(x - drag.startX) + Math.abs(y - drag.startY) > 3) drag.moved = true;
      render();
    });
    canvas.addEventListener('pointerup', () => { drag = null; });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const slot = state.slots[selectedPanel];
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      slot.zoom = Math.min(4, Math.max(0.5, slot.zoom * factor));
      render();
    }, { passive: false });

    doc.getElementById('export').addEventListener('click', () => exportPng());
  }

  function exportPng() {
    const size = EXPORT_SIZES[exportSize];
    const off = doc.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    drawCoverArt(off, state);
    setStatus('Rendering PNG…');
    off.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — the browser could not make the PNG.');
        return;
      }
      const a = doc.createElement('a');
      a.href = URL.createObjectURL(blob);
      const slug = (state.caption || 'cover').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cover';
      a.download = `vice-cover-${slug}-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setStatus(`Exported ${size.w} × ${size.h} PNG — check your downloads.`);
    }, 'image/png');
  }

  bindControls();
  render();
  setStatus('Load a photo, pick a layout and a grade, then export your cover.');
  return { state, render, exportPng, addPhoto };
}
