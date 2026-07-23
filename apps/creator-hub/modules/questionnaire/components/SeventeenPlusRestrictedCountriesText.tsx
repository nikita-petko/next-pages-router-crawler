import React, { FunctionComponent } from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

export interface SeventeenPlusRestrictedCountriesTextProps {
  isContentMaturityEnabled: boolean;
}

const SeventeenPlusRestrictedCountriesText: FunctionComponent<
  React.PropsWithChildren<SeventeenPlusRestrictedCountriesTextProps>
> = (isContentMaturityEnabled) => {
  const { translate } = useTranslation();

  return (
    <Typography variant='caption' color='secondary' display='block'>
      {isContentMaturityEnabled
        ? translate('Message.RestrictedMaturityDisabledCountries')
        : '17+ experiences are currently unplayable in Korea, Saudi Arabia, and Turkey.'}
    </Typography>
  );
};

export default SeventeenPlusRestrictedCountriesText;
