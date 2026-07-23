import { FunctionComponent, useMemo, useCallback } from 'react';
import { CreatorType, Item } from '@modules/miscellaneous/common';
import { ItemGridContainer } from '@modules/creations';
import { useTranslation } from '@rbx/intl';
import { EmptyState, Flex } from '@modules/miscellaneous/common/components';
import { makeStyles } from '@rbx/ui';
import {
  LicenseManagerImpressionEvent,
  useLicenseManagerLoggerLogOnce,
} from '@modules/ip/license-manager/utils/logger';

import loadExperiences, {
  ExperienceData,
  LoadExperiencesParameters,
} from '../utils/loadExperiences';
import ExperienceCardContainer from './ExperienceCardContainer';

interface ExperienceSelectorProps {
  licenseId: string;
  creatorId: number;
  creatorType: CreatorType;
  loadPageSize?: number;
}

const useStyles = makeStyles()((theme) => ({
  emptyStateContainer: {
    ...theme.border.radius.large,
    border: `1px solid ${theme.palette.components.divider}`,
    width: '100%',
    height: '212px',
  },
}));

/** A component that displays a step in the request license flow where the user selects an experience to apply with. */
const ExperienceSelector: FunctionComponent<ExperienceSelectorProps> = ({
  licenseId,
  creatorId,
  creatorType,
  loadPageSize,
}) => {
  const { translate } = useTranslation();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const {
    classes: { emptyStateContainer },
  } = useStyles();

  const pagingParameters: LoadExperiencesParameters = useMemo(() => {
    return {
      licenseId,
      creatorId,
      creatorType,
      loadPageSize,
    };
  }, [licenseId, creatorId, creatorType, loadPageSize]);

  const updateItems = useCallback((data: ExperienceData[]) => {
    return data.map((experience) => {
      if (experience.universeId) {
        return {
          ...experience,
        };
      }
      return experience;
    });
  }, []);

  const emptyContent = useMemo(() => {
    return (
      <Flex classes={{ root: emptyStateContainer }}>
        <EmptyState
          title={translate('Label.NoExperiencesFound')}
          description={translate('Description.NoExperiencesFound')}
          size='small'
        />
      </Flex>
    );
  }, [translate, emptyStateContainer]);

  const handleFirstPageLoad = useCallback(
    (isEmpty: boolean) => {
      if (isEmpty) {
        logOnce(
          LicenseManagerImpressionEvent.EmptyStateMatchesTableNoValidExperiencesForThisCreatorImpressionEvent,
        );
      }
    },
    [logOnce],
  );

  return (
    <ItemGridContainer
      pagingParameters={pagingParameters}
      loadItems={loadExperiences}
      updateItems={updateItems}
      getItemKey={(item) => item.universeId ?? 0}
      GridItemComponent={ExperienceCardContainer}
      errorMessage={translate('Message.LoadItemsError', {
        itemType: Item.Game,
      })}
      emptyMessage={emptyContent}
      onFirstPageLoad={handleFirstPageLoad}
      useWideIcons
    />
  );
};

export default ExperienceSelector;
