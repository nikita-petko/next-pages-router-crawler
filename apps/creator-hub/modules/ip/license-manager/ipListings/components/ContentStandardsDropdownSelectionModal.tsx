import type { FunctionComponent } from 'react';
import { useState, useMemo, useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { ContentStandardsQuestionAnswer } from '@rbx/client-content-licensing-api/v1';
import { ContentStandardAnswer } from '@rbx/client-content-licensing-api/v1';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, CircularProgress, FormHelperText, Link, MenuItem, Select } from '@rbx/ui';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import GenericStandardsAccordion from '../../components/GenericStandardsAccordion';
import useGuidelinesAndRestrictionsModalStyles from '../../components/GuidelinesAndRestrictionsSummaryModal.styles';
import { COMMUNITY_STANDARDS_HREF } from '../../urls';
import {
  ContentStandardsStatements,
  getLabelFromContentStandardQuestion,
} from '../../utils/guidelinesAndRestrictions';

enum Steps {
  Selection = 0,
  Review = 1,
}

type FormStore = {
  [key: string]: string | null;
};

/** Local rows always have `questionId` (from our enum); API type keeps it optional. */
type ContentStandardsStatementFormRow = ContentStandardsQuestionAnswer & {
  questionId: NonNullable<ContentStandardsQuestionAnswer['questionId']>;
};

const statements: ContentStandardsStatementFormRow[] = Object.values(
  ContentStandardsStatements,
).map((value) => ({
  questionId: value,
  answer: undefined as string | undefined,
}));

/** Keep select menus inside the dialog DOM so Foundation Dialog focus/overlay state is not left blocking clicks. */
const contentStandardsSelectMenuProps = {
  disablePortal: true,
  disableScrollLock: true,
  disableAutoFocus: true,
  disableEnforceFocus: true,
  disableRestoreFocus: true,
} as const;

interface ContentStandardsDropdownSelectionModalProps {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  setSelections: (selections: ContentStandardsQuestionAnswer[]) => void;
  selections: ContentStandardsQuestionAnswer[];
}

interface ContentStandardsDropdownSelectionModalBodyProps extends ContentStandardsDropdownSelectionModalProps {
  classes: ReturnType<typeof useGuidelinesAndRestrictionsModalStyles>['classes'];
}

/** Form body remounts when the dialog opens so step state resets without an effect. */
const ContentStandardsDropdownSelectionModalBody: FunctionComponent<
  ContentStandardsDropdownSelectionModalBodyProps
