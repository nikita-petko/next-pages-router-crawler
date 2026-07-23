import type { TIconProps } from '@rbx/foundation-ui';
import {
  itineraryChallengeImage,
  itineraryCafeImage,
  itineraryWorkshopsImage,
  speakerAvatar,
} from './assetConstants';

// Inspire landing data conventions:
// - Keep `workshopSessions` aligned with the official Creator Events page (INSPIRE_EVENTS_URL).
// - Speaker avatars and bios live in `featuredSpeakerEntries`; workshop cards use `speakerAvatar(slug)`.
// - `featuredSpeakers` order is derived from `workshopSessions` via `orderFeaturedSpeakersByWorkshops`
//   (chronological workshop order; café-only speakers follow via `CAFE_ONLY_SPEAKER_IDS`).

export type InspireItineraryItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  sectionId: string;
};

export type CafeLocation = {
  id: string;
  location: string;
  date: string;
  applyUrl: string;
};

export type WorkshopSpeaker = {
  name: string;
  image: string;
};

export type WorkshopSession = {
  id: string;
  title: string;
  topic: string;
  dateLabel: string;
  time: string;
  language: string;
  speakers: WorkshopSpeaker[];
};

export type ChallengeCategory = {
  id: string;
  title: string;
  description: string;
  iconName: TIconProps['name'];
};

export type ChallengeGuidelineSegment = {
  text: string;
  href?: string;
};

export type ChallengeGuideline = {
  id: string;
  segments: ChallengeGuidelineSegment[];
};

export type ChallengePrizeItem = {
  place: string;
  value: string;
};

export type ChallengePrizeGroup = {
  title: string;
  description?: string;
  items?: ChallengePrizeItem[];
};

export type Speaker = {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
  talks: string[];
};

export type HallOfFameEntry = {
  id: string;
  gameTitle: string;
  award: string;
  gameUrl: string;
  placeId: string;
};

export type FAQItemSegment = {
  text: string;
  href?: string;
};

export type FAQItem = {
  question: string;
  answer?: string;
  answerSegments?: FAQItemSegment[];
};

export const INSPIRE_EVENTS_URL = 'https://events.roblox.com/public/events/inspire-2026';

export const INSPIRE_CHALLENGE_WINDOW = 'Jul 31, 10 AM - Aug 3, 10 AM';

export const INSPIRE_HERO = {
  title: 'Roblox Inspire 2026',
  description:
    'Join 50,000+ creators worldwide! Attend a local café, level up with virtual workshops, and compete in the 72-hour Game Jam. Your creator journey starts here!',
};

export const ITINERARY_SECTION = {
  title: 'Itinerary',
  subtitle: 'A full month of programming for you to ship your novel game quickly.',
  learnMoreLabel: 'Learn more',
};

export const itineraryCards: InspireItineraryItem[] = [
  {
    id: 'cafe',
    title: 'Inspire Cafe',
    description:
      'Connect with your local community. Join us at an Inspire Cafe for a casual in-person gathering.',
    image: itineraryCafeImage,
    sectionId: 'inspire-cafe',
  },
  {
    id: 'workshops',
    title: 'Inspire Workshops',
    description:
      'Pick up the must-have skills to make your first game! Learn from top creators in the Roblox community.',
    image: itineraryWorkshopsImage,
    sectionId: 'inspire-workshops',
  },
  {
    id: 'challenge',
    title: 'Inspire Challenge',
    description:
      'Put your skills to the test! Form a team of 1-5 members and create a playable Roblox game from scratch.',
    image: itineraryChallengeImage,
    sectionId: 'inspire-challenge',
  },
];

export const CAFE_SECTION = {
  title: 'Inspire Café',
  subtitle:
    'Connect with your local community. Join us at an Inspire Cafe for a casual in-person gathering.',
  alertTitle: 'Application Required',
  alertDescription:
    'Each location has restricted availability, so you must apply for an invite early. Your participation is subject to approval, and you will receive an invite if selected.',
  applyLabel: 'Apply',
};

export const WORKSHOPS_SECTION = {
  title: 'Inspire Workshops',
  subtitle: 'Get the foundational skills you need to build your first game!',
  allTabLabel: 'All',
  registerLabel: 'Register',
  maxVisibleSpeakerAvatars: 3,
};

export const SPEAKERS_SECTION = {
  title: 'Featured speakers',
  talkLabel: 'Talk',
  initialVisibleCount: 9,
  seeMoreLabel: 'See more',
  seeLessLabel: 'See less',
};

export const HALL_OF_FAME_SECTION = {
  title: 'Hall of Fame',
  eyebrow: 'Inspire 2025 Challenge',
  viewGameLabel: 'View game',
};

