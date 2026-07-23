import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  clsx as cx,
} from '@rbx/foundation-ui';
import styles from './FAQ.module.css';
import layoutStyles from './Layout.module.css';

type QA = {
  question: string;
  answer: React.ReactNode;
};

const allQA: QA[] = [
  {
    question: 'What kinds of games are you looking for?',
    answer: (
      <>
        <span>
          {`Genre, gameplay, and visual style are common factors in a player's decision to try a new experience, especially for 18+ players. Entrance into Roblox Incubator and Jumpstart hinge on innovation in these areas.`}
        </span>
        <ul
          className='padding-left-xlarge padding-top-small flex flex-col gap-small'
          style={{ listStyleType: 'disc' }}>
          <li>
            <strong>{'Genres: '}</strong>
            <span>{`RPG, strategy, and shooter games are heavily underrepresented despite strong demand from older age groups. We're seeking bold games in these core genres, plus unexpected genre mash-ups and projects that blend traditional mechanics with Roblox's avatars, social features, and cross-platform support.`}</span>
          </li>
          <li>
            <strong>{'Gameplay: '}</strong>
            <span>{`Deep game mechanics, metagame systems, and skillful challenges keep players coming back. We're looking for creators who seamlessly blend depth with Roblox's intuitive nature, massive multiplayer scale, and emergent social dynamics to craft highly replayable, memorable experiences and moments players can't find anywhere else.`}</span>
          </li>
          <li>
            <strong>{'Visual style: '}</strong>
            <span>{`We're looking for games that push aesthetic boundaries and make players think "Wait, that's Roblox?" We're looking for teams innovating with hyper-realistic 3D assets, stylized 2.5D sprites, high fidelity avatars or any other technique that brings their vision to life in ways that are entirely new to Roblox.`}</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    question: 'How do I apply?',
    answer:
      'You can apply directly on this page for Jumpstart and Incubator OR at our booth at GDC 2026 for Jumpstart.',
  },
  {
    question: 'Does participation guarantee promotion or a hit game?',
    answer: `No. All program benefits are discretionary, may depend on hitting performance milestones, and don't guarantee commercial success or specific placement.`,
  },
  {
    question: 'Do I have to be 18+ to participate in this program?',
    answer:
      'Yes. All participants must be 18 years or older by the start of the program to be eligible.',
  },
  {
    question: `If I don't speak English can I participate in the programs?`,
    answer:
      'Participants should have English language skills sufficient to communicate and participate in Program activities including check-ins, milestone reviews, and cohort events. This ensures effective collaboration with Roblox staff and other participants.',
  },
  {
    question: 'If I am an experienced game developer outside of Roblox should I apply?',
    answer: `Yes! Both programs are designed for teams with existing game development experience who are looking to bring their skills to Roblox. If you've built games using other engines or platforms and are ready to apply that knowledge on Roblox, we encourage you to apply.`,
  },
  {
    question: 'I submitted an application, but need to make changes. How can I do this?',
    answer:
      'We will use the most recent version you send as your official submission. Just submit a new one!',
  },
  {
    question: 'Does every member of our team need to submit an application?',
    answer:
      'No. Only one application is needed per team. It should be completed by a team lead who can represent the project and act as the primary point of contact.',
  },
  {
    question: `I am already building a novel game but don't want to participate in the Incubator - what should I do?`,
    answer: (
      <>
        <span>
          {
            "We'd love to hear from you and support you. Tell us what game you are building by filling out "
          }
        </span>
        <a
          href='https://survey.roblox.com/jfe/form/SV_b1QDMtBNrR0EUGG'
          target='_blank'
          rel='noopener noreferrer'
          className='content-link'>
          this survey
        </a>
        <span>.</span>
      </>
    ),
  },
];

export default function FAQ() {
  return (
    <div
      className={cx(
        layoutStyles.maxWidthContainer,
        layoutStyles.faqSpacing,
        'flex',
        'flex-col',
        'gap-xlarge',
        'large:flex-row',
        'large:justify-between',
        'large:gap-[64px]',
        'padding-x-[48px]',
      )}>
      <span className='text-heading-medium small:text-heading-large content-emphasis large:text-no-wrap'>
        Frequently asked questions
      </span>
      <Accordion size='Large'>
        {allQA.map(({ question, answer }) => (
          <AccordionItem key={question}>
            <AccordionItemTrigger className={cx(styles.question, 'text-align-x-left gap-small')}>
              <span className='text-title-large text-wrap text-truncate-none no-clip'>
                {question}
              </span>
            </AccordionItemTrigger>
            <AccordionItemContent className='text-wrap text-align-x-left no-clip-x'>
              <span className='text-body-medium'>{answer}</span>
            </AccordionItemContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
