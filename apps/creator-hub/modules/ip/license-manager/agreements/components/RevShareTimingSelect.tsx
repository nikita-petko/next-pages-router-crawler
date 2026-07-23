import React, { useCallback } from 'react';
import { clsx, Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { TSelectProps } from '@rbx/ui';
import { Select, MenuItem as MuiMenuItem, Typography, makeStyles } from '@rbx/ui';
import {
  createBridgedSelectChangeEvent,
  toFoundationDropdownValue,
  type BridgedSelectBlurHandler,
  type BridgedSelectChangeHandler,
} from './foundationSelectBridge';

const useStyles = makeStyles()(() => ({
  detailsRow: {
    alignItems: 'center',
    maxWidth: '500px',
    textWrap: 'wrap',
  },
}));

export enum RevShareTiming {
  Later = 'later',
  OnActivation = 'on-activation',
}

interface RevShareTimingOptionContentProps {
  revShareTiming: RevShareTiming;
  /** Shows a simplified version of the revenue share timing content */
  simple?: boolean;
}

const RevShareTimingOptionContent: React.FC<RevShareTimingOptionContentProps> = ({
  revShareTiming,
  simple,
}) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();
  const isTimingLater = revShareTiming === RevShareTiming.Later;

  if (simple) {
    return (
      <Typography variant='body1' fontWeight='medium' component='div'>
        {translate(isTimingLater ? 'Label.MonetizeLater' : 'Label.MonetizeOnActivation')}
      </Typography>
    );
  }

  return (
    <div className={classes.detailsRow}>
      <Typography variant='body1' fontWeight='medium' color='secondary' component='div'>
        {translate(isTimingLater ? 'Label.MonetizeLater' : 'Label.MonetizeOnActivation')}
      </Typography>
      <div>
        <Typography variant='body2' component='div'>
          {isTimingLater ? translate('Label.MonitorRevshare') : translate('Label.MonitorOnly')}
        </Typography>
      </div>
    </div>
  );
};

interface RevShareTimingSelectProps extends Omit<TSelectProps, 'children' | 'onChange' | 'onBlur'> {
  revShareTiming: RevShareTiming | null;
  /** When true, renders with Foundation UI `Dropdown` instead of MUI `Select`. */
  useFoundationUiComponents?: boolean;
  onChange?: BridgedSelectChangeHandler;
  onBlur?: BridgedSelectBlurHandler;
  'data-testId'?: string;
  'data-testid'?: string;
}

const RevShareTimingSelect = React.forwardRef<HTMLDivElement, RevShareTimingSelectProps>(
  (
    {
      revShareTiming,
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
      'data-testId': dataTestIdLegacy,
      'data-testid': dataTestIdProp,
      SelectProps: _selectProps,
      ...rest
    },
    ref,
  ) => {
    const { translate } = useTranslation();

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
              <MenuItem
                value={RevShareTiming.OnActivation}
                title={translate('Label.MonetizeOnActivation')}
                description={translate('Label.MonitorOnly')}
              />
              <MenuItem
                value={RevShareTiming.Later}
                title={translate('Label.MonetizeLater')}
                description={translate('Label.MonitorRevshare')}
              />
            </Menu>
          </Dropdown>
        </div>
      );
    }

    const renderValue = (selectedValue: unknown) => {
      if (!selectedValue) {
        return null;
      }

      return (
        <RevShareTimingOptionContent
          revShareTiming={revShareTiming ?? RevShareTiming.Later}
          simple
        />
      );
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
        renderValue={renderValue}
        ref={ref}>
        <MuiMenuItem value={RevShareTiming.OnActivation}>
          <RevShareTimingOptionContent revShareTiming={RevShareTiming.OnActivation} />
        </MuiMenuItem>
        <MuiMenuItem value={RevShareTiming.Later}>
          <RevShareTimingOptionContent revShareTiming={RevShareTiming.Later} />
        </MuiMenuItem>
      </Select>
    );
  },
);

RevShareTimingSelect.displayName = 'RevShareTimingSelect';

export default RevShareTimingSelect;
