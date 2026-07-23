import type { FunctionComponent } from 'react';
import React, { useEffect, useMemo, useState } from 'react';
import { ReleaseStatus } from '@rbx/client-experience-releases-api/v1';
import { withTranslation, useTranslation } from '@rbx/intl';
import { useMediaQuery, Button, LaunchIcon } from '@rbx/ui';
import { multiGetExperienceReleaseStatuses } from '@modules/clients/experienceReleasesRequests';
import { CreatorType } from '@modules/miscellaneous/common';
import { Carousel, LoadingCarousel } from '@modules/miscellaneous/components';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { getShowMoreTileData } from '../../constants/tileConstants';
import useExperienceInsights from '../../hooks/useExperienceInsights';
import { useCreator } from '../../providers/CreatorProvider';
import { useExperience, maxExperienceTiles } from '../../providers/ExperienceProvider';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import Section from '../common/Section';
import SectionHeader from '../common/SectionHeader';
import ExperienceEmptyState from './ExperienceEmptyState';
import ExperienceLoadingTile from './ExperienceLoadingTile';
import ExperienceTile from './ExperienceTile';

const { dashboard } = creatorHub;
const Experiences: FunctionComponent<React.PropsWithChildren> = () => {
  const { context } = useCreator();
  const { translate } = useTranslation();
  const { visibleExperiences, experiencesAnalytics } = useExperience();
  const { open, dialog, isCompatible } = useStudio();
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const parsedGroupId = context.type === CreatorType.Group ? context.id : undefined;

  const visibleAnalytics = useMemo(() => {
    if (!experiencesAnalytics || !visibleExperiences) {
      return null;
    }
    const visibleIds = new Set(visibleExperiences.map((exp) => exp.id));
    return Object.fromEntries(
      Object.entries(experiencesAnalytics).filter(([id]) => visibleIds.has(Number(id))),
    );
  }, [experiencesAnalytics, visibleExperiences]);

  const experienceInsights = useExperienceInsights(visibleAnalytics);

  const [betaUniverseIds, setBetaUniverseIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!visibleExperiences || visibleExperiences.length === 0) {
      return;
    }
    const universeIds = visibleExperiences.map((exp) => exp.id);
    multiGetExperienceReleaseStatuses({
      multiGetReleaseStatusesRequest: { universeIds },
    })
      .then((response) => {
        const betaIds = new Set<number>();
        response.universeIds?.forEach((uid, index) => {
          if (response.releaseTypes?.[index] === ReleaseStatus.Beta) {
            betaIds.add(uid);
          }
        });
        setBetaUniverseIds(betaIds);
      })
      .catch(() => {});
  }, [visibleExperiences]);

  const renderContent = useMemo(() => {
    if (visibleExperiences === null) {
      return (
        <LoadingCarousel>
          {Array.from({ length: maxExperienceTiles }).map((_, id) => (
            // eslint-disable-next-line react/no-array-index-key -- NOTE(jcountryman, 03/06/24): Not important since this are throwaway components that do not have a true lifecycle in application
            <ExperienceLoadingTile key={id} />
          ))}
        </LoadingCarousel>
      );
    }

    if (visibleExperiences.length <= 1) {
      return (
        <ExperienceEmptyState
          data={visibleExperiences[0]}
          isBeta={betaUniverseIds.has(visibleExperiences[0]?.id)}
        />
      );
    }

    const tiles = [
      ...visibleExperiences.map((experience) => ({ ...experience, type: 'data' as const })),
      getShowMoreTileData(),
    ];

    return (
      <Carousel
        // V2 hover buttons are absolutely positioned below each card (top: 100%).
        // The carousel's overflowX: scroll forces overflowY: auto, which clips them.
        // paddingBottom reserves space inside the scroll container so buttons aren't clipped;
        // marginBottom collapses that space externally so the section gap stays unchanged.
        contentStyle={{ paddingBottom: 64, marginBottom: -64 }}>
        {tiles.map((data) => (
          <ExperienceTile
            key={data.id}
            data={data}
            insight={experienceInsights?.[data.id] ?? undefined}
            isBeta={betaUniverseIds.has(data.id)}
          />
        ))}
      </Carousel>
    );
  }, [visibleExperiences, experienceInsights, betaUniverseIds]);

  return (
    <Section>
      <SectionHeader
        header={translate('Heading.Experiences')}
        viewAllHref={dashboard.getUrl(parsedGroupId)}
        onViewAllClick={() => {
          captureHomepageEvent('clickViewAll', EHomepageSection.Experiences);
        }}
        adornment={
          !isSm &&
          isCompatible && (
            <Button
              onClick={() => {
                open({ task: EStudioTaskType.Default });
              }}
              size='small'
              color='primary'
              variant='outlined'
              endIcon={<LaunchIcon />}>
              {translate('Label.CreateExperience')}
            </Button>
          )
        }
      />
      {renderContent}
      {dialog}
    </Section>
  );
};

export default withTranslation(Experiences, [
  TranslationNamespace.Creations,
  TranslationNamespace.Home,
]);
