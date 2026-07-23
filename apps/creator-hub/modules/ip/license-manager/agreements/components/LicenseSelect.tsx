import React, { useCallback } from 'react';
import type { LicenseResponse } from '@rbx/client-content-licensing-api/v1';
import { clsx, Dropdown, Menu, MenuItem, MenuLabel } from '@rbx/foundation-ui';
import { useTranslation, type UseTranslationResult } from '@rbx/intl';
import type { TSelectProps } from '@rbx/ui';
import { Select, MenuItem as MuiMenuItem, Typography, makeStyles } from '@rbx/ui';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import { getDauLicenseLabelFromEnum } from '../../utils/dauEnum';
import { getMaturityRatingLabel } from '../../utils/maturityRating';
import {
  createBridgedSelectChangeEvent,
  toFoundationDropdownValue,
  type BridgedSelectBlurHandler,
  type BridgedSelectChangeHandler,
} from './foundationSelectBridge';

const useStyles = makeStyles()(() => ({
  optionContent: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  detailsRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
}));

interface LicenseOptionContentProps {
  license: LicenseResponse;
  /** Shows a simplified version of the license content */
  simple?: boolean;
}

const LicenseOptionContent: React.FC<LicenseOptionContentProps> = ({ license, simple }) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  return (
    <div className={classes.optionContent}>
      <Typography variant='body1' fontWeight='medium' component='div'>
        {license.name}
      </Typography>
      <div className={classes.detailsRow}>
        <Typography variant='body2' color='secondary'>
          {translate('Label.RevenueShareWithValue', {
            value: formatRoyaltyRate(license.royaltyRate),
          })}
        </Typography>
      </div>
      {!simple && (
        <div className={classes.detailsRow}>
          <Typography variant='body2' color='secondary'>
            {translate('Label.MinimumDAUWithValue', {
              value: translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold)),
            })}
          </Typography>
          <Typography variant='body2' color='secondary'>
            •
          </Typography>
          <Typography variant='body2' color='secondary'>
            {translate('Label.MaxMaturityRatingWithValue', {
              value: translate(getMaturityRatingLabel(license.maxAgeRating)),
            })}
          </Typography>
        </div>
      )}
    </div>
  );
};

function isSelectableLicense(
  license: LicenseResponse,
): license is LicenseResponse & { id: string } {
  return typeof license.id === 'string' && license.id.length > 0;
}

function getLicenseMenuItemDescription(
  license: LicenseResponse,
  translate: UseTranslationResult['translate'],
): string {
  return [
    translate('Label.RevenueShareWithValue', {
      value: formatRoyaltyRate(license.royaltyRate),
    }),
    translate('Label.MinimumDAUWithValue', {
      value: translate(getDauLicenseLabelFromEnum(license.dau7DayThreshold)),
    }),
    translate('Label.MaxMaturityRatingWithValue', {
      value: translate(getMaturityRatingLabel(license.maxAgeRating)),
    }),
  ].join(' • ');
}

interface LicenseSelectProps extends Omit<TSelectProps, 'children' | 'onChange' | 'onBlur'> {
  licenses: LicenseResponse[];
  /** When true, renders with Foundation UI `Dropdown` instead of MUI `Select`. */
  useFoundationUiComponents?: boolean;
  onChange?: BridgedSelectChangeHandler;
  onBlur?: BridgedSelectBlurHandler;
  'data-testId'?: string;
  'data-testid'?: string;
}

const LicenseSelect = React.forwardRef<HTMLDivElement, LicenseSelectProps>(
  (
    {
      licenses,
      useFoundationUiComponents = false,
      value,
      onChange,
      onBlur,
      disabled,
      error,
      helperText,
      label,
      className,
      fullWidth,
      id,
      'data-testId': dataTestIdLegacy,
      'data-testid': dataTestIdProp,
      SelectProps: _selectProps,
      ...rest
    },
    ref,
  ) => {
    const { translate } = useTranslation();
    const selectableLicenses = licenses.filter(isSelectableLicense);

    const handleOpenChange = useCallback(
      (open: boolean) => {
        if (!open) {
          onBlur?.();
        }
      },
      [onBlur],
    );

    const handleValueChange = useCallback(
      (nextValue: string) => {
        onChange?.(createBridgedSelectChangeEvent(nextValue));
      },
      [onChange],
    );

    if (useFoundationUiComponents) {
      const stringValue = toFoundationDropdownValue(value);
      const dataTestId = dataTestIdProp ?? dataTestIdLegacy;

      return (
        <div
          ref={ref}
          data-testid={dataTestId}
          className={clsx(fullWidth && 'width-full', className)}>
          <Dropdown
            className='width-full'
            size='Medium'
            label={typeof label === 'string' && label.length > 0 ? label : undefined}
            value={stringValue}
            placeholder={translate('Action.Select')}
            isDisabled={disabled}
            hasError={!!error}
            hint={typeof helperText === 'string' ? helperText : undefined}
            onOpenChange={handleOpenChange}
            onValueChange={handleValueChange}>
            <Menu>
              {selectableLicenses.length > 0 ? (
                selectableLicenses.map((license) => (
                  <MenuItem
                    key={license.id}
                    value={license.id}
                    title={license.name ?? ''}
                    description={getLicenseMenuItemDescription(license, translate)}
                  />
                ))
              ) : (
                <MenuLabel disabled title={translate('Label.NoLicensesAvailable')} />
              )}
            </Menu>
          </Dropdown>
        </div>
      );
    }

    const renderValue = (selectedValue: unknown) => {
      if (!selectedValue) {
        return null;
      }

      const selectedLicense = selectableLicenses.find((license) => license.id === selectedValue);
      if (!selectedLicense) {
        return null;
      }

      return <LicenseOptionContent license={selectedLicense} simple />;
    };

    return (
      <Select
        {...rest}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        error={error}
        helperText={helperText}
        label={label}
        className={className}
        fullWidth={fullWidth}
        id={id}
        renderValue={renderValue}
        ref={ref}>
        {selectableLicenses.length > 0 ? (
          selectableLicenses.map((license) => (
            <MuiMenuItem key={license.id} value={license.id}>
              <LicenseOptionContent license={license} />
            </MuiMenuItem>
          ))
        ) : (
          <MuiMenuItem value='' disabled>
            {translate('Label.NoLicensesAvailable')}
          </MuiMenuItem>
        )}
      </Select>
    );
  },
);

LicenseSelect.displayName = 'LicenseSelect';

export default LicenseSelect;
