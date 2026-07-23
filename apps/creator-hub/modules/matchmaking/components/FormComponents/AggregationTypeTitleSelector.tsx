import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, TitleSelector, TitleSelectorText } from '@rbx/ui';
import AggregationType from '../../enums/AggregationType';
import {
  aggregationTypeDescriptionTranslationKeys,
  aggregationTypeTranslationKeys,
} from '../../utils/translationGetter';
import useCustomSignalStyles from '../CustomSignalDialog.styles';

export interface AggregationTypeTitleSelectorProps {
  attributeName: string;
  selectedAggregationType?: AggregationType;
  onSelect: (aggregationType: AggregationType) => void;
}

const AggregationTypeTitleSelector: FunctionComponent<
  React.PropsWithChildren<AggregationTypeTitleSelectorProps>
> = ({ attributeName, selectedAggregationType, onSelect }) => {
  const { translate } = useTranslation();
  const {
    classes: { typeTitleCard },
  } = useCustomSignalStyles();

  return (
    <Grid item direction='row' display='flex' justifyContent='flex-start' alignItems='stretch'>
      {Object.values(AggregationType).map((type) => (
        <TitleSelector
          key={type}
          selected={selectedAggregationType === type}
          onClick={() => onSelect(type)}
          classes={{ root: typeTitleCard }}>
          <TitleSelectorText>{translate(aggregationTypeTranslationKeys[type])}</TitleSelectorText>
          <TitleSelectorText variant='subtext'>
            {translate(aggregationTypeDescriptionTranslationKeys[type], {
              attribute: attributeName,
            })}
          </TitleSelectorText>
        </TitleSelector>
      ))}
    </Grid>
  );
};

export default AggregationTypeTitleSelector;
