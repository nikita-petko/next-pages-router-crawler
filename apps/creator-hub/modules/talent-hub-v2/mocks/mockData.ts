import type {
  ApiApplication,
  ApiApplicationListItem,
  ApiTalentProfile,
  Job,
  ListJobsResponse,
  ListStudiosResponse,
  Studio,
  TalentSignalResponse,
} from '../types';

type MockStudio = Studio & { group?: string | null };
type MockApplicationListItem = ApiApplicationListItem & { talentUsername?: string | null };

export const MOCK_STUDIO_V2: MockStudio = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Voldex',
  logo: null,
  email: 'careers@voldex.com',
  description: 'Driving Empire NFL Universe Football Brookhaven',
  teamSize: 3,
  location: 'Toronto, Canada',
  groupId: 4999963,
  group: 'https://www.roblox.com/communities/4999963/Driving-Empire-by-Voldex',
  website: 'https://www.voldex.com',
  atsLink: 'https://voldex.com/careers',
  topExperienceUniverseIds: [3351674303, 4924922222, 2338325648, 13415948659],
  createdAt: new Date('2025-06-01T00:00:00Z'),
  // The real API returns `permissions` alongside each studio via the
  // `…WithPermissions` variant. Mock the caller as an owner so edit/manage
  // flows are exercisable with `?mocks=1`.
  permissions: ['read', 'write'],
};

/** Baseline studio payload for the mock `apiStudiosPost` path (`useCreateStudio` with mocks on). */
export const MOCK_CREATE_STUDIO_RESPONSE: MockStudio = {
  ...MOCK_STUDIO_V2,
  id: '00000000-0000-0000-0000-00000000c0de',
  name: 'Mock Created Studio',
  email: 'created@mock.studio',
};

const MOCK_STUDIO_GAMEFAM: MockStudio = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Gamefam Studios',
  logo: null,
  email: 'careers@gamefam.com',
  description:
    'Gamefam is the leading publisher of games on Roblox, operating titles with billions of visits including All Star Tower Defense, Twilight Daycare, and more.',
  teamSize: 3,
  location: 'Los Angeles, CA',
  groupId: 6742246,
  group: 'https://www.roblox.com/communities/6742246/Gamefam',
  website: 'https://www.gamefam.com',
  atsLink: 'https://gamefam.com/careers',
  topExperienceUniverseIds: [4996049426, 7551121821, 10963827863],
  createdAt: new Date('2025-03-15T00:00:00Z'),
};

const MOCK_STUDIO_UPLIFT: MockStudio = {
  id: '00000000-0000-0000-0000-000000000003',
  name: 'Uplift Games',
  logo: null,
  email: 'hello@upliftgames.com',
  description:
    'Creators of Adopt Me!, one of the most popular games on Roblox with over 30 billion visits. We build social experiences for families and friends.',
  teamSize: 2,
  location: 'London, UK',
  groupId: 295182,
  group: 'https://www.roblox.com/communities/295182/Uplift-Games',
  website: 'https://www.upliftgames.com',
  atsLink: null,
  topExperienceUniverseIds: [920587237],
  createdAt: new Date('2025-01-20T00:00:00Z'),
};

const MOCK_STUDIO_BADIMO: MockStudio = {
  id: '00000000-0000-0000-0000-000000000004',
  name: 'Badimo',
  logo: null,
  email: 'contact@badimo.com',
  description:
    'Developers of Jailbreak, one of the most iconic games on Roblox. Over 7 billion visits and counting.',
  teamSize: 0,
  groupId: 3059674,
  group: 'https://www.roblox.com/communities/3059674/Badimo',
  website: 'https://www.badimo.com',
  atsLink: null,
  topExperienceUniverseIds: [606849621],
  createdAt: new Date('2025-01-10T00:00:00Z'),
};

const MOCK_STUDIO_SUPERSOCIAL: MockStudio = {
  id: '00000000-0000-0000-0000-000000000005',
  name: 'SuperSocial',
  logo: null,
  email: 'jobs@supersocial.com',
  description:
    'SuperSocial builds social games for the metaverse. Our titles include Ghostopia and Mermaid Life, reaching millions of players every month.',
  teamSize: 1,
  groupId: 6807398,
  group: 'https://www.roblox.com/communities/6807398/play-ghostopia',
  website: 'https://supersocial.com',
  atsLink: null,
  topExperienceUniverseIds: [10704789056, 2727067538],
  createdAt: new Date('2025-01-08T00:00:00Z'),
};

