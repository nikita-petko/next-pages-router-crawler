import { makeStyles } from '@rbx/ui';

const useConfigurationSimulationContainerStyles = makeStyles()((theme) => ({
  button: {
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 30,
  },
  errorMessageStyles: {
    width: '100%',
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 14,
  },
  bodyContainer: {
    gap: 0,
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  item: {
    marginTop: 20,
    marginBottom: 10,
  },
  tooltip: {
    marginLeft: 20,
    marginRight: 5,
    marginTop: 5,
  },
  signalTooltip: {
    marginLeft: 0,
    marginTop: 2,
  },
  infoText: {
    marginTop: 6,
  },
  title: {
    gap: 15,
    marginBottom: 30,
  },
  signalsContainer: {
    marginTop: 20,
    marginBottom: 10,
    flexWrap: 'nowrap',
  },
  simulationContainer: {
    marginBottom: 30,
    marginLeft: 20,
    marginTop: 10,
  },
  dialogBoxContent: {
    marginTop: 10,
    marginBottom: 10,
  },
  dialog: {
    marginTop: 20,
    marginBottom: 10,
    maxWidth: '600px',
    minWidth: '300px',
  },
  image: {
    width: 30,
    height: 30,
    position: 'relative',
    objectFit: 'contain',
  },
  menuItem: {
    margin: 5,
  },
  placeName: {
    marginLeft: 10,
    marginTop: 3,
  },
  templateLabel: {
    marginLeft: -12,
  },
  configExplainer: {
    display: 'flex',
  },
  customSignalButton: {
    marginBottom: 15,
    marginTop: 15,
  },
  weightsInfo: {
    marginLeft: 5,
    padding: 5,
    borderRadius: '5px',
    flexWrap: 'nowrap',
    textWrap: 'nowrap',
    display: 'flex',
    alignItems: 'flex-end',
    backgroundColor: theme.palette.components.alert.informFill,
  },
  simulationInfo: {
    display: 'flex',
    justifyItems: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 20,
    marginLeft: 15,
    padding: 15,
    borderRadius: '5px',
    backgroundColor: theme.palette.components.alert.informFill,
  },
  scoreGrid: {
    backgroundColor: theme.palette.actionV2.secondary.fill,
    borderRadius: '5px',
    display: 'flex',
    padding: 10,
  },
  scoreTextField: {
    textDecoration: 'underline dotted',
    marginBottom: 3,
  },
  signalWeightsContainer: {
    marginTop: 20,
    marginBottom: 10,
    overflow: 'auto',
    overflowX: 'scroll',
    flexWrap: 'nowrap',
  },
  simulationDivider: {
    marginTop: 19,
    marginBottom: 10,
  },
  video: {
    height: 'auto',
    width: '100%',
    aspectRatio: '16 / 9',
  },
}));

export default useConfigurationSimulationContainerStyles;
