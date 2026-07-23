import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo } from 'react';
import type {
  AffiliateLink,
  CreateAffiliateLinkResponseAffiliateLink,
} from '@rbx/client-affiliate-links-api/v1';
import { withTranslation } from '@rbx/intl';
import { Dialog } from '@rbx/ui';
import { useAffiliateProgram } from '@modules/affiliate-program/providers/AffiliateProgramProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CreatedShareLinkDialog from './CreatedShareLinkDialog';
import CreateShareLinkDialog from './CreateShareLinkDialog';
import EditShareLinkDialog from './EditShareLinkDialog';
import getShareLink from './getShareLink';

export type TCreateShareLinkRequestProps = {
  campaignName: string;
  universeId: number;
};

type TShareLinkDialogProps = {
  isOpen: boolean;
  close: VoidFunction;
  copyLink: (link: string) => void;
  onCreateOrUpdateLink: (link: CreateAffiliateLinkResponseAffiliateLink) => void;
  getUniverseId: (universeId: number) => Promise<number | null>;
  existingAffiliateLink?: AffiliateLink;
  createdAffiliateLink?: CreateAffiliateLinkResponseAffiliateLink;
  setCreatedAffiliateLink: React.Dispatch<
    React.SetStateAction<CreateAffiliateLinkResponseAffiliateLink | undefined>
  >;
};

const ShareLinkDialog: FunctionComponent<TShareLinkDialogProps> = ({
  isOpen,
  close,
  getUniverseId,
  copyLink,
  onCreateOrUpdateLink,
  existingAffiliateLink,
  createdAffiliateLink,
  setCreatedAffiliateLink,
}) => {
  const { creatorMetadata } = useAffiliateProgram();

  const shareLink = useMemo(() => {
    if (createdAffiliateLink) {
      return getShareLink(createdAffiliateLink);
    }

    return;
  }, [createdAffiliateLink]);

  const onCreateOrUpdateLinkWrapper = useCallback(
    (link: CreateAffiliateLinkResponseAffiliateLink) => {
      setCreatedAffiliateLink(link);
      onCreateOrUpdateLink(link);
    },
    [onCreateOrUpdateLink, setCreatedAffiliateLink],
  );

  if (shareLink) {
    return (
      <Dialog open={isOpen} maxWidth='Medium' fullWidth>
        <CreatedShareLinkDialog copyLink={copyLink} shareLink={shareLink} close={close} />
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} maxWidth='Medium' fullWidth>
      {existingAffiliateLink ? (
        <EditShareLinkDialog
          affiliateLink={existingAffiliateLink}
          getUniverseId={getUniverseId}
          onEditLink={onCreateOrUpdateLinkWrapper}
          close={close}
          isAllowedToCreateForAnyExperience={
            creatorMetadata?.isAllowedToCreateForAnyExperience === true
          }
        />
      ) : (
        <CreateShareLinkDialog
          getUniverseId={getUniverseId}
          onCreateLink={onCreateOrUpdateLinkWrapper}
          close={close}
          isAllowedToCreateForAnyExperience={
            creatorMetadata?.isAllowedToCreateForAnyExperience === true
          }
        />
      )}
    </Dialog>
  );
};

export default withTranslation(ShareLinkDialog, [TranslationNamespace.ShareLinksManagement]);
