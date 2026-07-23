import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography, Grid, TextField, Button, AddIcon } from '@rbx/ui';
import { maxNumberOfPlayers } from '../constants';
import type AggregationType from '../enums/AggregationType';
import type { AttributesInfo } from '../types/AttributesInfo';
import type { PlayerValues } from '../types/ConfigurationInfo';
import {
  getAttributeName,
  getServerValueFromAggregationType,
  initialPlayerRowValues,
} from '../utils/ConfigurationUtils';
import useCustomSignalStyles from './CustomSignalDialog.styles';
import ExistingPlayerRow from './ExistingPlayerRow';

export interface TestSignalExistingPlayersProps {
  attribute?: AttributesInfo;
  aggregationType?: AggregationType;
  onJoiningPlayerChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onServerValueChange: (value: number) => void;
}

const TestSignalExistingPlayers: FunctionComponent<
  React.PropsWithChildren<TestSignalExistingPlayersProps>
> = ({ attribute, aggregationType, onJoiningPlayerChange, onServerValueChange }) => {
  const { translate } = useTranslation();
  const {
    classes: { gridBorder },
    cx,
  } = useCustomSignalStyles();
  const [playerRows, setExistingPlayRows] = useState<PlayerValues[]>(initialPlayerRowValues);

  const attributeName = useMemo(() => {
    return getAttributeName(attribute) ?? '';
  }, [attribute]);

  const handleAddButtonClick = useCallback(() => {
    if (playerRows.length < maxNumberOfPlayers) {
      const newRow = {
        id: playerRows.length,
        value: 0,
      };
      const updatedRows = [...playerRows, newRow];
      setExistingPlayRows(updatedRows);
      onServerValueChange(getServerValueFromAggregationType(aggregationType, updatedRows));
    }
  }, [aggregationType, onServerValueChange, playerRows]);

  const handleClosePlayerRow = useCallback(
    (id: number) => {
      const updatedRows = [...playerRows];
      updatedRows.splice(id, 1);
      updatedRows.forEach((row, i) => {
        if (i >= id) {
          const newRow = {
            ...row,
            id: i,
          };
          updatedRows[i] = newRow;
        }
        setExistingPlayRows(updatedRows);
        onServerValueChange(getServerValueFromAggregationType(aggregationType, updatedRows));
      });
    },
    [aggregationType, onServerValueChange, playerRows],
  );

  const handlePlayerRowsChange = useCallback(
    (id: number, value: number) => {
      const updatedRows = [...playerRows];
      const oldRow = playerRows[id];
      updatedRows[id] = {
        ...oldRow,
        value,
      };
      setExistingPlayRows(updatedRows);
      onServerValueChange(getServerValueFromAggregationType(aggregationType, updatedRows));
    },
    [aggregationType, onServerValueChange, playerRows],
  );

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
      <Typography style={{ margin: 10 }} variant='body2'>
        {translate('Dialog.JoiningPlayer', {
          attribute: attributeName,
        })}
      </Typography>
      <TextField
        style={{ margin: 10 }}
        required
        id='existingPlayer'
        size='small'
        inputProps={{ maxLength: 20 }}
        InputLabelProps={{ shrink: true }}
        defaultValue={0}
        label={translate('Dialog.JoiningPlayerLabel')}
        onChange={onJoiningPlayerChange}
      />
      <Typography style={{ margin: 10 }} variant='body2'>
        {translate('Dialog.ExistingPlayer', {
          attribute: attributeName,
        })}
      </Typography>
      {playerRows.map((row) => (
        <ExistingPlayerRow
          key={row.id}
          value={row.value}
          shouldShowCloseIcon={playerRows.length > 1}
          playerCount={row.id + 1}
          onCancel={handleClosePlayerRow}
          onChange={handlePlayerRowsChange}
        />
      ))}
      {playerRows.length < maxNumberOfPlayers && (
        <Button
          style={{ marginLeft: 10, marginTop: 10, marginBottom: 10 }}
          onClick={handleAddButtonClick}
          size='small'
          variant='outlined'
          color='primary'
          startIcon={<AddIcon />}>
          {translate('Button.AddPlayer')}
        </Button>
      )}
    </Grid>
  );
};

export default TestSignalExistingPlayers;
