// Vice Cover Studio — cover renderer.
// Draws a GTA-poster-style multi-panel cover onto any 2D canvas: panel photos
// with a Vice City sunset / neon grade, halftone dots, white gutters and bold
// condensed caption lettering. Everything is drawn from scratch — no assets,
// no Rockstar artwork, no external fonts.

export const LAYOUTS = {
  trio: {
    label: 'Trio — hero + two panels',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ],
  },
  duo: {
    label: 'Duo — tall split',
    panels: [
      { x: 0, y: 0, w: 0.58, h: 1 },
      { x: 0.58, y: 0, w: 0.42, h: 1 },
    ],
  },
  quad: {
    label: 'Quad — four panels',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  hero: {
    label: 'Hero — one full photo',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    sky: ['rgba(255, 94, 98, 0)', 'rgba(255, 94, 98, 0.28)', 'rgba(255, 170, 60, 0.34)'],
    wash: 'rgba(255, 60, 140, 0.10)',
    vignette: 0.34,
  },
  neon: {
    label: 'Neon Nights',
    sky: ['rgba(0, 229, 255, 0)', 'rgba(0, 229, 255, 0.16)', 'rgba(255, 45, 149, 0.30)'],
    wash: 'rgba(120, 40, 255, 0.16)',
    vignette: 0.42,
  },
  noir: {
    label: 'Palm Noir',
    sky: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.22)', 'rgba(255, 120, 40, 0.22)'],
    wash: 'rgba(10, 10, 30, 0.18)',
    vignette: 0.5,
  },
  golden: {
    label: 'Golden Hour',
    sky: ['rgba(255, 214, 120, 0)', 'rgba(255, 180, 60, 0.20)', 'rgba(255, 120, 40, 0.30)'],
    wash: 'rgba(255, 190, 80, 0.08)',
    vignette: 0.26,
  },
};

export const TITLE_STYLES = {
  sunset: { label: 'Sunset gradient', stops: ['#ffffff', '#ffe9a8', '#ff9a3d'] },
  white: { label: 'Clean white', stops: ['#ffffff', '#ffffff', '#e8e8e8'] },
  neon: { label: 'Neon pink', stops: ['#ffffff', '#ff9de2', '#ff2d95'] },
  gold: { label: 'Gold', stops: ['#fffbe8', '#ffd76a', '#c98a12'] },
};

/** Default editor state. `slots[i]` belongs to panel i: which photo, zoom, pan. */
export function defaultState() {
  return {
    layout: 'trio',
    grade: 'sunset',
    titleStyle: 'sunset',
    caption: 'VICE SUNSET',
    subtitle: 'NEON NIGHTS • A COVER STORY',
    titleScale: 1,
    halftone: true,
    grain: true,
    gutter: 'light', // 'light' white gutters or 'dark' black gutters
    photos: [], // [{ img, name }]
    slots: [
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
      { photo: 0, zoom: 1, ox: 0, oy: 0 },
    ],
  };
}

function panelRect(layout, i, w, h, gutter) {
  const p = LAYOUTS[layout].panels[i];
  const g = gutter;
  return {
    x: p.x * w + (p.x > 0 ? g / 2 : 0),
    y: p.y * h + (p.y > 0 ? g / 2 : 0),
    w: p.w * w - (p.x > 0 ? g / 2 : 0) - (p.x + p.w < 1 ? g / 2 : 0),
    h: p.h * h - (p.y > 0 ? g / 2 : 0) - (p.y + p.h < 1 ? g / 2 : 0),
  };
}

