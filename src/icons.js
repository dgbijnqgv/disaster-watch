// Line icons (24×24, stroke = currentColor) used across the UI instead of emoji.
const P = {
  earthquake: ['M2 12h3l2-5 3 11 3-14 3 12 2-4h4'],
  wildfire: ['M12 22c4 0 7-3 7-7 0-5-4-7-5-12-2 2-3 4-3 7-1-1-2-2-2-4-2 2-4 5-4 9 0 4 3 7 7 7z', 'M12 22c-2 0-3-1.5-3-3.5S11 15 12 13c1 2 3 3.5 3 5.5S14 22 12 22z'],
  storm: ['M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z', 'M4 9c2-4 7-6 11-4', 'M20 15c-2 4-7 6-11 4', 'M15 5c3 1 5 4 5 7', 'M9 19c-3-1-5-4-5-7'],
  flood: ['M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0', 'M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0'],
  volcano: ['M3 21l6-10h6l6 10z', 'M12 7V3', 'M9 8L7 5', 'M15 8l2-3'],
  severe: ['M7 16a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18.5 9 3.5 3.5 0 0 1 18 16', 'M12 12l-2 4h4l-2 4'],
  tsunami: ['M2 19c3 0 4-2 6-2s3 2 6 2 4-2 8-2', 'M4 14c0-5 4-9 9-9-2 1.5-3 4-2 6 1 1.5 3 1.5 4 .5'],
  heat: ['M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z', 'M12 9v6'],
  winter: ['M12 2v20', 'M3.3 7l17.4 10', 'M3.3 17L20.7 7', 'M9 4l3 2 3-2', 'M9 20l3-2 3 2'],
  drought: ['M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', 'M12 2v2', 'M12 20v2', 'M2 12h2', 'M20 12h2', 'M4.9 4.9l1.4 1.4', 'M17.7 17.7l1.4 1.4', 'M4.9 19.1l1.4-1.4', 'M17.7 6.3l1.4-1.4'],
  other: ['M12 3l10 18H2z', 'M12 10v4', 'M12 17.5v.5'],
  pin: ['M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21z', 'M12 7a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z'],
  refresh: ['M20 12a8 8 0 1 1-2.4-5.7', 'M20 4v5h-5'],
  chevronRight: ['M9 6l6 6-6 6'],
  chevronLeft: ['M15 6l-6 6 6 6'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  shieldCheck: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M9 12l2 2 4-4'],
  alert: ['M12 3l10 18H2z', 'M12 10v4', 'M12 17.5v.5'],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z'],
  globe: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M3 12h18', 'M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z'],
  location: ['M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z', 'M12 2v3', 'M12 19v3', 'M2 12h3', 'M19 12h3'],
  info: ['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z', 'M12 11v5', 'M12 7.5v.5'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
};

export function icon(name, size = 20) {
  const paths = P[name] ?? P.other;
  return `<svg class="i" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths.map((d) => `<path d="${d}"/>`).join('')}</svg>`;
}
