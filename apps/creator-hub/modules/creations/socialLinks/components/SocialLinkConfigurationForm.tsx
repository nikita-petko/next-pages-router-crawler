import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { Grid, Button, Typography, Divider, DialogTemplate, useDialog, useSnackbar } from '@rbx/ui';
import { useForm, FormProvider, useFieldArray, useWatch } from 'react-hook-form';
import FormMode from '@modules/miscellaneous/common/enums/FormMode';
import { SocialLinksData, SocialLinksMetadata, SocialLinkTypes } from '@modules/clients';
import { useTranslation } from '@rbx/intl';
import { toastDurationTime } from '@modules/miscellaneous/common';
import useSocialLinksBehavior from '@modules/social-links/hooks/useSocialLinksBehavior';
import SocialLinkFormErrors from '../errors';
import useSocialLinkConfigurationFormStyles from './SocialLinkConfigurationForm.styles';
import useTranslatedSocialLinkNames from '../hooks/useTranslatedSocialLinkNames';
import { SocialLinkFormType } from '../formConfiguration';
import FormItem from './FormItem';

export interface SocialLinkConfigurationFormProps {
  linkMetadata: SocialLinksMetadata | null;
  savedLinks: SocialLinkFormType;
  onDelete: (row: SocialLinksData) => Promise<unknown>;
  onAdd: (row: SocialLinksData) => Promise<SocialLinksData>;
  onSave: (row: SocialLinksData) => Promise<SocialLinksData>;
  onRefetchLinks: () => Promise<{
    socialLink: SocialLinksData[];
  }>;
}

const maxLinkCount = 3;
const newRow: SocialLinksData = {
  linkId: null,
  linkType: null,
  title: '',
  url: '',
};

const SocialLinkConfigurationForm: FunctionComponent<
  React.PropsWithChildren<SocialLinkConfigurationFormProps>
