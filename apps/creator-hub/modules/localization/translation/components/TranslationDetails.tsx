import type { ChangeEvent, FunctionComponent } from 'react';
import React, { Fragment, useMemo, useState, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Input, Tooltip, Button, ReportProblemOutlinedIcon } from '@rbx/ui';
import type { GameInfoTranslationInfo } from '../../gameInfoTranslation/types';
import type { GameProductTranslationInfo } from '../../gameProductTranslation/types';
import type { GameStringTranslationInfo } from '../../gameStringTranslation/types';
import {
  characterNumberThreshold,
  denseLanguages,
  tallLanguages,
  rtlLanguages,
} from '../constants';
import useEntryManagementMetadata from '../hooks/useEntryManagementMetadata';
import useTranslationDetailsStyles from './TranslationDetails.styles';

export interface TranslationDetailsProps {
  entryInfo: GameStringTranslationInfo | GameInfoTranslationInfo | GameProductTranslationInfo;
  identifier: string;
  sourceLanguageCode: string;
  isLoading: boolean;
  maxCharacters: number;
  onSave: (translation: string | null, isTranslationManual: boolean) => void;
}

const TranslationDetails: FunctionComponent<React.PropsWithChildren<TranslationDetailsProps>> = ({
  entryInfo,
  identifier,
  sourceLanguageCode,
  isLoading,
  maxCharacters,
  onSave,
}) => {
  const { activeTranslationTarget } = useEntryManagementMetadata();
  const { translate } = useTranslation();
  const {
    classes: {
      container,
      title,
      text,
      unavailableText,
      input,
      rtlInput,
      tallInput,
      tallRtlInput,
      denseInput,
      denseRtlInput,
      characterLeftText,
      icon,
    },

    cx,
  } = useTranslationDetailsStyles();
  const bufferIdentifier = useRef<string | null>(null);
  const bufferInitialTranslation = useRef<string | null>(null);
  const [inputTranslation, setInputTranslation] = useState<string | null>(null);
  const { globalTranslation } = entryInfo;
  const isSourceLanguage = sourceLanguageCode === activeTranslationTarget?.languageCode;
  const globalTranslationExists = globalTranslation !== null;
  const isdefaultLocalizationTarget = activeTranslationTarget?.isDefaultTarget;
  const isGlobalTranslationRequired =
    !globalTranslationExists && !isdefaultLocalizationTarget && !isSourceLanguage;
  const initialTranslation = entryInfo.currentTranslation;

  const languageName = activeTranslationTarget?.displayName;
  const currentTranslation = useMemo(() => {
    if (
      bufferIdentifier.current !== identifier ||
      bufferInitialTranslation.current !== initialTranslation
    ) {
      bufferIdentifier.current = identifier;
      bufferInitialTranslation.current = initialTranslation;
      setInputTranslation(initialTranslation);
      return initialTranslation;
    }
    return inputTranslation;
  }, [identifier, inputTranslation, initialTranslation]);

  const charactersRemaining = useMemo(() => {
    return maxCharacters - (currentTranslation?.trim().length ?? 0);
  }, [currentTranslation, maxCharacters]);

  const isSavable = useMemo(() => {
    if (isLoading || currentTranslation === null) {
      return false;
    }
    if ('fieldType' in entryInfo) {
      return currentTranslation !== initialTranslation;
    }
    return currentTranslation !== initialTranslation && currentTranslation !== '';
  }, [currentTranslation, entryInfo, initialTranslation, isLoading]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const trimmedInput = inputValue.trim();
    if (maxCharacters - trimmedInput.length >= 0) {
      setInputTranslation(inputValue);
    } else {
      setInputTranslation(trimmedInput.substring(0, maxCharacters));
    }
  };

  const inputStyle = useMemo(() => {
    const languageCode = activeTranslationTarget?.languageCode ?? '';
    if (tallLanguages.has(languageCode)) {
      return rtlLanguages.has(languageCode) ? tallRtlInput : tallInput;
    }
    if (denseLanguages.has(languageCode)) {
      return rtlLanguages.has(languageCode) ? denseRtlInput : denseInput;
    }
    return rtlLanguages.has(languageCode) ? rtlInput : input;
  }, [
    activeTranslationTarget?.languageCode,
    denseInput,
    denseRtlInput,
    input,
    rtlInput,
    tallInput,
    tallRtlInput,
  ]);

  return (
    <Grid className={container}>
      <Grid container wrap='nowrap'>
        <Grid item container>
          <Typography className={title} variant='subtitle2'>
            {translate(isSourceLanguage ? 'Title.GlobalSourceText' : 'Title.TextToTranslate')}:
          </Typography>
          <Typography className={text} variant='largeLabel2'>
            {entryInfo.sourceText}
          </Typography>
        </Grid>
      </Grid>
      {!isdefaultLocalizationTarget && !isSourceLanguage && (
        <>
          <Typography className={title} variant='subtitle2'>
            {`${languageName} | ${translate('Title.GlobalTranslation')}: `}
          </Typography>
          {globalTranslationExists ? (
            <Typography className={text} variant='subtitle2'>
              <span>{`${globalTranslation} `}</span>
              <br />
              <br />
            </Typography>
          ) : (
            <Typography className={unavailableText} variant='largeLabel2'>
              <span>{`${translate('Message.NoGlobalTranslation')} `}</span>
              <br />
              <br />
            </Typography>
          )}
        </>
      )}
      <Typography className={title} variant='subtitle2'>
        <span>{languageName}</span>
        <span>:</span>
      </Typography>
      <Input
        color='primary'
        className={inputStyle}
        placeholder={translate('Message.TranslationPlaceholder')}
        value={currentTranslation ?? ''}
        multiline
        fullWidth
        minRows={5}
        disabled={isGlobalTranslationRequired}
        onChange={handleInputChange}
      />
      <Grid container>
        <Grid item XSmall>
          <Typography
            className={cx({
              [characterLeftText]: charactersRemaining >= characterNumberThreshold,
            })}
            color={charactersRemaining < characterNumberThreshold ? 'error' : 'secondary'}
            variant='captionBody'>
            {charactersRemaining} {translate('Label.CharactersRemaining')}
          </Typography>
        </Grid>
        <Grid>
          {isGlobalTranslationRequired && (
            <Grid item className={icon}>
              <Tooltip title={translate('Message.NeedGlobalTranslation')}>
                <ReportProblemOutlinedIcon fontSize='small' />
              </Tooltip>
            </Grid>
          )}
          <Button
            size='small'
            type='submit'
            value='submit'
            variant='contained'
            loading={isLoading}
            disabled={!isSavable}
            onClick={() => onSave(currentTranslation, true)}>
            {translate('Action.Save')}
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default TranslationDetails;
