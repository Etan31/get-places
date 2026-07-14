const COLUMNS = [
  ['shopName', 'Shop Name'],
  ['email', 'Email'],
  ['number', 'Number'],
  ['accountLink', 'Account Link(FB, Tiktok, IG)'],
  ['facebookLink', 'Facebook Link'],
  ['category', 'Category'],
  ['location', 'Location'],
  ['mapsUrl', 'Google Maps Link']
];

export function toCsv(rows) {
  const header = COLUMNS.map(([, label]) => escapeCsv(label)).join(',');
  const body = rows.map((row) => COLUMNS.map(([key]) => escapeCsv(row[key] || '-')).join(','));
  return [header, ...body].join('\n');
}

function escapeCsv(value) {
  const normalized = String(value ?? '-').replace(/\r?\n/g, ' ').trim() || '-';
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}
