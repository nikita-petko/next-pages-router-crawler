import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const INSPIRE_NAMESPACE = TranslationNamespace.Landing;

export type InspireLocalizedWorkshopCopy = {
  title: string;
  topic: string;
  dateLabel: string;
  time: string;
  language: string;
};

export type InspireLocalizedSpeakerCopy = {
  title?: string;
  bio?: string;
  talks?: string[];
};

export const localizeInspireWorkshopCopy: Record<
  string,
  (tPendingTranslation: TPendingTranslationFunction) => InspireLocalizedWorkshopCopy
> = {
  'build-community-roblox-games': (tPendingTranslation) => ({
    title: tPendingTranslation(
      'How to Build a Community for Roblox Games',
      'Inspire 2026 virtual workshop session title.',
      translationKey('Inspire.Workshop.BuildCommunityRobloxGames.Title', INSPIRE_NAMESPACE),
    ),
    topic: tPendingTranslation(
      'Presented by Stef2317',
      'Inspire 2026 workshop presenter line for Stef2317.',
      translationKey('Inspire.Workshop.BuildCommunityRobloxGames.Topic', INSPIRE_NAMESPACE),
    ),
    dateLabel: tPendingTranslation(
      'Sat, Jul 25',
      'Inspire 2026 workshop date label for Saturday, July 25.',
      translationKey('Inspire.Workshop.BuildCommunityRobloxGames.DateLabel', INSPIRE_NAMESPACE),
    ),
    time: tPendingTranslation(
      '9 AM',
      'Inspire 2026 workshop start time label.',
      translationKey('Inspire.Workshop.BuildCommunityRobloxGames.Time', INSPIRE_NAMESPACE),
    ),
    language: tPendingTranslation(
      'Italian',
      'Inspire 2026 workshop language badge label.',
      translationKey('Inspire.Workshop.BuildCommunityRobloxGames.Language', INSPIRE_NAMESPACE),
    ),
  }),
  'game-planning-avatar-design': (tPendingTranslation) => ({
    title: tPendingTranslation(
      'Game Planning and Avatar Design for User Experiences',
      'Inspire 2026 virtual workshop session title.',
      translationKey('Inspire.Workshop.GamePlanningAvatarDesign.Title', INSPIRE_NAMESPACE),
    ),
    topic: tPendingTranslation(
      'Presented by pond_official & may_pond',
      'Inspire 2026 workshop presenter line for Pond Studio speakers.',
      translationKey('Inspire.Workshop.GamePlanningAvatarDesign.Topic', INSPIRE_NAMESPACE),
    ),
    dateLabel: tPendingTranslation(
      'Sat, Jul 25',
      'Inspire 2026 workshop date label for Saturday, July 25.',
      translationKey('Inspire.Workshop.GamePlanningAvatarDesign.DateLabel', INSPIRE_NAMESPACE),
    ),
    time: tPendingTranslation(
      '6 PM',
      'Inspire 2026 workshop start time label.',
      translationKey('Inspire.Workshop.GamePlanningAvatarDesign.Time', INSPIRE_NAMESPACE),
    ),
    language: tPendingTranslation(
      'Korean',
      'Inspire 2026 workshop language badge label.',
      translationKey('Inspire.Workshop.GamePlanningAvatarDesign.Language', INSPIRE_NAMESPACE),
    ),
  }),
};

export const localizeInspireSpeakerCopy: Record<
  string,
  (tPendingTranslation: TPendingTranslationFunction) => InspireLocalizedSpeakerCopy
