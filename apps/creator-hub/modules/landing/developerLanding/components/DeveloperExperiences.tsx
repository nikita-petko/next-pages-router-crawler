import React, { FunctionComponent, useState, useEffect, useRef } from 'react';
import { makeStyles } from '@rbx/ui';
import { gamesClient, GameDetailResponse } from '@modules/clients';
import { components } from '@modules/miscellaneous/common';
// eslint-disable-next-line no-restricted-imports -- Linter error is not valid. Caused by nested directory named the same module.
import mockGameDetailsResponse from '../../landing/constants/mockGameDetailsResponse';
import { DEVELOPER_LANDING_HORIZONTAL_PADDING } from './DeveloperContainer.styles';
import DeveloperExperienceCard from './DeveloperExperienceCard';
import { experienceAssets, experienceIds } from '../constants/contentConstants';
import { EDeveloperLandingSection } from '../utils/eventUtils';
import useDeveloperLandingSectionImpression from '../utils/useDeveloperLandingSectionImpression';

const { Carousel } = components;
const useStyles = makeStyles()(() => ({
  root: {
    padding: `0px ${DEVELOPER_LANDING_HORIZONTAL_PADDING.compact}px`,
  },
}));

const DeveloperExperiences: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const {
    classes: { root },
  } = useStyles();
  const [gameDetails, setGameDetails] = useState<Record<number, GameDetailResponse>>({});
  const experiencesContainerRef = useRef<HTMLDivElement>(null);
  useDeveloperLandingSectionImpression(
    experiencesContainerRef,
    EDeveloperLandingSection.Experiences,
    1,
  );

  useEffect(() => {
    const getGameDetails = async () => {
      try {
        const { data = [] } = await gamesClient.getDetails(Object.values(experienceIds));
        const parsedData = data.reduce<Record<number, GameDetailResponse>>((acc, curr) => {
          acc[curr.id ?? 0] = curr;
          return acc;
        }, {});
        setGameDetails(parsedData);
      } catch {
        // Fail silently
      }
    };
    const mockGameDetails = async () => {
      setGameDetails(mockGameDetailsResponse);
    };

    if (process.env.bedev1BaseDomain === 'roblox.com') {
      getGameDetails();
    } else {
      mockGameDetails();
    }
  }, []);

  return (
    <div ref={experiencesContainerRef} className={root}>
      <Carousel>
        {Object.keys(experienceIds).map((experience) => {
          const experienceId = experienceIds[experience as keyof typeof experienceIds];
          const experienceAsset = experienceAssets[experience as keyof typeof experienceIds];

          return (
            <DeveloperExperienceCard
              key={experienceId}
              details={gameDetails[experienceId]}
              imageUrl={experienceAsset}
            />
          );
        })}
      </Carousel>
    </div>
  );
};
export default DeveloperExperiences;
