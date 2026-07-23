import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, TitleSelector, TitleSelectorText } from '@rbx/ui';
import DistributionType from '../../enums/DistributionType';
import {
  distributionTypeDescriptionTranslationKeys,
  distributionTypeTranslationKeys,
} from '../../utils/translationGetter';
import useCustomSignalStyles from '../CustomSignalDialog.styles';

export interface DistributionTypeTitleSelectorProps {
  attributeName: string;
  distributionType?: DistributionType;
  onSelect: (distributionType: DistributionType) => void;
}

const DistributionTypeTitleSelector: FunctionComponent<
  React.PropsWithChildren<DistributionTypeTitleSelectorProps>
> = ({ attributeName, distributionType, onSelect }) => {
  const { translate } = useTranslation();
  const {
    classes: { typeTitleCard },
  } = useCustomSignalStyles();

  return (
    <Grid item direction='row' display='flex' justifyContent='flex-start' alignItems='stretch'>
      {Object.values(DistributionType).map((type) => (
        <TitleSelector
          key={type}
          selected={distributionType === type}
          onClick={() => onSelect(type)}
          classes={{ root: typeTitleCard }}>
          <TitleSelectorText>{translate(distributionTypeTranslationKeys[type])}</TitleSelectorText>
          <TitleSelectorText variant='subtext'>
            {translate(distributionTypeDescriptionTranslationKeys[type], {
              attribute: attributeName,
            })}
          </TitleSelectorText>
        </TitleSelector>
      ))}
    </Grid>
  );
};

export default DistributionTypeTitleSelector;
