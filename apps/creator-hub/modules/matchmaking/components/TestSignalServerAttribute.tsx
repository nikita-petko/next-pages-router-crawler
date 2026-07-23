import { Typography, Grid, TextField } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import React, { Fragment, FunctionComponent, useMemo } from 'react';
import useCustomSignalStyles from './CustomSignalDialog.styles';
import { getAttributeName } from '../utils/ConfigurationUtils';
import { AttributesInfo } from '../types/AttributesInfo';
import ComparisonType from '../enums/ComparisonType';

export interface TestSignalServerAttributeProps {
  attribute?: AttributesInfo;
  comparisonType?: ComparisonType;
  onAttributeValueChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onServerAttributeNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPlayerAttributeNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TestSignalServerAttribute: FunctionComponent<
  React.PropsWithChildren<TestSignalServerAttributeProps>
> = ({
  attribute,
  comparisonType,
  onServerAttributeNameChange,
  onPlayerAttributeNameChange,
  onAttributeValueChange,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { gridBorder },
    cx,
  } = useCustomSignalStyles();

  const attributeName = useMemo(() => {
    return getAttributeName(attribute) ?? '';
  }, [attribute]);

  return (
    <Grid
      item
      XSmall={4}
      className={cx(gridBorder)}
      display='flex'
      direction='column'
      alignItems='flex-start'>
      <Typography style={{ margin: 10 }} variant='h6'>
        {translate('Dialog.TestSignal')}
      </Typography>
      {comparisonType === ComparisonType.ConstantValue && (
        <Fragment>
          <Typography style={{ margin: 10 }} variant='body2'>
            {translate('Label.EnterServerValue')}
          </Typography>
          <TextField
            style={{ margin: 10 }}
            required
            id='serverValue'
            size='small'
            inputProps={{ maxLength: 20 }}
            InputLabelProps={{ shrink: true }}
            label={translate('Label.AttributeValue')}
            onChange={onAttributeValueChange}
          />
        </Fragment>
      )}
      {comparisonType === ComparisonType.Player && (
        <Fragment>
          <Typography style={{ margin: 10 }} variant='body2'>
            {translate('Label.EnterServerName', {
              attribute: attributeName,
            })}
          </Typography>
          <TextField
            style={{ margin: 10 }}
            required
            id='serverValue'
            size='small'
            inputProps={{ maxLength: 20 }}
            InputLabelProps={{ shrink: true }}
            label={translate('Label.AttributeName')}
            onChange={onServerAttributeNameChange}
          />
          <Typography style={{ margin: 10 }} variant='body2'>
            {translate('Label.EnterPlayerName', {
              attribute: attributeName,
            })}
          </Typography>
          <TextField
            style={{ margin: 10 }}
            required
            id='serverValue'
            size='small'
            inputProps={{ maxLength: 20 }}
            InputLabelProps={{ shrink: true }}
            label={translate('Label.AttributeName')}
            onChange={onPlayerAttributeNameChange}
          />
        </Fragment>
      )}
    </Grid>
  );
};

export default TestSignalServerAttribute;
