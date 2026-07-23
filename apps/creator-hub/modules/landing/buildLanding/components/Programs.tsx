import React from 'react';
import { clsx as cx } from '@rbx/foundation-ui';
import { Flex } from '@modules/miscellaneous/common/components';
import Section from './Section';
import ProgramCard, { type Program } from './ProgramCard';
import layoutStyles from './Layout.module.css';

const jumpstartDetails = [
  {
    id: 'benefits',
    label: "What's in it for you?",
    details: `
For selected projects, you get hands-on help turning a bold idea into a real Roblox launch.

#### Promotional marketing support

- Homepage curation for select projects with prominent placement to boost exposure through a new Standout Games sort

#### Hands-on support from Roblox

- Expert guidance on core loop, monetization, performance, and launch from Roblox and creator mentors.
- Assistance navigating and optimizing Roblox Studio for professional workflows

#### Access to technology and tools

- Early access to upcoming Roblox Engine, Studio, and AI features`,
  },
  {
    id: 'looking-for',
    label: 'What are we looking for?',
    details: `
New and existing Roblox developers who haven't shipped a novel game yet and:

- Have a clear, novel game concept that feels fresh for Roblox—new genres, new gameplay patterns, or a distinctive look and feel.
- A small, committed team (or solo dev) ready to move fast, iterate, and ship within the program window.
- Openness to feedback and a willingness to adapt as you learn the Roblox toolset and hear from players and mentors.`,
  },
  {
    id: 'dates',
    label: 'Important dates',
    details: `
**Applications are open now!**

The Jumpstart Program operates year-round with no fixed groups or deadlines:

- **Applications open:** February 25, 2026
- **Reviews:** Conducted on a rolling basis
- **Start date:** Apply whenever you're ready

**Please note:** Spots are limited. The program will support as many teams as possible.`,
  },
  {
    id: 'faq',
    label: 'FAQ',
    details: `
#### Do I need prior Roblox experience?

No. You don't need to have shipped on Roblox before; Jumpstart is specifically designed to help early-stage teams learn the platform and launch their first high-quality Roblox game.

#### Is this cash funding or a salary?

No. Jumpstart support is primarily **in-kind**: guidance, Robux-based operational support, and visibility tools—not a salary or traditional publishing deal.

#### Who's eligible to apply?

Off-platform studios, new Roblox creators, and small teams from around the world can apply, as long as at least one team member is 18+. Full eligibility details will be listed on the application form.

#### What if I'm already an experienced or full-time team?

If you've already shipped games or have a more mature Roblox project, you may be a better fit for the Roblox Incubator Program, which is a longer, milestone-driven track for teams ready to scale a promising title.

#### What happens after Jumpstart?

If your game shows strong potential, Roblox can connect you with follow-on programs and resources—including potential Incubator consideration—to keep building momentum after launch.`,
  },
];

