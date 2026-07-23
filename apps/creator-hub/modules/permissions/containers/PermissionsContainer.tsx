import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { NavigateBeforeIcon, Button, Grid, makeStyles, Typography } from '@rbx/ui';
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import ToolboxServiceApiProvider from '@modules/toolboxService/ToolboxServiceApiProvider';
import { CreatorGroupList } from '../components/CreatorGroupList';
import { PermissionGroupList } from '../components/PermissionGroupList';
import { TranslationContext, useTranslationContext } from '../providers/TranslationProvider';
import { UIConfigProvider, useUiConfig } from '../providers/UIConfigProvider';
import type { CreatorTypes } from '../utils/enums';
import type { CreatorDetails, EntityDetails, UIConfig } from '../utils/types';

type PermissionsContainerProps = {
  entity: EntityDetails;
  creatorFilter: Array<CreatorTypes | CreatorDetails>;
  uiConfig?: UIConfig;
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

const PermissionsContainerInternal: FunctionComponent<PermissionsContainerInternalProps> = ({
  entity,
  creatorFilter,
  setSelectedCreator,
  selectedCreator,
}) => {
  const { translate } = useTranslationContext();
  const { showMobileView, singleCreatorExperience } = useUiConfig();
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
    const noCreatorsLink = translate(`Action.${creatorType}.NoCreatorsLink`);
    return (
      <EmptyStateBorder>
        <EmptyState
          illustration='noUsers'
          size='small'
          title={String(translate(`Messages.${creatorType}.NoCreatorsToShow`))}>
          <Typography variant='body2' mt={1}>
            {translate(`Messages.${creatorType}.NoCreatorsToShowSubtext`)}
          </Typography>

          {noCreatorsLink && (
            <Grid item mt={2}>
              <Button href='/dashboard/group/roles' color='secondary' variant='contained'>
                {noCreatorsLink}
              </Button>
            </Grid>
          )}
        </EmptyState>
      </EmptyStateBorder>
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
    if (uiConfig?.singleCreatorExperience && !selectedCreator) {
      setSelectedCreator(creatorFilter[0] as CreatorDetails);
    }
  }, [uiConfig, creatorFilter, selectedCreator]);

  return (
    <ToolboxServiceApiProvider>
      <TranslationContext entity={entity} selectedCreator={selectedCreator ?? undefined}>
        <UIConfigProvider {...uiConfig}>
          <PermissionsContainerInternal
            entity={entity}
            creatorFilter={creatorFilter}
            setSelectedCreator={setSelectedCreator}
            selectedCreator={selectedCreator}
          />
        </UIConfigProvider>
      </TranslationContext>
    </ToolboxServiceApiProvider>
  );
};

export { PermissionsContainer, type PermissionsContainerProps };
