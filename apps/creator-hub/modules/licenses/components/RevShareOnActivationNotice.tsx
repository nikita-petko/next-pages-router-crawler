import type { FunctionComponent } from 'react';
import type { LicenseDurationResponse } from '@rbx/client-content-licensing-api/v1';
import type { LicenseType } from '@rbx/client-content-licensing-api/v1';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatRoyaltyRate } from '../utils/format';
import {
  getRevShareOnActivationDescriptionKeys,
  type RevShareOnActivationDescriptionKey,
} from '../utils/licenseApplicationRequirementsFieldsUtils';
import { getIsNonZeroRevShareFromValue } from '../utils/revShare';

interface RevShareOnActivationNoticeProps {
  revShareValue?: number;
  licenseDuration?: LicenseDurationResponse;
  licenseType?: LicenseType;
  enableCollaborationLicensing?: boolean;
}

/** Informational copy when rev-share timing is fixed at agreement activation (not user-selectable). */
const RevShareOnActivationNotice: FunctionComponent<RevShareOnActivationNoticeProps> = ({
  revShareValue,
  licenseDuration,
  licenseType,
  enableCollaborationLicensing = false,
}) => {
  const translation = useTranslation();
  const { translate } = translation;
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const descriptionKeys = getRevShareOnActivationDescriptionKeys({
    revShareValue,
    licenseDuration,
    licenseType,
    enableCollaborationLicensing,
  });
  const isNonZeroRevShare = getIsNonZeroRevShareFromValue(revShareValue);

  const getDescriptionText = (descriptionKey: RevShareOnActivationDescriptionKey) => {
    if (descriptionKey === 'Description.MarketplaceSalesRevenueShareTiming') {
      return tPendingTranslation(
        'Avatar marketplace licenses will only monetize when the avatar item associated with the license has been sold either through Avatar Marketplace or in games that contain a marketplace.',
        'Explanatory text shown in the revenue share timing section when the rights holder has selected their license type to be Marketplace sales license aka Avatar marketplace sales license.',
        translationKey(
          'Description.MarketplaceSalesRevenueShareTiming',
          TranslationNamespace.AgreementsManager,
        ),
      );
    }
    if (descriptionKey === 'Description.AvatarRevShareTimingWithValue') {
      return tPendingTranslation(
        'Assets published to marketplace that are linked with this license will require a revenue share of {value}. The license can be attached to marketplace assets as soon as the rights holder approves your request.',
        'Description text shown to Creators applying for a Marketplace sales license, a license which allows creators to create and publish officially licensed assets to the avatar marketplace. The description explains this license has a specified revenue share of {value} percentage for assets which are published to the avatar marketplace and have this license attached.',
        translationKey('Description.AvatarRevShareTimingWithValue', TranslationNamespace.Licenses),
        { value: formatRoyaltyRate(revShareValue) },
      );
    }
    if (descriptionKey === 'Description.AvatarTimeLimitedRevShareWithValue') {
      return tPendingTranslation(
        'Assets published to marketplace that are linked with this license will require a revenue share of {value}. The license can be attached to marketplace assets as soon as the rights holder approves your request. The items will go on-sale and be subject to monetization on the above designated start date.',
        'Description text shown to Creators applying for a Marketplace sales license, a license which allows creators to create and publish officially licensed assets to the avatar marketplace. The description explains this license has a specified revenue share of {value} percentage for assets which are published to the avatar marketplace and have this license attached. It also specifies that the linked assets will only go on-sale ate the designated start date.',
        translationKey(
          'Description.AvatarTimeLimitedRevShareWithValue',
          TranslationNamespace.Licenses,
        ),
        { value: formatRoyaltyRate(revShareValue) },
      );
    }
    if (descriptionKey === 'Description.CollaborationRevShareTimingWithValue') {
      return tPendingTranslation(
        'This license requires revenue share of {value} upon rights holder’s acceptance of your request. This applies only on sales related to the asset IDs you provide below.',
        'Description text shown to Creators applying for a In-game sales license (meaning that the creator derivatives of an IP can be used in an experience as long as it is gated by the sale of a game pass or developer product) and that this license has a specified revenue share of {value} percentage that begins as soon as the the license is active but applies only to the asset IDs of the specified game pass or developer product (can be multiple)',
        translationKey(
          'Description.CollaborationRevShareTimingWithValue',
          TranslationNamespace.Licenses,
        ),
        { value: formatRoyaltyRate(revShareValue) },
      );
    }
    if (descriptionKey === 'Description.CollaborationTimeLimitedRevShareTimingWithValue') {
      return tPendingTranslation(
        'This license requires revenue share of {value} which will automatically begin on the start date designated above but only on the asset IDs you provide below, if the rights holder approves your request.',
        'Description text shown to Creators applying for a time-limited duration, In-game sales license (meaning that the creator derivatives of an IP can be used in an experience as long as it is gated by the sale of a game pass or developer product) and that this license has a specified revenue share of {value} percentage that begins as soon as the the license is active on the specified start date but applies only to the asset IDs of the specified game pass or developer product (can be multiple)',
        translationKey(
          'Description.CollaborationTimeLimitedRevShareTimingWithValue',
          TranslationNamespace.Licenses,
        ),
        { value: formatRoyaltyRate(revShareValue) },
      );
    }
    if (isNonZeroRevShare) {
      return translate(descriptionKey, {
        value: formatRoyaltyRate(revShareValue),
      });
    }
    return translate(descriptionKey);
  };

  const descriptions = descriptionKeys.map((descriptionKey) => ({
    key: descriptionKey,
    text: getDescriptionText(descriptionKey),
  }));

  return (
    <Grid item container flexDirection='column' alignItems='left' paddingBottom={1} spacing={2}>
      <Grid item>
        <Typography variant='h6'>{translate('Label.RevShareTiming')}</Typography>
      </Grid>
      {descriptions.map(({ key, text }) => (
        <Grid item key={key}>
          <Typography variant='body1'>{text}</Typography>
        </Grid>
      ))}
    </Grid>
  );
};

export default RevShareOnActivationNotice;
