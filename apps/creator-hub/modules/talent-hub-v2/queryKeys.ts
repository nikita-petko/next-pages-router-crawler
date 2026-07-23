const ROOT = 'talent-hub-v2' as const;

export const th2QueryKeys = {
  jobs: {
    all: [ROOT, 'jobs'] as const,
    list: (params: object, mocks: boolean) => [ROOT, 'jobs', params, { mocks }] as const,
    detail: (id: string, mocks: boolean) => [ROOT, 'jobs', 'detail', id, { mocks }] as const,
    detailPlaceholder: [ROOT, 'jobs', 'detail', 'none'] as const,
  },
  studios: {
    all: [ROOT, 'studios'] as const,
    list: (params: object, mocks: boolean) => [ROOT, 'studios', params, { mocks }] as const,
    detail: (id: string, mocks: boolean) => [ROOT, 'studios', 'detail', id, { mocks }] as const,
    detailPlaceholder: [ROOT, 'studios', 'detail', 'none'] as const,
  },
  myStudios: {
    all: [ROOT, 'my-studios'] as const,
    list: (mocks: boolean, groupId?: string | number) =>
      [ROOT, 'my-studios', { mocks, groupId }] as const,
  },
  inbox: {
    all: [ROOT, 'inbox'] as const,
    list: (mocks: boolean) => [ROOT, 'inbox', { mocks }] as const,
  },
  studioInbox: {
    all: [ROOT, 'studio-inbox'] as const,
    list: (studioId: string, mocks: boolean) =>
      [ROOT, 'studio-inbox', studioId, { mocks }] as const,
  },
  applications: {
    all: [ROOT, 'applications'] as const,
    list: (params?: object) => [ROOT, 'applications', 'list', params ?? {}] as const,
    detail: (id: string) => [ROOT, 'applications', id] as const,
    detailPlaceholder: [ROOT, 'applications', 'none'] as const,
  },
  talentProfile: {
    all: [ROOT, 'talent-profile'] as const,
    profile: (id: string) => [ROOT, 'talent-profile', id] as const,
    me: () => [ROOT, 'talent-profile', 'me'] as const,
    placeholder: [ROOT, 'talent-profile', 'none'] as const,
  },
  signals: {
    detail: (username: string, mocks: boolean) => [ROOT, 'signals', username, { mocks }] as const,
  },
  talentSignals: {
    detail: (variant: 'self' | 'application', applicationId: string | null, mocks: boolean) =>
      [ROOT, 'talent-signal', { mocks, variant, applicationId }] as const,
  },
  gameDetails: {
    list: (universeIds: number[]) => [ROOT, 'game-details', universeIds] as const,
  },
  resumes: {
    all: [ROOT, 'resumes'] as const,
    list: (mocks: boolean) => [ROOT, 'resumes', { mocks }] as const,
  },
  ageVerification: {
    user: (userId: number) => [ROOT, 'age-verification', userId] as const,
    placeholder: [ROOT, 'age-verification', 'none'] as const,
  },
} as const;
