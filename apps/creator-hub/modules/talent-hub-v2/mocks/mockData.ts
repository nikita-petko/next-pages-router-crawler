import type {
  Job,
  Studio,
  ListJobsResponse,
  ListStudiosResponse,
} from '@rbx/clients/talentHubV2Service/v1';
import type { ApiInboxResponse, ApiStudioInboxResponse, ApiTalentProfile } from '../types';

type MockStudio = Studio & { group?: string | null };

export const MOCK_STUDIO_V2: MockStudio = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Voldex',
  logo: null,
  email: 'careers@voldex.com',
  description: 'Driving Empire NFL Universe Football Brookhaven',
  teamSize: 3,
  groupId: 4999963,
  group: 'https://www.roblox.com/communities/4999963/Driving-Empire-by-Voldex',
  website: 'https://www.voldex.com',
  socialLinks: ['https://x.com/vaborvoldex'],
  atsLink: 'https://voldex.com/careers',
  topExperienceUniverseIds: [3351674303, 4924922222, 2338325648, 13415948659],
  createdAt: new Date('2025-06-01T00:00:00Z'),
};

const MOCK_STUDIO_GAMEFAM: MockStudio = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Gamefam Studios',
  logo: null,
  email: 'careers@gamefam.com',
  description:
    'Gamefam is the leading publisher of games on Roblox, operating titles with billions of visits including All Star Tower Defense, Twilight Daycare, and more.',
  teamSize: 3,
  group: null,
  website: 'https://www.gamefam.com',
  socialLinks: ['https://x.com/gamefamstudios'],
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
  group: null,
  website: 'https://www.upliftgames.com',
  socialLinks: ['https://x.com/PlayAdoptMe'],
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
  group: null,
  website: 'https://www.badimo.com',
  socialLinks: ['https://x.com/badaborvoldex'],
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
  group: null,
  website: 'https://supersocial.com',
  socialLinks: ['https://x.com/supersaborvoldex'],
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
  group: null,
  website: 'https://wonderworks.gg',
  socialLinks: ['https://x.com/wonderworksstudio', 'https://youtube.com/wonderworksgames'],
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

export const MOCK_JOBS_V2: Job[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    studioId: MOCK_STUDIO_V2.id,
    title: 'Software Engineer - Driving Empire',
    _function: 0,
    jobType: 0,
    location: 'Remote',
    applyMethod: 'mailto:careers@voldex.com',
    description: 'Build core vehicle physics and open-world systems for Driving Empire.',
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
    status: 0,
    updatedAt: new Date('2026-01-20T00:00:00Z'),
    createdAt: new Date('2026-01-05T00:00:00Z'),
    studio: MOCK_STUDIO_V2,
  },
];

export const MOCK_JOBS_RESPONSE_V2: ListJobsResponse = {
  jobs: MOCK_JOBS_V2,
  nextPageToken: undefined,
};

export const MOCK_STUDIOS_RESPONSE_V2: ListStudiosResponse = {
  studios: MOCK_STUDIOS_V2,
  nextPageToken: undefined,
};

export const MOCK_TALENT_PROFILE_V2: ApiTalentProfile = {
  id: '00000000-0000-0000-0000-000000010001',
  userId: '00000000-0000-0000-0000-000000020001',
  fullName: 'Jordan Rivera',
  contactEmail: 'jordan.rivera@example.com',
  robloxUsername: 'JordanCreates',
  linkedInUrl: 'https://www.linkedin.com/in/jordanrivera',
  location: {
    country: 'United States',
    city: 'Austin',
  },
  relocationPreference: 'Remote only',
  aboutMe:
    'Gameplay engineer focused on scalable Roblox systems, monetization loops, and analytics-driven features.',
  resumeUrl: 'https://portfolio.example.com/resume.pdf',
  creationLinks: [
    'https://www.roblox.com/games/1234567890',
    'https://www.roblox.com/games/2345678901',
  ],
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-02-10T00:00:00Z',
};

