import React, {
  ChangeEvent,
  Fragment,
  FunctionComponent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Grid, Input, Typography, Button } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { extractStringValueFromError, localizationTableClient } from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { addEntryEventModel } from '@modules/eventStream/constants/eventConstants';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import getIdentifier from '../../translation/utils/getIdentifier';
import Panel from '../../common/components/Panel';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import useEntryAdderStyles from './EntryAdder.styles';
import { characterNumberThreshold, maxCharacterNumber, placeHolderTableName } from '../constants';
import { TranslationEntry } from '../types';
import { rtlLanguages } from '../../translation/constants';

export interface EntryAdderProps {
  entryIdentifierSet: Set<string>;
  entryKeySet: Set<string>;
  onSelectEntry: (activeEntryKey: string) => void;
  toggleAddEntryPanel: (show: boolean) => void;
  onAddSuccess: (translationEntry: TranslationEntry) => void;
  onCancel: () => void;
}

const EntryAdder: FunctionComponent<React.PropsWithChildren<EntryAdderProps>> = ({
  entryIdentifierSet,
  entryKeySet,
  onSelectEntry,
  toggleAddEntryPanel,
  onAddSuccess,
  onCancel,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const {
    classes: {
      panel,
      text,
      exampleGrid,
      buttons,
      leftButton,
      charactersRemainingText,
      inputField,
      rtlInputField,
    },

    cx,
  } = useEntryAdderStyles();
  const [textToTranslate, setTextToTranslate] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [example, setExample] = useState<string | null>(null);
  const [charactersRemaining, setCharactersRemaining] = useState<number>(maxCharacterNumber);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const { gameId, entryTableId, sourceLanguageCode } = useEntryManagementMetadata();
  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();

  const hasDuplicateIdentifier = useMemo(() => {
    return entryIdentifierSet.has(getIdentifier(textToTranslate, context));
  }, [textToTranslate, context, entryIdentifierSet]);

  const hasDuplicateKey = useMemo(() => {
    if (key !== null) {
      return entryKeySet.has(key);
    }
    return false;
  }, [key, entryKeySet]);

  const isEmptyString = (inputString: string | null) => {
    return inputString === null || inputString === '';
  };

  const canAdd = useMemo(() => {
    return !hasDuplicateIdentifier && !hasDuplicateKey && !isEmptyString(textToTranslate);
  }, [textToTranslate, hasDuplicateKey, hasDuplicateIdentifier]);

  const handleInputsource = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const trimmedInput = inputValue.trim();
    if (maxCharacterNumber - trimmedInput.length >= 0) {
      setTextToTranslate(inputValue);
      setCharactersRemaining(maxCharacterNumber - trimmedInput.length);
    } else {
      setTextToTranslate(trimmedInput.substring(0, maxCharacterNumber));
      setCharactersRemaining(0);
    }
  };

  const handleInputKey = (event: ChangeEvent<HTMLInputElement>) => {
    setKey(event.target.value);
  };

  const handleInputContext = (event: ChangeEvent<HTMLInputElement>) => {
    setContext(event.target.value);
  };

  const handleInputExample = (event: ChangeEvent<HTMLInputElement>) => {
    setExample(event.target.value);
  };

  const handleSaveNewEntry = useCallback(async () => {
    setIsAdding(true);
    trackerClient.sendEvent(
      addEntryEventModel(
        textToTranslate ?? '',
        key?.trim() ?? '',
        context?.trim() ?? '',
        example?.trim() ?? '',
        gameId,
        CreatorDashboardUserResponse.Save,
      ),
    );
    try {
      if (!gameId) {
        throw new Error('Game Id is null');
      }
      const newEntry = {
        identifier: {
          source: textToTranslate ?? '',
          key: key?.trim() ?? '',
          context: context?.trim() ?? '',
        },
        metadata: {
          example: example?.trim() ?? '',
        },
      };
      const errorResponse = await localizationTableClient.modifyEntry({
        gameId,
        tableId: entryTableId,
        request: {
          entries: [newEntry],
          name: placeHolderTableName,
        },
      });
      if ((errorResponse.failedEntriesAndTranslations?.length ?? 0) > 0) {
        throw new Error('Failed to add new entry');
      }
      const identifier = getIdentifier(textToTranslate, context);
      // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
      // responsible for triaging issue.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for future use after @rbx/ui upgrade triage
      const translationEntry: TranslationEntry = {
        ...newEntry,
        createdTime: new Date(),
      };
      onSelectEntry(identifier);
      toggleAddEntryPanel(false);
      showSuccessToast(translate('Message.NewEntryAdded'));
      onAddSuccess({ ...newEntry, createdTime: new Date() });
    } catch (e) {
      error(extractStringValueFromError(e, 'message', ''));
      showFailureToast(translate('Message.FailedToAddEntry'));
    } finally {
      setIsAdding(false);
    }
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: translate/onSelectEntry/toggleAddEntryPanel/onAddSuccess/error omitted per jcountryman triage note
  }, [
    gameId,
    entryTableId,
    textToTranslate,
    key,
    context,
    example,
    showFailureToast,
    showSuccessToast,
    trackerClient,
  ]);

  const inputStyleWithRtlSupport = useMemo(() => {
    const languageCode = sourceLanguageCode ?? '';
    if (rtlLanguages.has(languageCode)) {
      return rtlInputField;
    }
    return inputField;
    // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
    // responsible for triaging issue.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inputField/rtlInputField from makeStyles are stable for this panel
  }, [sourceLanguageCode]);

  return (
    <Fragment>
      <Grid className={text}>
        <Panel className={panel} title={`${translate('Title.TextToTranslate')}:`}>
          <Input
            className={inputStyleWithRtlSupport}
            placeholder={translate('Label.Required')}
            rows={5}
            value={textToTranslate}
            multiline
            fullWidth
            onChange={handleInputsource}
          />
        </Panel>
        <Typography
          className={cx({
            [charactersRemainingText]: charactersRemaining >= characterNumberThreshold,
          })}
          color={charactersRemaining < characterNumberThreshold ? 'error' : 'secondary'}
          variant='captionBody'>
          {charactersRemaining} {translate('Label.CharactersRemaining')}
        </Typography>
      </Grid>
      <Grid container wrap='nowrap' spacing={1}>
        <Grid item XSmall={6}>
          <Panel title={`${translate('Label.Key')}:`}>
            <Input className={inputField} fullWidth onChange={handleInputKey} />
            <Fragment>
              {hasDuplicateKey && (
                <Typography color='error' variant='footer'>
                  {translate('Message.EntryWithSameKeyWarning')}
                </Typography>
              )}
            </Fragment>
          </Panel>
        </Grid>
        <Grid item XSmall={6}>
          <Panel title={`${translate('Label.Context')}:`}>
            <Input className={inputField} fullWidth onChange={handleInputContext} />
            <Fragment>
              {hasDuplicateIdentifier && (
                <Typography color='error' variant='footer'>
                  {translate('Message.EntryWithSameSourceAndContextWarning')}
                </Typography>
              )}
            </Fragment>
          </Panel>
        </Grid>
      </Grid>
      <Grid className={exampleGrid}>
        <Panel title={`${translate('Label.Example')}:`}>
          <Input
            className={inputStyleWithRtlSupport}
            rows={5}
            multiline
            fullWidth
            onChange={handleInputExample}
          />
        </Panel>
      </Grid>
      <Grid className={buttons} container justifyContent='flex-end'>
        <Button
          className={leftButton}
          variant='outlined'
          color='primary'
          onClick={onCancel}
          disabled={isAdding}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          disabled={!canAdd}
          loading={isAdding}
          variant='contained'
          onClick={handleSaveNewEntry}>
          {translate('Action.Save')}
        </Button>
      </Grid>
    </Fragment>
  );
};

export default EntryAdder;
