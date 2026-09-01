import { makeStyles } from '@rbx/ui';

export const useEarnedRatesDialogStyles = makeStyles()((theme) => ({
  paper: {
    borderRadius: 16,
    width: 640,
    maxWidth: 640,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  sectionContainer: {
    marginTop: 19,
  },
  rateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  tierContainer: {
    marginTop: 22,
  },
  rateInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  infoIcon: {
    fontSize: '1rem',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderTop: `1px solid ${theme.palette.surface.outline}`,
    marginTop: 20,
    paddingTop: 16,
  },
  footerLink: {
    color: 'inherit',
    textDecoration: 'underline',
  },
}));
