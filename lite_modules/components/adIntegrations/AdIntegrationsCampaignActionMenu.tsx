import {
  IconButton,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { openArchiveAdIntegrationCampaignDialog } from '@components/adIntegrations/dialogs/ArchiveAdIntegrationCampaignDialog';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface AdIntegrationsCampaignActionMenuProps {
  campaignId: string;
  isCampaignArchived?: boolean;
  isCampaignEnded?: boolean;
  onArchiveCampaign?: (campaignId: string) => void;
}

const AdIntegrationsCampaignActionMenu = ({
  campaignId,
  isCampaignArchived = false,
  isCampaignEnded = false,
  onArchiveCampaign,
}: AdIntegrationsCampaignActionMenuProps) => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <IconButton
          ariaLabel={translateReport('Description.MoreOptions')}
          icon='icon-regular-three-dots-vertical'
          isCircular
          size='Medium'
          variant='Utility'
        />
      </PopoverTrigger>
      <PopoverContent
        align='start'
        ariaLabel={translateReport('Description.MoreOptions')}
        side='bottom'>
        <Menu>
          <MenuItem
            onSelect={() => {
              setOpen(false);
              router.push({
                pathname: Routes.AD_INTEGRATIONS_CAMPAIGN,
                query: { campaignId },
              });
            }}
            title={translateAccount('Action.ViewDetails')}
            value='view-details'
          />
          <MenuItem
            disabled={isCampaignEnded}
            onSelect={() => {
              setOpen(false);
              router.push({
                pathname: Routes.AD_INTEGRATIONS,
                query: { campaignId },
              });
            }}
            title={translateAccount('Action.ManageAssets')}
            value='manage-assets'
          />
          {onArchiveCampaign && !isCampaignArchived && (
            <MenuItem
              onSelect={() => {
                setOpen(false);
                openArchiveAdIntegrationCampaignDialog(() => {
                  onArchiveCampaign(campaignId);
                });
              }}
              title={translateMisc('Action.ArchiveCampaign')}
              value='archive'
            />
          )}
        </Menu>
      </PopoverContent>
    </Popover>
  );
};

export default AdIntegrationsCampaignActionMenu;