export const EXCLUSIVE_AWARD = {
  title: 'Exclusive award',
  description:
    'Join at least one live challenge during any workshop to earn an exclusive virtual accessory reward!',
};

export const CHALLENGE_SECTION = {
  id: 'inspire-challenge',
  title: 'Inspire Challenge',
  subtitle: `Ready to put your skills to the test? Form a team of 1-5 members and create a playable Roblox experience from scratch in just 72 hours from ${INSPIRE_CHALLENGE_WINDOW}!`,
  categoriesTitle: 'Categories & judging criteria',
  guidelinesTitle: 'Guidelines',
  prizesTitle: 'Prizes',
  prizesDisclaimer:
    '*The prizes are listed in USD and are subject to availability and location. The participant must be 18 years or older to be eligible for the RDC prize.',
  submitLabel: 'Send your entry',
  submitUrl: 'https://devforum.roblox.com/t/roblox-inspire-2026/4670208',
};

export const FAQ_SECTION = {
  title: 'Frequently asked questions',
  subtitle:
    'To earn revenue for eligible user\u2019s spend when users join Roblox using your share link, you must meet certain eligibility criteria.',
};

export const challengeGuidelines: ChallengeGuideline[] = [
  {
    id: 'team-size',
    segments: [{ text: 'Teams can have one to five members.' }],
  },
  {
    id: 'devforum',
    segments: [{ text: 'All team members must be registered on DevForum.' }],
  },
  {
    id: 'moderation',
    segments: [{ text: 'Must maintain good standing with Roblox moderation.' }],
  },
  {
    id: 'standards',
    segments: [
      { text: 'All team members and the game must follow the ' },
      { text: 'Roblox Terms of Use', href: 'https://www.roblox.com/info/terms' },
      { text: ', the ' },
      {
        text: 'Community Standards',
        href: 'https://en.help.roblox.com/hc/en-us/articles/203313410-Roblox-Community-Standards',
      },
      { text: ' and the ' },
      { text: 'Terms of Participation' },
      { text: '.' },
    ],
  },
  {
    id: 'submission-window',
    segments: [
      {
        text: `The game must have been created and submitted within the challenge period: ${INSPIRE_CHALLENGE_WINDOW}.`,
      },
    ],
  },
];

export const challengePrizeGroups: ChallengePrizeGroup[] = [
  {
    title: 'Best Overall Experience',
    description: 'Fully paid lodging and round-trip flight tickets to RDC 2026.',
  },
  {
    title: 'Remaining categories',
    description: 'The top 3 teams in each category can win the following:',
    items: [
      { place: '1st place', value: 'USD 600 GoGift card per team member.' },
      { place: '2nd place', value: 'USD 400 GoGift card per team member.' },
      { place: '3rd place', value: 'USD 200 GoGift card per team member.' },
    ],
  },
];

const CAFE_APPLY_URL = 'https://survey.roblox.com/jfe/form/SV_bq5CZm0DLTeBfOS';

export const cafeLocations: CafeLocation[] = [
  {
    id: 'los-angeles',
    location: 'Los Angeles, United States',
    date: 'July 8, 2026',
    applyUrl: CAFE_APPLY_URL,
  },
  {
    id: 'houston',
    location: 'Houston, United States',
    date: 'July 12, 2026',
    applyUrl: CAFE_APPLY_URL,
  },
  {
    id: 'new-york',
    location: 'New York, United States',
    date: 'July 17, 2026',
    applyUrl: CAFE_APPLY_URL,
  },
  {
    id: 'seoul',
    location: 'Seoul, South Korea',
    date: 'July 18, 2026',
    applyUrl: CAFE_APPLY_URL,
  },
  {
    id: 'sao-paulo',
    location: 'São Paulo, Brazil',
    date: 'July 18, 2026',
    applyUrl: CAFE_APPLY_URL,
  },
];

export const workshopTabs = ['Wed, Jul 22', 'Thu, Jul 23', 'Fri, Jul 24', 'Sat, Jul 25'] as const;

