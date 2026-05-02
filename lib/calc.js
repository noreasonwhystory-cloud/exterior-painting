import pricing from './pricing.json' with { type: 'json' };

function interpolate(tsubo, key) {
  const table = pricing.table;
  if (tsubo <= table[0].tsubo) return table[0][key];
  if (tsubo >= table[table.length - 1].tsubo) {
    const last = table[table.length - 1];
    const prev = table[table.length - 2];
    const slope = (last[key] - prev[key]) / (last.tsubo - prev.tsubo);
    return last[key] + slope * (tsubo - last.tsubo);
  }
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i], b = table[i + 1];
    if (tsubo >= a.tsubo && tsubo <= b.tsubo) {
      const ratio = (tsubo - a.tsubo) / (b.tsubo - a.tsubo);
      return a[key] + (b[key] - a[key]) * ratio;
    }
  }
  return table[table.length - 1][key];
}

export function calc(tsubo) {
  const m2 = Math.round(tsubo * pricing.tsuboToM2 * pricing.wallRatio);
  const silicon = Math.round(interpolate(tsubo, 'silicon') / 10000) * 10000;
  const fluorine = Math.round(interpolate(tsubo, 'fluorine') / 10000) * 10000;
  return { tsubo, m2, silicon, fluorine };
}
