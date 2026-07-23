/* eslint-disable import/no-unused-modules */
import { makeStyles } from '@rbx/ui';

const url = `${process.env.assetPathPrefix}/common/hero_image.gif`;

export const useLandingHeaderStyles = makeStyles()((theme) => ({
  button: {
    width: 'fit-content',
  },

  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
  },

  compactViewContainer: {
    display: 'flex',
    flexDirection: 'column',

    margin: '0 6vw',
  },

  creatorHubLayoutOverlay: {
    margin: '0px -32px',
  },

  ctaRow: {
    [`@media (min-width: ${theme.breakpoints.values.Large}px)`]: {
      margin: '32px 0px 74px',
    },
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    margin: '4vh 0 2vh 0',
  },

  expandedViewContainer: {
    alignItems: 'left',
    display: 'flex',
    flexDirection: 'column',
    margin: '0 6vw',
  },

  headerOverlay: {
    backgroundImage: `linear-gradient(180deg, rgba(23, 23, 23, 0) 51.04%, ${theme.palette.content.static.dark} 100%), url(${url})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    height: '100vh',
  },

  smallImage: {
    backgroundImage: `linear-gradient(180deg, ${theme.palette.content.static.dark} 0%, ${theme.palette.content.static.dark} 0.01%, rgba(23, 23, 23, 0) 15.21%, rgba(23, 23, 23, 0) 83.85%, ${theme.palette.content.static.dark} 99.99%, ${theme.palette.content.static.dark} 100%), url(${url})`,
    backgroundSize: 'cover',
    marginBottom: '3vh',
    paddingTop: '64.29%' /* (img-height / img-width * container-width) */,
  },

  subtitle: {
    [`@media (min-width: ${theme.breakpoints.values.Large}px)`]: {
      fontSize: 20,
      margin: '24px 0 36px 0',
      maxWidth: '35vw',
    },

    fontSize: 16,
    margin: '16px 24px 0px', // top left/right bottom
  },

  title: {
    [`@media (min-width: ${theme.breakpoints.values.Large}px)`]: {
      fontSize: 32,
      marginTop: '12vh',
    },
    marginTop: '5vh',
  },
}));
