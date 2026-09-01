import { makeStyles } from '@rbx/ui';

const useSummaryGeneralInformationPanelStyles = makeStyles()({
  subLabel: {
    marginBottom: 32,
  },
  textfield: {
    maxWidth: 750,
    marginBottom: 16,
    marginTop: 16,
  },
  thumbnailSection: {
    width: '500px', // from figma, but rounded to a whole number
    flexWrap: 'nowrap',
    marginRight: '85px', // from figma
  },
  infoIcon: {
    marginLeft: 8,
  },
});

export default useSummaryGeneralInformationPanelStyles;
