export const formatClock = (value) => {
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60).toString().padStart(2, '0');
  const seconds = (total % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const formatBest = (time, medal) => {
  if (time === null) return 'NO CLEAR';
  return `${formatClock(time)} ${medal ? medal.toUpperCase() : ''}`;
};