const MOCK_STUDIO_WONDER_WORKS: MockStudio = {
  id: '00000000-0000-0000-0000-000000000006',
  name: 'Wonder Works Studio',
  logo: null,
  email: 'recruiting@wonderworks.gg',
  description:
    'Wonder Works develops immersive story-driven games on Roblox. Our flagship titles average 50K+ concurrent users on weekends.',
  teamSize: 2,
  groupId: 6258143,
  group: 'https://www.roblox.com/communities/6258143/Wonder-Works-Studio',
  website: 'https://wonderworks.gg',
  atsLink: 'https://wonderworks.gg/careers',
  topExperienceUniverseIds: [4282985734, 4639625707, 370731277],
  createdAt: new Date('2025-01-05T00:00:00Z'),
};

export const MOCK_STUDIOS_V2: Studio[] = [
  MOCK_STUDIO_V2,
  MOCK_STUDIO_GAMEFAM,
  MOCK_STUDIO_UPLIFT,
  MOCK_STUDIO_BADIMO,
  MOCK_STUDIO_SUPERSOCIAL,
  MOCK_STUDIO_WONDER_WORKS,
];

/**
 * Sample universes for the experience search combobox in mocks mode. Includes
 * a mix of well-known names plus a numeric-id case so the typeahead can be
 * exercised by typing either text or an id prefix locally with `?mocks=1`.
 */
export const MOCK_UNIVERSES_FOR_SEARCH: ReadonlyArray<{
  id: number;
  name: string;
  rootPlaceId: number;
}> = [
  { id: 3351674303, name: 'Driving Empire', rootPlaceId: 2470481355 },
  { id: 4924922222, name: 'NFL Universe Football', rootPlaceId: 9472213095 },
  { id: 2338325648, name: 'Brookhaven RP', rootPlaceId: 4924922222 },
  { id: 920587237, name: 'Adopt Me!', rootPlaceId: 920587237 },
  { id: 4996049426, name: 'All Star Tower Defense', rootPlaceId: 4996049426 },
  { id: 7551121821, name: 'Twilight Daycare', rootPlaceId: 7551121821 },
  { id: 606849621, name: 'Jailbreak', rootPlaceId: 606849621 },
  { id: 4282985734, name: 'Anime Fighters Simulator', rootPlaceId: 4282985734 },
  { id: 10704789056, name: 'Pet Simulator 99', rootPlaceId: 10704789056 },
  { id: 13415948659, name: 'Football Brookhaven', rootPlaceId: 13415948659 },
];

