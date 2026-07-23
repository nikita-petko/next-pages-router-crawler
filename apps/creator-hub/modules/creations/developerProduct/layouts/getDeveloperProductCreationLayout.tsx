import { Translate } from '@rbx/intl';
/* istanbul ignore file */
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import getCreationsPageLayout from '../../common/implementations/getCreationsPageLayout';

const getDeveloperProductCreationLayout = (page: React.ReactNode) => {
  return getCreationsPageLayout(<LanguageManagementProvider>{page}</LanguageManagementProvider>, {
    title: (
      <Translate
        namespace='CreatorDashboard.DeveloperProducts'
        translationKey='Heading.CreateDeveloperProduct'
      />
    ),
  });
};

export default getDeveloperProductCreationLayout;
