import { makeStyles } from '@rbx/ui';

const useMatchmakingContainerStyles = makeStyles()((theme) => ({
  errorText: {
    marginTop: theme.spacing(4),
  },
  dialogContent: {
    paddingTop: '24px',
  },
  container: {
    marginBottom: 20,
  },
  image: {
    width: 30,
    height: 30,
    borderRadius: '5px',
    position: 'relative',
    objectFit: 'contain',
  },
  chipImage: {
    width: 24,
    height: 24,
    borderRadius: '9px',
    position: 'relative',
    objectFit: 'contain',
  },
  menuItem: {
    margin: 5,
  },
  select: {
    height: '100',
  },
  placeName: {
    marginLeft: 8,
    marginTop: 3,
  },
  imageName: {
    marginLeft: 8,
    marginTop: 5,
  },
  stateSelection: {
    marginTop: 30,
  },
  button: {
    marginLeft: 10,
  },
}));

export default useMatchmakingContainerStyles;