export const MOCK_JOBS_V2: Job[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    studioId: MOCK_STUDIO_V2.id,
    title: 'Software Engineer - Driving Empire',
    _function: 0,
    jobType: 0,
    location: 'Remote',
    applyMethod: 'mailto:careers@voldex.com',
    description:
      'Build core vehicle physics and open-world systems for Driving Empire.\n\nWork location: Worldwide',
    responsibilities: 'Ship features, improve performance, and collaborate cross-functionally.',
    qualifications: '5+ years of engineering experience.',
    status: 0,
    updatedAt: new Date('2026-02-10T00:00:00Z'),
    createdAt: new Date('2026-01-20T00:00:00Z'),
    studio: MOCK_STUDIO_V2,
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    studioId: MOCK_STUDIO_GAMEFAM.id,
    title: 'UGC Artist - All Star Tower Defense',
    _function: 1,
    jobType: 0,
    location: 'Remote',
    applyMethod: 'careers@gamefam.com',
    description: 'Create 3D characters, towers, and environments for ASTD.',
    responsibilities: 'Model, texture, and optimize assets for Roblox.',
    qualifications: 'Strong Blender or Maya skills, portfolio required.',
    status: 0,
    updatedAt: new Date('2026-02-09T00:00:00Z'),
    createdAt: new Date('2026-01-18T00:00:00Z'),
    studio: MOCK_STUDIO_GAMEFAM,
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    studioId: MOCK_STUDIO_UPLIFT.id,
    title: 'Game Producer - Adopt Me',
    _function: 2,
    jobType: 0,
    location: 'Remote',
    applyMethod: 'hello@upliftgames.com',
    description: 'Drive feature delivery and coordinate across disciplines for Adopt Me.',
    responsibilities: 'Manage sprint planning, stakeholder comms, and release cadence.',
    qualifications: '3+ years production experience, shipped at least one live game.',
    status: 0,
    updatedAt: new Date('2026-02-08T00:00:00Z'),
    createdAt: new Date('2026-01-15T00:00:00Z'),
    studio: MOCK_STUDIO_UPLIFT,
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    studioId: MOCK_STUDIO_GAMEFAM.id,
    title: 'Software Engineer - Gym League',
    _function: 0,
    jobType: 0,
    location: 'Remote',
    applyMethod: 'careers@gamefam.com',
    description: 'Build multiplayer competitive systems and leaderboards.',
    responsibilities: 'Write performant Luau code and integrate networking.',
    qualifications: 'Experience with Roblox development or game engines.',
    status: 0,
    updatedAt: new Date('2026-02-07T00:00:00Z'),
    createdAt: new Date('2026-01-12T00:00:00Z'),
    studio: MOCK_STUDIO_GAMEFAM,
  },
  {
    id: '00000000-0000-0000-0000-000000000105',
    studioId: MOCK_STUDIO_SUPERSOCIAL.id,
    title: 'Community Manager - Ghostopia',
    _function: 5,
    jobType: 0,
    location: 'Remote',
    applyMethod: 'jobs@supersocial.com',
    description: 'Grow our community across social platforms.',
    responsibilities: 'Create content calendars, manage Discord, and run campaigns.',
    qualifications: 'Experience growing gaming communities, strong writing skills.',
    status: 0,
    updatedAt: new Date('2026-02-06T00:00:00Z'),
    createdAt: new Date('2026-01-10T00:00:00Z'),
    studio: MOCK_STUDIO_SUPERSOCIAL,
  },
  {
    id: '00000000-0000-0000-0000-000000000106',
    studioId: MOCK_STUDIO_BADIMO.id,
    title: 'Software Engineer - Jailbreak',
    _function: 0,
    jobType: 0,
    location: 'Remote',
    applyMethod: 'contact@badimo.com',
    description: 'Build heist mechanics, vehicles, and open-world systems.',
    responsibilities: 'Implement game mechanics and maintain live ops.',
    qualifications: 'Lua/Luau proficiency, passion for open-world games.',
    status: 0,
    updatedAt: new Date('2026-02-04T00:00:00Z'),
    createdAt: new Date('2026-01-08T00:00:00Z'),
    studio: MOCK_STUDIO_BADIMO,
  },
  {
    id: '00000000-0000-0000-0000-000000000107',
    studioId: MOCK_STUDIO_V2.id,
    title: 'Backend Engineer - Brookhaven',
    _function: 0,
    jobType: 0,
    location: 'Remote',
    applyMethod: 'mailto:careers@voldex.com',
    description: 'Design and build backend services for the most-visited game on Roblox.',
    responsibilities: 'Own services, scaling, and reliability.',
    qualifications: '3+ years of backend experience.',
    status: 0,
    updatedAt: new Date('2026-02-05T00:00:00Z'),
    createdAt: new Date('2026-01-10T00:00:00Z'),
    studio: MOCK_STUDIO_V2,
  },
  {
    id: '00000000-0000-0000-0000-000000000108',
    studioId: MOCK_STUDIO_V2.id,
    title: 'Data Analyst - NFL Universe Football',
    _function: 10,
    jobType: 0,
    location: 'Remote',
    applyMethod: 'mailto:careers@voldex.com',
    description: 'Analyze player behavior and economy health for NFL Universe.',
    responsibilities: 'Build dashboards and actionable insights.',
    qualifications: 'SQL proficiency and analytics experience.',
    // Closed mock posting so `/hire/my-studio/jobs` can exercise the Closed tab styling.
    status: 1,
    updatedAt: new Date('2026-01-20T00:00:00Z'),
    createdAt: new Date('2026-01-05T00:00:00Z'),
    studio: MOCK_STUDIO_V2,
  },
];

export const MOCK_JOBS_RESPONSE_V2: ListJobsResponse = {
  jobs: MOCK_JOBS_V2,
  nextPageToken: undefined,
};

