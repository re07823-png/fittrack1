const P = {
  today:'<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  workouts:'<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>',
  nutrition:'<path d="M12 7c-2-3-7-2-7 3 0 5 4 10 7 10s7-5 7-10c0-5-5-6-7-3zM12 7c0-2 1-3 3-4"/>',
  cardio:'<circle cx="14" cy="4.5" r="1.8"/><path d="M8 21l3-6 3 2 2 4M11 15l-1-5 4-1 2 3 3 1M10 10L7 12"/>',
  body:'<path d="M4 20V9M10 20V4M16 20v-8M22 20H2"/>',
  more:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  reports:'<path d="M5 20V10M12 20V4M19 20v-7M3 20h18"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"/>',
  moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  auto:'<circle cx="12" cy="12" r="8"/><path d="M12 4v16"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'
};

export const icon = n =>
  `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

export const empty = (ic, title, text) =>
  `<section class="empty">${icon(ic)}<h2>${title}</h2><p>${text}</p></section>`;

export const esc = s =>
  String(s).replace(/[&<>"']/g, c => ({
    '&':'&',
    '<':'<',
    '>':'>',
    '"':'"',
    "'":'''
  }[c]));

export const bar = p =>
  `<div class="bar"><i style="width:${Math.min(100, Math.max(0, p || 0))}%"></i></div>`;

export const line = (v, w = 300, h = 80) =>
  v.length < 2 ? '' : (() => {
    const mn = Math.min(...v);
    const mx = Math.max(...v);
    const r = mx - mn || 1;

    return `<svg viewBox="0 0 ${w} ${h}" class="spark" role="img">
      <polyline
        fill="none"
        stroke="var(--accent)"
        stroke-width="2"
        points="${v.map((x, i) =>
          `${i / (v.length - 1) * (w - 4) + 2},${h - 4 - (x - mn) / r * (h - 8)}`
        ).join(' ')}"
      />
    </svg>`;
  })();

export const bars = (v, w = 300, h = 80) => {
  if (!v.length) return '';

  const mx = Math.max(...v, 1);
  const bw = w / v.length;

  return `<svg viewBox="0 0 ${w} ${h}" class="spark" role="img">
    ${v.map((x, i) =>
      `<rect
        x="${i * bw + 1}"
        y="${h - x / mx * (h - 4)}"
        width="${Math.max(1, bw - 2)}"
        height="${x / mx * (h - 4)}"
        rx="2"
        fill="var(--accent)"
        opacity=".85"
      />`
    ).join('')}
  </svg>`;
};
