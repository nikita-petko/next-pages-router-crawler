import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Grid, MenuItem, Select, Tooltip, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import BooleanValueType from '../../enums/BooleanValueType';
import { booleanTypeTranslationKeys } from '../../utils/translationGetter';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';

interface PreferredPlayersSimulationRowProps {
  score: number;
  hasPreferredPlayer: boolean;
  weight: number;
  onValuesChange: (hasPreferredPlayer: boolean) => void;
}

const PreferredPlayersSimulationRow = function PreferredPlayersSimulationRowProps({
  score,
  hasPreferredPlayer,
  weight,
  onValuesChange,
}: PreferredPlayersSimulationRowProps): React.JSX.Element {
  const { translate } = useTranslation();
  const {
    classes: { scoreTextField, scoreGrid },
  } = useConfigurationSimulationContainerStyles();
  const [hasPlayer, setHasPlayer] = useState<BooleanValueType>(
    hasPreferredPlayer ? BooleanValueType.True : BooleanValueType.False,
  );

  useEffect(() => {
    setHasPlayer(hasPreferredPlayer ? BooleanValueType.True : BooleanValueType.False);
  }, [hasPreferredPlayer]);

  const toolTipSummary = useMemo(() => {
    return (
      <Grid item display='flex' direction='column'>
        <Typography variant='tooltip'>{translate('Tooltip.FriendsScore')}</Typography>
        <Typography variant='body2' whiteSpace='pre-line'>
          {translate(hasPreferredPlayer ? 'Tooltip.HasFriends' : 'Tooltip.NoFriends', {
            weight: weight.toString(),
            score: score.toString(),
          })}
        </Typography>
      </Grid>
    );
  }, [hasPreferredPlayer, score, translate, weight]);

  const handleOnPreferredPlayerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const booleanType = e?.target?.value as keyof typeof BooleanValueType;
      if (booleanType === BooleanValueType.True) {
        onValuesChange(true);
        setHasPlayer(BooleanValueType.True);
      } else if (booleanType === BooleanValueType.False) {
        onValuesChange(false);
        setHasPlayer(BooleanValueType.False);
      }
    },
    [onValuesChange],
  );

  return (
    <Grid
      item
      XSmall={12}
      justifyContent='space-between'
      display='flex'
      direction='row'
      alignItems='center'
      style={{ marginLeft: 10, marginTop: 20 }}>
      <Grid item XSmall={9} display='flex' direction='row'>
        <Select
          style={{
            marginRight: 15,
            flex: 1,
          }}
          fullWidth
          size='small'
          label={translate('Label.HasFriends')}
          value={hasPlayer}
          onChange={handleOnPreferredPlayerChange}
          inputProps={{ 'aria-label': 'hasFriends' }}>
          {Object.values(BooleanValueType).map((type) => (
            <MenuItem key={type} value={type}>
              <Typography variant='captionBody' color='primary'>
                {translate(booleanTypeTranslationKeys[type])}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </Grid>
      <Grid item XSmall={3} className={scoreGrid}>
        <Tooltip title={toolTipSummary} placement='top'>
          <Typography className={scoreTextField} color='primary' variant='body2'>
            {score}
          </Typography>
        </Tooltip>
      </Grid>
    </Grid>
  );
};

export default PreferredPlayersSimulationRow;
