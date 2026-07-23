import React, { FunctionComponent, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogTitle,
  Grid,
  Link,
  Typography,
  AlertTitle,
  DialogActions,
  DialogContent,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { CreatorType } from '@rbx/clients/assetPermissionsApi';
import { useGetAssetDependencies } from '@modules/react-query/assetPermissions';
import CompositeAssetDependenciesTable from '../table/CompositeAssetDependenciesTable';
import { alertTypeConstants, DependenciesAlertType } from '../constants/alertTypeConstants';
import useCompositeAssetDependenciesAlertStyles from './CompositeAssetDependenciesAlert.styles';

export type CompositeAssetDependenciesAlertProps = {
  alertType: DependenciesAlertType;
  parentAssetId: number;
  parentCreator: { id: number; type: CreatorType };
};

/*
 * This component has two main display states:
 * 1. The alert and dependencies are stacked
 * - This is the default state and is useful when the alert is being displayed
 *   in an existing dialog
 * 2. The alert has a "See assets" button that opens a new dialog with the dependencies
 *
 * To keep the component self-contained, all the configuration options, based on
 * the DependenciesAlertType, are defined in the alertTypeConstants object.
 */
const CompositeAssetDependenciesAlert: FunctionComponent<
  React.PropsWithChildren<CompositeAssetDependenciesAlertProps>
> = ({ alertType, parentAssetId, parentCreator }) => {
  const { translate } = useTranslation();
  const {
    alertTitleTranslationKey,
    alertSubtitleTranslationKey,
    alertLearnMoreLink,
    dependenciesDescriptionTranslationKey,
    dependenciesFilter,
    dependenciesTableOptionalAttributesToShow,
    displayDependenciesInNewModal,
    modalTitleTranslationKey,
    shouldShowDependencies,
    shouldFetchCreatorNameForDependencies,
  } = alertTypeConstants[alertType];
  const { data: dependencies } = useGetAssetDependencies(
    parentAssetId,
    dependenciesFilter,
    true, // includeAccessStatus
    shouldFetchCreatorNameForDependencies, // includeCreatorName
    parentCreator,
    shouldShowDependencies,
  );

  const {
    classes: { dependenciesDescription, alertAction, learnMoreLink, dependenciesModalActions },
  } = useCompositeAssetDependenciesAlertStyles({
    displayDependenciesInNewModal,
  });
  const [showDependenciesModal, setShowDependenciesModal] = useState(false);

  const dependenciesExist = dependencies && dependencies.length > 0;

  const dependenciesTable = useMemo(() => {
    if (!dependenciesExist) {
      return null;
    }

    return (
      <Grid container>
        {dependenciesDescriptionTranslationKey && (
          <Typography color='secondary' classes={{ root: dependenciesDescription }}>
            {translate(dependenciesDescriptionTranslationKey)}
          </Typography>
        )}
        <CompositeAssetDependenciesTable
          dependencies={dependencies}
          optionalAttributesToShow={dependenciesTableOptionalAttributesToShow}
          parentCreator={parentCreator}
        />
      </Grid>
    );
  }, [
    dependencies,
    dependenciesDescription,
    dependenciesDescriptionTranslationKey,
    dependenciesExist,
    dependenciesTableOptionalAttributesToShow,
    parentCreator,
    translate,
  ]);

  return (
    <Grid container data-testid='compositeAssetDependenciesAlert'>
      <Alert
        action={
          displayDependenciesInNewModal &&
          dependenciesExist && (
            <Typography
              variant='buttonSmall'
              classes={{ root: alertAction }}
              onClick={() => setShowDependenciesModal(true)}>
              {translate('Action.SeeAssets')}
            </Typography>
          )
        }
        severity='warning'>
        <AlertTitle>{translate(alertTitleTranslationKey)}</AlertTitle>
        <React.Fragment>
          <Typography variant='body1'>
            {translate(alertSubtitleTranslationKey)}
            &nbsp;
          </Typography>
          <Typography
            target='_blank'
            variant='body1'
            aria-label={translate('Link.LearnMore')}
            component={Link}
            href={alertLearnMoreLink}
            classes={{ root: learnMoreLink }}>
            {translate('Link.LearnMore')}
          </Typography>
        </React.Fragment>
      </Alert>
      {shouldShowDependencies &&
        (displayDependenciesInNewModal ? (
          <Dialog open={showDependenciesModal} onClose={() => setShowDependenciesModal(false)}>
            <DialogTitle>
              {modalTitleTranslationKey && translate(modalTitleTranslationKey)}
            </DialogTitle>
            <DialogContent>{dependenciesTable}</DialogContent>
            <DialogActions classes={{ root: dependenciesModalActions }}>
              <Button
                color='secondary'
                variant='outlined'
                onClick={() => setShowDependenciesModal(false)}>
                {translate('Action.Close')}
              </Button>
            </DialogActions>
          </Dialog>
        ) : (
          dependenciesTable
        ))}
    </Grid>
  );
};

export default CompositeAssetDependenciesAlert;
