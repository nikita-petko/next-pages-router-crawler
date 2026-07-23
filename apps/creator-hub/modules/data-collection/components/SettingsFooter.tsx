import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ErrorOutlineOutlinedIcon,
  Grid,
  Typography,
  makeStyles,
  useDialog,
} from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import DataSharingDefaultSettingsKey from '../enums/DataSharingDefaultSettingsKey';
import type { ChangedDataCount } from '../utils/formDiffUtils';
import {
  DataSharingEntityType,
  getChangedData,
  getSharedAndUnsharedCounts,
} from '../utils/formDiffUtils';

export const defaultSettingsKeys: DataSharingDefaultSettingsKey[] = [
  DataSharingDefaultSettingsKey.Experiences,
  DataSharingDefaultSettingsKey.AvatarItems,
  DataSharingDefaultSettingsKey.CreatorStore,
];

function getTranslationKeyForTab(key: string): string {
  switch (key) {
    case DataSharingEntityType.Experience:
      return 'Tab.Experiences';
    case DataSharingEntityType.LuauDataset:
      return 'Tab.PublicLuau';
    case DataSharingEntityType.AvatarAsset:
    case DataSharingEntityType.AvatarBundle:
      return 'Tab.Bundles';
    case DataSharingEntityType.CreatorStoreAsset:
      return 'Tab.Products';
    default: {
      throw new Error(`Unknown tab key: ${key}`);
    }
  }
}

const useStyle = makeStyles()((theme) => ({
  statusContainer: {
    ...theme.border.radius.medium,
    border: `1px solid ${theme.palette.components.divider}`,
    marginTop: 10,
    marginBottom: 10,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 20,
    paddingRight: 20,
  },
  itemsList: {
    margin: 0,
    '& li': {
      marginTop: 5,
    },
  },
}));

type SettingsFooterProps = {
  onSubmit: () => void;
  onCancel: () => void;
  isDirty: boolean;
  initialValuesRef: React.RefObject<Record<string, boolean>>;
  isSubmitting: boolean;
};

const SettingsFooter: FunctionComponent<SettingsFooterProps> = ({
  onSubmit,
  onCancel,
  isDirty,
  initialValuesRef,
  isSubmitting,
}) => {
  const { configure: configureDialog, open: openDialog, close: closeDialog } = useDialog();
  const { getValues } = useFormContext();
  const {
    classes: { statusContainer, itemsList },
  } = useStyle();

  const { translate, translateHTML } = useTranslation();

  const translateChangedDataToString = useCallback(
    (changedData: ChangedDataCount) => {
      return Object.entries(changedData)
        .filter(([, number]) => number > 0)
        .map(([type, number]) => `${number} ${translate(getTranslationKeyForTab(type))}`)
        .join(', ');
    },
    [translate],
  );

  const translateToDialogDisplayMessage = useCallback(
    (key: string, changedData: ChangedDataCount) => {
      const omit = Object.values(changedData).every((value) => value === 0);
      if (omit) {
        return null;
      }
      return translateHTML(key, [
        {
          opening: 'itemsStart',
          closing: 'itemsEnd',
          content() {
            return (
              <Typography variant='largeLabel2'>
                {translateChangedDataToString(changedData)}
              </Typography>
            );
          },
        },
      ]);
    },
    [translateChangedDataToString, translateHTML],
  );

  const openConfirmationDialog = useCallback(
    (unshared: ChangedDataCount, shared: ChangedDataCount) => {
      const unsharedMessage = translateToDialogDisplayMessage(
        'Message.ConfirmationUnshared',
        unshared,
      );
      const sharedMessage = translateToDialogDisplayMessage('Message.ConfirmationShared', shared);
      configureDialog(
        <Dialog open data-testid='data-sharing-footer-dialog' maxWidth='Medium'>
          <DialogTitle>{translate('Header.ConfirmationModal')}</DialogTitle>
          <DialogContent>
            <DialogContentText component='div'>
              <Flex
                flexDirection='row'
                alignItems='flex-start'
                gap={10}
                classes={{ root: statusContainer }}>
                <ErrorOutlineOutlinedIcon color='info' fontSize='large' />
                <div>
                  <Typography component='p'>{translate('Message.ConfirmationContinue')}</Typography>
                  <ul className={itemsList}>
                    {unsharedMessage && (
                      <li data-testid='data-sharing-footer-unshared'>{unsharedMessage}</li>
                    )}
                    {sharedMessage && (
                      <li data-testid='data-sharing-footer-shared'>{sharedMessage}</li>
                    )}
                  </ul>
                </div>
              </Flex>
              <Typography component='p' marginBottom={2} variant='body1'>
                {translate('Message.ConfirmationModal1')}
              </Typography>
              {unsharedMessage && (
                <Typography component='p' variant='body2'>
                  {translate('Message.ConfirmationModal2')}
                </Typography>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              variant='outlined'
              color='secondary'
              onClick={closeDialog}
              data-testid='data-sharing-footer-dialog-cancel'>
              {translate('Action.Cancel')}
            </Button>
            <Button
              variant='contained'
              color='primaryBrand'
              onClick={() => {
                closeDialog();
                onSubmit();
              }}
              data-testid='data-sharing-footer-dialog-confirm'>
              {translate('Action.Continue')}
            </Button>
          </DialogActions>
        </Dialog>,
      );
      openDialog();
    },
    [
      configureDialog,
      closeDialog,
      openDialog,
      onSubmit,
      translate,
      translateToDialogDisplayMessage,
      statusContainer,
      itemsList,
    ],
  );

  const pendingSubmit = () => {
    const currentValues = getValues();
    const changedDataSharingValues = getChangedData(initialValuesRef.current, currentValues);

    if (Object.keys(changedDataSharingValues).length > 0) {
      const { unshared, shared } = getSharedAndUnsharedCounts(
        initialValuesRef.current,
        currentValues,
      );
      openConfirmationDialog(unshared, shared);
    } else {
      onSubmit();
    }
  };

  return (
    <Flex flexDirection='row'>
      <Grid container spacing={2}>
        <Grid item sx={{ my: 4 }}>
          <Button
            color='secondary'
            size='large'
            variant='outlined'
            onClick={onCancel}
            disabled={!isDirty || isSubmitting}
            data-testid='data-sharing-footer-cancel'>
            {translate('Action.Cancel')}
          </Button>
        </Grid>
        <Grid item sx={{ my: 4 }}>
          <Button
            color='primaryBrand'
            size='large'
            variant='contained'
            onClick={pendingSubmit}
            disabled={!isDirty || isSubmitting}
            loading={isSubmitting}
            data-testid='data-sharing-footer-save'>
            {translate('Action.Save')}
          </Button>
        </Grid>
      </Grid>
    </Flex>
  );
};

export default withTranslation(SettingsFooter, [TranslationNamespace.DataSharingSettingsV2]);
