import { FunctionComponent, useState, useMemo, useCallback, useRef } from 'react';
import {
  Button,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Select,
  MenuItem,
  FormHelperText,
  Link,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Controller, useForm } from 'react-hook-form';
import {
  ContentStandardAnswer,
  ContentStandardsQuestionAnswer,
} from '@rbx/clients/contentLicensingApi/v1';
import GenericStandardsAccordion from '../../components/GenericStandardsAccordion';
import { COMMUNITY_STANDARDS_HREF } from '../../urls';
import {
  ContentStandardsStatements,
  getLabelFromContentStandardQuestion,
} from '../../utils/guidelinesAndRestrictions';
import useGuidelinesAndRestrictionsModalStyles from '../../components/GuidelinesAndRestrictionsSummaryModal.styles';

enum Steps {
  Selection = 0,
  Review = 1,
}

type FormStore = {
  [key: string]: string | null;
};

const statements: ContentStandardsQuestionAnswer[] = (() =>
  Object.values(ContentStandardsStatements).map((value) => ({
    questionId: value,
    answer: undefined as string | undefined,
  })))();

interface ContentStandardsDropdownSelectionModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  setSelections: (selections: ContentStandardsQuestionAnswer[]) => void;
  selections: ContentStandardsQuestionAnswer[];
}

/** ContentStandardsDropdownSelectionModal is responsible for serving, validating, and summarizing
 * IPH preference to various Content Standard expectations that Creators are allowed, not allowed,
 * or found not relevant (aka not applicable) for. */
const ContentStandardsDropdownSelectionModal: FunctionComponent<
  ContentStandardsDropdownSelectionModalProps
