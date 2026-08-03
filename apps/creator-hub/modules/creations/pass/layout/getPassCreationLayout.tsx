import { Translate } from '@rbx/intl';
/* istanbul ignore file */
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import getCreationsPageLayout from '../../common/implementations/getCreationsPageLayout';

const getPassCreationLayout = (page: React.ReactNode) => {
  return getCreationsPageLayout(<LanguageManagementProvider>{page}</LanguageManagementProvider>, {
    title: <Translate namespace='CreatorDashboard.Passes' translationKey='Heading.CreatePass' />,
  });
};

export default getPassCreationLayout;
