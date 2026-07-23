import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  CloseIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import {
  ASSET_PRIVACY_OPT_OUT_SURVEY_REASON_IDS_GROUP,
  ASSET_PRIVACY_OPT_OUT_SURVEY_REASON_IDS_USER,
  ASSET_PRIVACY_OPT_OUT_REASON_TRANSLATION_KEYS,
  type AssetPrivacyOptOutReasonId,
  type AssetPrivacyOptOutSurveyPayload,
} from '../types/assetPrivacyOptOutSurvey';
import useAssetPrivacyOpenUseFollowUpDialogStyles from './AssetPrivacyOpenUseFollowUpDialog.styles';

const MAX_FREE_FORM_CHARACTERS = 1000;

function clampToMaxLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}

export type AssetPrivacyOpenUseFollowUpDialogProps = {
  open: boolean;
  /** User account (Creator Settings) vs group account (group profile) — controls which friction reasons are shown. */
  surveyContext: 'user' | 'group';
  /** Close (X) / dismiss survey and continue */
  onClose: () => void;
  /** Submit survey responses and complete opt-out */
  onSubmit: (payload: AssetPrivacyOptOutSurveyPayload) => void;
};

const AssetPrivacyOpenUseFollowUpDialog: FunctionComponent<
  React.PropsWithChildren<AssetPrivacyOpenUseFollowUpDialogProps>
> = ({ open, surveyContext, onClose, onSubmit }) => {
  const { classes } = useAssetPrivacyOpenUseFollowUpDialogStyles();
  const { translate } = useTranslation();
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [additionalFeedback, setAdditionalFeedback] = useState('');

  const surveyReasonIds = useMemo(
    () =>
      surveyContext === 'user'
        ? ASSET_PRIVACY_OPT_OUT_SURVEY_REASON_IDS_USER
        : ASSET_PRIVACY_OPT_OUT_SURVEY_REASON_IDS_GROUP,
    [surveyContext],
  );

  useEffect(() => {
    if (!open) {
      setSelectedReasons(new Set());
      setAdditionalFeedback('');
    }
  }, [open]);

  const toggleReason = useCallback((reasonId: string, checked: boolean) => {
    setSelectedReasons((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(reasonId);
      } else {
        next.delete(reasonId);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit({
      reasonIds: surveyReasonIds.filter((id) =>
        selectedReasons.has(id),
      ) as AssetPrivacyOptOutReasonId[],
      additionalFeedback,
    });
  }, [additionalFeedback, onSubmit, selectedReasons, surveyReasonIds]);

  const freeFormCharacterCount = additionalFeedback.length;

  const handleFreeFormChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAdditionalFeedback(clampToMaxLength(event.target.value, MAX_FREE_FORM_CHARACTERS));
  }, []);

  return (
    <Dialog fullWidth maxWidth='Medium' open={open} onClose={onClose}>
      <DialogTitle>
        <Grid
          container
          alignItems='flex-start'
          justifyContent='space-between'
          wrap='nowrap'
          columnGap={2}>
          <Grid item style={{ flex: 1, minWidth: 0 }}>
            <Typography component='h2' variant='h3'>
              {translate('Heading.TellUsWhyOptOut' /* TranslationNamespace.AssetPrivacy */)}
            </Typography>
            <Typography
              component='p'
              variant='body2'
              color='secondary'
              style={{ marginTop: 8, marginBottom: 16 }}>
              {translate(
                'Description.OptionalSurveySubtitle' /* TranslationNamespace.AssetPrivacy */,
              )}
            </Typography>
          </Grid>
          <IconButton
            aria-label={translate('Action.Close' /* TranslationNamespace.CommonUIControls */)}
            color='inherit'
            edge='end'
            onClick={onClose}
            size='large'
            style={{ color: '#FFFFFF', flexShrink: 0 }}>
            <CloseIcon fontSize='large' />
          </IconButton>
        </Grid>
      </DialogTitle>
      <DialogContent>
        <Typography variant='subtitle2' component='p' className={classes.sectionHeading}>
          {translate('Label.SelectAllThatApply' /* TranslationNamespace.AssetPrivacy */)}
        </Typography>
        <Grid container direction='column' className={classes.reasonList}>
          {surveyReasonIds.map((reasonId) => (
            <FormControlLabel
              key={reasonId}
              className={classes.reasonRow}
              control={
                <Checkbox
                  checked={selectedReasons.has(reasonId)}
                  color='secondary'
                  name={reasonId}
                  onChange={(event) => toggleReason(reasonId, event.target.checked)}
                />
              }
              label={
                <Typography variant='body1' component='span'>
                  {translate(ASSET_PRIVACY_OPT_OUT_REASON_TRANSLATION_KEYS[reasonId])}
                </Typography>
              }
            />
          ))}
        </Grid>
        <Typography
          id='asset-privacy-opt-out-free-form-instruction'
          variant='subtitle2'
          component='p'
          className={classes.freeFormHeading}>
          {translate('Label.FreeFormMoreContext' /* TranslationNamespace.AssetPrivacy */)}
        </Typography>
        <TextField
          id='asset-privacy-opt-out-feedback'
          fullWidth
          multiline
          minRows={4}
          label={translate('Label.TypeYourMessageHere' /* TranslationNamespace.AssetPrivacy */)}
          placeholder={translate(
            'Label.TypeYourMessageHere' /* TranslationNamespace.AssetPrivacy */,
          )}
          value={additionalFeedback}
          onChange={handleFreeFormChange}
          margin='none'
          variant='outlined'
          helperText={`${freeFormCharacterCount} / ${MAX_FREE_FORM_CHARACTERS}`}
          FormHelperTextProps={{
            style: { marginLeft: 0 },
          }}
          InputProps={{
            notched: false,
            inputProps: {
              maxLength: MAX_FREE_FORM_CHARACTERS,
              'aria-describedby': 'asset-privacy-opt-out-free-form-instruction',
              'aria-label': translate(
                'Label.TypeYourMessageHere' /* TranslationNamespace.AssetPrivacy */,
              ),
            },
          }}
          InputLabelProps={{
            shrink: true,
            style: { display: 'none' },
          }}
        />
      </DialogContent>
      <Divider />
      <DialogActions className={classes.dialogActions}>
        <Button
          color='primaryBrand'
          size='large'
          variant='contained'
          className={classes.submitButton}
          onClick={handleSubmit}>
          {translate('Action.Submit' /* TranslationNamespace.AssetPrivacy */)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(AssetPrivacyOpenUseFollowUpDialog, [
  TranslationNamespace.AssetPrivacy,
  TranslationNamespace.CommonUIControls,
]);
