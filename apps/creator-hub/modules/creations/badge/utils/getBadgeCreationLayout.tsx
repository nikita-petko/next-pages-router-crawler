import type { ReactNode } from 'react';
import LanguageManagementProvider from '@modules/localization/localization/providers/LanguageManagementProvider';
import getCreationsPageLayout, {
  type TGetCreationsPageLayoutContext,
} from '../../common/implementations/getCreationsPageLayout';

const getBadgeCreationLayout = (page: ReactNode, context: TGetCreationsPageLayoutContext) => {
  return getCreationsPageLayout(
    <LanguageManagementProvider>{page}</LanguageManagementProvider>,
    context,
  );
};

export default getBadgeCreationLayout;
