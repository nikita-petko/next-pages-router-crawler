import React, { Fragment, FunctionComponent } from 'react';
import { Button, Divider, Fade, Grid, InfoOutlinedIcon, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { MockServerSignalValues } from '@rbx/clients/matchmakingApi/v1';
import { EmptyState } from '@modules/miscellaneous/common/components';
import { PageLoading } from '@modules/miscellaneous/common';
import useConfigurationSimulationContainerStyles from '../../container/ConfigurationSimulationContainer.styles';
import { numOfFakeServers } from '../../constants';
import {
  CustomSignal,
  CustomSignalServerValue,
  ServerSignalScores,
  ServerSignalValues,
} from '../../types/ConfigurationInfo';
import MockServer from './MockServer';
import MockServerHeader from './MockServerHeader';

export type SimulationTableProps = {
  isLoading: boolean;
  simulationTableOpen: boolean;
  winningServerIndex: number | undefined;
  serverScores: number[];
  serverSignalValues: ServerSignalValues[];
  signalScores: ServerSignalScores[];
  customSignalWeightsMap: Map<string, CustomSignal>;
  defaultSignalWeightsMap: Map<string, number>;
  onDefaultSignalValueChanges: (serverNumber: number, serverValue: MockServerSignalValues) => void;
  onCustomSignalValuesChange: (
    serverNumber: number,
    customSignalServerValues: Map<string, CustomSignalServerValue>,
  ) => void;
  onSimulationTableOpen: () => void;
};

const SimulationTable: FunctionComponent<React.PropsWithChildren<SimulationTableProps>> = ({
  isLoading,
  simulationTableOpen,
  winningServerIndex,
  serverScores,
  serverSignalValues,
  signalScores,
  customSignalWeightsMap,
  defaultSignalWeightsMap,
  onDefaultSignalValueChanges,
  onCustomSignalValuesChange,
  onSimulationTableOpen,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { simulationInfo, simulationDivider },
  } = useConfigurationSimulationContainerStyles();

  const simulationExplainer = (
    <Grid
      container
      style={{ marginBottom: 10, marginTop: 10, marginLeft: 10 }}
      justifyContent='space-between'
      direction='column'>
      <Typography variant='h5' style={{ marginBottom: 10, marginLeft: 10 }}>
        {translate('Label.Simulation')}
      </Typography>
      <Typography variant='body2' style={{ marginBottom: 5, marginTop: 8, marginLeft: 10 }}>
        {translate('Decription.Simulation')}
      </Typography>
    </Grid>
  );

  const getSimulationTableLayout = (children: React.ReactNode) => {
    return (
      <Grid
        container
        display='flex'
        direction='row'
        justifyContent='space-between'
        style={{ marginTop: 18 }}>
        {children}
      </Grid>
    );
  };

  const previewAndTestExplainer = (
    <Fragment>
      {getSimulationTableLayout(
        Array.from(Array(numOfFakeServers).keys()).map((val, i) => (
          <Grid key={val} item style={{ flex: 1 }}>
            <MockServerHeader serverNumber={i + 1} isWinningServer={false} />
            <Divider className={simulationDivider} />
          </Grid>
        )),
      )}
      {isLoading ? (
        <PageLoading />
      ) : (
        <EmptyState
          title={translate('Header.GetStarted')}
          description={
            <Grid>
              <Typography style={{ lineHeight: '200%' }} whiteSpace='pre-line'>
                {translate('Body.GetStarted')}
              </Typography>
              <Grid item className={simulationInfo}>
                <InfoOutlinedIcon style={{ marginTop: 2 }} fontSize='medium' color='secondary' />
                <Typography color='primary' alignContent='center' variant='body1'>
                  {translate('Tooltip.SimulationInfo')}
                </Typography>
              </Grid>
            </Grid>
          }
          size='small'
          illustration='matchmakingSimulation'>
          <Button
            style={{ marginTop: 7 }}
            data-testid='create-configuration-button'
            variant='contained'
            size='large'
            color='secondary'
            aria-label={translate('Label.Simulation')}
            onClick={onSimulationTableOpen}>
            {translate('Label.Simulation')}
          </Button>
        </EmptyState>
      )}
    </Fragment>
  );

  const simulationTable = (
    <Fade in={simulationTableOpen}>
      {getSimulationTableLayout(
        Array.from(Array(numOfFakeServers).keys()).map((val, i) => (
          <MockServer
            key={val}
            serverScore={serverScores[i]}
            serverNumber={i + 1}
            isWinningServer={winningServerIndex === i}
            mockServerValue={serverSignalValues[i]}
            customSignalWeightsMap={customSignalWeightsMap}
            defaultSignalWeightsMap={defaultSignalWeightsMap}
            signalScores={signalScores[i]}
            onDefaultSignalValuesChange={onDefaultSignalValueChanges}
            onCustomSignalValuesChange={onCustomSignalValuesChange}
          />
        )),
      )}
    </Fade>
  );

  return (
    <Grid
      container
      display='flex'
      position='sticky'
      style={{ overflow: 'auto', overflowX: 'scroll' }}>
      {simulationExplainer}
      {simulationTableOpen ? simulationTable : previewAndTestExplainer}
    </Grid>
  );
};

export default SimulationTable;
