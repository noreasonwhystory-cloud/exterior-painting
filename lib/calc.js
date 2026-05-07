import pricing from './pricing.json' with { type: 'json' };

const SCORE = { safe: 0, mild: 1, medium: 2, severe: 3 };

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

function sumRepair(det) {
  let sum = 0;
  for (const [item, level] of Object.entries(det || {})) {
    const cost = pricing.deterioration?.[item]?.[level];
    if (typeof cost === 'number') sum += cost;
  }
  return sum;
}

function scoreOf(det) {
  let s = 0;
  for (const level of Object.values(det || {})) {
    s += SCORE[level] ?? 0;
  }
  return s;
}

function pickIssues(det) {
  const items = pricing.labels.items;
  const levels = pricing.labels.levels;
  const out = [];
  for (const [item, level] of Object.entries(det || {})) {
    if (level && level !== 'safe') {
      out.push({ item, level, label: `${items[item]}: ${levels[level]}` });
    }
  }
  return out;
}

function roundMan(yen) {
  return Math.round(yen / 10000) * 10000;
}

export function calc(tsubo, det) {
  const m2 = Math.round(tsubo * pricing.tsuboToM2 * pricing.wallRatio);
  const baseS = interpolate(tsubo, 'silicon');
  const baseF = interpolate(tsubo, 'fluorine');
  const repair = sumRepair(det);
  const silicon = baseS + repair;
  const fluorine = baseF + repair;
  const ratio = pricing.priceRangeRatio;
  const score = scoreOf(det);
  const riskKey = score <= 3 ? 'low' : score <= 8 ? 'mid' : 'high';
  return {
    tsubo,
    m2,
    siliconLow: roundMan(silicon * (1 - ratio)),
    siliconHigh: roundMan(silicon * (1 + ratio)),
    fluorineLow: roundMan(fluorine * (1 - ratio)),
    fluorineHigh: roundMan(fluorine * (1 + ratio)),
    repair,
    score,
    riskKey,
    riskMessage: pricing.riskMessage[riskKey],
    issues: pickIssues(det),
  };
}