const FALLBACK_MOCK_JOB_ID = '00000000-0000-0000-0000-000000020001';
const MOCK_JOB_ID_0 = MOCK_JOBS_V2[0]?.id ?? FALLBACK_MOCK_JOB_ID;
const MOCK_JOB_ID_1 = MOCK_JOBS_V2[1]?.id ?? '00000000-0000-0000-0000-000000020002';
const MOCK_JOB_ID_2 = MOCK_JOBS_V2[2]?.id ?? '00000000-0000-0000-0000-000000020003';
const MOCK_JOB_ID_3 = MOCK_JOBS_V2[3]?.id ?? '00000000-0000-0000-0000-000000020004';
const MOCK_JOB_ID_4 = MOCK_JOBS_V2[4]?.id ?? '00000000-0000-0000-0000-000000020005';
const MOCK_JOB_ID_5 = MOCK_JOBS_V2[5]?.id ?? '00000000-0000-0000-0000-000000020006';
const MOCK_JOB_ID_6 = MOCK_JOBS_V2[6]?.id ?? '00000000-0000-0000-0000-000000020007';
const MOCK_JOB_ID_7 = MOCK_JOBS_V2[7]?.id ?? '00000000-0000-0000-0000-000000020008';

export const MOCK_STUDIOS_RESPONSE_V2: ListStudiosResponse = {
  studios: MOCK_STUDIOS_V2,
  nextPageToken: undefined,
};

export const MOCK_TALENT_PROFILE_V2: ApiTalentProfile = {
  userId: 123456,
  displayName: 'Jordan Rivera',
  contactEmail: 'jordan.rivera@example.com',
  bio: 'Gameplay engineer focused on scalable Roblox systems, monetization loops, and analytics-driven features.',
  location: 'Austin, TX',
  website: 'https://portfolio.example.com',
  jobFunctions: [0, 1],
  availabilityStatus: 0,
  preferredJobType: 0,
  yearsOfExperience: 5,
  skillTags: ['Luau', 'Analytics', 'Live ops'],
  workExperiences: [
    {
      universeId: 11156779721,
      title: 'Sword Burst 3',
      description: null,
      startDate: null,
      endDate: null,
    },
    {
      universeId: 3233893879,
      title: 'Islands',
      description: null,
      startDate: null,
      endDate: null,
    },
    {
      universeId: 65241,
      title: 'MeepCity',
      description: null,
      startDate: null,
      endDate: null,
    },
  ],
  createdAt: new Date('2026-02-01T00:00:00Z'),
  updatedAt: new Date('2026-02-10T00:00:00Z'),
};

// Multiple applicants against the Driving Empire job so we exercise the
// read/unread/starred variants in the applications table with `?mocks=1`.
const DRIVING_EMPIRE_JOB_TITLE = MOCK_JOBS_V2[0].title ?? 'Driving Empire — Gameplay Engineer';

export const MOCK_APPLICATION_LIST_ITEMS: MockApplicationListItem[] = [
  {
    id: '00000000-0000-0000-0000-000000040001',
    jobTitle: DRIVING_EMPIRE_JOB_TITLE,
    studioName: MOCK_STUDIO_V2.name ?? 'Voldex',
    talentName: 'Taylor Rivers',
    talentUsername: 'TaylorBuilds',
    talentUserId: 123456,
    createdAt: new Date('2026-03-16T12:00:00Z'),
    viewed: false,
    favorite: false,
  },
  {
    id: '00000000-0000-0000-0000-000000040002',
    jobTitle: DRIVING_EMPIRE_JOB_TITLE,
    studioName: MOCK_STUDIO_V2.name ?? 'Voldex',
    talentName: 'Morgan Patel',
    talentUsername: 'MorganMakes',
    talentUserId: 234567,
    createdAt: new Date('2026-03-16T11:30:00Z'),
    viewed: false,
    favorite: false,
  },
  {
    id: '00000000-0000-0000-0000-000000040003',
    jobTitle: DRIVING_EMPIRE_JOB_TITLE,
    studioName: MOCK_STUDIO_V2.name ?? 'Voldex',
    talentName: 'Alex Chen',
    talentUsername: 'AlexCreates',
    talentUserId: 345678,
    createdAt: new Date('2026-03-16T09:00:00Z'),
    viewed: true,
    favorite: true,
  },
  {
    id: '00000000-0000-0000-0000-000000040004',
    jobTitle: DRIVING_EMPIRE_JOB_TITLE,
    studioName: MOCK_STUDIO_V2.name ?? 'Voldex',
    talentName: 'Samira Okafor',
    talentUsername: 'SamiraStudio',
    talentUserId: 456789,
    createdAt: new Date('2026-03-15T18:00:00Z'),
    viewed: true,
    favorite: false,
  },
  {
    id: '00000000-0000-0000-0000-000000040005',
    jobTitle: DRIVING_EMPIRE_JOB_TITLE,
    studioName: MOCK_STUDIO_V2.name ?? 'Voldex',
    talentName: 'Devon Blake',
    talentUsername: 'DevonDev',
    talentUserId: 567890,
    createdAt: new Date('2026-03-14T14:00:00Z'),
    viewed: true,
    favorite: true,
  },
  {
    id: '00000000-0000-0000-0000-000000040006',
    jobTitle: DRIVING_EMPIRE_JOB_TITLE,
    studioName: MOCK_STUDIO_V2.name ?? 'Voldex',
    talentName: 'Riley Quinn',
    talentUsername: 'RileyRoblox',
    talentUserId: 678901,
    createdAt: new Date('2026-03-14T10:00:00Z'),
    viewed: true,
    favorite: false,
  },
  {
    id: '00000000-0000-0000-0000-000000040007',
    jobTitle: MOCK_JOBS_V2[1]?.title ?? 'Brookhaven — Environment Artist',
    studioName: MOCK_STUDIO_GAMEFAM.name ?? 'Gamefam',
    talentName: 'Jordan Lee',
    talentUsername: 'JordanUGC',
    talentUserId: 654321,
    createdAt: new Date('2026-02-08T12:00:00Z'),
    viewed: true,
    favorite: true,
  },
];

