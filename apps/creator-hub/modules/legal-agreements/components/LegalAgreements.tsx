import React, { ReactElement, FunctionComponent, useCallback, useState, Fragment } from 'react';
import {
  Checkbox,
  CheckCircleOutlineIcon,
  FormControlLabel,
  Grid,
  TextField,
  Typography,
} from '@rbx/ui';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import useLegalAgreementStyles from './LegalAgreements.styles';

export type LegalStatementType = {
  id: string;
  text: string | ReactElement;
  wasPreviouslySigned?: boolean;
};

export interface LegalAgreementsProps {
  description?: string;
  isSignatureRequired: boolean;
  legalStatements: LegalStatementType[];
  onFormUpdate?: (isAllAgreementsComplete: boolean) => void;
  statementSpacing?: number;
  signatureWidth?: string;
}

const LegalAgreements: FunctionComponent<React.PropsWithChildren<LegalAgreementsProps>> = ({
  description,
  isSignatureRequired,
  legalStatements,
  onFormUpdate,
  statementSpacing,
  signatureWidth,
}) => {
  const { classes: styles } = useLegalAgreementStyles();
  const { translate } = useTranslation();
  const [checkedCheckboxes, setCheckedCheckboxes] = useState<{ [id: string]: boolean }>({});
  const [signature, setSignature] = useState('');
  const { control, formState } = useFormContext();
  const { errors } = formState;

  const areLegalAgreementsComplete = useCallback(
    (checkboxes: { [id: string]: boolean }, currSignature: string): boolean => {
      const allCheckboxesChecked =
        Object.values(checkboxes).filter((checked) => checked).length === legalStatements.length;
      const signatureEntered = !!currSignature && !errors.signature;

      return allCheckboxesChecked && (isSignatureRequired ? !!signatureEntered : true);
    },
    [errors, isSignatureRequired, legalStatements],
  );

  const onClickCheckbox = useCallback(
    (checkboxId: string) => {
      const newCheckboxState = {
        ...checkedCheckboxes,
        ...{ [checkboxId]: !checkedCheckboxes[checkboxId] },
      };
      setCheckedCheckboxes(newCheckboxState);
      if (onFormUpdate) {
        onFormUpdate(areLegalAgreementsComplete(newCheckboxState, signature));
      }
    },
    [checkedCheckboxes, onFormUpdate, areLegalAgreementsComplete, signature],
  );

  const onEnterSignature = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newSignature = e.target.value;
      setSignature(newSignature);
      if (onFormUpdate) {
        onFormUpdate(areLegalAgreementsComplete(checkedCheckboxes, newSignature));
      }
    },
    [checkedCheckboxes, onFormUpdate, areLegalAgreementsComplete],
  );

  let hasCheckBoxError = false;
  legalStatements.forEach((statement) => {
    if (errors[statement.id]) {
      hasCheckBoxError = true;
    }
  });
  const hasUnfilledErrorAfterDirty = !!(errors.signature || hasCheckBoxError);

  const spacing = statementSpacing === undefined ? 3 : statementSpacing;
  const sigWidth = signatureWidth === undefined ? '100%' : signatureWidth;

  return (
    <Fragment>
      <Grid item>
        <Typography variant='h4'>{translate('Label.LegalAgreements')}</Typography>
      </Grid>

      {description && (
        <Grid item>
          <Typography variant='body1'>{description}</Typography>
        </Grid>
      )}

      <Grid container direction='column' spacing={spacing} item>
        {legalStatements.map((statement) => {
          return (
            <Grid item key={statement.id}>
              {statement.wasPreviouslySigned ? (
                <Grid container className={styles.indentedItem} spacing={2}>
                  <Grid item>
                    <CheckCircleOutlineIcon color='success' data-testid='completed-icon-id' />
                  </Grid>
                  <Grid item>
                    <Typography variant='body1'>{statement.text}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Controller
                  name={statement.id}
                  control={control}
                  rules={{
                    required: true,
                  }}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          color='secondary'
                          onClick={() => onClickCheckbox(statement.id)}
                          size='medium'
                          required
                        />
                      }
                      label={statement.text}
                    />
                  )}
                />
              )}
            </Grid>
          );
        })}
      </Grid>

      {isSignatureRequired && (
        <Grid item>
          <Controller
            name='signature'
            control={control}
            rules={{
              required: true,
              validate: {
                maxLength: (input: string) => {
                  return input?.length < 200 || 'Signature is too long';
                },
              },
            }}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(value) => {
                  onEnterSignature(value);
                  field.onChange(value);
                }}
                autoComplete='off'
                data-testid='signature-id'
                error={hasUnfilledErrorAfterDirty}
                id='signatureTextField'
                label='Signature'
                helperText={
                  hasUnfilledErrorAfterDirty
                    ? 'Signature and Agreements are required'
                    : translate('Description.EnterElectronicSignature')
                }
                required
                sx={{ width: sigWidth }}
              />
            )}
          />
        </Grid>
      )}
    </Fragment>
  );
};

export default LegalAgreements;