// Sync with INSPIRE_EVENTS_URL when sessions or speakers change on the events site.
export const workshopSessions: WorkshopSession[] = [
  {
    id: 'opening-ceremony',
    title: 'Opening Ceremony',
    topic: 'Presented by JParty & MangoBytz',
    dateLabel: 'Wed, Jul 22',
    time: '11 AM',
    language: 'English',
    speakers: [
      { name: 'JParty', image: speakerAvatar('jparty') },
      { name: 'MangoBytz', image: speakerAvatar('mangobytz') },
    ],
  },
  {
    id: 'data-meets-visuals',
    title: 'Data Meets Visuals: The Importance of Thumbnails in Qualified Playthrough Rate',
    topic: 'Presented by StaredSystemized & yakiniky',
    dateLabel: 'Wed, Jul 22',
    time: '11:30 AM',
    language: 'English',
    speakers: [
      { name: 'StaredSystemized', image: speakerAvatar('staredsystemized') },
      { name: 'yakiniky', image: speakerAvatar('yakiniky') },
    ],
  },
  {
    id: 'first-hour-studio',
    title: 'Your First Hour on Roblox Studio',
    topic: 'Presented by achutti1991 & Morniratu',
    dateLabel: 'Wed, Jul 22',
    time: '2 PM',
    language: 'English',
    speakers: [
      { name: 'achutti1991', image: speakerAvatar('achutti1991') },
      { name: 'Morniratu', image: speakerAvatar('morniratu') },
    ],
  },
  {
    id: 'intro-3d-modeling',
    title: 'Intro to 3D Modeling and Building Your First Map',
    topic: 'Presented by harht & Krissy3D',
    dateLabel: 'Wed, Jul 22',
    time: '9 PM',
    language: 'English',
    speakers: [
      { name: 'harht', image: speakerAvatar('harht') },
      { name: 'Krissy3D', image: speakerAvatar('krissy3d') },
    ],
  },
  {
    id: 'server-authority',
    title: 'Server Authority: Powering Competitive Gameplay',
    topic: 'Presented by ev1',
    dateLabel: 'Thu, Jul 23',
    time: '9 AM',
    language: 'English',
    speakers: [{ name: 'ev1', image: speakerAvatar('ev1') }],
  },
  {
    id: 'ai-roblox-studio',
    title: 'AI in Roblox Studio: Best Practices with LLMs & MCP',
    topic: 'Presented by DrakeRose',
    dateLabel: 'Thu, Jul 23',
    time: '11 AM',
    language: 'English',
    speakers: [{ name: 'DrakeRose', image: speakerAvatar('drakerose') }],
  },
  {
    id: 'player-to-team-lead',
    title: 'From Player to Leading a Small Creative Team on Roblox',
    topic: 'Presented by yevertonnw',
    dateLabel: 'Thu, Jul 23',
    time: '2 PM',
    language: 'Portuguese',
    speakers: [{ name: 'yevertonnw', image: speakerAvatar('yevertonnw') }],
  },
  {
    id: 'intro-scripting',
    title: 'Intro to Scripting: Making Your Game Interactive',
    topic: 'Presented by Femtrs',
    dateLabel: 'Thu, Jul 23',
    time: '6 PM',
    language: 'Thai',
    speakers: [{ name: 'Femtrs', image: speakerAvatar('femtrs') }],
  },
  {
    id: 'responsive-ui-react',
    title: 'Building responsive UI with React & Roblox-TS',
    topic: 'Presented by Dervex',
    dateLabel: 'Fri, Jul 24',
    time: '9 AM',
    language: 'Polish',
    speakers: [{ name: 'Dervex', image: speakerAvatar('dervex') }],
  },
  {
    id: 'ai-powered-programming',
    title: 'Introduction to AI-powered Programming',
    topic: 'Presented by GlibDuke',
    dateLabel: 'Fri, Jul 24',
    time: '11 AM',
    language: 'English',
    speakers: [{ name: 'GlibDuke', image: speakerAvatar('glibduke') }],
  },
  {
    id: 'dynamic-heads-101',
    title: 'Dynamic Heads 101: from Blender to Roblox',
    topic: 'Presented by WawaFluff',
    dateLabel: 'Fri, Jul 24',
    time: '2 PM',
    language: 'Spanish',
    speakers: [{ name: 'WawaFluff', image: speakerAvatar('wawafluff') }],
  },
  {
    id: 'strive-for-success',
    title: 'How to Strive for Success Before and After the Inspire Challenge',
    topic: 'Presented by Goober_ish',
    dateLabel: 'Fri, Jul 24',
    time: '6 PM',
    language: 'English',
    speakers: [{ name: 'Goober_ish', image: speakerAvatar('goober_ish') }],
  },
  {
    id: 'build-community-roblox-games',
    title: 'How to Build a Community for Roblox Games',
    topic: 'Presented by Stef2317',
    dateLabel: 'Sat, Jul 25',
    time: '9 AM',
    language: 'Italian',
    speakers: [{ name: 'Stef2317', image: speakerAvatar('stef2317') }],
  },
  {
    id: 'level-design-env-art',
    title: 'Level Design & Environmental Art: A Unique Combination',
    topic: 'Presented by ByJovian & RoxN_Roll',
    dateLabel: 'Sat, Jul 25',
    time: '11 AM',
    language: 'English',
    speakers: [
      { name: 'ByJovian', image: speakerAvatar('byjovian') },
      { name: 'RoxN_Roll', image: speakerAvatar('roxn_roll') },
    ],
  },
  {
    id: 'unique-games-core-loops',
    title: 'Designing Unique Games & Fun Core Loops',
    topic: 'Presented by Gavineo',
    dateLabel: 'Sat, Jul 25',
    time: '2 PM',
    language: 'English',
    speakers: [{ name: 'Gavineo', image: speakerAvatar('gavineo') }],
  },
  {
    id: 'social-multiplayer',
    title: 'Designing Social & Multiplayer Mechanics',
    topic: 'Presented by RatIsMyUsername',
    dateLabel: 'Sat, Jul 25',
    time: '4 PM',
    language: 'English',
    speakers: [{ name: 'RatIsMyUsername', image: speakerAvatar('ratismyusername') }],
  },
  {
    id: 'game-planning-avatar-design',
    title: 'Game Planning and Avatar Design for User Experiences',
    topic: 'Presented by pond_official & may_pond',
    dateLabel: 'Sat, Jul 25',
    time: '6 PM',
    language: 'Korean',
    speakers: [
      { name: 'pond_official', image: speakerAvatar('pond_official') },
      { name: 'may_pond', image: speakerAvatar('may_pond') },
    ],
  },
];

