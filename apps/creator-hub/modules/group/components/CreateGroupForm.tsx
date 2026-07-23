import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { SubmitHandler, ControllerRenderProps } from 'react-hook-form';
import { useForm, Controller } from 'react-hook-form';
import type { V1GroupsCreatePostRequest } from '@rbx/client-groups/v1';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { useTranslation } from '@rbx/intl';
import {
  Typography,
  Grid,
  makeStyles,
  Button,
  Divider,
  FormHelperText,
  TextField,
  RobuxIcon,
  CircularProgress,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import economyClient from '@modules/clients/economy';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { CreatorType, FormMode } from '@modules/miscellaneous/common';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { creatorHub } from '@modules/miscellaneous/urls';
import { getEnumKeyByValue } from '@modules/miscellaneous/utils/enumUtils';
import { useGroups } from '@modules/providers/groups/GroupsProvider';
import { useCreateGroup } from '@modules/react-query/groups/groupQueries';
import type { CreateGroupFormType, GroupIcon } from '../ConfigureGroupTypes';
import { NewGroupPrice } from '../constants/groupConstants';
import GroupErrorCodes from '../interface/GroupErrorCodes';
import IconUploader from './IconUploader';

const useCreateGroupFormStyles = makeStyles()((theme) => ({
  configureButton: {
    marginRight: 12,
  },
  pageContainer: {
    width: '100%',
    height: '100%',
    minHeight: 450,
  },
  formContainer: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 48,
    },
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },
  inputFormPadding: {
    width: '100%',
    '& > *:not(:last-child)': {
      paddingBottom: 32,
    },
  },
  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
    color: theme.palette.actionV2.important.fill,
    fontWeight: 'bold',
    fontSize: 12,
  },
  buttonContainer: {
    padding: '32px 0',
    flexDirection: 'row',
    [theme.breakpoints.down('Large')]: {
      flexDirection: 'column',
    },
  },
  descriptionField: {
    '& > * > div': {
      minHeight: 180,
      alignItems: 'baseline',
    },
  },
  priceIcon: {
    verticalAlign: 'sub',
    fontSize: '1rem',
  },
}));
const CreateGroupRegisterOptions = {
  name: {
    required: 'Error.OrganizationNameRequired',
    maxLength: 50,
  },
  icon: { required: true },
  description: {
    maxLength: 1000,
  },
};

export type CreateGroupFormProps = {
  disabled?: boolean;
};