export const MOCK_INBOX_RESPONSE_V2: ApiInboxResponse = {
  applications: [
    {
      id: '00000000-0000-0000-0000-000000020101',
      jobId: MOCK_JOBS_V2[0].id!,
      jobTitle: MOCK_JOBS_V2[0].title ?? '',
      studioName: MOCK_STUDIO_V2.name ?? '',
      status: 1,
      submittedAt: '2026-02-08T00:00:00Z',
      lastUpdatedAt: '2026-02-10T00:00:00Z',
      messagePreview: 'Thanks for applying. We will review your profile soon.',
    },
    {
      id: '00000000-0000-0000-0000-000000020102',
      jobId: MOCK_JOBS_V2[1].id!,
      jobTitle: MOCK_JOBS_V2[1].title ?? '',
      studioName: MOCK_STUDIO_GAMEFAM.name ?? '',
      status: 2,
      submittedAt: '2026-01-28T00:00:00Z',
      lastUpdatedAt: '2026-02-02T00:00:00Z',
      messagePreview: 'We would like to schedule a short interview.',
    },
    {
      id: '00000000-0000-0000-0000-000000020103',
      jobId: MOCK_JOBS_V2[2].id!,
      jobTitle: MOCK_JOBS_V2[2].title ?? '',
      studioName: MOCK_STUDIO_UPLIFT.name ?? '',
      status: 0,
      submittedAt: '2026-01-12T00:00:00Z',
      lastUpdatedAt: '2026-01-14T00:00:00Z',
      messagePreview: 'Application received.',
    },
  ],
};

export const MOCK_STUDIO_INBOX_RESPONSE: ApiStudioInboxResponse = {
  applicants: [
    {
      id: '00000000-0000-0000-0000-000000030001',
      jobId: MOCK_JOBS_V2[0].id!,
      jobTitle: MOCK_JOBS_V2[0].title ?? '',
      talentProfile: {
        id: '00000000-0000-0000-0000-000000010001',
        fullName: 'Jordan Rivera',
        robloxUsername: 'JordanCreates',
        contactEmail: 'jordan.rivera@example.com',
        aboutMe:
          'Gameplay engineer focused on scalable Roblox systems, monetization loops, and analytics-driven features.',
        location: { country: 'United States', city: 'Austin' },
        creationLinks: [
          'https://www.roblox.com/games/1234567890',
          'https://www.roblox.com/games/2345678901',
        ],
      },
      status: 0,
      submittedAt: '2026-02-08T00:00:00Z',
    },
    {
      id: '00000000-0000-0000-0000-000000030002',
      jobId: MOCK_JOBS_V2[0].id!,
      jobTitle: MOCK_JOBS_V2[0].title ?? '',
      talentProfile: {
        id: '00000000-0000-0000-0000-000000010002',
        fullName: 'Mia Chen',
        robloxUsername: 'MiaBuilds',
        contactEmail: 'mia.chen@example.com',
        aboutMe:
          'Full-stack developer with 4 years of Roblox Luau experience. Shipped 3 top-100 games.',
        location: { country: 'Canada', city: 'Vancouver' },
        creationLinks: ['https://www.roblox.com/games/3456789012'],
      },
      status: 0,
      submittedAt: '2026-02-06T00:00:00Z',
    },
    {
      id: '00000000-0000-0000-0000-000000030003',
      jobId: MOCK_JOBS_V2[6].id!,
      jobTitle: MOCK_JOBS_V2[6].title ?? '',
      talentProfile: {
        id: '00000000-0000-0000-0000-000000010003',
        fullName: 'Alex Kim',
        robloxUsername: 'AlexTheDev',
        contactEmail: 'alex.kim@example.com',
        aboutMe:
          'Backend engineer specializing in data pipelines, matchmaking, and server infrastructure on Roblox.',
        location: { country: 'United Kingdom', city: 'London' },
        creationLinks: [],
      },
      status: 0,
      submittedAt: '2026-02-04T00:00:00Z',
    },
    {
      id: '00000000-0000-0000-0000-000000030004',
      jobId: MOCK_JOBS_V2[7].id!,
      jobTitle: MOCK_JOBS_V2[7].title ?? '',
      talentProfile: {
        id: '00000000-0000-0000-0000-000000010004',
        fullName: 'Sam Patel',
        robloxUsername: 'SamAnalytics',
        contactEmail: 'sam.patel@example.com',
        aboutMe:
          'Data analyst with experience in player behavior modeling, SQL, and Tableau dashboards for live games.',
        location: { country: 'United States', city: 'Chicago' },
        creationLinks: [],
      },
      status: 0,
      submittedAt: '2026-02-01T00:00:00Z',
    },
  ],
};