export const challengeCategories: ChallengeCategory[] = [
  {
    id: 'technical',
    title: 'Best Technical Quality',
    description:
      "Game's performance and level of polish, judging the absence of bugs, optimization, and the professional quality of the assets.",
    iconName: 'icon-regular-code',
  },
  {
    id: 'overall',
    title: 'Best Overall Experience',
    description:
      'Cohesiveness and overall quality of the game, considering how well all elements work together to create an outstanding player experience.',
    iconName: 'icon-regular-trophy',
  },
  {
    id: 'creative',
    title: 'Most Creative Game Concept',
    description:
      'Originality and innovation of the core game concept, including how creatively and effectively it interprets and integrates the theme.',
    iconName: 'icon-regular-pencil',
  },
  {
    id: 'immersive',
    title: 'Most Immersive Experience',
    description:
      "Game's ability to maintain its engagement through a compelling gameplay loop, a captivating atmosphere, and a world that feels alive.",
    iconName: 'icon-regular-cube-vertexes',
  },
  {
    id: 'trailer',
    title: 'Best Video Trailer',
    description:
      "Trailer's effectiveness in showcasing the game's concept and gameplay, also taking into account the video and editing quality.",
    iconName: 'icon-regular-circle-play',
  },
  {
    id: 'global',
    title: 'Global Citizenship Award',
    description:
      'Breaks the language barrier and/or incorporates themes of diversity, proposing a respectful representation that is a core feature of the game.',
    iconName: 'icon-regular-globe-simplified',
  },
];

/** Inspire Café presenters who are not assigned to a workshop session. */
export const CAFE_ONLY_SPEAKER_IDS = [
  'nosniy',
  'istaridium',
  'chickenthuggies',
  'fal3cuniverse',
  'ianbaek830',
  'httpderpyy',
  'ebur1n',
] as const;

function speakerIdFromAvatar(image: string): string | undefined {
  return image.match(/\/speakers\/([^/.]+)\./)?.[1];
}

/** Workshop presenters first (chronological session order), then café-only speakers. */
export function orderFeaturedSpeakersByWorkshops(
  speakers: Speaker[],
  sessions: WorkshopSession[],
  cafeOnlyIds: readonly string[],
): Speaker[] {
  const byId = new Map(speakers.map((speaker) => [speaker.id, speaker]));
  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const session of sessions) {
    for (const workshopSpeaker of session.speakers) {
      const id = speakerIdFromAvatar(workshopSpeaker.image);
      if (id && !seen.has(id) && byId.has(id)) {
        seen.add(id);
        orderedIds.push(id);
      }
    }
  }

  for (const id of cafeOnlyIds) {
    if (!seen.has(id) && byId.has(id)) {
      seen.add(id);
      orderedIds.push(id);
    }
  }

  for (const speaker of speakers) {
    if (!seen.has(speaker.id)) {
      orderedIds.push(speaker.id);
    }
  }

  return orderedIds.flatMap((id) => {
    const speaker = byId.get(id);
    return speaker ? [speaker] : [];
  });
}

