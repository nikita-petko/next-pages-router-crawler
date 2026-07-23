import React, { FunctionComponent, useMemo } from 'react';
import {
  Grid,
  Typography,
  Tooltip,
  IconButton,
  InfoOutlinedIcon,
  Switch,
  CircularProgress,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { ChangeAgentType } from '@modules/clients';
import type { GameStringTranslationInfo } from '../../gameStringTranslation/types';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import useSaveTranslationChangeAgent from './SaveTranslationChangeAgent.styles';

export interface SaveTranslationChangeAgentProps {
  isLoading: boolean;
  entryInfo: GameStringTranslationInfo;
  onSave: (currentTranslation: string | null, isTranslationManual: boolean) => void;
}

const SaveTranslationChangeAgent: FunctionComponent<
  React.PropsWithChildren<SaveTranslationChangeAgentProps>
> = ({ isLoading, entryInfo, onSave }) => {
  const { translate } = useTranslation();
  const {
    classes: { container },
  } = useSaveTranslationChangeAgent();
  const { currentLanguageOrLocaleCode } = useEntryManagementMetadata();

  const currTranslationInfo = useMemo(() => {
    return entryInfo.translations.find(
      (translation) => translation.languageCode === currentLanguageOrLocaleCode,
    );
  }, [currentLanguageOrLocaleCode, entryInfo.translations]);

  const isManualTranslation = useMemo(() => {
    return currTranslationInfo?.changeAgent?.changeAgentType === ChangeAgentType.User;
  }, [currTranslationInfo?.changeAgent?.changeAgentType]);

  let content;
  if (isLoading) {
    content = <CircularProgress color='secondary' size={20} />;
  } else {
    content = (
      <Switch
        aria-label='autolocalizationEnabledToggle'
        disabled={!currTranslationInfo?.translation}
        checked={isManualTranslation}
        size='medium'
        onChange={() => onSave(entryInfo.currentTranslation, !isManualTranslation)}
      />
    );
  }

  return (
    <Grid className={container} display='flex' justifyContent='space-between'>
      <Grid>
        <Typography variant='captionBody'>{translate('Description.LockTranslation')}</Typography>
        <Tooltip
          color='secondary'
          arrow
          title={translate('Tooltip.AutoTranslationUpdates')}
          placement='right'>
          <IconButton aria-label='info' size='large'>
            <InfoOutlinedIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Grid>
      <Grid>{content}</Grid>
    </Grid>
  );
};

export default SaveTranslationChangeAgent;