const CreateGroupForm: FunctionComponent<React.PropsWithChildren<CreateGroupFormProps>> = ({
  disabled = false,
}) => {
  const {
    classes: {
      formContainer,
      inputFormPadding,
      configureButton,
      errorMessageStyles,
      buttonContainer,
      descriptionField,
      priceIcon,
    },
  } = useCreateGroupFormStyles();

  const { translate } = useTranslation();
  const [formSubmissionErrorMsg, setFormSubmissionErrorMsg] = useState<string | null>(null);

  const { error } = useMetricsMonitoring();
  const [currentBalance, setCurrentBalance] = useState<number | undefined>();

  const { user } = useAuthentication();
  const router = useRouter();
  const { refreshGroups } = useGroups();

  const loadCurrency = useCallback(
    async (creatorType: CreatorType, id: number) => {
      try {
        if (creatorType === CreatorType.User) {
          const userCurrency = await economyClient.getUserCurrency(id);
          setCurrentBalance(userCurrency.robux);
        } else if (creatorType === CreatorType.Group) {
          const groupCurrency = await economyClient.getGroupCurrency(id);
          setCurrentBalance(groupCurrency.robux);
        } else {
          throw new Error('Invalid payment source type');
        }
      } catch (e) {
        if (typeof e === 'string') {
          error(e);
        }
      }
    },
    [error],
  );

  useEffect(() => {
    if (user && user.id) {
      void loadCurrency(CreatorType.User, user.id);
    }
  }, [user, loadCurrency]);

  const createGroupFormDefaultValue = useMemo(() => ({}), []);

  const { handleSubmit, control, setValue, formState, reset } = useForm<CreateGroupFormType>({
    mode: FormMode.OnChange,
    reValidateMode: FormMode.OnChange,
    defaultValues: createGroupFormDefaultValue,
    shouldUnregister: true,
  });
  const { isSubmitting, errors, isValid, isValidating, isDirty } = formState;

  const handleIconChange = useCallback(
    (newValue: GroupIcon, fieldOnChange: ControllerRenderProps['onChange']) => {
      setValue('icon', newValue);
      fieldOnChange(newValue);
    },
    [setValue],
  );

  const redirectToProfile = useCallback(
    async (groupId: number) => {
      if (user?.id) {
        // Clear the cache for the user's groups so that the new group is fetched on the next page load
        await refreshGroups();
      }

      void router.push(creatorHub.dashboard.getGroupProfileUrl(groupId.toString()));
    },
    [user?.id, refreshGroups, router],
  );

  const { mutateAsync: createGroup } = useCreateGroup();
  const { setWorkspaceByGroupId } = useWorkspaces();

  const handleFormSubmit: SubmitHandler<CreateGroupFormType> = useCallback(
    async (data) => {
      setFormSubmissionErrorMsg(null);

      const createGroupRequest: V1GroupsCreatePostRequest = {
        name: data.name,
        description: data.description,
        publicGroup: false,
        buildersClubMembersOnly: false,
        files: data.icon.file,
      };

      try {
        const response = await createGroup(createGroupRequest);

        if (response.id) {
          setWorkspaceByGroupId(response.id);
          void redirectToProfile(response.id);
        } else {
          setFormSubmissionErrorMsg(translate('Error.UnknownError'));
        }
      } catch (errRes) {
        let errorMsgKey = 'Error.UnknownError';
        const err = await tryParseResponseError(errRes);
        if (err) {
          const nameOfError = getEnumKeyByValue(GroupErrorCodes, err.code);
          if (nameOfError) {
            errorMsgKey = `Error.${nameOfError}`;
          }
        }

        setFormSubmissionErrorMsg(translate(errorMsgKey));
      }
    },
    [setFormSubmissionErrorMsg, translate, redirectToProfile, createGroup, setWorkspaceByGroupId],
  );

  useEffect(() => {
    if (reset) {
      reset(createGroupFormDefaultValue);
    }
  }, [createGroupFormDefaultValue, reset]);

  return (
    <Grid container item className={formContainer} data-testid='create-group-form'>
      <HubMeta
        title={buildTitle(translate('Heading.CreateGroup'))}
        breadcrumb={buildBreadcrumb(translate('Label.Group'), translate('Heading.CreateGroup'))}
      />
      <Grid container item XSmall={12}>
        <Controller
          name='icon'
          control={control}
          rules={CreateGroupRegisterOptions.icon}
          render={({ field }) => (
            <IconUploader
              {...field}
              onSelectValue={(newValue) => handleIconChange(newValue, field.onChange)}
              disabled={isSubmitting || disabled || disabled}
            />
          )}
        />
      </Grid>
      <Grid container item XSmall={12} XLarge={6} className={inputFormPadding}>
        <Grid item XSmall={12}>
          <Controller
            name='name'
            control={control}
            rules={CreateGroupRegisterOptions.name}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.name}
                fullWidth
                multiline
                required
                id='name'
                inputProps={{ maxLength: 50 }}
                label={translate('Label.OrganizationName')}
                helperText={
                  errors?.name?.message
                    ? translate(errors.name.message)
                    : translate('Message.CharacterLimit', {
                        limit: '50',
                      })
                }
                disabled={isSubmitting || disabled || disabled}
              />
            )}
          />
        </Grid>

        <Grid item XSmall={12} className={descriptionField}>
          <Controller
            name='description'
            control={control}
            rules={CreateGroupRegisterOptions.description}
            render={({ field }) => (
              <TextField
                {...field}
                error={!!errors.description}
                fullWidth
                multiline
                id='description'
                inputProps={{ maxLength: 1000 }}
                label={translate('Label.Description')}
                helperText={
                  errors.description && errors.description.message
                    ? translate(errors.description.message)
                    : translate('Message.CharacterLimit', {
                        limit: '1000',
                      })
                }
                disabled={isSubmitting || disabled}
              />
            )}
          />
        </Grid>
      </Grid>
      <Grid container item XSmall={12} XLarge={8}>
        <Grid item XSmall={12}>
          <Divider />
        </Grid>
        <Grid container item XSmall={12} className={buttonContainer} alignItems='center'>
          <Button
            className={configureButton}
            data-testid='create-group-button'
            variant='contained'
            size='large'
            color='primaryBrand'
            disabled={
              !isDirty ||
              isValidating ||
              !isValid ||
              // oxlint-disable-next-line typescript/prefer-nullish-coalescing - Flase positive values caused by formSubmissionErrorMsg
              (formSubmissionErrorMsg && !isDirty) ||
              disabled
            }
            onClick={handleSubmit(handleFormSubmit)}
            loading={isSubmitting}>
            <>
              <span>{translate('Action.PurchaseFor')}</span>&nbsp;
              <RobuxIcon className={priceIcon} />
              <span>{NewGroupPrice}</span>
            </>
          </Button>

          <Typography variant='body2' color='secondary'>
            <span>{translate('Label.CurrentBalance')}</span>&nbsp;
            {currentBalance === undefined ? (
              <CircularProgress size={14} />
            ) : (
              <>
                <RobuxIcon className={priceIcon} />
                <span>{currentBalance}</span>
              </>
            )}
          </Typography>

          {formSubmissionErrorMsg && (
            <FormHelperText className={errorMessageStyles}>{formSubmissionErrorMsg}</FormHelperText>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CreateGroupForm;
