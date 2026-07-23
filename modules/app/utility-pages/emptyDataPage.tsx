import GenericNoDataPage from '@components/common/GenericNoDataPage';
import Routes from '@constants/routes';

export const EmptyDataPage = () => (
  <GenericNoDataPage
    linkInSubtitle={{
      subtitleLink: Routes.MANAGE,
      subtitleLinkText: 'here.',
    }}
    subtitle='Switch from Manage Ads (Classic) to the new Ads Manager powered by AI to reach the right players faster. Try it '
    title='No campaigns'
  />
);
