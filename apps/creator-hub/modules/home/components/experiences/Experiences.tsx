import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { useMediaQuery, Button, LaunchIcon } from '@rbx/ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { urls, components } from '@modules/miscellaneous/common';
import { ReleaseStatus } from '@rbx/clients/experienceReleases';
import { multiGetExperienceReleaseStatuses } from '@modules/clients/experienceReleasesRequests';
import { getShowMoreTileData } from '../../constants/tileConstants';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import Section from '../common/Section';
import SectionHeader from '../common/SectionHeader';
import { useCreator } from '../../providers/CreatorProvider';
import { useExperience } from '../../providers/ExperienceProvider';
import ExperienceLoadingTile from './ExperienceLoadingTile';
import ExperienceEmptyState from './ExperienceEmptyState';
import ExperienceTile from './ExperienceTile';
import useExperienceInsights from '../../hooks/useExperienceInsights';

const maxExperienceTiles = 12;
const { LoadingCarousel, Carousel } = components;
const {
  creatorHub: { dashboard },
} = urls;
const Experiences: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { context } = useCreator();
  const { translate } = useTranslation();
  const { experiences, experiencesAnalytics } = useExperience();
  const { open, dialog, isCompatible } = useStudio();
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('Large'));

  const parsedGroupId = useMemo(() => {
    if (context.type === 'Group') {
      return context.id;
    }
    return undefined;
  }, [context]);

  const parsedExperiences = useMemo(
    () =>
      Object.values(experiences || {})
        .sort(
          (a, b) => new Date(b.updated as Date).getTime() - new Date(a.updated as Date).getTime(),
        )
        .map((experience) => ({
          ...experience,
          type: 'data' as const,
        }))
        .slice(0, maxExperienceTiles),
    [experiences],
  );

  const visibleAnalytics = useMemo(() => {
    if (!experiencesAnalytics) return null;
    const visibleIds = new Set(parsedExperiences.map((exp) => exp.id));
    return Object.fromEntries(
      Object.entries(experiencesAnalytics).filter(([id]) => visibleIds.has(Number(id))),
    );
  }, [experiencesAnalytics, parsedExperiences]);

  const experienceInsights = useExperienceInsights(visibleAnalytics);

  const [betaUniverseIds, setBetaUniverseIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (parsedExperiences.length === 0) return;
    const universeIds = parsedExperiences.map((exp) => exp.id);
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
  }, [parsedExperiences]);

  const renderContent = useMemo(() => {
    if (parsedExperiences.length <= 1 && experiences !== null) {
      return (
        <ExperienceEmptyState
          data={parsedExperiences[0]}
          isBeta={betaUniverseIds.has(parsedExperiences[0]?.id)}
        />
      );
    }

    if (experiences === null) {
      return (
        <LoadingCarousel>
          {new Array(maxExperienceTiles).fill(0).map((_, id) => (
            // eslint-disable-next-line react/no-array-index-key -- NOTE(jcountryman, 03/06/24): Not important since this are throwaway components that do not have a true lifecycle in application
            <ExperienceLoadingTile key={id} />
          ))}
        </LoadingCarousel>
      );
    }

    return (
      <Carousel
        // V2 hover buttons are absolutely positioned below each card (top: 100%).
        // The carousel's overflowX: scroll forces overflowY: auto, which clips them.
        // paddingBottom reserves space inside the scroll container so buttons aren't clipped;
        // marginBottom collapses that space externally so the section gap stays unchanged.
        contentStyle={{ paddingBottom: 64, marginBottom: -64 }}>
        {[...parsedExperiences, getShowMoreTileData()].map((data) => (
          <ExperienceTile
            key={data.id}
            data={data}
            insight={experienceInsights?.[data.id] ?? undefined}
            isBeta={betaUniverseIds.has(data.id)}
          />
        ))}
      </Carousel>
    );
  }, [experiences, parsedExperiences, experienceInsights, betaUniverseIds]);

  return (
    <Section>
      {parsedExperiences.length > 0 && (
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
      )}
      {renderContent}
      {dialog}
    </Section>
  );
};

export default withTranslation(Experiences, [
  TranslationNamespace.Creations,
  TranslationNamespace.Home,
]);
