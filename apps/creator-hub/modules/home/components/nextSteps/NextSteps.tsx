import React, { FunctionComponent, useEffect, useState, useMemo } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { utils, components } from '@modules/miscellaneous/common';
import { withTranslation, useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { useExperience } from '../../providers/ExperienceProvider';
import { nextStepsTopics, TNextStepsTopic } from '../../constants/nextStepsConstants';
import Section from '../common/Section';
import SectionHeader from '../common/SectionHeader';
import NextStepsLoadingTile from './NextStepsLoadingTile';
import NextStepsTile from './NextStepsTile';

const { shuffle } = utils;
const { Carousel, LoadingCarousel } = components;
const NextSteps: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { user } = useAuthentication();
  const { translate } = useTranslation();
  const { experiencesAnalytics } = useExperience();
  const [cards, setCards] = useState<TNextStepsTopic[] | null>(null);

  const totalRobux = useMemo(() => {
    return Object.values(experiencesAnalytics || []).reduce((acc, curr) => {
      return acc + (curr?.robux?.newValue || 0);
    }, 0);
  }, [experiencesAnalytics]);

  const totalDAU = useMemo(() => {
    return Object.values(experiencesAnalytics || []).reduce((acc, curr) => {
      return acc + (curr?.dailyActiveUser?.newValue || 0);
    }, 0);
  }, [experiencesAnalytics]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const date = new Date();
        let shuffledTopics = shuffle(nextStepsTopics, `${user?.id ?? 0}${date.getDate()}`);
        if (totalDAU < 100) {
          shuffledTopics = shuffledTopics.filter((topic) => topic.requirement !== '100DAU');
        }
        if (totalDAU < 10) {
          shuffledTopics = shuffledTopics.filter((topic) => topic.requirement !== '10DAU');
        }
        if (totalRobux < 5000) {
          shuffledTopics = shuffledTopics.filter((topic) => topic.requirement !== '5KROBUX');
        }
        setCards(shuffledTopics);
      } catch {
        setCards([]);
      }
    };
    loadData();
  }, [totalDAU, totalRobux, user?.id]);

  if (cards?.length === 0) {
    return null;
  }

  return (
    <Section>
      <SectionHeader header={translate('Heading.NextSteps')} />
      {cards === null ? (
        <LoadingCarousel>
          {new Array(10).fill(0).map((_, id) => (
            // eslint-disable-next-line react/no-array-index-key -- NOTE(jcountryman, 03/06/24): Not important since this are throwaway components that do not have a true lifecycle in application
            <NextStepsLoadingTile key={id} />
          ))}
        </LoadingCarousel>
      ) : (
        <Carousel>
          {cards.map((data) => (
            <NextStepsTile key={data.id} data={data} />
          ))}
        </Carousel>
      )}
    </Section>
  );
};

export default withTranslation(NextSteps, [TranslationNamespace.Home]);
