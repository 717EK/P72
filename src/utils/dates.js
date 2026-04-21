export const pad = (n) => String(n).padStart(2, '0');

export const dateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => dateKey(new Date());

export const daysBetween = (a, b) =>
  Math.round((b.getTime() - a.getTime()) / 86400000);

export const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

export const dayIndex = (startKey, key) =>
  daysBetween(parseKey(startKey), parseKey(key));

export const formatDate = (d) =>
  d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

export const formatClock = (d) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

export const msUntilMidnight = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - now.getTime();
};
