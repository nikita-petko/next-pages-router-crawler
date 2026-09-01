import { useState, useCallback, useMemo } from 'react';
import { Key } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Input, Grid, Chip, Paper, Button, Typography, useMediaQuery, Switch } from '@rbx/ui';
import { FormLabel, EmptyGrid, ConfirmDialog } from '@modules/miscellaneous/components';
import { maxIPsAllowed } from '../../constants/openCloudConstants';
import cidrValidator from '../../utils/cidrRegex';
import type { ValidatorOptions } from '../../utils/ipRegex';
import ipValidator from '../../utils/ipRegex';
import useIpAddressFormStyles from './IpAddressForm.styles';

interface IpAddressFormProps {
  ipValues?: Array<string>;
  onChange?: (ips: Array<string>) => void;
}

interface IPFormValidator {
  isInputInvalid: () => boolean;
  isMaxIPCountReached: () => boolean;
  isDuplicate: () => boolean;
}

const wildcardCidr = '0.0.0.0/0';
const wildcardIpList = [wildcardCidr];
const emptyIpList: string[] = [];

const IpAddressForm = ({ ipValues, onChange }: IpAddressFormProps) => {
  const currentIpValues = ipValues!;
  const areIpsCurrentlyRestricted = !(
    currentIpValues.length === 1 && currentIpValues[0] === wildcardCidr
  );
  const [restrictIps, setRestrictIps] = useState<boolean>(areIpsCurrentlyRestricted);

  const {
    classes: {
      root,
      chip,
      header,
      subHeading,
      button,
      buttonWrapper,
      ipBoxGrid,
      ipAddressFormInput,
    },
  } = useIpAddressFormStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [ipIndexToRemove, setIpIndexToRemove] = useState<number | undefined>();

  const [inputVal, setInputVal] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');

  const { translate } = useTranslation();

  const ipFormValidator = useMemo(() => {
    const validator: IPFormValidator = {
      isInputInvalid() {
        const validateRegex = (regexValidator: {
          (options: ValidatorOptions): RegExp;
          v4(options?: ValidatorOptions): RegExp;
          v6(options?: ValidatorOptions): RegExp;
        }) => {
          const { v4, v6 } = regexValidator;
          const re4 = v4({ exact: true });
          const re6 = v6({ exact: true });

          return re4.test(inputVal) || re6.test(inputVal);
        };

        return !(validateRegex(cidrValidator) || validateRegex(ipValidator));
      },
      isMaxIPCountReached() {
        return currentIpValues.length === maxIPsAllowed;
      },
      isDuplicate() {
        return currentIpValues.includes(inputVal);
      },
    };

    return validator;
  }, [currentIpValues, inputVal]);

  const onAddIPAddress = useCallback(() => {
    if (inputVal === '') {
      setErrorText(translate('Message.EmptyIPSubmitError'));
    } else if (ipFormValidator.isMaxIPCountReached()) {
      // only 10 IP Addresses allowed
      setErrorText(translate('Message.MaxIpsAllowedError', { maxIPCount: `${maxIPsAllowed}` }));
    } else if (ipFormValidator.isDuplicate()) {
      setErrorText(translate('Message.DuplicateIPError'));
    } else if (ipFormValidator.isInputInvalid()) {
      setErrorText(translate('Message.InvalidCIDROrIP'));
    } else {
      // make a copy of the state ip list (do not mutate the state directly)
      // ip is valid, add it
      const ipsCopy: string[] = [...currentIpValues];
      ipsCopy.push(inputVal);
      if (onChange) {
        onChange(ipsCopy);
      }
      setInputVal('');
      setErrorText('');
    }
  }, [onChange, inputVal, currentIpValues, ipFormValidator, translate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === Key.Enter) {
        onAddIPAddress();
      }
    },
    [onAddIPAddress],
  );

  const handleClick = useCallback(() => {
    onAddIPAddress();
  }, [onAddIPAddress]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setInputVal(e.target.value);
    },
    [],
  );

  const openDeleteConfirmDialog = useCallback((ipAddressIndex: number) => {
    setIsDialogOpen(true);
    setIpIndexToRemove(ipAddressIndex);
  }, []);

  const onDialogCancel = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const onDialogConfirm = useCallback(() => {
    if (ipIndexToRemove !== undefined) {
      const ipsCopy = [...currentIpValues];
      ipsCopy.splice(ipIndexToRemove, 1);

      if (onChange) {
        onChange(ipsCopy);
      }
    }

    setIsDialogOpen(false);
    setIpIndexToRemove(undefined);
  }, [currentIpValues, ipIndexToRemove, onChange]);

  const ipToRemoveString = useMemo(() => {
    if (ipIndexToRemove !== undefined && ipIndexToRemove < currentIpValues.length) {
      return `${currentIpValues[ipIndexToRemove]}`;
    }
    return '';
  }, [ipIndexToRemove, currentIpValues]);

  let whitelistedIps;

  if (currentIpValues.length > 0) {
    whitelistedIps = (
      <Paper className={ipBoxGrid}>
        {currentIpValues.map((ip, index) => {
          return (
            <Chip
              key={ip}
              className={chip}
              onDelete={() => openDeleteConfirmDialog(index)}
              label={ip}
              size={isCompactView ? 'small' : 'medium'}
              color='primary'
              variant='outlined'
            />
          );
        })}
      </Paper>
    );
  } else {
    whitelistedIps = (
      <Paper>
        <EmptyGrid>
          <Typography variant='body1' color='primary'>
            {translate('Message.NoIpAddresses')}
          </Typography>
        </EmptyGrid>
      </Paper>
    );
  }

  const handleRestrictIps = useCallback(() => {
    if (!restrictIps) {
      if (onChange) {
        onChange(emptyIpList);
      }
      setRestrictIps(true);
    } else {
      if (onChange) {
        onChange(wildcardIpList);
      }
      setRestrictIps(false);
    }
  }, [onChange, restrictIps]);

  return (
    <div className={root}>
      <div>
        <Switch
          id='api-key-restrict-ips'
          aria-label='Restrict IPs'
          checked={restrictIps}
          onChange={handleRestrictIps}
        />
        <Typography variant='body1'>{translate('Label.RestrictedIPsToggle')}</Typography>
      </div>
      {restrictIps && (
        <Typography variant='body2'>
          <Grid
            container
            justifyContent='space-between'
            wrap={isCompactView ? 'wrap' : undefined}
            spacing={isCompactView ? 2 : 0}>
            <Grid item XSmall={12} Medium={6}>
              <FormLabel
                className={header}
                htmlFor='ip-address-input'
                isRequired
                labelName={translate('Heading.AcceptedAddresses')}
                requiredText={translate('Label.Required')}
              />
              <Typography className={subHeading} variant='body1' color='primary'>
                {translate('Heading.AcceptedAddressDescription')}
              </Typography>
            </Grid>
            <Grid item XSmall={12} Medium={6}>
              <Grid
                item
                container={!isCompactView}
                wrap={isCompactView ? 'wrap' : 'nowrap'}
                justifyContent='flex-end'
                alignItems='baseline'
                classes={{ root: ipAddressFormInput }}>
                <Grid item XSmall={12}>
                  <Input
                    fullWidth
                    id='ip-address-input'
                    error={errorText !== ''}
                    placeholder={translate('Message.InputIpPlaceholder')}
                    onChange={onInputChange}
                    value={inputVal}
                    onKeyDown={handleKeyDown}
                  />
                  <Typography variant='body1' color='primary'>
                    {translate('Message.AddIPInstructions')}
                  </Typography>
                  <Typography variant='body1' component='p' color='error'>
                    {errorText}
                  </Typography>
                </Grid>

                <div className={buttonWrapper}>
                  <Button
                    disabled={inputVal === ''}
                    classes={{ root: button }}
                    variant='outlined'
                    size='small'
                    color='primary'
                    onClick={handleClick}>
                    <Typography variant='body1'>{translate('Button.AddIPAddress')}</Typography>
                  </Button>
                </div>
              </Grid>
              <Grid item>{whitelistedIps}</Grid>
            </Grid>

            <ConfirmDialog
              open={isDialogOpen}
              maxWidth='Medium'
              title={translate('Heading.RemoveIPAddress')}
              cancelText={translate('Action.Cancel')}
              confirmText={translate('Button.Remove')}
              onCancel={onDialogCancel}
              onConfirm={onDialogConfirm}
              content={
                <Typography align='center'>
                  {translate(`Message.IpConfirmDelete`, {
                    ipToRemove: ipToRemoveString,
                  })}
                </Typography>
              }
            />
          </Grid>
        </Typography>
      )}
    </div>
  );
};

export default IpAddressForm;