> = {
  jparty: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      "As Roblox's Head of Developer Community, Justin Sousa leads and engages with the platform's developer community of over 2 million creators . Prior to Roblox, Justin served as Spokesman for 2K, where he represented 2K and Evolve brands internationally and domestically for corporate and public presentations. Justin received a Bachelor's degree in Engineering from the Massachusetts Institute of Technology.",
      'Inspire 2026 featured speaker biography for jparty.',
      translationKey('Inspire.Speaker.Jparty.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  nosniy: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      "Nosniy is the founder and co-owner of Nosniy Games, the studio behind multiple hit games on Roblox, including RIVALS, the #1 FPS experience on the platform. He leads the games creative direction and 3D art, helping shape one of Roblox's most successful competitive experiences.",
      'Inspire 2026 featured speaker biography for nosniy.',
      translationKey('Inspire.Speaker.Nosniy.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  drakerose: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'After 4 years at Voldex, he now serves as Director of Engineering. A Roblox player and creator since 2008, he debuted with his game Derby Wars. A CS grad from University of Silicon Valley specializing in game design, his identical twin leads art on Brookhaven. He loves cooking and family time.',
      'Inspire 2026 featured speaker biography for drakerose.',
      translationKey('Inspire.Speaker.Drakerose.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  achutti1991: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Camila Achutti is an entrepreneur, educator, and leading voice in technology and innovation. Founder of Mastertech and SOMAS, she works to democratize digital knowledge and prepare people and organizations for the future of AI.',
      'Inspire 2026 featured speaker biography for achutti1991.',
      translationKey('Inspire.Speaker.Achutti1991.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  morniratu: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Morniratu is a self-taught developer focused on Prop Design and everything medieval. With a passion for teaching, he helped many successful Brazilian developers find their way on Roblox.',
      'Inspire 2026 featured speaker biography for morniratu.',
      translationKey('Inspire.Speaker.Morniratu.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  harht: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'harht is a Roblox developer who specializes in building and world design. She previously worked on Royale High, and later worked at easy.gg on Islands and Bed Wars. Now, she works full-time at Dress To Impress as the lead builder, coordinating the map design for updates, collaborations, and events.',
      'Inspire 2026 featured speaker biography for harht.',
      translationKey('Inspire.Speaker.Harht.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  krissy3d: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      "Hi there! I'm Krissy. I've been 3D Modeling and Building on Roblox for 5 years, and love developing games while helping others improve their skills! I currently work on Dress To Impress and enjoy creating fun, memorable experiences for players.",
      'Inspire 2026 featured speaker biography for krissy3d.',
      translationKey('Inspire.Speaker.Krissy3d.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  yevertonnw: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Everton is a game producer who leads the studio behind Primeval Earth on Roblox. He manages production, deadlines, and team coordination while also contributing to map building, 3D visuals, and creative direction. Passionate about dinosaurs, he has spent years creating on Roblox.',
      'Inspire 2026 featured speaker biography for yevertonnw.',
      translationKey('Inspire.Speaker.Yevertonnw.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  femtrs: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'As a creator on the platform since 2016 and a community ambassador, Femtrs has been a meaningful contributor in the Roblox community and creator space. He has contributed to popular Roblox experiences, managed communities, and co-founded the largest community in Thailand.',
      'Inspire 2026 featured speaker biography for femtrs.',
      translationKey('Inspire.Speaker.Femtrs.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  dervex: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Dervex is a Polish software engineer and game developer. He created Argon, a powerful two-way sync tool for Roblox development, and his first simulation game: Build Your Factory Tycoon, which has achieved over 10 million plays.',
      'Inspire 2026 featured speaker biography for dervex.',
      translationKey('Inspire.Speaker.Dervex.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  glibduke: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'GlibDuke (Hugo) is a prominent 21-year-old Roblox developer and community leader based in Brazil. He is widely recognized for his contributions to game development and learning resources the platform.',
      'Inspire 2026 featured speaker biography for glibduke.',
      translationKey('Inspire.Speaker.Glibduke.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  wawafluff: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'WawaFluff is a dedicated creator specializing in UGC avatar content, localization and game development. A part of the Roblox community for nearly ten years, they focus on sharing things that everyone can enjoy! 😸',
      'Inspire 2026 featured speaker biography for wawafluff.',
      translationKey('Inspire.Speaker.Wawafluff.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  goober_ish: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'This is Goober_ish. He has been developing for over 4 years and he was one of the developers that made the game "Armless Detective" which was is an old inspire challenge game that has grew in popularity after the challenge.',
      'Inspire 2026 featured speaker biography for goober_ish.',
      translationKey('Inspire.Speaker.GooberIsh.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  byjovian: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'ByJovian (Jisoo/Jove) is a Canadian digital artist and designer that focuses on illustration, graphic design, video compositing, and more! Mainly working as a freelancer, Jove has contributed to over 10+ Roblox game titles.',
      'Inspire 2026 featured speaker biography for byjovian.',
      translationKey('Inspire.Speaker.Byjovian.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  roxn_roll: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      '3D artist, lead developer for the In Plain Sight series, developer for Stars Align and 2-time ROBLOX gamejam winner.',
      'Inspire 2026 featured speaker biography for roxn_roll.',
      translationKey('Inspire.Speaker.RoxnRoll.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  gavineo: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Gavin is a Roblox player since 2007 turned professional designer and producer, he has been shipping titles since 2018, including an indie project that hit 40K CCU and work on major branded experiences. From player to developer, and an ultimate love for Roblox.',
      'Inspire 2026 featured speaker biography for gavineo.',
      translationKey('Inspire.Speaker.Gavineo.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  ratismyusername: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'RatIsMyUsername is the co-founder and technical lead of Redscape Interactive, the studio behind Weird Gun Game and Steel Titans. His work focuses on social and multiplayer mechanics, competitive gameplay systems, and player-driven sandbox experiences on Roblox.',
      'Inspire 2026 featured speaker biography for ratismyusername.',
      translationKey('Inspire.Speaker.Ratismyusername.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  staredsystemized: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Roblox thumbnail designer with 10 years of experience. Founder of BIG BANG TEAM CO., LTD, helping games scale QPTR through design and research. Currently working on thumbnails for RIVALS.',
      'Inspire 2026 featured speaker biography for staredsystemized.',
      translationKey('Inspire.Speaker.Staredsystemized.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  yakiniky: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'A 3D Artist specializing in Blender with a background in communication design. ',
      'Inspire 2026 featured speaker biography for yakiniky.',
      translationKey('Inspire.Speaker.Yakiniky.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  istaridium: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Andy Vu has been a Roblox developer for 6 years and is also a computer science student at the University of Florida. He is passionate about using AI tools like Claude Code for game development.',
      'Inspire 2026 featured speaker biography for istaridium.',
      translationKey('Inspire.Speaker.Istaridium.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  chickenthuggies: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      "Chickenthuggies is a former Michelin-pedigreed chef who traded in one passion for the next. Founder of Los Calientes Studios, he's passionate about creating fun, scalable systems that turn great ideas into memorable experiences.",
      'Inspire 2026 featured speaker biography for chickenthuggies.',
      translationKey('Inspire.Speaker.Chickenthuggies.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  fal3cuniverse: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Started developing on Roblox in 2020 with LOLLY WORLD Adventure. In 2022, launched the FaL3C Universe, a metaverse-inspired series based on real-world locations and interactive experiences. Winner of the 2025 AI·XR Developer Competition. Currently focused on developing gameplay-focused experiences.',
      'Inspire 2026 featured speaker biography for fal3cuniverse.',
      translationKey('Inspire.Speaker.Fal3cuniverse.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  ianbaek830: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Started developing on Roblox in 2020 with LOLLY WORLD Adventure. In 2022, launched the FaL3C Universe, a metaverse-inspired series based on real-world locations and interactive experiences. Winner of the 2025 AI·XR Developer Competition. Currently focused on developing gameplay-focused experiences.',
      'Inspire 2026 featured speaker biography for ianbaek830.',
      translationKey('Inspire.Speaker.Ianbaek830.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  httpderpyy: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Gabriel has played Roblox since 2009 and developed on the platform for 8 years. After contributing to many projects, he participated in developing Weird Gun Game, reaching 250M+ users. He is passionate about game development and programming, holds a B.S. in CS, and is pursuing an MBA in AI.',
      'Inspire 2026 featured speaker biography for httpderpyy.',
      translationKey('Inspire.Speaker.Httpderpyy.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  ebur1n: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      "Evelyn (ebur1n) is a Product Manager/Producer with a heavy art background. She's spent nearly a decade building Roblox games that range from award-winning indie titles to bridging the gap between Roblox and brands/IP. ",
      'Inspire 2026 featured speaker biography for ebur1n.',
      translationKey('Inspire.Speaker.Ebur1n.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  mangobytz: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'Naomi is part of the Developer Relations team at Roblox, with over 8 years of firsthand experience as a game developer and UGC creator on the platform. She has released multiple titles, partnered with globally recognized brands and been featured in major publications. On DevRel, she uses her experience as a creator to support the developer community and help bring their ideas to life.',
      'Inspire 2026 featured speaker biography for mangobytz.',
      translationKey('Inspire.Speaker.Mangobytz.Bio', INSPIRE_NAMESPACE),
    ),
  }),
  ev1: (tPendingTranslation) => ({
    bio: tPendingTranslation(
      'ev1 is a French Roblox developer and UGC creator, skilled in programming, 3D animation, and 2D/3D art. They are best known for co-owning TTD 3 and creating the Steven bundle, along with several S15 bundles.',
      'Inspire 2026 featured speaker biography for ev1.',
      translationKey('Inspire.Speaker.Ev1.Bio', INSPIRE_NAMESPACE),
    ),
  }),

  stef2317: (tPendingTranslation) => ({
    title: tPendingTranslation(
      'Founder @ Two Players One Console',
      'Inspire 2026 featured speaker role line for Stef2317.',
      translationKey('Inspire.Speaker.Stef2317.Title', INSPIRE_NAMESPACE),
    ),
    bio: tPendingTranslation(
      "I grew up playing video games. For 10 years, I worked on YouTube by playing video games, and now, together with my software house, I'm trying to create my own video games!",
      'Inspire 2026 featured speaker biography for Stef2317.',
      translationKey('Inspire.Speaker.Stef2317.Bio', INSPIRE_NAMESPACE),
    ),
    talks: [
      tPendingTranslation(
        'How to Build a Community for Roblox Games',
        'Inspire 2026 featured speaker talk link label for Stef2317.',
        translationKey('Inspire.Speaker.Stef2317.Talk.BuildCommunity', INSPIRE_NAMESPACE),
      ),
    ],
  }),
  pond_official: (tPendingTranslation) => ({
    title: tPendingTranslation(
      'CEO @ Pond Studio',
      'Inspire 2026 featured speaker role line for pond_official.',
      translationKey('Inspire.Speaker.PondOfficial.Title', INSPIRE_NAMESPACE),
    ),
    bio: tPendingTranslation(
      'He is the CEO of Pond Studio, leading Roblox experiences including Prism Runway Show. He specializes in branded content, UGC and marketing creative content. He also teaches media and game content at a university and has received recognition through international exhibitions, creative awards.',
      'Inspire 2026 featured speaker biography for pond_official.',
      translationKey('Inspire.Speaker.PondOfficial.Bio', INSPIRE_NAMESPACE),
    ),
    talks: [
      tPendingTranslation(
        'Game Planning and Avatar Design for User Experiences',
        'Inspire 2026 featured speaker talk link label for pond_official.',
        translationKey('Inspire.Speaker.PondOfficial.Talk.GamePlanning', INSPIRE_NAMESPACE),
      ),
    ],
  }),
  may_pond: (tPendingTranslation) => ({
    title: tPendingTranslation(
      'Game Planner @ Pond',
      'Inspire 2026 featured speaker role line for may_pond.',
      translationKey('Inspire.Speaker.MayPond.Title', INSPIRE_NAMESPACE),
    ),
    bio: tPendingTranslation(
      'Seoyoung Kim is a Game Planner at POND Studio with experience developing a variety of Roblox experiences, from original games to brand collaboration projects. She has contributed to the development of Prism Runway Show, focusing on game play design, avatar systems, and user experience design.',
      'Inspire 2026 featured speaker biography for may_pond.',
      translationKey('Inspire.Speaker.MayPond.Bio', INSPIRE_NAMESPACE),
    ),
    talks: [
      tPendingTranslation(
        'Game Planning and Avatar Design for User Experiences',
        'Inspire 2026 featured speaker talk link label for may_pond.',
        translationKey('Inspire.Speaker.MayPond.Talk.GamePlanning', INSPIRE_NAMESPACE),
      ),
    ],
  }),
};