/** Cover-fit draw of one photo into a rect, with zoom and pan offsets. */
function drawPhotoInto(ctx, img, rect, slot) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * (slot?.zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  const cx = rect.x + rect.w / 2 + (slot?.ox || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (slot?.oy || 0) * rect.h;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

let halftonePattern = null;
function getHalftone(ctx, spacing) {
  if (halftonePattern && halftonePattern.spacing === spacing) return halftonePattern.pat;
  const tile = document.createElement('canvas');
  tile.width = tile.height = spacing;
  const t = tile.getContext('2d');
  t.fillStyle = 'rgba(0,0,0,0.55)';
  t.beginPath();
  t.arc(spacing / 2, spacing / 2, spacing * 0.22, 0, Math.PI * 2);
  t.fill();
  halftonePattern = { spacing, pat: ctx.createPattern(tile, 'repeat') };
  return halftonePattern.pat;
}

function applyGrade(ctx, rect, grade, w, h, halftone, grain) {
  const g = GRADES[grade];
  // Sunset wash: transparent at the top, warm at the bottom of each panel.
  const wash = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  wash.addColorStop(0, g.sky[0]);
  wash.addColorStop(0.55, g.sky[1]);
  wash.addColorStop(1, g.sky[2]);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = g.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // Halftone dots, denser toward the bottom of the panel.
  if (halftone) {
    const spacing = Math.max(7, Math.round(w / 160));
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = getHalftone(ctx, spacing);
    ctx.fillRect(rect.x, rect.y + rect.h * 0.55, rect.w, rect.h * 0.45);
    ctx.restore();
  }
  // Vignette.
  const vg = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.42,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(10,0,20,${g.vignette})`);
  ctx.fillStyle = vg;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // Film grain.
  if (grain) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.globalAlpha = 0.05;
    const step = Math.max(3, Math.round(w / 360));
    for (let y = rect.y; y < rect.y + rect.h; y += step) {
      for (let x = rect.x; x < rect.x + rect.w; x += step) {
        const v = Math.floor(Math.random() * 255);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, step, step);
      }
    }
    ctx.restore();
  }
}

function drawNeonRule(ctx, x, y, w, color) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, 3);
  ctx.restore();
}

function drawTitle(ctx, state, w, h) {
  const pad = w * 0.045;
  const bandH = h * 0.26;
  const bandY = h - bandH;
  // Scrim so the lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, bandY - h * 0.05, 0, h);
  scrim.addColorStop(0, 'rgba(8, 0, 18, 0)');
  scrim.addColorStop(0.5, 'rgba(8, 0, 18, 0.62)');
  scrim.addColorStop(1, 'rgba(8, 0, 18, 0.88)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - h * 0.05, w, bandH + h * 0.05);

  const title = (state.caption || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  const style = TITLE_STYLES[state.titleStyle] || TITLE_STYLES.sunset;

  if (sub) {
    drawNeonRule(ctx, pad, bandY + h * 0.03, w * 0.16, '#ff2d95');
    let subSize = Math.max(11, h * 0.02);
    ctx.font = `700 ${subSize}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(2, subSize * 0.22)}px`;
    while (ctx.measureText(sub).width > w * 0.86 && subSize > 9) {
      subSize -= 1;
      ctx.font = `700 ${subSize}px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`;
    }
    ctx.fillStyle = '#ffd7ef';
    ctx.fillText(sub, pad, bandY + h * 0.10);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }

  if (!title) return;
  let size = h * 0.092 * (state.titleScale || 1);
  const setFont = (s) => {
    ctx.font = `900 ${s}px "Arial Black", "Archivo Black", "Helvetica Neue", Arial, sans-serif`;
  };
  setFont(size);
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.max(1, size * 0.015)}px`;
  while (ctx.measureText(title).width > w - pad * 2 && size > 14) {
    size -= 2;
    setFont(size);
  }
  const baseline = h - h * 0.035;
  const grad = ctx.createLinearGradient(0, baseline - size, 0, baseline);
  grad.addColorStop(0, style.stops[0]);
  grad.addColorStop(0.55, style.stops[1]);
  grad.addColorStop(1, style.stops[2]);
  ctx.save();
  // Compensate the lean so the title's baseline starts exactly at the padding:
  // the shear moves a point at height y left by 0.05*y.
  ctx.translate(pad + 0.05 * baseline, 0);
  ctx.transform(1, 0, -0.05, 1, 0, 0); // slight forward lean, poster style
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 0, 20, 0.9)';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeText(title, 0, baseline);
  ctx.shadowColor = 'rgba(255, 45, 149, 0.55)';
  ctx.shadowBlur = size * 0.16;
  ctx.shadowOffsetY = size * 0.03;
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, baseline);
  ctx.restore();
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

/**
 * Renders the whole cover onto `canvas` (its width/height are the export size).
 * `state` is the editor state from defaultState(). Photos are HTMLImageElements.
 */
export function drawCoverArt(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const gutter = Math.max(4, Math.round(Math.min(w, h) * 0.008));
  const bg = state.gutter === 'dark' ? '#0b0614' : '#f5efe8';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const layout = LAYOUTS[state.layout] || LAYOUTS.trio;
  const panels = layout.panels;
  panels.forEach((_, i) => {
    const rect = panelRect(state.layout, i, w, h, gutter);
    const slot = state.slots[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[slot.photo];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (photo && photo.img) {
      drawPhotoInto(ctx, photo.img, rect, slot);
    } else {
      // Empty panel: deep violet placeholder with a sun disc, so the cover
      // still reads as a poster before any photo is loaded.
      const ph = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
      ph.addColorStop(0, '#2b103f');
      ph.addColorStop(1, '#ff5e62');
      ctx.fillStyle = ph;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h * 0.42, Math.min(rect.w, rect.h) * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
    applyGrade(ctx, rect, state.grade, w, h, state.halftone, state.grain);
    ctx.restore();
    // Panel frame.
    ctx.strokeStyle = state.gutter === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
  });

  drawTitle(ctx, state, w, h);
  return canvas;
}

/** Which panel (index) contains point (x, y) in canvas pixels, or -1. */
export function panelAt(state, x, y, w, h) {
  const gutter = Math.max(4, Math.round(Math.min(w, h) * 0.008));
  const panels = (LAYOUTS[state.layout] || LAYOUTS.trio).panels;
  for (let i = panels.length - 1; i >= 0; i--) {
    const r = panelRect(state.layout, i, w, h, gutter);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}