> = ({ isOpen, setOpen, setSelections, selections }) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useGuidelinesAndRestrictionsModalStyles();

  const [formError, setFormError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<Steps>(Steps.Selection);
  const [isAllowedExpanded, setIsAllowedExpanded] = useState<boolean>(true);
  const [isNotAllowedExpanded, setIsNotAllowedExpanded] = useState<boolean>(true);
  const resetStepOnCloseRef = useRef(false);

  const defaultValues: FormStore = useMemo(() => {
    return statements.reduce((acc, statement) => {
      if (!statement.questionId) return acc;
      const existingSelection = selections.find(
        (selection) => selection.questionId === statement.questionId,
      );
      acc[statement.questionId] = existingSelection?.answer || null;
      return acc;
    }, {} as FormStore);
  }, [selections]);

  const { control, handleSubmit, reset, getValues } = useForm<FormStore>({
    defaultValues,
    mode: 'onSubmit',
  });

  const onNext = useCallback(() => {
    if (activeStep === Steps.Selection) {
      setFormError(null);
      setActiveStep(activeStep + 1);
    } else {
      const formData = getValues();
      const newSelections: ContentStandardsQuestionAnswer[] = statements
        .filter((statement) => statement.questionId && formData[statement.questionId]) // Only include statements that have a selection
        .map((statement) => ({
          questionId: statement.questionId!,
          answer: formData[statement.questionId!],
        }));
      setSelections(newSelections);
      setOpen(false);
      resetStepOnCloseRef.current = true;
    }
  }, [activeStep, getValues, setOpen, setSelections]);

  const onFormSuccess = useCallback(() => {
    onNext();
  }, [onNext]);

  const onFormError = useCallback(() => {
    setFormError(translate('Error.SelectAllContentStandards'));
  }, [translate]);

  const onPrev = useCallback(() => {
    setActiveStep(activeStep - 1);
    setFormError(null);
    setIsAllowedExpanded(true);
    setIsNotAllowedExpanded(true);
  }, [activeStep]);

  const resetToSelectionStep = useCallback(() => {
    setActiveStep(Steps.Selection);
    setFormError(null);
    setIsAllowedExpanded(true);
    setIsNotAllowedExpanded(true);
  }, []);

  const onCancel = useCallback(() => {
    if (activeStep === Steps.Review) {
      setOpen(false);
      resetStepOnCloseRef.current = true;
      return;
    }
    setOpen(false);
    resetToSelectionStep();
    // Only reset to default values if the user hasn't already submitted their selections
    if (selections.length === 0) {
      reset(defaultValues);
    }
  }, [activeStep, selections.length, reset, defaultValues, setOpen, resetToSelectionStep]);

  const onDialogExited = useCallback(() => {
    if (resetStepOnCloseRef.current) {
      resetStepOnCloseRef.current = false;
      resetToSelectionStep();
    }
  }, [resetToSelectionStep]);

  // Ensures that we only render the accordion if we would have content in it
  const getReviewContent = useCallback(() => {
    const allowedStandards = statements
      .filter(
        (statement) =>
          statement.questionId && getValues(statement.questionId) === ContentStandardAnswer.Yes, // Check that the formData selection is Yes
      )
      .map((statement) => ({
        ...statement,
        answer: ContentStandardAnswer.Yes, // Forcibly apply the selection to answer (which is still undefined at this point)
      }));
    const notAllowedStandards = statements
      .filter(
        (statement) =>
          statement.questionId && getValues(statement.questionId) === ContentStandardAnswer.No, // Check that the formData selection is No
      )
      .map((statement) => ({
        ...statement,
        answer: ContentStandardAnswer.No, // Forcibly apply the selection to answer (which is still undefined at this point)
      }));
    // Note: we intentionally do not render the Not Applicable selections

    return allowedStandards.length === 0 && notAllowedStandards.length === 0 ? (
      <div>
        <Typography variant='body2' color='secondary'>
          {translate('Label.NotApplicableLong')}
        </Typography>
      </div>
    ) : (
      <div>
        {allowedStandards.length > 0 && (
          <GenericStandardsAccordion
            isAccordionOpen={isAllowedExpanded}
            setIsOpen={setIsAllowedExpanded}
            title={translate('Label.Allowed')}
            statementsToShow={allowedStandards}
          />
        )}
        {notAllowedStandards.length > 0 && (
          <GenericStandardsAccordion
            isAccordionOpen={isNotAllowedExpanded}
            setIsOpen={setIsNotAllowedExpanded}
            title={translate('Label.NotAllowed')}
            statementsToShow={notAllowedStandards}
          />
        )}
        <div className={classes.text}>
          <Typography variant='body2' color='secondary'>
            {translateHTML('Label.InAdditionCommunityStandards', [
              {
                opening: 'startLink',
                closing: 'endLink',
                content(chunks) {
                  return (
                    <Link
                      href={COMMUNITY_STANDARDS_HREF}
                      target='_blank'
                      style={{ textDecoration: 'underline' }}
                      color='inherit'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        </div>
      </div>
    );
  }, [
    getValues,
    isAllowedExpanded,
    setIsAllowedExpanded,
    isNotAllowedExpanded,
    setIsNotAllowedExpanded,
    translate,
    translateHTML,
    classes,
  ]);

  return (
    <Dialog
      maxWidth='Medium'
      open={isOpen}
      TransitionProps={{
        onExited: onDialogExited,
      }}>
      <form onSubmit={handleSubmit(onFormSuccess, onFormError)}>
        <DialogTitle className={classes.dialogTitle}>
          <Typography variant='h4'>{translate('Heading.SelectContentStandards')}</Typography>
          {activeStep === Steps.Review && (
            <Grid item>
              <Typography variant='body2' color='primary' gutterBottom>
                <strong>{translate('Label.ContentStandardsCreatorViewDisclaimer')}</strong>
              </Typography>
            </Grid>
          )}
        </DialogTitle>
        {activeStep === Steps.Selection && (
          <DialogContent>
            <div className={classes.dialogContent}>
              {statements.map((statement) => (
                <div className={classes.statementContainer} key={statement.questionId}>
                  <Typography variant='body1' color='secondary'>
                    {translate(getLabelFromContentStandardQuestion(statement.questionId!))}
                  </Typography>
                  <Controller
                    name={statement.questionId!}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Select
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (formError) {
                            setFormError(null);
                          }
                        }}
                        error={!!error}
                        helperText={error?.message}
                        label={translate('Action.Select')}
                        className={classes.selectDropdown}>
                        <MenuItem value={ContentStandardAnswer.Yes}>
                          {translate('Label.Allowed')}
                        </MenuItem>
                        <MenuItem value={ContentStandardAnswer.No}>
                          {translate('Label.NotAllowed')}
                        </MenuItem>
                        <MenuItem value={ContentStandardAnswer.NotApplicable}>
                          {translate('Label.NotApplicableLong')}
                        </MenuItem>
                      </Select>
                    )}
                    rules={{ required: translate('Label.FieldIsRequired') }}
                  />
                </div>
              ))}
            </div>
          </DialogContent>
        )}
        {activeStep === Steps.Review && (
          <DialogContent>
            <div className={classes.dialogContent}>{getReviewContent()}</div>
          </DialogContent>
        )}
        <DialogActions className={classes.dialogActions}>
          <Grid container>
            {formError && (
              <Grid item>
                <FormHelperText className={classes.error} error>
                  {formError}
                </FormHelperText>
              </Grid>
            )}
            <Grid item container flexDirection='row' justifyContent='space-between'>
              <Grid item>
                <Button size='large' variant='contained' color='secondary' onClick={onCancel}>
                  {translate('Action.Cancel')}
                </Button>
              </Grid>
              <Grid item container width='auto'>
                {activeStep === Steps.Review && (
                  <Grid item paddingRight={1}>
                    <Button size='large' variant='contained' color='secondary' onClick={onPrev}>
                      {translate('Action.Back')}
                    </Button>
                  </Grid>
                )}
                <Grid item>
                  <Button size='large' variant='contained' color='primaryBrand' type='submit'>
                    {activeStep === Steps.Selection
                      ? translate('Heading.Review')
                      : translate('Action.Save')}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ContentStandardsDropdownSelectionModal;
