import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { Grid, Chip, makeStyles, Alert, CircularProgress } from '@rbx/ui';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { usePermissionsTranslation } from '../providers/TranslationProvider';
import { usePermissionsUiConfig } from '../providers/UIConfigProvider';
import { useGetAllCreators } from '../queries';
import findFirstCreator from '../utils/creator';
import type { CreatorDetails, CreatorFilter, EntityDetails } from '../utils/types';
import { CreatorTypes, CreatorFilterChipTypes } from '../utils/types';
import { Creator } from './Creator';
import { CreatorsGroup } from './CreatorGroup';

export type CreatorGroupListProps = {
  creatorFilter: CreatorFilter;
  selectedCreator?: CreatorDetails;
  entity: EntityDetails;
  onCreatorSelect: (creator: CreatorDetails | null) => void;
};

// min height avoids the page height from jumping when the permissions UI reloads for a new creator
const PERMISSIONS_UI_MIN_HEIGHT = 550;
// This value is used to set the min height of the container so that it doesn't lead to 2 scrollbars on page.
const ACCOMMODATION_FOR_LAYOUT = 550;

const ALL_CHIPS: { labelKey: CreatorFilterChipTypes; creatorTypes: Set<CreatorTypes> }[] = [
  {
    labelKey: CreatorFilterChipTypes.ALL,
    creatorTypes: new Set([
      CreatorTypes.MEMBER_ROLE,
      CreatorTypes.USER,
      CreatorTypes.LEGACY_ROLE,
      CreatorTypes.ROLE,
    ]),
  },
  {
    labelKey: CreatorFilterChipTypes.USER,
    creatorTypes: new Set([CreatorTypes.USER]),
  },
  {
    labelKey: CreatorFilterChipTypes.ROLE,
    creatorTypes: new Set([CreatorTypes.MEMBER_ROLE, CreatorTypes.LEGACY_ROLE, CreatorTypes.ROLE]),
  },
];

const useCreatorGroupListStyles = makeStyles()((theme) => ({
  creatorGroupList: {
    [theme.breakpoints.up('Medium')]: {
      paddingRight: theme.spacing(3),
      height: `calc(100vh - ${ACCOMMODATION_FOR_LAYOUT}px)`,
      minHeight: PERMISSIONS_UI_MIN_HEIGHT,
    },
  },
}));

const CreatorGroupList: FunctionComponent<CreatorGroupListProps> = ({
  creatorFilter,
  entity,
  selectedCreator,
  onCreatorSelect,
}) => {
  const {
    classes: { creatorGroupList },
  } = useCreatorGroupListStyles();
  const { showMobileView } = usePermissionsUiConfig();
  const { translate } = usePermissionsTranslation();
  const { organization, permissions } = useCurrentGroup();
  const {
    data: creatorData,
    isPending,
    isError,
  } = useGetAllCreators(creatorFilter, entity, organization ?? undefined, permissions ?? undefined);
  const [selectedChip, setSelectedChip] = useState<number>(0);

  const chipsToShow = ALL_CHIPS.filter((chip) =>
    creatorData?.some((creatorGroup) => chip.creatorTypes.has(creatorGroup.type)),
  );

  useEffect(() => {
    if (!selectedCreator && !isPending && !showMobileView) {
      const firstCreator = findFirstCreator(creatorData);
      onCreatorSelect(firstCreator);
    }
  }, [showMobileView, isPending, creatorData, onCreatorSelect, selectedCreator]);

  if (isError) {
    return (
      <Grid margin={3}>
        <Alert severity='error' variant='standard'>
          {translate('Messages.CreatorFetchFailed')}
        </Alert>
      </Grid>
    );
  }

  return isPending ? (
    <Grid container justifyContent='center' mt={10}>
      <CircularProgress />
    </Grid>
  ) : (
    <>
      {/* the first chip is the "all" chip. If there are only 2 chips, both will show the same data. */}
      {chipsToShow.length > 2 && (
        <Grid container justifyContent='left' mb={3}>
          {chipsToShow.map((chip, index) => (
            <Grid pr={1} key={chip.labelKey}>
              <Chip
                color={selectedChip === index ? 'primary' : 'secondary'}
                label={translate(`Chip.${chip.labelKey}.Label`)}
                onClick={() => setSelectedChip(index)}
                size='medium'
                variant='filled'
                data-testid={`chip-${chip.labelKey}`}
              />
            </Grid>
          ))}
        </Grid>
      )}
      <Grid className={creatorGroupList}>
        {entity.owner && <Creator {...entity.owner} isOwner />}
        {creatorData &&
          creatorData.map(
            (creatorGroup) =>
              chipsToShow[selectedChip].creatorTypes.has(creatorGroup.type) && (
                <CreatorsGroup
                  key={creatorGroup.type}
                  selectedCreator={selectedCreator}
                  {...creatorGroup}
                  onCreatorSelect={onCreatorSelect}
                />
              ),
          )}
      </Grid>
    </>
  );
};

export { CreatorGroupList };