// Speaker profile data. Display order is derived from workshopSessions (see orderFeaturedSpeakersByWorkshops).
// User-facing copy for new/updated entries is localized via inspirePendingTranslations.ts.
export const inspireSpeakerEntries: Speaker[] = [
  {
    id: 'jparty',
    name: 'JParty',
    title: 'Head of Developer Community @ Roblox',
    bio: "As Roblox's Head of Developer Community, Justin Sousa leads and engages with the platform's developer community of over 2 million creators . Prior to Roblox, Justin served as Spokesman for 2K, where he represented 2K and Evolve brands internationally and domestically for corporate and public presentations. Justin received a Bachelor's degree in Engineering from the Massachusetts Institute of Technology.",
    image: speakerAvatar('jparty'),
    talks: ['Opening Ceremony'],
  },
  {
    id: 'nosniy',
    name: 'Nosniy',
    title: 'Founder @ Nosniy Games',
    bio: "Nosniy is the founder and co-owner of Nosniy Games, the studio behind multiple hit games on Roblox, including RIVALS, the #1 FPS experience on the platform. He leads the games creative direction and 3D art, helping shape one of Roblox's most successful competitive experiences.",
    image: speakerAvatar('nosniy'),
    talks: ['Inspire Café'],
  },
  {
    id: 'drakerose',
    name: 'DrakeRose',
    title: 'Director of Engineering @ Voldex',
    bio: 'After 4 years at Voldex, he now serves as Director of Engineering. A Roblox player and creator since 2008, he debuted with his game Derby Wars. A CS grad from University of Silicon Valley specializing in game design, his identical twin leads art on Brookhaven. He loves cooking and family time.',
    image: speakerAvatar('drakerose'),
    talks: ['AI in Roblox Studio: Best Practices with LLMs & MCP'],
  },
  {
    id: 'achutti1991',
    name: 'achutti1991',
    title: 'Founder @ Mastertech',
    bio: 'Camila Achutti is an entrepreneur, educator, and leading voice in technology and innovation. Founder of Mastertech and SOMAS, she works to democratize digital knowledge and prepare people and organizations for the future of AI.',
    image: speakerAvatar('achutti1991'),
    talks: ['Your First Hour on Roblox Studio'],
  },
  {
    id: 'morniratu',
    name: 'Morniratu',
    title: 'Founder @ Washinoie',
    bio: 'Morniratu is a self-taught developer focused on Prop Design and everything medieval. With a passion for teaching, he helped many successful Brazilian developers find their way on Roblox.',
    image: speakerAvatar('morniratu'),
    talks: ['Your First Hour on Roblox Studio'],
  },
  {
    id: 'harht',
    name: 'harht',
    title: 'Lead Builder @ Dress to Impress',
    bio: 'harht is a Roblox developer who specializes in building and world design. She previously worked on Royale High, and later worked at easy.gg on Islands and Bed Wars. Now, she works full-time at Dress To Impress as the lead builder, coordinating the map design for updates, collaborations, and events.',
    image: speakerAvatar('harht'),
    talks: ['Intro to 3D Modeling and Building Your First Map'],
  },
  {
    id: 'krissy3d',
    name: 'Krissy3D',
    title: 'Developer @ Dress to Impress',
    bio: "Hi there! I'm Krissy. I've been 3D Modeling and Building on Roblox for 5 years, and love developing games while helping others improve their skills! I currently work on Dress To Impress and enjoy creating fun, memorable experiences for players.",
    image: speakerAvatar('krissy3d'),
    talks: ['Intro to 3D Modeling and Building Your First Map'],
  },
  {
    id: 'yevertonnw',
    name: 'yevertonnw',
    title: 'Game Producer @ Primeval Earth',
    bio: 'Everton is a game producer who leads the studio behind Primeval Earth on Roblox. He manages production, deadlines, and team coordination while also contributing to map building, 3D visuals, and creative direction. Passionate about dinosaurs, he has spent years creating on Roblox.',
    image: speakerAvatar('yevertonnw'),
    talks: ['From Player to Leading a Small Creative Team on Roblox'],
  },
  {
    id: 'femtrs',
    name: 'Femtrs',
    title: 'Developer @ Creator Community',
    bio: 'As a creator on the platform since 2016 and a community ambassador, Femtrs has been a meaningful contributor in the Roblox community and creator space. He has contributed to popular Roblox experiences, managed communities, and co-founded the largest community in Thailand.',
    image: speakerAvatar('femtrs'),
    talks: ['Intro to Scripting: Making Your Game Interactive'],
  },
  {
    id: 'dervex',
    name: 'Dervex',
    title: 'Founder @ Argon',
    bio: 'Dervex is a Polish software engineer and game developer. He created Argon, a powerful two-way sync tool for Roblox development, and his first simulation game: Build Your Factory Tycoon, which has achieved over 10 million plays.',
    image: speakerAvatar('dervex'),
    talks: ['Building responsive UI with React & Roblox-TS'],
  },
  {
    id: 'glibduke',
    name: 'GlibDuke',
    title: 'Developer @ Los Calientes',
    bio: 'GlibDuke (Hugo) is a prominent 21-year-old Roblox developer and community leader based in Brazil. He is widely recognized for his contributions to game development and learning resources the platform.',
    image: speakerAvatar('glibduke'),
    talks: ['Introduction to AI-powered Programming'],
  },
  {
    id: 'wawafluff',
    name: 'WawaFluff',
    title: 'UGC Creator @ KYROSEN',
    bio: 'WawaFluff is a dedicated creator specializing in UGC avatar content, localization and game development. A part of the Roblox community for nearly ten years, they focus on sharing things that everyone can enjoy! 😸',
    image: speakerAvatar('wawafluff'),
    talks: ['Dynamic Heads 101: from Blender to Roblox'],
  },
  {
    id: 'goober_ish',
    name: 'Goober_ish',
    title: 'Creator @ Armless Detective',
    bio: 'This is Goober_ish. He has been developing for over 4 years and he was one of the developers that made the game "Armless Detective" which was is an old inspire challenge game that has grew in popularity after the challenge.',
    image: speakerAvatar('goober_ish'),
    talks: ['How to Strive for Success Before and After the Inspire Challenge'],
  },
  {
    id: 'byjovian',
    name: 'ByJovian',
    title: 'Creator @ Light Work',
    bio: 'ByJovian (Jisoo/Jove) is a Canadian digital artist and designer that focuses on illustration, graphic design, video compositing, and more! Mainly working as a freelancer, Jove has contributed to over 10+ Roblox game titles.',
    image: speakerAvatar('byjovian'),
    talks: ['Level Design & Environmental Art: A Unique Combination'],
  },
  {
    id: 'roxn_roll',
    name: 'RoxN_Roll',
    title: 'Creator @ Light Work',
    bio: '3D artist, lead developer for the In Plain Sight series, developer for Stars Align and 2-time ROBLOX gamejam winner.',
    image: speakerAvatar('roxn_roll'),
    talks: ['Level Design & Environmental Art: A Unique Combination'],
  },
  {
    id: 'gavineo',
    name: 'Gavineo',
    title: 'Producer @ Voldex',
    bio: 'Gavin is a Roblox player since 2007 turned professional designer and producer, he has been shipping titles since 2018, including an indie project that hit 40K CCU and work on major branded experiences. From player to developer, and an ultimate love for Roblox.',
    image: speakerAvatar('gavineo'),
    talks: ['Designing Unique Games & Fun Core Loops'],
  },
  {
    id: 'ratismyusername',
    name: 'RatIsMyUsername',
    title: 'Co-Founder @ Redscape Interactive',
    bio: 'RatIsMyUsername is the co-founder and technical lead of Redscape Interactive, the studio behind Weird Gun Game and Steel Titans. His work focuses on social and multiplayer mechanics, competitive gameplay systems, and player-driven sandbox experiences on Roblox.',
    image: speakerAvatar('ratismyusername'),
    talks: ['Designing Social & Multiplayer Mechanics'],
  },
  {
    id: 'staredsystemized',
    name: 'StaredSystemized',
    title: 'Founder @ BIG BANG TEAM',
    bio: 'Roblox thumbnail designer with 10 years of experience. Founder of BIG BANG TEAM CO., LTD, helping games scale QPTR through design and research. Currently working on thumbnails for RIVALS.',
    image: speakerAvatar('staredsystemized'),
    talks: ['Data Meets Visuals: The Importance of Thumbnails in Qualified Playthrough Rate'],
  },
  {
    id: 'yakiniky',
    name: 'yakiniky',
    title: '3D Artist @ BIG BANG TEAM',
    bio: 'A 3D Artist specializing in Blender with a background in communication design. ',
    image: speakerAvatar('yakiniky'),
    talks: ['Data Meets Visuals: The Importance of Thumbnails in Qualified Playthrough Rate'],
  },
  {
    id: 'istaridium',
    name: 'iStaridium',
    title: 'Developer @ Creator Community',
    bio: 'Andy Vu has been a Roblox developer for 6 years and is also a computer science student at the University of Florida. He is passionate about using AI tools like Claude Code for game development.',
    image: speakerAvatar('istaridium'),
    talks: ['Inspire Café'],
  },
  {
    id: 'chickenthuggies',
    name: 'chickenthuggies',
    title: 'Founder @ Los Calientes',
    bio: "Chickenthuggies is a former Michelin-pedigreed chef who traded in one passion for the next. Founder of Los Calientes Studios, he's passionate about creating fun, scalable systems that turn great ideas into memorable experiences.",
    image: speakerAvatar('chickenthuggies'),
    talks: ['Inspire Café'],
  },
  {
    id: 'fal3cuniverse',
    name: 'FaL3CUniverse',
    title: 'Co-Founder @ FaL3C Universe',
    bio: 'Started developing on Roblox in 2020 with LOLLY WORLD Adventure. In 2022, launched the FaL3C Universe, a metaverse-inspired series based on real-world locations and interactive experiences. Winner of the 2025 AI·XR Developer Competition. Currently focused on developing gameplay-focused experiences.',
    image: speakerAvatar('fal3cuniverse'),
    talks: ['Inspire Café'],
  },
  {
    id: 'ianbaek830',
    name: 'ianbaek830',
    title: 'Co-Founder @ FaL3C Universe',
    bio: 'Started developing on Roblox in 2020 with LOLLY WORLD Adventure. In 2022, launched the FaL3C Universe, a metaverse-inspired series based on real-world locations and interactive experiences. Winner of the 2025 AI·XR Developer Competition. Currently focused on developing gameplay-focused experiences.',
    image: speakerAvatar('ianbaek830'),
    talks: ['Inspire Café'],
  },
  {
    id: 'httpderpyy',
    name: 'httpDerpyy',
    title: 'Developer @ Weird Gun Game',
    bio: 'Gabriel has played Roblox since 2009 and developed on the platform for 8 years. After contributing to many projects, he participated in developing Weird Gun Game, reaching 250M+ users. He is passionate about game development and programming, holds a B.S. in CS, and is pursuing an MBA in AI.',
    image: speakerAvatar('httpderpyy'),
    talks: ['Inspire Café'],
  },
  {
    id: 'ebur1n',
    name: 'ebur1n',
    title: 'Product Manager @ Twin Atlas',
    bio: "Evelyn (ebur1n) is a Product Manager/Producer with a heavy art background. She's spent nearly a decade building Roblox games that range from award-winning indie titles to bridging the gap between Roblox and brands/IP. ",
    image: speakerAvatar('ebur1n'),
    talks: ['Inspire Café'],
  },
  {
    id: 'mangobytz',
    name: 'MangoBytz',
    title: 'Developer Program Manager @ Roblox',
    bio: 'Naomi is part of the Developer Relations team at Roblox, with over 8 years of firsthand experience as a game developer and UGC creator on the platform. She has released multiple titles, partnered with globally recognized brands and been featured in major publications. On DevRel, she uses her experience as a creator to support the developer community and help bring their ideas to life.',
    image: speakerAvatar('mangobytz'),
    talks: ['Opening Ceremony'],
  },
  {
    id: 'ev1',
    name: 'ev1',
    title: 'Founder @ Reimplemented',
    bio: 'ev1 is a French Roblox developer and UGC creator, skilled in programming, 3D animation, and 2D/3D art. They are best known for co-owning TTD 3 and creating the Steven bundle, along with several S15 bundles.',
    image: speakerAvatar('ev1'),
    talks: ['Server Authority: Powering Competitive Gameplay'],
  },
  {
    id: 'pond_official',
    name: 'pond_official',
    title: 'CEO @ Pond Studio',
    bio: 'He is the CEO of Pond Studio, leading Roblox experiences including Prism Runway Show. He specializes in branded content, UGC and marketing creative content. He also teaches media and game content at a university and has received recognition through international exhibitions, creative awards.',
    image: speakerAvatar('pond_official'),
    talks: ['Game Planning and Avatar Design for User Experiences'],
  },
  {
    id: 'stef2317',
    name: 'Stef2317',
    title: 'Founder @ Two Players One Console',
    bio: "I grew up playing video games. For 10 years, I worked on YouTube by playing video games, and now, together with my software house, I'm trying to create my own video games!",
    image: speakerAvatar('stef2317'),
    talks: ['How to Build a Community for Roblox Games'],
  },
  {
    id: 'may_pond',
    name: 'may_pond',
    title: 'Game Planner @ Pond',
    bio: 'Seoyoung Kim is a Game Planner at POND Studio with experience developing a variety of Roblox experiences, from original games to brand collaboration projects.  She has contributed to the development of Prism Runway Show, focusing on game play design, avatar systems, and user experience design.',
    image: speakerAvatar('may_pond'),
    talks: ['Game Planning and Avatar Design for User Experiences'],
  },
];