> = ({ linkMetadata, onAdd, onSave, onDelete, onRefetchLinks, savedLinks }) => {
  const { open, close: closeDialog, configure } = useDialog();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const [isDeletingLink, setIsDeletingLink] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [commonErrorMessage, setCommonErrorMessage] = useState<string | null>(null);
  // This value is for reset form default value after everytime submit to server
  const [defaultValue, setDefaultValue] = useState<SocialLinksData[]>(savedLinks.socialLink);
  const [rowToDelete, setRowToDelete] = useState<{
    index: number;
    item: SocialLinksData;
  } | null>(null);
  const {
    classes: { formField, buttons, cancelButton, errorMessage, dialogText },
  } = useSocialLinkConfigurationFormStyles();
  const {
    data: { shouldDisableSocialLinkCreation },
  } = useSocialLinksBehavior();

  const formMethods = useForm<SocialLinkFormType>({
    disabled: shouldDisableSocialLinkCreation,
    mode: FormMode.All,
    reValidateMode: FormMode.OnChange,
    defaultValues: { socialLink: defaultValue },
  });
  const { formState, control, getValues, handleSubmit, reset, setError, clearErrors, trigger } =
    formMethods;
  const { fields, append, update, remove, replace } = useFieldArray({
    control,
    shouldUnregister: true,
    name: 'socialLink',
  });
  const { translate } = useTranslation();
  const { getTranslatedSocialLinkName } = useTranslatedSocialLinkNames();

  const handleResetForm = useCallback(() => {
    reset();
    setCommonErrorMessage(null);
  }, [reset]);

  const handleAddRow = useCallback(() => {
    append({ ...newRow });
  }, [append]);

  const rowIsDirty = useCallback(
    (index: number) => {
      return [
        formState.dirtyFields?.socialLink?.[index]?.title,
        formState.dirtyFields?.socialLink?.[index]?.url,
        formState.dirtyFields?.socialLink?.[index]?.linkType,
      ].includes(true);
    },
    [formState.dirtyFields?.socialLink],
  );

  const formValue = useWatch({
    control,
    name: `socialLink`,
  });

  const isCancelDisable = useMemo(() => {
    if (typeof formValue === 'undefined') {
      return true;
    }
    return (
      formState.isSubmitting ||
      !formState.isDirty ||
      (formValue.length === 1 && Object.values(formValue[0]).every((value) => !value))
    );
  }, [formState.isDirty, formState.isSubmitting, formValue]);

  const triggerInputValidation = useCallback(async () => {
    await trigger(
      fields.map((_, index) => `socialLink.${index}.linkType` as `socialLink.${number}.linkType`),
    );
    // NOTE (lguan-cn, 2022-7-20) Errors shouldn't be shown on untouched and empty field
    fields.forEach((_, index) => {
      if (
        !formState.touchedFields?.socialLink?.[index]?.linkType &&
        getValues(`socialLink.${index}.linkType`) === null
      ) {
        clearErrors(`socialLink.${index}.linkType`);
      }
    });
  }, [clearErrors, fields, formState.touchedFields?.socialLink, getValues, trigger]);

  const handleDeleteRow = useCallback(
    (index: number) => {
      const linkId = getValues(`socialLink.${index}.linkId`);
      const savedLink = savedLinks.socialLink.find((link) => link.linkId === linkId);
      if (savedLink === undefined) {
        remove(index);
      } else {
        setRowToDelete({
          index,
          item: savedLink,
        });
        open();
      }
    },
    [getValues, open, remove, savedLinks.socialLink],
  );

  const handleDeleteFromServer = useCallback(async () => {
    if (!rowToDelete) {
      return;
    }
    setCommonErrorMessage(null);
    // prevent closure value change
    const rowToDeleteLocalCopy = { ...rowToDelete };
    setIsDeletingLink(true);
    setSubmitSuccess(false);
    try {
      await onDelete(rowToDeleteLocalCopy.item);
      await onRefetchLinks();
      remove(rowToDeleteLocalCopy.index);
      setDefaultValue((oldValue) => {
        return oldValue.reduce<Array<SocialLinksData>>((previousValue, item) => {
          if (item.linkId !== rowToDeleteLocalCopy.item.linkId) {
            previousValue.push(item);
          }
          return previousValue;
        }, []);
      });
      setSubmitSuccess(true);
      enqueue({
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHide: true,
        message: translate('Message.SuccessfullyDeleteLink'),
        autoHideDuration: toastDurationTime,
        onClose: closeSnackbar,
      });
    } catch {
      setError(`socialLink.${rowToDeleteLocalCopy.index}`, {
        type: SocialLinkFormErrors.DeletionError.toString(),
      });
    } finally {
      setIsDeletingLink(false);
      setRowToDelete(null);
      closeDialog();
    }
  }, [
    closeDialog,
    closeSnackbar,
    enqueue,
    onDelete,
    onRefetchLinks,
    remove,
    rowToDelete,
    setError,
    translate,
  ]);

  const addToServerAndUpdateDefaultValue = useCallback(
    async (item: SocialLinksData, index: number) => {
      const response = await onAdd(item);
      await onRefetchLinks();
      setDefaultValue((oldValue) => {
        if (oldValue.length >= maxLinkCount) {
          throw new Error('value out of range');
        }
        const newValue = [...oldValue];
        // for make sure the value can be properly set by order since backend response might in different order
        newValue.splice(index, 0, response);
        return newValue;
      });
      update(index, response);
      return response;
    },
    [onAdd, onRefetchLinks, update],
  );

  const updateToServerAndUpdateDefaultValue = useCallback(
    async (item: SocialLinksData) => {
      const response = await onSave(item);
      await onRefetchLinks();
      setDefaultValue((oldValue) => {
        return oldValue.map((row) => {
          if (row.linkId === item.linkId) {
            return { ...response };
          }
          return row;
        }, []);
      });
      return response;
    },
    [onRefetchLinks, onSave],
  );

  const handleSubmitForm = handleSubmit(async (data) => {
    setCommonErrorMessage(null);
    const promises: Array<Promise<SocialLinksData>> = [];
    const triggerRequestIndex: Array<number> = [];
    data.socialLink.forEach((item, index) => {
      if (!rowIsDirty(index)) {
        return;
      }
      if (!item.linkId) {
        promises.push(addToServerAndUpdateDefaultValue(item, index));
      } else {
        promises.push(updateToServerAndUpdateDefaultValue(item));
      }
      triggerRequestIndex.push(index);
    });
    if (promises.length === 0) {
      return;
    }
    setSubmitSuccess(false);
    const responses = await Promise.allSettled(promises);
    const failedLinks: string[] = [];
    const successLinks: string[] = [];
    responses.forEach((response, promiseIndex) => {
      const realIndex = triggerRequestIndex[promiseIndex];
      if (response.status === 'fulfilled' && response.value !== null) {
        const linkType = response.value.linkType?.toString() ?? '';
        successLinks.push(getTranslatedSocialLinkName(linkType as SocialLinkTypes));
      }
      if (response.status === 'rejected') {
        if (response.reason.message === 'Error.TitleModerated') {
          setError(`socialLink.${realIndex}.title`, {
            type: SocialLinkFormErrors.BackendFeedback,
            message: translate(response.reason.message),
          });
        }
        if (
          response.reason.message === 'Error.UrlWrongFormat' ||
          response.reason.message === 'Error.InsufficientGroupPermission'
        ) {
          setError(`socialLink.${realIndex}.url`, {
            type: SocialLinkFormErrors.BackendFeedback,
            message: translate(response.reason.message),
          });
        }
        const linkType = data.socialLink[realIndex].linkType?.toString() ?? '';
        failedLinks.push(getTranslatedSocialLinkName(linkType as SocialLinkTypes));
      }
    });
    if (failedLinks.length > 0) {
      setCommonErrorMessage(translate('Error.FailedToSaveLink', { links: failedLinks.join(', ') }));
    }
    if (successLinks.length > 0) {
      setSubmitSuccess(true);
      enqueue({
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHide: true,
        message: translate('Message.SaveLinkSuccess', {
          links: failedLinks.length > 0 ? successLinks.join(', ') : translate('Label.All'),
        }),
        autoHideDuration: toastDurationTime,
        onClose: closeSnackbar,
      });
    }
  });

  useEffect(() => {
    configure(
      <DialogTemplate
        variant='alert'
        color='destructive'
        loading={isDeletingLink}
        title={translate('Label.ConfirmDeleteDialogTitle')}
        content={
          <span className={dialogText}>
            {translate('Label.DeleteLinkConfirmation', {
              url: rowToDelete?.item.url || '',
            })}
          </span>
        }
        cancelText={translate('Label.Cancel')}
        confirmText={translate('Label.Delete')}
        onCancel={closeDialog}
        onConfirm={handleDeleteFromServer}
      />,
    );
  }, [
    closeDialog,
    configure,
    dialogText,
    handleDeleteFromServer,
    isDeletingLink,
    rowToDelete?.item.url,
    translate,
  ]);

  useEffect(() => {
    // for reset form default value after everytime submit to server
    if (submitSuccess) {
      const currentValue = getValues(`socialLink`);
      reset({ socialLink: defaultValue }, { keepErrors: true });
      // below line is for rewrit current values into the form since `keepValue` of `reset` method is kind of buggy
      // maybe need to to below operation in next tick if the behaviour becomes wired
      replace(currentValue);
    }
  }, [defaultValue, getValues, replace, reset, submitSuccess]);

  useEffect(() => {
    // for auto insert new row when all deleted
    if (fields.length === 0) {
      append({ ...newRow });
    }
  }, [append, fields.length]);

  useEffect(() => {
    // should trigger validation on deletion
    triggerInputValidation();
  }, [formValue?.length, triggerInputValidation]);

  return (
    <Grid>
      <Grid item XSmall={12}>
        <Grid className={formField} item XSmall={12} XLarge={8}>
          <Typography variant='body1' color='primary'>
            {translate('Description.SocialLink')}
          </Typography>
        </Grid>
        <Grid className={formField} item XSmall={12} XLarge={8}>
          <Typography variant='body1' color='primary'>
            {translate('Description.SocialLinkLimit')}
          </Typography>
        </Grid>
        <FormProvider {...formMethods}>
          {fields.map((field, index) => (
            <FormItem
              key={field.id}
              index={index}
              linkMetadata={linkMetadata}
              onValidateInput={triggerInputValidation}
              onDelete={() => handleDeleteRow(index)}
              disableDelete={fields.length === 1 && getValues(`socialLink.0.linkId`) === null}
            />
          ))}
        </FormProvider>
        {fields.flat().length < maxLinkCount && (
          <Button
            data-testid='add-link'
            className={formField}
            color='primary'
            variant='contained'
            disabled={formState.isSubmitting || formState.disabled}
            onClick={() => handleAddRow()}>
            {translate('Label.AddLink')}
          </Button>
        )}
        <Grid item XSmall={12} XLarge={8}>
          <Divider />
        </Grid>
      </Grid>
      <Grid className={buttons} container direction='row'>
        <Button
          data-testid='reset-form'
          className={cancelButton}
          variant='outlined'
          color='primary'
          disabled={isCancelDisable}
          onClick={handleResetForm}>
          {translate('Label.Cancel')}
        </Button>
        <Button
          data-testid='submit-form'
          variant='contained'
          disabled={!formState.isDirty || fields.length === 0 || formState.disabled}
          loading={formState.isSubmitting}
          onClick={() => {
            clearErrors();
            handleSubmitForm();
          }}>
          {translate('Label.Save')}
        </Button>
      </Grid>
      <Grid item XSmall={12} XLarge={8}>
        <Typography
          data-testid='common-error'
          className={errorMessage}
          component='p'
          variant='smallLabel2'
          color='error'>
          {commonErrorMessage}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default SocialLinkConfigurationForm;
