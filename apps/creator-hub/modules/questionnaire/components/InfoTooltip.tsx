import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { InfoOutlinedIcon, Tooltip } from '@rbx/ui';
import useExperienceGuidelinesStyles from '../containers/ExperienceGuidelines.styles';

export interface InfoTooltipProps {
  translationKey: string;
}

const InfoTooltip: FunctionComponent<React.PropsWithChildren<InfoTooltipProps>> = ({
  translationKey,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { tooltipIcon },
  } = useExperienceGuidelinesStyles();

  return (
    <Tooltip arrow title={translate(translationKey)} placement='bottom'>
      <InfoOutlinedIcon fontSize='small' className={tooltipIcon} />
    </Tooltip>
  );
};

export default InfoTooltip;
