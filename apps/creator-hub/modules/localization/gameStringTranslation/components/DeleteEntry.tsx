import {
  Accordion,
  Dialog,
  Typography,
  AccordionSummary,
  AccordionDetails,
  Grid,
  DialogTemplate,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import React, { Fragment, FunctionComponent, useCallback, useMemo, useState } from 'react';
import { extractStringValueFromError, localizationTableClient } from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
// eslint-disable-next-line no-restricted-imports -- deep import; localization root barrel removed
import useLocaleMap from '@modules/localization/localization/hooks/useLocaleMap';
import Panel from '../../common/components/Panel';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import useDeleteEntryStyles from './DeleteEntry.styles';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import { GameStringTranslationInfo, TranslationInfo } from '../types';
import { placeHolderTableName } from '../constants';

export interface DeleteEntryProps {
  isDialogOpen: boolean;
  entryInfo: GameStringTranslationInfo;
  onSelectEntry: (activeEntryKey: string | null) => void;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

const DeleteEntry: FunctionComponent<React.PropsWithChildren<DeleteEntryProps>> = ({
  isDialogOpen,
  entryInfo,
  onSelectEntry,
  onClose,
  onDeleteSuccess,
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const { error } = useMetricsMonitoring();
  const {
    classes: { panel, translationGrid, sourceTextGrid, accordion, accordionGrid },
  } = useDeleteEntryStyles();
  const { translate } = useTranslation();
  const { languagesMap } = useLocaleMap();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const { gameId, entryTableId } = useEntryManagementMetadata();

  const handleCancel = () => {
    onClose();
  };

  const handleConfirmDeletion = useCallback(async () => {
    setIsDeleting(true);
    try {
      if (!gameId) {
        throw new Error('Game Id is null');
      }
      const errorResponse = await localizationTableClient.modifyEntry({
        gameId,
        tableId: entryTableId,
        request: {
          entries: [
            {
              identifier: {
                source: entryInfo?.sourceText,
                key: entryInfo?.key ?? '',
                context: entryInfo?.context ?? '',
              },
              _delete: true,
            },
          ],
          name: placeHolderTableName,
        },
      });
      if ((errorResponse.failedEntriesAndTranslations?.length ?? 0) > 0) {
        throw new Error('Failed to delete entry');
      }
      onSelectEntry(null);
      showSuccessToast(translate('Message.EntryDeleted'));
      onDeleteSuccess();
    } catch (e) {
      error(extractStringValueFromError(e, 'message', ''));
      showFailureToast(translate('Message.FailedToDeleteEntry'));
    } finally {
      setIsDeleting(false);
    }
  }, [
    gameId,
    entryTableId,
    entryInfo,
    translate,
    showSuccessToast,
    showFailureToast,
    onDeleteSuccess,
    error,
    onSelectEntry,
  ]);

  const translationInfoList = useMemo(() => {
    return entryInfo.translations
      .map((translation) => {
        const languageName = languagesMap.get(translation.languageCode);
        if (languageName) {
          return {
            languageCode: languagesMap.get(translation.languageCode),
            translation: translation.translation,
          } as TranslationInfo;
        }
        return undefined;
      })
      .filter((info) => info) as TranslationInfo[];
  }, [entryInfo, languagesMap]);

  return (
    <Dialog open={isDialogOpen} maxWidth='Medium'>
      <DialogTemplate
        color='destructive'
        title={translate('Label.DeleteEntry')}
        cancelText={translate('Action.Cancel')}
        confirmText={translate('Action.Delete')}
        loading={isDeleting}
        onConfirm={handleConfirmDeletion}
        onCancel={handleCancel}
        content={
          <Fragment>
            <Typography variant='body1'>{translate('Message.DeleteEntryWarning')}</Typography>
            <Grid className={sourceTextGrid}>
              <Typography variant='largeLabel1'>{translate('Label.SourceText')} </Typography>
              <Typography variant='body2'>{entryInfo.sourceText}</Typography>
            </Grid>
            <Panel
              title={`${translate('Label.AffectedLanguages')} ${translate(
                'Label.CompletedTranslations',
              )} ${entryInfo.translations.length}`}
              className={panel}>
              <Grid className={accordionGrid}>
                {translationInfoList.map((translationInfo) => (
                  <Accordion key={translationInfo.languageCode} className={accordion}>
                    <AccordionSummary>
                      <Typography variant='smallLabel1'>{translationInfo.languageCode}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid className={translationGrid}>
                        <Typography variant='smallLabel2'>
                          {translationInfo.translation.translationText}
                        </Typography>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Grid>
            </Panel>
          </Fragment>
        }
      />
    </Dialog>
  );
};

export default DeleteEntry;
