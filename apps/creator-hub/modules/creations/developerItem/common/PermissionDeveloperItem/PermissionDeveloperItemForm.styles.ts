import { makeStyles } from '@rbx/ui';

const usePermissionDeveloperItemContainerStyles = makeStyles()(() => ({
  actionContainerParent: {
    position: 'sticky',
    bottom: 0,
  },

  actionContainer: {
    marginLeft: -47,
    padding: '24px 48px',
    backdropFilter: 'blur(50px)',
    opacity: 1,
    zIndex: 2 /* Ensure it's above other content */,
    gap: 12,
  },

  alert: {
    borderRadius: 8,
    marginBottom: 8,
  },

  buttonText: {
    textTransform: 'none',
  },

  container: {
    padding: 8,
  },

  description: {
    marginBottom: 64,
  },

  helperText: {
    marginLeft: 14,
  },

  iconButton: {
    padding: 0,
  },

  sectionHeader: {
    marginTop: 40,
    paddingBottom: 12,
  },

  stickyFooter: {
    marginLeft: -47,
  },

  subSectionHeading: {
    marginTop: 8,
  },

  title: {
    marginBottom: 12,
  },
}));

export default usePermissionDeveloperItemContainerStyles;