// Inspire 2025 Challenge winners (grand prize + each category's first place).
export const hallOfFameEntries: HallOfFameEntry[] = [
  {
    id: 'operation-clogged-liberty',
    gameTitle: 'Operation Clogged Liberty',
    award: 'Best Overall Experience',
    gameUrl: 'https://www.roblox.com/games/129118912228998/Operation-Clogged-Liberty',
    placeId: '129118912228998',
  },
  {
    id: 'light-work',
    gameTitle: 'Light Work',
    award: 'Best Technical Quality',
    gameUrl: 'https://www.roblox.com/games/84843854608244/Light-Work',
    placeId: '84843854608244',
  },
  {
    id: 'inkwell',
    gameTitle: 'Inkwell',
    award: 'Most Creative Game Concept',
    gameUrl: 'https://www.roblox.com/games/126341693436579/Inkwell',
    placeId: '126341693436579',
  },
  {
    id: 'shadows-over-city',
    gameTitle: 'Shadows Over City',
    award: 'Most Immersive Experience',
    gameUrl: 'https://www.roblox.com/games/128453707487443/Shadows-Over-City',
    placeId: '128453707487443',
  },
  {
    id: 'tool-of-language',
    gameTitle: 'Tool of Language',
    award: 'Global Citizenship Award',
    gameUrl: 'https://www.roblox.com/games/79118539278043/Tool-of-Langauge',
    placeId: '79118539278043',
  },
];

