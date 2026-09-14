const TIME_ZONE = 'Asia/Karachi';

const getPakistanDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date);

const getPakistanTimeParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  return parts;
};

const getBusinessDate = (date = new Date()) => {
  const parts = getPakistanTimeParts(date);
  const currentDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  if (minutes >= 11 * 60) return getPakistanDate(date);
  currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  return currentDate.toISOString().slice(0, 10);
};

module.exports = { TIME_ZONE, getPakistanDate, getPakistanTimeParts, getBusinessDate };
