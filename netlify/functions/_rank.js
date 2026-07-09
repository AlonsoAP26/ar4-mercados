const RANK_ORDER = { basico: 0, vip: 1, premium: 2, elite: 3, administrador: 4 };

function effectiveRank(storedRank, isPremiumPaid) {
  const base = RANK_ORDER.hasOwnProperty(storedRank) ? RANK_ORDER[storedRank] : 0;
  const premiumFloor = isPremiumPaid ? RANK_ORDER.premium : 0;
  const order = Math.max(base, premiumFloor);
  return Object.keys(RANK_ORDER).find((k) => RANK_ORDER[k] === order);
}

function atLeast(rank, minRank) {
  return RANK_ORDER[rank] >= RANK_ORDER[minRank];
}

module.exports = { RANK_ORDER, effectiveRank, atLeast };
