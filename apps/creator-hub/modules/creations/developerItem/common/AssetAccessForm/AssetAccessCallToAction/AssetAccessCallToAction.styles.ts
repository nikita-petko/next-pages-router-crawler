import { makeStyles } from '@rbx/ui';

export type StyleProps = {
  severity: 'success' | 'warning';
};

const useAssetAccessCallToActionStyles = makeStyles<StyleProps>()((theme, { severity }) => ({
  alert: {
    alignItems: 'center',
    height: 50,
    marginBottom: 16,
    marginTop: 0,
    width: '100%',
  },

  enrollButton: {
    color:
      severity === 'warning'
        ? theme.palette.components.alert.noticeContent
        : theme.palette.components.alert.activeContent,
    marginBottom: 4,
  },
}));

export default useAssetAccessCallToActionStyles;
