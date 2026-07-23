import React, { FunctionComponent } from 'react';
import { InfoOutlinedIcon, Tooltip } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
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
