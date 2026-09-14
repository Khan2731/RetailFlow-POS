export const PAKISTAN_TIME_ZONE = 'Asia/Karachi';

export const parseApiDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  const text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const dateOnly = new Date(`${text}T00:00:00`);
    return Number.isNaN(dateOnly.getTime()) ? null : dateOnly;
  }

  const utcTimestamp = `${text.replace(' ', 'T')}Z`;
  const date = /(?:Z|[+-]\d{2}:?\d{2})$/.test(text)
    ? new Date(text)
    : new Date(utcTimestamp);

  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatApiDateTime = (value) => {
  const date = parseApiDate(value);
  return date ? date.toLocaleString([], { timeZone: PAKISTAN_TIME_ZONE, hour12: true }) : '—';
};

export const formatApiTime = (value, options = {}) => {
  const date = parseApiDate(value);
  return date
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: PAKISTAN_TIME_ZONE, ...options, hour12: true })
    : '—';
};

export const getPakistanDate = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: PAKISTAN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export const getBusinessDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PAKISTAN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  const calendarDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  if (Number(parts.hour) * 60 + Number(parts.minute) >= 11 * 60) return getPakistanDate(date);
  calendarDate.setUTCDate(calendarDate.getUTCDate() - 1);
  return calendarDate.toISOString().slice(0, 10);
};
