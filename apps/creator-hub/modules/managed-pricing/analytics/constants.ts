// Excluding various low population locations to reduce noise on the bar charts
// A few paying users or VPN users may be skewing the data for these locations
export const LOW_POPULATION_LOCATIONS = [
  'AQ',
  'BV',
  'HM',
  'TF',
  'UM',
  'PN',
  'TK',
  'NU',
  'FK',
  'SH',
  'BL',
  'TV',
  'NR',
  'CK',
  'PW',
  'IO',
  'AI',
  'WF',
  'SM',
  'GI',
  'VG',
  'TC',
  'MF',
  'MH',
  'KN',
  'AS',
  'MP',
  'FO',
  'KY',
  'DM',
  'BM',
  'GG',
  'IM',
  'AD',
  'AG',
  'PM',
  'JE',
  'VA',
  'GU',
  'NF',
];

// one month in milliseconds
export const DEFAULT_AGGREGATION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export const DEFAULT_LOW_PAYER_PENETRATION_THRESHOLD = 0.05; // 5%