export const inspireFaqItems: FAQItem[] = [
  {
    question: 'Who can participate?',
    answerSegments: [
      {
        text: 'Inspire is open to creators around the world, whether you are just getting started or have already shipped multiple experiences. To enter the Inspire Challenge, every team member must be registered on DevForum and in good standing with Roblox moderation. ',
      },
      { text: 'To join the virtual workshops, visit the ' },
      { text: 'Roblox Creator Events page', href: INSPIRE_EVENTS_URL },
      {
        text: ' and click Register to sign up for online sessions (July 22–25). To attend an Inspire Café in person, apply for an invite on the same event page before July 19—each location has limited capacity and participation is subject to approval.',
      },
    ],
  },
  {
    question: 'Do I need to attend in person?',
    answer:
      'No. Inspire is a global online event: the workshops stream online and the Inspire Challenge is a remote game jam, so you can take part from anywhere in the world. The Inspire Cafés are the only in-person part of the event, and joining one is completely optional.',
  },
  {
    question: 'Where do the workshops take place, and will they be recorded?',
    answer:
      'Workshops are hosted online so you can join live from anywhere. Every session is also recorded and made available to watch afterward, so you will not miss anything if you cannot attend in real time.',
  },
  {
    question: 'How do I attend an Inspire Café?',
    answer:
      'Each Café has limited capacity, so you need to apply for an invite early. Your participation is subject to approval, and you will receive an invite if you are selected.',
  },
  {
    question: 'How do I earn the exclusive accessory?',
    answer:
      'Join at least one live challenge during any workshop to earn the exclusive accessory. Virtual rewards are distributed after the event ends.',
  },
  {
    question: 'Do I need a team to join the Inspire Challenge?',
    answer:
      'You can join solo or in a team of up to five people, and every team member must be registered on DevForum. Looking for teammates? Connect with other creators at an Inspire Café or in the community before the challenge begins.',
  },
  {
    question: 'Do I need to pre-register for the Challenge?',
    answer:
      'No. You only need to submit your entry through the submission survey within the challenge window. Make sure every team member is registered on DevForum before you submit.',
  },
  {
    question: 'Can I start building my game before the Challenge begins?',
    answer: `No. Your experience must be created and submitted within the challenge window (${INSPIRE_CHALLENGE_WINDOW}). Anything created before or after that window will not be eligible.`,
  },
  {
    question: 'Are pre-made assets allowed in the Inspire Challenge?',
    answer:
      'Yes. In the Inspire Challenge, pre-made assets are allowed as long as you own the rights to them and list them in your submission survey.',
  },
  {
    question: 'Do all of my teammates need to submit an Inspire Challenge entry?',
    answer:
      'No. Only one team member needs to fill out the submission survey on behalf of the whole team. You can resubmit any time during the Inspire Challenge window, and only your most recent entry will be considered.',
  },
  {
    question: 'What can I win in the Inspire Challenge?',
    answer:
      'In the Inspire Challenge, the top three teams in each category win GoGift cards (USD 600, 400, and 200 per team member for 1st, 2nd, and 3rd place), and the team behind the Best Overall Experience wins a trip to RDC. Every valid submission is also eligible for the DevRel virtual prizes.',
  },
];
