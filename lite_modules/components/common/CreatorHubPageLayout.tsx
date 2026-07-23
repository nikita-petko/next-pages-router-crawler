import { CreatorHubLayout } from '@rbx/creator-hub-navigation';
import { FC, PropsWithChildren, ReactNode, useCallback } from 'react';

import NavigationRail from '@components/navigation/NavigationRail';
import { TranslationNamespace } from '@constants/localization';
import { useLogin } from '@hooks/useLogin';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';

type Slots = {
  header?: ReactNode;
  headerClassName?: string;
  headerKey?: string;
  /** Namespace the `headerKey` resolves from. Required whenever `headerKey` is set. */
  headerNamespace?: TranslationNamespace;
  rail?: ReactNode;
};

const Layout: FC<PropsWithChildren<{ slots: Slots }>> = ({ children, slots }) => {
  const { translate } = useNamespacedTranslation(
    slots.headerNamespace ?? TranslationNamespace.Misc,
  );
  const login = useLogin();
  const { dialog, open } = useStudio();

  const openStudio = useCallback(() => {
    open({ task: EStudioTaskType.Default });
  }, [open]);

  const rail = Object.prototype.hasOwnProperty.call(slots, 'rail') ? (
    slots.rail
  ) : (
    <NavigationRail />
  );
  const headerContent = slots.headerKey ? translate(slots.headerKey) : slots.header;
  const header =
    slots.headerClassName != null ? (
      <div className='flex h-[48px] items-center'>
        <span className={slots.headerClassName}>{headerContent}</span>
      </div>
    ) : (
      headerContent
    );
  return (
    <CreatorHubLayout>
      {dialog}
      <CreatorHubLayout.Header onLogout={login}>{header}</CreatorHubLayout.Header>
      <CreatorHubLayout.Rail openStudio={openStudio}>{rail}</CreatorHubLayout.Rail>
      <CreatorHubLayout.PageContent>{children}</CreatorHubLayout.PageContent>
    </CreatorHubLayout>
  );
};

export const getCreatorHubPageLayout = (page: ReactNode, slots: Slots = {}) => (
  <Layout slots={slots}>{page}</Layout>
);
