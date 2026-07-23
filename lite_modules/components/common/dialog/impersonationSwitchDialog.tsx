import { Button, Dropdown, Menu, MenuItem, TextInput } from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { type FormEvent, type ReactElement, useCallback, useState } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import BaseDialog from '@components/common/dialog/BaseDialog';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import { DEFAULT_FLAG_VALUE, IMPERSONATION_FLAGS } from '@constants/impersonation';
import type { FlagValues } from '@constants/impersonation';
import { setImpCookie } from '@services/ads/adAccountService';
import { CaptureException } from '@utils/error';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const serializeFlagValues = (values: FlagValues): string | undefined => {
  const overrides = IMPERSONATION_FLAGS.filter(({ configKey }) => {
    const value = values[configKey];
    return value !== undefined && value !== DEFAULT_FLAG_VALUE;
  }).map(({ configKey }) => `${configKey}:${values[configKey]}`);

  return overrides.length > 0 ? overrides.join(',') : undefined;
};

interface ImpersonationSwitchDialogProps extends BaseInjectedDialogProps {
  impersonatedJwtId: string;
  initialFlagValues: FlagValues;
}

export const ImpersonationSwitchDialog = ({
  impersonatedJwtId,
  initialFlagValues,
  onClose,
}: ImpersonationSwitchDialogProps): ReactElement => {
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [impersonatedID, setImpersonatedID] = useState<string>(impersonatedJwtId || '');
  const [flagValues, setFlagValues] = useState<FlagValues>(initialFlagValues);
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!UUID_PATTERN.test(impersonatedID)) {
        setIsInvalid(true);
        return;
      }

      try {
        await setImpCookie(impersonatedID, serializeFlagValues(flagValues));
        setIsInvalid(false);
        onClose();
        router.reload();
      } catch (error) {
        setIsInvalid(true);
        CaptureException(error);
      }
    },
    [impersonatedID, flagValues, router, onClose],
  );

  return (
    <BaseDialog
      dialogBody={
        <form className='flex flex-col gap-medium' id='impersonate-form' onSubmit={handleSubmit}>
          <TextInput
            error={isInvalid ? 'Invalid Ad Account ID' : undefined}
            hasError={isInvalid}
            label='Ad Account ID'
            onChange={(e) => {
              setIsInvalid(false);
              setImpersonatedID(e.target.value);
            }}
            size='Medium'
            value={impersonatedID}
          />
          {IMPERSONATION_FLAGS.map(({ configKey, label }) => (
            <Dropdown
              key={configKey}
              label={label}
              onValueChange={(value) => {
                setFlagValues((prev) => ({ ...prev, [configKey]: value }));
              }}
              placeholder='Default'
              size='Medium'
              value={flagValues[configKey]}>
              <Menu>
                <MenuItem title='Default' value={DEFAULT_FLAG_VALUE} />
                <MenuItem title='Enable' value='true' />
                <MenuItem title='Disable' value='false' />
              </Menu>
            </Dropdown>
          ))}
        </form>
      }
      dialogFooter={
        <>
          <Button form='impersonate-form' size='Medium' type='submit' variant='Emphasis'>
            View Account
          </Button>
          <Button onClick={onClose} size='Medium' variant='Standard'>
            Cancel
          </Button>
        </>
      }
      dialogTitle='Impersonate Account'
    />
  );
};

export const openImpersonationSwitchDialog = (
  impersonatedJwtId: string,
  initialFlagValues: FlagValues,
): void => {
  openDialog({
    component: ImpersonationSwitchDialog,
    props: { impersonatedJwtId, initialFlagValues },
  });
};