const incubatorDetails = [
  {
    id: 'benefits',
    label: "What's in it for you?",
    details: `
For selected projects, you get:

#### Promotional marketing support

- Homepage curation for select projects with prominent placement to boost exposure through a new Standout Games sort

#### Access to Roblox HQ

- Dedicated desk space at HQ for teams who wish to work on-site, collaboration spaces with other Incubator teams and Roblox staff, free onsite breakfast and lunch Monday–Friday, and more. (Space is limited - Apply early and see FAQ for details.)

#### Hands-on support from Roblox

- Dedicated program leads who help keep your scope realistic, milestones sharp, and roadmap aligned
- Access to Roblox engineers in networking, performance, scaling, data, and security
- 1:1 Game design reviews on core loop, progression, economy, and retention
- Visual and technical advice from Roblox artists

#### Access to technology and tools

- Early access to upcoming Roblox Engine, Studio, and AI features
- Performance budgets and architecture guidance to scale effectively
- A direct line into the platform team - your needs and feedback help shape our platform

#### A community of talented creator teams

- A cohort of peer studios ready to support each other
- Access to an alumni network of notable developers, alumni and investors
- Structured resources - shared channels, structured critique and playtests`,
  },
  {
    id: 'looking-for',
    label: 'What are we looking for?',
    details: `
Roblox Incubator is for Roblox native teams, as well as off-platform studios who are committed to building on the platform. The program is aimed at experienced, agile and highly motivated teams who **have a vision** and are ready to **commit full-time for six months**. You're a strong fit if you:

- Are highly motivated to build an ambitious game that feels revolutionary for Roblox in genre, depth, fidelity, or audience.
- Have shipped before on Roblox, or proven track record outside of Roblox
- Can dedicate a core team with designated roles (ie eng, art, design)
- Are energized by a disciplined, fast-iteration and intensive sprint
- Excited to become a part of a supportive community
- A playable prototype or vertical slice that demonstrates your core loop is strongly preferred but not required`,
  },
  {
    id: 'dates',
    label: 'Important dates',
    details: `
The first 2026 Incubator cohort will follow this high-level timeline:

- **Applications live:** March 9th, 2026
- **Priority deadline:** April 6th, 2026
- **Priority candidate selections:** April 15th, 2026
- **Program start:** Targeted to kick-off on April 28th, 2026

We will accept submissions on a rolling-basis until May 4th, 2026 which may result in a delayed start date`,
  },
  {
    id: 'faq',
    label: 'FAQ',
    details: `
#### When will the program start?

The program is targeted to start April 28th. Teams who are selected will receive more detailed information on timing, onboarding, and next steps once final decisions have been made.

#### Will I get paid to participate in the Incubator?

No, participants do not receive game compensation, tech stipends, reimbursement for any travel, relocation, commuting, and technical expenses. Instead, the program provides value through mentorship and increased platform visibility. Additionally, teams may gain direct exposure to investors, brand partners and top developers.

#### Do I need to attend in person?

Attendance in person is entirely optional. The program is designed to be fully-remote friendly.

#### Can my team work out of Roblox HQ?

Yes, for participants who wish to work on-site, we offer optional office and community space at Roblox HQ. However, space is highly limited for the 2026 cohort. We'll coordinate whether your team wants to build on-site for the entire 6-month sprint, or just drop in for a partial visit.

#### Is the program open to all countries?

Please see the application form for eligibility requirements.

#### Do I need a visa to visit Roblox HQ?

The Incubator is remote-friendly, and in-person attendance is optional. If your team is based outside the United States and wants to attend program events at Roblox HQ (such as orientation, milestone reviews, or demo days), you may need a visa depending on your nationality.

Visa requirements vary by country and individual circumstances. We recommend reviewing the U.S. Department of State's visa information for your country before planning any travel.

For participants accepted into the program who wish to visit HQ, Roblox may provide business invitation letters and other forms of visa travel coordination support.

Visa support is subject to availability and does not guarantee visa approval, which is determined by the U.S. government. All travel and lodging costs are the participant's responsibility.

#### I will be a full time student during the Program. Can I still participate in the Incubator?

While we welcome applications from students, this is an intensive program that requires significant time and commitment, and recommend that full-time students carefully assess whether they can dedicate the substantial effort required to participate.

#### How does Roblox select which teams participate in the Incubator program?

Candidates will be evaluated on their team competency demonstrated through their thorough application, pitch decks, and a clear game development roadmap. Additionally, aimed at developers who are ready to elevate the platform with 'meaningfully new' concepts that challenge existing standards in genre, depth, fidelity, or audience.

#### How will I know if I move forward in the application process, or made it into the program?

All applications will be responded to by early April. By then you and your team will be informed whether you are selected to move forward or have been accepted into the program. All updates will be shared to the leads' email address from an official Roblox address (@roblox.com).

#### Will my team and I be allowed to announce we've been accepted into the program?

Once all teams have been selected and agreements have been finalized, the Roblox team will coordinate with you on announcement timing so that the participants can share the news.`,
  },
];

const allPrograms: Program[] = [
  {
    title: 'Jumpstart',
    subtitle: 'Curious about Roblox? Take the first step and start building with our help.',
    applyUrl: 'https://survey.roblox.com/jfe/form/SV_0k1TET5QW7FGnGK',
    contents: [
      {
        iconName: 'icon-regular-person-with-smaller-person',
        description: 'New to Roblox, or native creators exploring their first novel game',
      },
      {
        iconName: 'icon-regular-book-open',
        description: 'Flexible timelines with full pipeline support',
      },
      {
        iconName: 'icon-regular-paper-airplane',
        description: 'Designed to support teams going from novice to pro',
      },
    ],
    details: jumpstartDetails,
  },
  {
    title: 'Incubator',
    subtitle:
      'Get the intensive support required to turn your novel game vision into a polished, massive hit.',
    applyUrl: 'https://survey.roblox.com/jfe/form/SV_a41bu4NztYWMmk6',
    contents: [
      {
        iconName: 'icon-regular-person-graduate',
        description: 'Native creators, or professional off-platform studios with strong commitment',
      },
      {
        iconName: 'icon-regular-three-people',
        description: '6-month, full-time intensive sprint',
      },
      {
        iconName: 'icon-regular-bullet-flying',
        description: 'Designed to accelerate path from vision/prototype to successful launch',
      },
    ],
    details: incubatorDetails,
  },
];

export const PROGRAMS_SECTION_ID = 'programs';

export default function Programs() {
  return (
    <Section
      id={PROGRAMS_SECTION_ID}
      title='Programs'
      subtitle='Introducing two new programs to help you pioneer the next generation of novel games on Roblox. For more on novel games, see below.'
      spacingClassName={layoutStyles.programsSpacing}>
      <Flex className={cx('gap-xxlarge', layoutStyles.programsRow)}>
        {allPrograms.map((program) => (
          <ProgramCard key={program.title} className={layoutStyles.programsRowCard} {...program} />
        ))}
      </Flex>
    </Section>
  );
}
