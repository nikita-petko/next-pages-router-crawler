export const UI_CONSTANTS = {
  MAX_VISIBLE_ROWS: 6.5,
  SCROLL_THRESHOLD: 10,
  LOAD_MORE_INCREMENT: 5,
  MAX_VISIBLE_PLACES: 3,
  ITEMS_PER_PAGE: 20,
  RESTART_CONFIRMED_DURATION_MS: 3000,
} as const;

export const POLLING_CONSTANTS = {
  INTERVAL_MS: 5000,
  DEBOUNCE_DELAY_MS: 500,
} as const;

export const VALIDATION_CONSTANTS = {
  BLEED_OFF_MIN_MINUTES: 1,
  BLEED_OFF_MAX_MINUTES_D: 60,
  BLEED_OFF_MAX_MINUTES: 240,
  PLAYER_COUNT_THRESHOLD_FOR_K_FORMAT: 1000,
} as const;

export const DATE_FORMAT_CONSTANTS = {
  LOCALE: 'en-US',
  DATE_OPTIONS: {
    month: 'short' as const,
    day: 'numeric' as const,
    year: 'numeric' as const,
  },
  TIME_OPTIONS: {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    hour12: true,
  },
} as const;

export const DEFAULT_VALUES = {
  PLACE_ID: 0,
  PUBLISHED_VERSION: 0,
  SERVERS: 0,
  OUTDATED_SERVERS: 0,
  PLAYERS: 0,
  PLAYERS_ON_OUTDATED: 0,
  ENGINE_VERSION: '0.000.0.0000000',
  OCCUPANCY: {
    CURRENT: 0,
    MAX: 0,
  },
  FRAME_RATE: 0,
  CREATE_TIME: new Date(),
  UPTIME: '00:00:00',
} as const;

export const DISPLAY_CONSTANTS = {
  EMPTY_PLACEHOLDER: '--',
} as const;

export const STEP_STATE_CONSTANTS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

export const DOCUMENTATION_CONSTANTS = {
  SERVER_RESTART_DOCS: '/docs/production/publishing/publish-experiences-and-places#release-updates',
} as const;

export const PAGINATION_CONSTANTS = {
  ROWS_PER_PAGE_OPTIONS: [10, 25, 50, 100],
} as const;
