/* istanbul ignore file */
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import { getCreationsPageLayout } from '@modules/creations/common';

const getDeveloperProductCreationLayout = (page: React.ReactNode) => {
  return getCreationsPageLayout(<LanguageManagementProvider>{page}</LanguageManagementProvider>, {
    title: 'Heading.CreateDeveloperProduct',
  });
};

export default getDeveloperProductCreationLayout;
