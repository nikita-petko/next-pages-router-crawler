import { useMemo } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import GenericTabbedPageLayout from '@modules/monetization-shared/tabs/GenericTabbedPageLayout';
import FreeAvatarsAvatarAssetsPanel from './components/FreeAvatarsAvatarAssetsPanel';
import FreeAvatarsTabs from './enums/FreeAvatarsTabs';

function FreeAvatarsPageContent({ universeId }: { universeId: number }) {
  const { translate } = useTranslation();

  const tabs = useMemo(
    () => [
      {
        key: FreeAvatarsTabs.AvatarAssets,
        label: translate('Heading.Creations'),
        content: <FreeAvatarsAvatarAssetsPanel universeId={universeId} />,
      },
      {
        key: FreeAvatarsTabs.Analytics,
        label: translate('Heading.Analytics'),
        content: <div className='min-height-[250px] padding-y-xxlarge' />,
      },
    ],
    [translate, universeId],
  );

  return <GenericTabbedPageLayout tabs={tabs} defaultTab={FreeAvatarsTabs.AvatarAssets} />;
}

export default withTranslation(FreeAvatarsPageContent, [TranslationNamespace.Creations]);
