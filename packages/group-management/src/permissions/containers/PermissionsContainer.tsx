import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { NavigateBeforeIcon, Button, Grid, makeStyles, Typography } from '@rbx/ui';
import useCurrentGroup from '../../hooks/useCurrentGroup';
import { CreatorGroupList } from '../components/CreatorGroupList';
import { PermissionGroupList } from '../components/PermissionGroupList';
import {
  PermissionsTranslationProvider,
  usePermissionsTranslation,
} from '../providers/TranslationProvider';
import { PermissionsUIConfigProvider, usePermissionsUiConfig } from '../providers/UIConfigProvider';
import type {
  CreatorDetails,
  CreatorTypes,
  EntityDetails,
  PermissionsUIConfig,
} from '../utils/types';

export type PermissionsContainerProps = {
  entity: EntityDetails;
  creatorFilter: Array<CreatorTypes | CreatorDetails>;
  uiConfig?: PermissionsUIConfig;
};

type PermissionsContainerInternalProps = Omit<PermissionsContainerProps, 'uiConfig'> & {
  setSelectedCreator: React.Dispatch<React.SetStateAction<CreatorDetails | null | undefined>>;
  selectedCreator?: CreatorDetails | null;
};

const usePermissionsContainerStyles = makeStyles()((theme) => ({
  creatorGridClass: {
    [theme.breakpoints.up('Medium')]: {
      borderRight: `1px solid ${theme.palette.components.divider}`,
    },
    overflow: 'auto',
  },
  fullPage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.palette.surface[0],
    width: '100%',
    zIndex: 1,
  },
  mobileBackButton: {
    margin: theme.spacing(3),
    marginBottom: 0,
  },
}));

const DefaultEmptyState: FunctionComponent<{ creatorType?: CreatorTypes }> = ({ creatorType }) => {
  const { translate } = usePermissionsTranslation();
  const titleKey = creatorType
    ? `Universe.Messages.${creatorType}.NoCreatorsToShow`
    : 'Messages.NoCreators';

  return <Typography variant='h4'>{translate(titleKey)}</Typography>;
};

const PermissionsContainerInternal: FunctionComponent<PermissionsContainerInternalProps> = ({
  entity,
  creatorFilter,
  setSelectedCreator,
  selectedCreator,
}) => {
  const { errorComponents } = useCurrentGroup();
  const { translate } = usePermissionsTranslation();
  const { showMobileView, singleCreatorExperience } = usePermissionsUiConfig();
  const [mobileStep, setMobileStep] = useState<number>(1);

  const {
    classes: { creatorGridClass, fullPage, mobileBackButton },
    cx,
  } = usePermissionsContainerStyles();

  const onCreatorSelect = useCallback(
    (creator: CreatorDetails | null) => {
      setSelectedCreator(creator);
      setMobileStep(2);
    },
    [setSelectedCreator, setMobileStep],
  );

  if (selectedCreator === null) {
    const creatorType = entity.owner?.type;
    return (
      <>
        {errorComponents?.emptyStateComponent ? (
          errorComponents.emptyStateComponent({ creatorType })
        ) : (
          <DefaultEmptyState creatorType={creatorType} />
        )}
      </>
    );
  }

  return (
    <Grid container data-testid='permissions-container' alignItems='stretch'>
      {!singleCreatorExperience && (
        <Grid
          item
          XSmall={12}
          Medium={4}
          XLarge={3}
          pt={2}
          pb={2}
          className={creatorGridClass}
          hidden={showMobileView && mobileStep !== 1}
          data-testid='creator-group-list'>
          <CreatorGroupList
            entity={entity}
            creatorFilter={creatorFilter}
            selectedCreator={selectedCreator ?? undefined}
            onCreatorSelect={onCreatorSelect}
          />
        </Grid>
      )}
      <Grid
        item
        XSmall={12}
        Medium={singleCreatorExperience ? 12 : 8}
        XLarge={singleCreatorExperience ? 12 : 9}
        hidden={showMobileView && mobileStep !== 2}
        className={cx({ [fullPage]: showMobileView })}>
        {showMobileView && (
          <Button
            color='inherit'
            size='small'
            startIcon={<NavigateBeforeIcon />}
            variant='text'
            onClick={() => setMobileStep(1)}
            className={mobileBackButton}
            data-testid='mobile-back-button'>
            {translate('Action.MobileBackButton')}
          </Button>
        )}
        <PermissionGroupList entity={entity} creator={selectedCreator} key={selectedCreator?.id} />
      </Grid>
    </Grid>
  );
};

const PermissionsContainer: FunctionComponent<PermissionsContainerProps> = ({
  entity,
  creatorFilter,
  uiConfig,
}) => {
  const [selectedCreator, setSelectedCreator] = useState<CreatorDetails | null | undefined>();

  useEffect(() => {
    if (uiConfig?.singleCreatorExperience) {
      const first = creatorFilter[0];
      if (first && typeof first !== 'string') {
        setSelectedCreator(first);
      }
    }
  }, [uiConfig, creatorFilter]);

  return (
    <PermissionsTranslationProvider entity={entity} selectedCreator={selectedCreator ?? undefined}>
      <PermissionsUIConfigProvider {...uiConfig}>
        <PermissionsContainerInternal
          entity={entity}
          creatorFilter={creatorFilter}
          setSelectedCreator={setSelectedCreator}
          selectedCreator={selectedCreator}
        />
      </PermissionsUIConfigProvider>
    </PermissionsTranslationProvider>
  );
};

export { PermissionsContainer };
