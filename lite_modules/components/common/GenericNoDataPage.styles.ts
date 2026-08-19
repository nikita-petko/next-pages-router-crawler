import { makeStyles } from '@rbx/ui';

const useGenericNoDataPageStyles = makeStyles()((theme) => ({
  avatarStyles: {
    alignItems: 'center',
    // The palette's avatar fill, which is a translucent overlay in both modes, so this
    // badge stays a step off the page either way. `surface[200]` is lighter than the page
    // in dark mode but resolves to the same white as `surface[0]` in light mode, which
    // left the circle painted white on a white page.
    backgroundColor: theme.palette.components.avatar.fill,
    borderRadius: '50%',
    display: 'flex',
    height: '96px',
    justifyContent: 'center',
    width: '96px',
  },
  buttonsContainer: {
    display: 'flex',
    gap: '8px',
  },
  customIconStyles: {
    height: '122px',
    objectFit: 'cover',
    width: '122px',
  },
  iconStyles: {
    height: '64px',
    width: '64px',
  },
  innerContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    justifyContent: 'center',
    padding: '40px 0px',
  },
  outerContainer: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    paddingTop: '24px',
    width: '100%',
  },
  outlinedContainer: {
    border: '1px solid',
    borderColor: theme.palette.components.divider,
    borderRadius: '12px',
  },
  textContainer: {
    alignItems: 'center',
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    justifyContent: 'center',
    textAlign: 'center',
  },
}));

export default useGenericNoDataPageStyles;