> = ({ setOpen, setSelections, selections, classes }) => {
  const { translate, translateHTML } = useTranslation();

  const [formError, setFormError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<Steps>(Steps.Selection);
  const [isAllowedExpanded, setIsAllowedExpanded] = useState<boolean>(true);
  const [isNotAllowedExpanded, setIsNotAllowedExpanded] = useState<boolean>(true);

  const defaultValues: FormStore = useMemo(() => {
    return statements.reduce((acc, statement) => {
      if (!statement.questionId) {
        return acc;
      }
      const existingSelection = selections.find(
        (selection) => selection.questionId === statement.questionId,
      );
      acc[statement.questionId] = existingSelection?.answer ?? null;
      return acc;
    }, {} as FormStore);
  }, [selections]);

  const { control, handleSubmit, reset, getValues } = useForm({
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
        .filter((statement) => formData[statement.questionId]) // Only include statements that have a selection
        .map((statement) => ({
          questionId: statement.questionId,
          answer: formData[statement.questionId],
        }));
      setSelections(newSelections);
      setOpen(false);
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

  const onCancel = useCallback(() => {
    setOpen(false);
    if (activeStep === Steps.Selection && selections.length === 0) {
      reset(defaultValues);
    }
  }, [activeStep, selections.length, reset, defaultValues, setOpen]);

  // Ensures that we only render the accordion if we would have content in it
  const getReviewContent = useCallback(() => {
    const allowedStandards = statements
      .filter(
        (statement) => getValues(statement.questionId) === ContentStandardAnswer.Yes, // Check that the formData selection is Yes
      )
      .map((statement) => ({
        ...statement,
        answer: ContentStandardAnswer.Yes, // Forcibly apply the selection to answer (which is still undefined at this point)
      }));
    const notAllowedStandards = statements
      .filter(
        (statement) => getValues(statement.questionId) === ContentStandardAnswer.No, // Check that the formData selection is No
      )
      .map((statement) => ({
        ...statement,
        answer: ContentStandardAnswer.No, // Forcibly apply the selection to answer (which is still undefined at this point)
      }));
    // Note: we intentionally do not render the Not Applicable selections

    return allowedStandards.length === 0 && notAllowedStandards.length === 0 ? (
      <span className='text-body-medium content-muted '>
        {translate('Label.NotApplicableLong')}
      </span>
    ) : (
      <>
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
            hasBottomMargin
          />
        )}
        <span className='text-body-medium content-muted'>
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
        </span>
      </>
    );
  }, [
    getValues,
    isAllowedExpanded,
    setIsAllowedExpanded,
    isNotAllowedExpanded,
    setIsNotAllowedExpanded,
    translate,
    translateHTML,
  ]);

  return (
    <form onSubmit={handleSubmit(onFormSuccess, onFormError)}>
      <DialogContent>
        <DialogTitle
          className={`${classes.dialogTitle} margin-small text-heading-small flex flex-col gap-small`}>
          {translate('Heading.SelectContentStandards')}
          {activeStep === Steps.Review && (
            <span className='text-body-medium'>
              <strong>{translate('Label.ContentStandardsCreatorViewDisclaimer')}</strong>
            </span>
          )}
        </DialogTitle>
        <DialogBody
          className={`${classes.dialogContentExtraPadding} flex flex-col gap-small !padding-top-none`}>
          {activeStep === Steps.Selection && (
            <div className={classes.dialogContent}>
              {statements.map((statement) => (
                <div className={classes.statementContainer} key={statement.questionId}>
                  <span className='text-body-large content-muted'>
                    {translate(getLabelFromContentStandardQuestion(statement.questionId))}
                  </span>
                  <Controller
                    name={statement.questionId}
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <Select
                        {...field}
                        SelectProps={{
                          MenuProps: contentStandardsSelectMenuProps,
                        }}
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
          )}
          {activeStep === Steps.Review && (
            <div className={classes.dialogContent}>{getReviewContent()}</div>
          )}
        </DialogBody>
        <DialogFooter className={`${classes.dialogActions} flex flex-col gap-small`}>
          {formError && (
            <FormHelperText className={classes.error} error>
              {formError}
            </FormHelperText>
          )}
          <div className='flex flex-row justify-between items-center width-full'>
            <Button type='button' variant='contained' color='secondary' onClick={onCancel}>
              {translate('Action.Cancel')}
            </Button>
            <div className='flex flex-row gap-small'>
              {activeStep === Steps.Review && (
                <Button type='button' variant='contained' color='secondary' onClick={onPrev}>
                  {translate('Action.Back')}
                </Button>
              )}
              <Button
                type='button'
                variant='contained'
                color='primaryBrand'
                onClick={handleSubmit(onFormSuccess, onFormError)}>
                {activeStep === Steps.Selection
                  ? translate('Heading.Review')
                  : translate('Action.Save')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </form>
  );
};

/** ContentStandardsDropdownSelectionModal is responsible for serving, validating, and summarizing
 * IPH preference to various Content Standard expectations that Creators are allowed, not allowed,
 * or found not relevant (aka not applicable) for. */
const ContentStandardsDropdownSelectionModal: FunctionComponent<
  ContentStandardsDropdownSelectionModalProps
> = (props) => {
  const { isOpen } = props;
  const { classes } = useGuidelinesAndRestrictionsModalStyles();
  const { isFetched } = useSettings();

  if (!isFetched) {
    return <CircularProgress />;
  }

  return (
    <Dialog open={isOpen} size='Large' isModal hasCloseAffordance={false}>
      {isOpen ? <ContentStandardsDropdownSelectionModalBody {...props} classes={classes} /> : null}
    </Dialog>
  );
};

export default ContentStandardsDropdownSelectionModal;
