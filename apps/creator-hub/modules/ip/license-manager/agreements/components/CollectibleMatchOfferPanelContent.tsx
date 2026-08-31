import { useCallback, useMemo, type FunctionComponent, type ReactNode } from 'react';
import {
  AgreementCandidateType,
  LicenseType,
  type AgreementCandidateResponse,
  type AgreementResponse,
  type IndexedAgreementCandidateResponse,
  type LicenseResponse,
} from '@rbx/client-content-licensing-api/v1';
import { useTranslation, useTranslationWithNamespace } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import { IP_LISTINGS_HREF } from '../../urls';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import useCollectibleMatchItemDetails from '../hooks/useCollectibleMatchItemDetails';
import { isLicenseCompatibleWithCollectible } from '../utils/collectibleLicenseCompatibility';
import CollectibleMatchContentTile from './CollectibleMatchContentTile';
import { getCollectibleMatchPresentation } from './collectibleMatchPresentation';
import MatchOfferPanelContent, {
  type MatchOfferPanelConfiguration,
} from './MatchOfferPanelContent';

type CollectibleMatchCandidate = AgreementCandidateResponse &
  Pick<IndexedAgreementCandidateResponse, 'candidateContentCreatorType'>;

interface CollectibleMatchOfferPanelContentProps {
  candidate: CollectibleMatchCandidate;
  onSuccess: (agreement: AgreementResponse) => void;
  onClose: () => void;
  onPanelStateChange?: (state: 'loading' | 'ready' | 'error') => void;
}

const COLLECTIBLE_MATCH_OFFER_CONFIGURATION: MatchOfferPanelConfiguration = {
  applicableLicenseType: LicenseType.MarketplaceSale,
  allowConditionalOffers: false,
  allowRevenueSharing: false,
  allowChangeRequests: false,
  showLicenseDauAndMaturityMetadata: false,
};

const CollectibleMatchOfferPanelContent: FunctionComponent<
  CollectibleMatchOfferPanelContentProps
> = ({ candidate, onSuccess, onClose, onPanelStateChange }) => {
  const translation = useTranslation();
  const { tPendingTranslation, tPendingHtmlTranslation } = useTranslationWrapper(translation);
  const { translate: translateControls } = useTranslationWithNamespace(
    TranslationNamespace.Controls,
  );
  const { logEvent } = useLicenseManagerLogger();
  const collectibleItemId = candidate.candidateId;
  const collectibleItemIds = useMemo(
    () => (collectibleItemId ? [collectibleItemId] : []),
    [collectibleItemId],
  );
  const itemDetailsRequest = useCollectibleMatchItemDetails(collectibleItemIds);
  const details = collectibleItemId ? itemDetailsRequest.data?.[collectibleItemId] : undefined;
  const presentation = useMemo(
    () =>
      details
        ? getCollectibleMatchPresentation(
            details,
            candidate.candidateContentCreatorType ?? undefined,
          )
        : undefined,
    [candidate.candidateContentCreatorType, details],
  );
  const licenseFilter = useCallback(
    (license: LicenseResponse) =>
      isLicenseCompatibleWithCollectible(
        license,
        presentation?.isLimited ?? false,
        presentation?.isResellAllowed ?? false,
      ),
    [presentation?.isLimited, presentation?.isResellAllowed],
  );
  const analyticsContext = useMemo(
    () => ({
      source: 'sidebar',
      itemType: presentation?.isBundle ? 'Bundle' : presentation ? 'Asset' : 'Unknown',
      isLimited: presentation?.isLimited ?? false,
      isResellAllowed: presentation?.isResellAllowed ?? false,
      hasDescription: Boolean(presentation?.description?.trim()),
      hasPrice: presentation?.price != null,
      hasSubtype: Boolean(details?.subtype),
    }),
    [details?.subtype, presentation],
  );
  const limitedLabel = tPendingTranslation(
    'Limited',
    'Label indicating that an avatar marketplace item has a limited supply.',
    translationKey('Label.Limited', TranslationNamespace.AgreementsManager),
  );
  const resellAllowedLabel = tPendingTranslation(
    'Resell allowed',
    'Label indicating whether owners may resell a limited avatar marketplace item.',
    translationKey('Label.ResellAllowed', TranslationNamespace.AgreementsManager),
  );

  return (
    <MatchOfferPanelContent
      candidate={candidate}
      onSuccess={onSuccess}
      onClose={onClose}
      candidateType={AgreementCandidateType.Collectible}
      analyticsContext={analyticsContext}
      onPanelStateChange={onPanelStateChange}
      creationTile={
        details && presentation ? (
          <>
            <CollectibleMatchContentTile
              details={details}
              creatorType={candidate.candidateContentCreatorType ?? undefined}
            />
            <KeyValuePairContainer>
              <KeyValuePair
                label={limitedLabel}
                value={translateControls(presentation.isLimited ? 'Action.Yes' : 'Action.No')}
              />
              {presentation.isLimited && (
                <KeyValuePair
                  label={resellAllowedLabel}
                  value={translateControls(
                    presentation.isResellAllowed ? 'Action.Yes' : 'Action.No',
                  )}
                />
              )}
            </KeyValuePairContainer>
          </>
        ) : undefined
      }
      creationRequest={{
        isPending: itemDetailsRequest.isPending,
        isError: itemDetailsRequest.isError || (itemDetailsRequest.isSuccess && details == null),
      }}
      noLicensesDescription={tPendingTranslation(
        'In order to send license offers, you need to create at least one perpetual, avatar marketplace license for this IP Family.',
        'Error shown when a rights holder has no perpetual Avatar Marketplace license available for a Collectible match offer.',
        translationKey(
          'Description.NoPerpetualAvatarMarketplaceLicensesForIpFamily',
          TranslationNamespace.AgreementsManager,
        ),
      )}
      licenseFilter={licenseFilter}
      noMatchingLicensesDescription={tPendingHtmlTranslation(
        'The available avatar marketplace licenses for this IP family do not permit reselling. You must {linkStart}create a license{linkEnd} that allows reselling in order to send a license offer to this match.',
        'Error shown when Avatar Marketplace licenses exist for an IP Family but none have reselling terms matching the selected Collectible agreement candidate.',
        translationKey(
          'Error.NoAvatarMarketplaceLicenseWithMatchingResellingTerms',
          TranslationNamespace.AgreementsManager,
        ),
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content: (chunks: ReactNode) => (
              <Link
                href={IP_LISTINGS_HREF}
                onClick={() =>
                  logEvent(LicenseManagerClickEvent.MatchOfferPanelCreateLicenseClickEvent, {
                    ...analyticsContext,
                    candidateType: AgreementCandidateType.Collectible,
                    agreementCandidateId: candidate.id ?? '',
                    ipFamilyId: candidate.ipFamilyId ?? '',
                    licenseType: LicenseType.MarketplaceSale,
                    reason: 'noCompatibleLicenses',
                  })
                }>
                {chunks}
              </Link>
            ),
          },
        ],
      )}
      configuration={COLLECTIBLE_MATCH_OFFER_CONFIGURATION}
    />
  );
};

export default CollectibleMatchOfferPanelContent;
