import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Divider, Tooltip, EmojiEventsIcon } from '@rbx/ui';
import DefaultConfigurationSignals from '../../enums/DefaultConfigurationSignals';
import type { ServerSignalScores } from '../../types/ConfigurationInfo';
import { roundToDecimalPlaces } from '../../utils/SimulationScoreUtils';
import { defaultSignalsTranslationKeys } from '../../utils/translationGetter';

export type MockServerHeaderProps = {
  serverNumber: number;
  isWinningServer: boolean;
  serverScore?: number;
  signalScores?: ServerSignalScores;
};

const MockServerHeader: FunctionComponent<React.PropsWithChildren<MockServerHeaderProps>> = ({
  serverScore,
  serverNumber,
  isWinningServer,
  signalScores,
}) => {
  const { translate } = useTranslation();

  const getScoreRow = (signalLabel: string, scoreValue: number) => {
    return (
      <Typography variant='body2' whiteSpace='pre-line'>
        {signalLabel} = {scoreValue} +
      </Typography>
    );
  };

  const serverScoreToolTip = useMemo(() => {
    return (
      <Grid item display='flex' direction='column'>
        <Typography variant='tooltip'>{translate('Tooltip.WeightedScore')}</Typography>
        {Object.values(DefaultConfigurationSignals).map((signal) =>
          getScoreRow(
            translate(defaultSignalsTranslationKeys[signal]),
            signalScores?.defaultSignalScores.get(signal) ?? 0,
          ),
        )}
        {Array.from(signalScores?.customSignalScores ?? []).map(([signalName, signalWeight]) =>
          getScoreRow(signalName, signalWeight ?? 0),
        )}
        <Divider style={{ marginTop: 5, marginBottom: 5 }} />
        <Typography variant='smallLabel2' whiteSpace='pre-line'>
          {translate('Tooltip.TotalScore')} = {roundToDecimalPlaces(serverScore ?? 0)}
        </Typography>
      </Grid>
    );
  }, [translate, signalScores?.customSignalScores, signalScores?.defaultSignalScores, serverScore]);

  return (
    <Grid
      item
      XSmall={12}
      justifyContent='space-between'
      display='flex'
      direction='row'
      style={{ marginLeft: 10 }}>
      <Grid item XSmall={7}>
        <Typography variant='body2'>
          {translate('Header.MockeServer', {
            number: serverNumber.toString(),
          })}
        </Typography>
      </Grid>
      <Grid
        item
        XSmall={5}
        display='flex'
        direction='row'
        style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
        <Typography variant='body2' style={{ marginRight: 5 }}>
          {translate('Header.Score')}
        </Typography>
        {serverScore !== undefined ? (
          <Tooltip title={serverScoreToolTip} placement='top'>
            <Typography
              style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                textDecoration: 'underline dotted',
                marginBottom: 3,
              }}
              display='inline'
              variant='tooltip'
              color={isWinningServer ? 'success' : 'info'}>
              {serverScore === undefined ? `--` : roundToDecimalPlaces(serverScore).toString()}
            </Typography>
          </Tooltip>
        ) : (
          <Typography
            style={{
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              marginBottom: 3,
            }}
            display='inline'
            variant='tooltip'>
            --
          </Typography>
        )}
        {isWinningServer && (
          <EmojiEventsIcon style={{ marginLeft: 3 }} fontSize='small' color='warning' />
        )}
      </Grid>
    </Grid>
  );
};

export default MockServerHeader;
