import { makeStyles } from '@rbx/ui';

// The below styles should work for non standard browsers. Use widely supported CSS properties. No flexbox or grid!
const useUnsupportedBrowserStyles = makeStyles()(() => ({
  container: {
    textAlign: 'center',
    verticalAlign: 'middle',
    display: 'inline-block',
  },
  aligner: {
    display: 'inline-block',
    height: '100%',
    verticalAlign: 'middle',
  },
  browserLink: {
    display: 'inline-block',
    margin: '0 10px',
  },
  wrapper: {
    height: '100vh',
    boxSizing: 'border-box',
    padding: '20px',
    textAlign: 'center',
  },
}));

export default useUnsupportedBrowserStyles;