const MOCK_APPLICANT_NAMES = [
  'Taylor Rivers',
  'Morgan Patel',
  'Alex Chen',
  'Samira Okafor',
  'Devon Blake',
  'Riley Quinn',
  'Jordan Lee',
  'Avery Kim',
  'Cameron Diaz',
  'Parker Shah',
  'Jamie Alvarez',
  'Skyler Reed',
  'Emerson Gray',
  'Rowan Diaz',
  'Casey Morgan',
  'Drew Harper',
  'Noa Bennett',
  'Kai Sullivan',
] as const;

const MOCK_APPLICANT_USERNAMES = [
  'TaylorBuilds',
  'MorganMakes',
  'AlexCreates',
  'SamiraStudio',
  'DevonDev',
  'RileyRoblox',
  'JordanUGC',
  'AveryArts',
  'CameronCodes',
  'ParkerPlays',
  'JamieJams',
  'SkylerScripts',
  'EmersonEnv',
  'RowanRenders',
  'CaseyCreates',
  'DrewDesigns',
  'NoaNodes',
  'KaiKinetics',
] as const;

type BuildStudioMockApplicationsArgs = {
  jobTitle: string;
  studioName: string;
  count: number;
  idSeed: number;
  userSeed: number;
};

function buildStudioMockApplications({
  jobTitle,
  studioName,
  count,
  idSeed,
  userSeed,
}: BuildStudioMockApplicationsArgs): MockApplicationListItem[] {
  return Array.from({ length: count }, (_, idx) => {
    const idValue = String(idSeed + idx).padStart(12, '0');
    const createdAt = new Date(Date.UTC(2026, 2, 16 - idx, 20 - (idx % 8), 0, 0));
    return {
      id: `00000000-0000-0000-0000-${idValue}`,
      jobTitle,
      studioName,
      talentName: MOCK_APPLICANT_NAMES[idx % MOCK_APPLICANT_NAMES.length],
      talentUsername: MOCK_APPLICANT_USERNAMES[idx % MOCK_APPLICANT_USERNAMES.length],
      talentUserId: userSeed + idx,
      createdAt,
      viewed: idx % 3 !== 0,
      favorite: idx % 4 === 0,
    };
  });
}

