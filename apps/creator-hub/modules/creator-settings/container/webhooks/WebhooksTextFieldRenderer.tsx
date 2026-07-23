import { useTranslation } from '@rbx/intl';
import {
  Grid,
  InfoOutlinedIcon,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@rbx/ui';
import React, { FunctionComponent, useMemo, useState } from 'react';
import { Link } from '@modules/miscellaneous/common';
import { ContentType } from '@rbx/clients/webhookConfigurationGateway';
import { Controller, UseFormReturn } from 'react-hook-form';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import {
  WebhookFormTextFieldNames,
  WebhookFormTextFieldPropsType,
  WebhookFormType,
} from './webhooksFieldMetadata';
import useWebhooksConfigureFormStyles from './WebhooksConfigureForm.styles';

type WebhooksTextFieldRendererProps = {
  methods: UseFormReturn<WebhookFormType>;
};

const WebhooksTextFieldRenderer: FunctionComponent<
  React.PropsWithChildren<WebhooksTextFieldRendererProps>
> = ({ methods }) => {
  const { translate, translateHTML } = useTranslation();
  const { classes: styles } = useWebhooksConfigureFormStyles();
  const [oldUrlValue, setOldUrlValue] = useState('');
  const { control, formState, setValue, getValues } = methods;
  const { errors } = formState;

  const textFieldProps = useMemo((): Record<
    Exclude<WebhookFormTextFieldNames, 'secretToggled' | 'secret'>,
    WebhookFormTextFieldPropsType
  > => {
    return {
      webhookUrl: {
        id: 'webhookUrl',
        label: translate('Label.WebhookUrl'),
        inputType: 'text',
        required: true,
        rules: {
          required: { value: true, message: translate('Hint.RequiredField') },
          maxLength: { value: 2048, message: translate('Hint.MaxLength2048') },
          validate: (url) => {
            try {
              // NOTE (mbae, 03/27/23): We don't assign this to anything since
              // we want the side effect, and VS Code undeclared cleanup would
              // remove this statement otherwise.
              // eslint-disable-next-line no-new -- See comment above
              new URL(url);
              return true;
            } catch {
              return translate('Hint.InvalidUrl');
            }
          },
        },
        onInputChange: (...args) => {
          const emittedValue = args[0].target.value;
          if (oldUrlValue === getValues('name')) {
            setValue('name', emittedValue);
          }
          setOldUrlValue(emittedValue);
        },
        inputAdornment: [
          <InputAdornment position='end' key='1'>
            <Tooltip
              title={
                <Grid className={styles.itemGap} container direction='column'>
                  <Grid item>
                    <Typography variant='captionHeader'>
                      {translate('Label.PayloadUrlHint')}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant='captionBody'>
                      {translateHTML('Description.PayloadUrlHint', [
                        {
                          opening: 'guideLinkStart',
                          closing: 'guideLinkEnd',
                          content(chunks) {
                            return (
                              <Link
                                href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/cloud/webhook-notifications#third-party-requirements`}
                                target='_blank'>
                                {chunks}
                              </Link>
                            );
                          },
                        },
                      ])}
                    </Typography>
                  </Grid>
                </Grid>
              }
              className={styles.tooltip}
              placement='right'
              arrow
              leaveDelay={250}>
              <InfoOutlinedIcon color='secondary' />
            </Tooltip>
          </InputAdornment>,
        ],
      },
      name: {
        id: 'name',
        label: translate('Label.WebhookName'),
        inputType: 'text',
        required: true,
        rules: {
          required: { value: true, message: translate('Hint.RequiredField') },
          maxLength: { value: 2048, message: translate('Hint.MaxLength2048') },
        },
      },
      contentType: {
        id: 'contentType',
        label: translate('Label.WebhookContentType'),
        inputType: 'text',
        required: true,
        rules: {
          required: { value: true, message: translate('Hint.RequiredField') },
        },
        formComponentType: 'Select',
        selectComponentValues: [{ value: ContentType.Json, text: 'application/json' }],
      },
    };
  }, [getValues, oldUrlValue, setValue, styles.itemGap, styles.tooltip, translate, translateHTML]);

  return (
    <React.Fragment>
      {Object.keys(textFieldProps).map((textFieldPropKey) => {
        const textFieldPropKeyTyped = textFieldPropKey as Exclude<
          WebhookFormTextFieldNames,
          'secretToggled' | 'secret'
        >;
        const {
          id,
          label,
          inputType,
          required,
          rules,
          formComponentType,
          selectComponentValues: selectComponentvalues,
          onInputChange,
          inputAdornment,
        } = textFieldProps[textFieldPropKeyTyped];

        return (
          <Grid item key={textFieldPropKey}>
            <Controller
              name={textFieldPropKeyTyped}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE (@mbae 05/09/24) React 18 migration: Tried looking around github react-hook-form, but couldn't find a solution to this
              control={control as any}
              rules={rules}
              render={({ field }) => {
                const fieldComponent =
                  formComponentType === 'Select' ? (
                    <Select
                      {...field}
                      id={id}
                      variant='outlined'
                      margin='none'
                      required={required}
                      label={label}
                      error={!!errors[textFieldPropKeyTyped]}
                      helperText={errors[textFieldPropKeyTyped]?.message}
                      InputProps={{ endAdornment: inputAdornment }}
                      fullWidth>
                      {selectComponentvalues?.map(({ value, text }) => (
                        <MenuItem key={value} value={value}>
                          {text}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    <TextField
                      {...field}
                      id={id}
                      margin='none'
                      type={inputType}
                      label={label}
                      error={!!errors[textFieldPropKeyTyped]}
                      helperText={errors[textFieldPropKeyTyped]?.message}
                      onChange={(...args) => {
                        field.onChange(...args);
                        onInputChange?.(...args);
                      }}
                      InputProps={{ endAdornment: inputAdornment }}
                      required={required}
                      autoComplete='off'
                      fullWidth
                    />
                  );

                return fieldComponent;
              }}
            />
          </Grid>
        );
      })}
    </React.Fragment>
  );
};

export default WebhooksTextFieldRenderer;
