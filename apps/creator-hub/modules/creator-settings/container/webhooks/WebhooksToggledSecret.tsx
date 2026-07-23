import { useTranslation } from '@rbx/intl';
import { Grid, InfoOutlinedIcon, Switch, TextField, Tooltip, Typography } from '@rbx/ui';
import React, { FunctionComponent, useMemo } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { WebhookFormTextFieldPropsType, WebhookFormType } from './webhooksFieldMetadata';
import useWebhooksConfigureFormStyles from './WebhooksConfigureForm.styles';

type WebhooksToggledTextFieldProps = {
  methods: UseFormReturn<WebhookFormType>;
};

const WebhooksToggledTextField: FunctionComponent<
  React.PropsWithChildren<WebhooksToggledTextFieldProps>
> = ({ methods }) => {
  const { translate } = useTranslation();
  const { classes: styles } = useWebhooksConfigureFormStyles();
  const {
    control,
    formState: { errors },
    getValues,
    setValue,
  } = methods;

  const secretFieldProps = useMemo((): WebhookFormTextFieldPropsType => {
    return {
      id: 'secret',
      label: translate('Label.WebhookSecret'),
      inputType: 'password',
      required: false,
      rules: {
        maxLength: { value: 300, message: translate('Hint.MaxLength300') },
      },
    };
  }, [translate]);

  const { id, label, inputType, required, rules, onInputChange } = secretFieldProps;

  const onSecretToggledChange = useMemo(
    () => (event: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = (event.target as HTMLInputElement)?.checked;
      setValue('secretToggled', isChecked, { shouldValidate: true });
    },
    [setValue],
  );

  return (
    <React.Fragment>
      <Grid item className={styles.toggledSecretContainer} direction='row' container>
        <Controller
          name='secretToggled'
          control={control}
          render={({ field }) => {
            return (
              <React.Fragment>
                <Grid item>
                  <Switch
                    {...field}
                    onChange={onSecretToggledChange}
                    id='secretToggled'
                    aria-label={translate('Action.ToggleWebhookSecret')}
                    checked={field.value}
                  />
                </Grid>
                <Grid
                  className={`${styles.toggledSecretContainer} ${styles.buttonGap}`}
                  direction='row'
                  item
                  container>
                  <Grid item>
                    <Typography>{translate('Label.IncludeWebhookSecret')}</Typography>
                  </Grid>
                  <Grid item>
                    <Tooltip
                      title={
                        <Grid className={styles.itemGap} container direction='column'>
                          <Grid item>
                            <Typography variant='captionHeader'>
                              {translate('Label.SecretHint')}
                            </Typography>
                          </Grid>
                          <Grid item>
                            <Typography variant='captionBody'>
                              {translate('Description.SecretHint')}
                            </Typography>
                          </Grid>
                        </Grid>
                      }
                      className={styles.tooltip}
                      placement='right'
                      arrow
                      leaveDelay={250}>
                      <InfoOutlinedIcon className={styles.secretIconHint} color='secondary' />
                    </Tooltip>
                  </Grid>
                </Grid>
              </React.Fragment>
            );
          }}
        />
      </Grid>
      <Controller
        name={secretFieldProps.id}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE (@mbae 05/09/24) React 18 migration: Tried looking around github react-hook-form, but couldn't find a solution to this
        control={control as any}
        rules={rules}
        render={({ field }) => {
          if (getValues('secretToggled')) {
            return (
              <Grid item>
                <TextField
                  {...field}
                  id={id}
                  margin='none'
                  type={inputType}
                  label={label}
                  error={errors[secretFieldProps.id] != null}
                  helperText={errors[secretFieldProps.id]?.message as string}
                  onChange={(...args) => {
                    field.onChange(...args);
                    onInputChange?.(...args);
                  }}
                  required={required}
                  autoComplete='off'
                  fullWidth
                />
              </Grid>
            );
          }

          // eslint-disable-next-line react/jsx-no-useless-fragment -- render function doesn't allow us to return null
          return <React.Fragment />;
        }}
      />
    </React.Fragment>
  );
};

export default WebhooksToggledTextField;