export const MOCK_STUDIO_APPLICATIONS_BY_JOB_ID: Record<string, ApiApplicationListItem[]> = {
  [MOCK_JOB_ID_0]: buildStudioMockApplications({
    jobTitle: MOCK_JOBS_V2[0]?.title ?? 'Software Engineer - Driving Empire',
    studioName: MOCK_STUDIO_V2.name ?? 'Voldex',
    count: 6,
    idSeed: 410000,
    userSeed: 810000,
  }),
  [MOCK_JOB_ID_1]: buildStudioMockApplications({
    jobTitle: MOCK_JOBS_V2[1]?.title ?? 'UGC Artist - All Star Tower Defense',
    studioName: MOCK_STUDIO_GAMEFAM.name ?? 'Gamefam Studios',
    count: 3,
    idSeed: 420000,
    userSeed: 820000,
  }),
  [MOCK_JOB_ID_2]: buildStudioMockApplications({
    jobTitle: MOCK_JOBS_V2[2]?.title ?? 'Game Producer - Adopt Me',
    studioName: MOCK_STUDIO_UPLIFT.name ?? 'Uplift Games',
    count: 1,
    idSeed: 430000,
    userSeed: 830000,
  }),
  [MOCK_JOB_ID_3]: [],
  [MOCK_JOB_ID_4]: buildStudioMockApplications({
    jobTitle: MOCK_JOBS_V2[4]?.title ?? 'Community Manager - Ghostopia',
    studioName: MOCK_STUDIO_SUPERSOCIAL.name ?? 'SuperSocial',
    count: 2,
    idSeed: 440000,
    userSeed: 840000,
  }),
  [MOCK_JOB_ID_5]: buildStudioMockApplications({
    jobTitle: MOCK_JOBS_V2[5]?.title ?? 'Software Engineer - Jailbreak',
    studioName: MOCK_STUDIO_BADIMO.name ?? 'Badimo',
    count: 8,
    idSeed: 450000,
    userSeed: 850000,
  }),
  // My studio jobs list in mocks (`Voldex`) currently shows these three jobs.
  [MOCK_JOB_ID_6]: buildStudioMockApplications({
    jobTitle: MOCK_JOBS_V2[6]?.title ?? 'Backend Engineer - Brookhaven',
    studioName: MOCK_STUDIO_V2.name ?? 'Voldex',
    count: 12,
    idSeed: 460000,
    userSeed: 860000,
  }),
  [MOCK_JOB_ID_7]: buildStudioMockApplications({
    jobTitle: MOCK_JOBS_V2[7]?.title ?? 'Data Analyst - Brookhaven',
    studioName: MOCK_STUDIO_V2.name ?? 'Voldex',
    count: 4,
    idSeed: 470000,
    userSeed: 870000,
  }),
};

const SECOND_MOCK_JOB_TITLE = MOCK_JOBS_V2[1]?.title;
const appliedApplicationJobIdById = MOCK_APPLICATION_LIST_ITEMS.reduce<Record<string, string>>(
  (acc, item) => {
    if (!item.id) {
      return acc;
    }
    acc[item.id] = item.jobTitle === SECOND_MOCK_JOB_TITLE ? MOCK_JOB_ID_1 : MOCK_JOB_ID_0;
    return acc;
  },
  {},
);

const studioApplicationJobIdById = Object.entries(MOCK_STUDIO_APPLICATIONS_BY_JOB_ID).reduce<
  Record<string, string>
>((acc, [jobId, items]) => {
  items.forEach((item) => {
    if (item.id) {
      acc[item.id] = jobId;
    }
  });
  return acc;
}, {});

export const MOCK_APPLICATION_JOB_ID_BY_ID: Record<string, string> = {
  ...appliedApplicationJobIdById,
  ...studioApplicationJobIdById,
};

export const MOCK_APPLICATION_DETAIL: ApiApplication = {
  id: '00000000-0000-0000-0000-000000040001',
  jobId: MOCK_JOB_ID_0,
  userId: 123456,
  resumeId: 'mock-resume-1',
  status: 0,
  consentToShareSignal: false,
  favorite: false,
  lastViewedAt: undefined,
  createdAt: new Date('2026-02-10T12:00:00Z'),
  talentProfile: MOCK_TALENT_PROFILE_V2,
};

export const MOCK_TALENT_SIGNAL_SELF_RESPONSE: TalentSignalResponse = {
  studioStartDate: new Date('2024-01-01T00:00:00Z'),
  studioTimespentMinutes: 4096,
  studioTop2yExperiences: [
    {
      universeId: 11156779721,
      timespentMinutes: 1560,
      rank: 1,
    },
    {
      universeId: 3233893879,
      timespentMinutes: 1024,
      rank: 2,
    },
    {
      universeId: 65241,
      timespentMinutes: 900,
      rank: 3,
    },
  ],
};

export const MOCK_TALENT_SIGNAL_APPLICATION_RESPONSE: TalentSignalResponse = {
  studioStartDate: new Date('2024-10-10T00:00:00Z'),
  studioTimespentMinutes: 8192,
  studioTop2yExperiences: [
    {
      universeId: 4996049426,
      timespentMinutes: 4096,
      rank: 1,
    },
    {
      universeId: 7551121821,
      timespentMinutes: 2048,
      rank: 2,
    },
    {
      universeId: 10963827863,
      timespentMinutes: 1024,
      rank: 3,
    },
  ],
};
