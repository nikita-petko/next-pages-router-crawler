import { makeStyles } from '@rbx/ui';

type StyleProps = {
  displayDependenciesInNewModal: boolean;
};

const useCompositeAssetDependenciesAlertStyles = makeStyles<StyleProps>()(
  (theme, { displayDependenciesInNewModal }) => ({
    alertAction: {
      cursor: 'pointer',
      paddingTop: 4,
      whiteSpace: 'nowrap',
    },

    dependenciesDescription: {
      marginTop: displayDependenciesInNewModal ? 0 : 16,
    },

    dependenciesModalActions: {
      padding: '0 24px 24px 24px',
    },

    learnMoreLink: {
      whiteSpace: 'nowrap',
    },
  }),
);

export default useCompositeAssetDependenciesAlertStyles;
