import { useCallback, useMemo } from 'react';
import { ApiPermissionStatus } from '@rbx/client-asset-permissions-api/v1';
import type { Asset, SocialLink } from '@rbx/client-assets-upload-api/v1';
import { useTranslation } from '@rbx/intl';
import assetsUploadApiClient, { FieldMask } from '@modules/clients/assetsupload';
import developClient from '@modules/clients/develop';
import gamesClient from '@modules/clients/games';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import universesClient from '@modules/clients/universes';
import type { AgeBracketResponse } from '@modules/clients/users';
import usersClient from '@modules/clients/users';
import { getResponseFromError } from '@modules/clients/utils';
import { Asset as AssetType } from '@modules/miscellaneous/common';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { getUniverseConfiguration } from '@modules/react-query/develop/universeApiRequest';
import { isPrivateAudience } from '../../../common/audiences';
import { getUniverseHasPermission } from '../../common/common';
import { TRY_ASSET_DEFAULT_PLACE_ID } from '../components/SocialLinksFormShard/TryAssetForm/tryAssetFormHelpers';
import useAssetsUploadApiOperationPolling from './useAssetsUploadApiOperationPolling';

/*
 * To add new social link types:
 * 1. Ensure type was already added to social-links-service and assets-upload-api
 * 2. Ensure latest versions of social-links-service, assets-upload-api, and OpenCloud are installed
 * 3. Add the new type to the type-specific mappings below
 *
 * See the following link for detailed instructions.
 * https://roblox.atlassian.net/wiki/spaces/SM/pages/2789507204/Runbook+social-links-service#Adding-New-Social-Link-Types
 */

// ============================================================================
// Constants
// ============================================================================

export const MAX_SOCIAL_LINKS = 3; // Excludes the TryAsset social link, which is handled separately
export const MAX_TITLE_LENGTH = 50;
export const MAX_URI_LENGTH = 256;
export const AGE_13_OR_OVER_AGE_BRACKET = 0;
export const TRY_ASSET_ENABLED_ASSET_TYPES = [AssetType.Model, AssetType.MeshPart];
export const PUBLIC_UNIVERSE_PRIVACY_TYPE = 'Public';

// ============================================================================
// External Types (Excludes TRY_ASSET)
// ============================================================================

// External enum for social link types (excludes TRY_ASSET)
export enum SocialLinkType {
  FACEBOOK = 'Facebook',
  TWITTER = 'Twitter',
  YOUTUBE = 'YouTube',
  TWITCH = 'Twitch',
  DISCORD = 'Discord',
  GITHUB = 'GitHub',
  ROBLOX = 'Roblox',
  DEVFORUM = 'DevForum',
}

// External interface that adds the type of the social link to make it easier to work with.
// The OpenCloud SocialLink type does not include the type of the social link.
// Instead, it handles it through the field name (e.g., facebookSocialLink).
export interface SocialLinkWithType extends SocialLink {
  type: SocialLinkType;
}

export type SocialLinkTypeToTranslatedText = Record<
  SocialLinkType,
  { displayName: string; helperText: string; placeholderText: string }
>;

export type FetchSocialLinksResponse = {
  socialLinks: SocialLinkWithType[];
  tryAssetPlaceId: string | null;
  tryAssetExistingPlaceIsPlayable: boolean | null;
};

export interface SocialLinksContext {
  socialLinkTypeToTranslatedText: SocialLinkTypeToTranslatedText;
  fetchAreSocialLinksEnabledForUser: () => Promise<boolean>;
  fetchSocialLinks: () => Promise<FetchSocialLinksResponse>;
  updateSocialLinks: (
    existingSocialLinksList: SocialLinkWithType[],
    updatedSocialLinksList: SocialLinkWithType[],
    existingTryAssetPlaceId: string | null,
    updatedTryAssetPlaceId: string | null,
  ) => Promise<void>;
  validateTryAssetPlaceId: (placeId: string) => Promise<{ isValid: boolean; errorMessage: string }>;
}

// ============================================================================
// Internal Types (Includes TRY_ASSET)
// ============================================================================

// Internal enum to represent the different types of social links (including TRY_ASSET)
enum InternalSocialLinkType {
  FACEBOOK = 'Facebook',
  TWITTER = 'Twitter',
  YOUTUBE = 'YouTube',
  TWITCH = 'Twitch',
  DISCORD = 'Discord',
  GITHUB = 'GitHub',
  ROBLOX = 'Roblox',
  DEVFORUM = 'DevForum',
  TRY_ASSET = 'TryAsset',
}

// Internal interface that includes TRY_ASSET
interface InternalSocialLinkWithType extends SocialLink {
  type: InternalSocialLinkType;
}

// Mapping from InternalSocialLinkType to the corresponding assets-upload-api FieldMask
const InternalSocialLinkTypeToFieldMask = {
  [InternalSocialLinkType.FACEBOOK]: FieldMask.FACEBOOK_SOCIAL_LINK,
  [InternalSocialLinkType.TWITTER]: FieldMask.TWITTER_SOCIAL_LINK,
  [InternalSocialLinkType.YOUTUBE]: FieldMask.YOUTUBE_SOCIAL_LINK,
  [InternalSocialLinkType.TWITCH]: FieldMask.TWITCH_SOCIAL_LINK,
  [InternalSocialLinkType.DISCORD]: FieldMask.DISCORD_SOCIAL_LINK,
  [InternalSocialLinkType.GITHUB]: FieldMask.GITHUB_SOCIAL_LINK,
  [InternalSocialLinkType.ROBLOX]: FieldMask.ROBLOX_SOCIAL_LINK,
  [InternalSocialLinkType.DEVFORUM]: FieldMask.DEVFORUM_SOCIAL_LINK,
  [InternalSocialLinkType.TRY_ASSET]: FieldMask.TRY_ASSET_SOCIAL_LINK,
};

// Convert from a SocialLink list to a InternalSocialLinkWithType list
// Only include the social links that have been set
const getSocialLinksWithType = (asset: Asset): InternalSocialLinkWithType[] => {
  return Object.values(InternalSocialLinkType)
    .map((type): InternalSocialLinkWithType | undefined => {
      switch (type) {
        case InternalSocialLinkType.FACEBOOK:
          return (
            asset.facebookSocialLink && {
              uri: asset.facebookSocialLink.uri,
              title: asset.facebookSocialLink.title,
              type,
            }
          );
        case InternalSocialLinkType.TWITTER:
          return (
            asset.twitterSocialLink && {
              uri: asset.twitterSocialLink.uri,
              title: asset.twitterSocialLink.title,
              type,
            }
          );
        case InternalSocialLinkType.YOUTUBE:
          return (
            asset.youtubeSocialLink && {
              uri: asset.youtubeSocialLink.uri,
              title: asset.youtubeSocialLink.title,
              type,
            }
          );
        case InternalSocialLinkType.TWITCH:
          return (
            asset.twitchSocialLink && {
              uri: asset.twitchSocialLink.uri,
              title: asset.twitchSocialLink.title,
              type,
            }
          );
        case InternalSocialLinkType.DISCORD:
          return (
            asset.discordSocialLink && {
              uri: asset.discordSocialLink.uri,
              title: asset.discordSocialLink.title,
              type,
            }
          );
        case InternalSocialLinkType.GITHUB:
          return (
            asset.githubSocialLink && {
              uri: asset.githubSocialLink.uri,
              title: asset.githubSocialLink.title,
              type,
            }
          );
        case InternalSocialLinkType.ROBLOX:
          return (
            asset.robloxSocialLink && {
              uri: asset.robloxSocialLink.uri,
              title: asset.robloxSocialLink.title,
              type,
            }
          );
        case InternalSocialLinkType.DEVFORUM:
          return (
            asset.devForumSocialLink && {
              uri: asset.devForumSocialLink.uri,
              title: asset.devForumSocialLink.title,
              type,
            }
          );
        case InternalSocialLinkType.TRY_ASSET:
          return (
            asset.tryAssetSocialLink && {
              uri: asset.tryAssetSocialLink.uri,
              type,
            }
          );
        default:
          throw new Error(`Unknown social link type: ${String(type)}`);
      }
    })
    .filter((entry): entry is InternalSocialLinkWithType => entry !== undefined);
};

// Convert from a SocialLinkWithType list to individual SocialLink fields
// Assign the social links to the asset based on the type
const assignSocialLinkWithType = (
  assetId: number,
  socialLinksWithType: InternalSocialLinkWithType[],
) => {
  const asset: Asset = { assetId };

  socialLinksWithType.forEach((linkWithType) => {
    const socialLink = {
      uri: linkWithType.uri,
      title: linkWithType.title,
    };
    switch (linkWithType.type) {
      case InternalSocialLinkType.FACEBOOK:
        asset.facebookSocialLink = socialLink;
        break;
      case InternalSocialLinkType.TWITTER:
        asset.twitterSocialLink = socialLink;
        break;
      case InternalSocialLinkType.YOUTUBE:
        asset.youtubeSocialLink = socialLink;
        break;
      case InternalSocialLinkType.TWITCH:
        asset.twitchSocialLink = socialLink;
        break;
      case InternalSocialLinkType.DISCORD:
        asset.discordSocialLink = socialLink;
        break;
      case InternalSocialLinkType.GITHUB:
        asset.githubSocialLink = socialLink;
        break;
      case InternalSocialLinkType.ROBLOX:
        asset.robloxSocialLink = socialLink;
        break;
      case InternalSocialLinkType.DEVFORUM:
        asset.devForumSocialLink = socialLink;
        break;
      case InternalSocialLinkType.TRY_ASSET:
        asset.tryAssetSocialLink = socialLink;
        break;
      default:
        throw new Error(`Unknown social link type: ${String(linkWithType.type)}`);
    }
  });

  return asset;
};

// ============================================================================
// Type Conversion Helpers
// ============================================================================

/**
 * Safely converts an external SocialLinkType to an InternalSocialLinkType
 * This is safe because InternalSocialLinkType is a superset of SocialLinkType
 */
const toInternalSocialLinkType = (type: SocialLinkType): InternalSocialLinkType => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- InternalSocialLinkType is a superset of SocialLinkType; values are nominal brands of the same string literals.
  return type as unknown as InternalSocialLinkType;
};

/**
 * Safely converts an InternalSocialLinkType to a SocialLinkType
 * Throws an error if the type is TRY_ASSET as it's not part of the external type
 */
const toExternalSocialLinkType = (type: InternalSocialLinkType): SocialLinkType => {
  if (type === InternalSocialLinkType.TRY_ASSET) {
    throw new Error('TRY_ASSET cannot be converted to external SocialLinkType');
  }
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- TRY_ASSET branch already ruled out above; remaining values are valid SocialLinkType brands.
  return type as unknown as SocialLinkType;
};

// ============================================================================
// Place Validation Helpers
// ============================================================================

const getPlaceUniverseId = async (placeId: number) => {
  const getUniverseContainingPlaceResponse =
    await universesClient.getUniverseContainingPlace(placeId);
  const universeId = getUniverseContainingPlaceResponse?.universeId ?? null;
  return universeId;
};

const isPlacePlayable = async (placeId: number) => {
  const placeDetails = await gamesClient.multigetPlaceDetails([placeId]);
  const placeIsPlayable = placeDetails.find((place) => place.placeId === placeId)?.isPlayable;
  return placeIsPlayable;
};

const computeUniverseIsPublic = (
  universeDetails: Awaited<ReturnType<typeof getUniverseConfiguration>> | null | undefined,
  enableAudiencesReplacement: boolean,
): boolean => {
  if (enableAudiencesReplacement) {
    return !isPrivateAudience(universeDetails?.audiences);
  }
  return universeDetails?.privacyType === 'Public';
};

const isPlacePublic = async (placeUniverseId: number, enableAudiencesReplacement: boolean) => {
  const universeDetails = await getUniverseConfiguration(placeUniverseId);
  return computeUniverseIsPublic(universeDetails, enableAudiencesReplacement);
};

/*
 * Internal-only function to validate the existing TryAsset place after fetching it
 */
const getExistingTryAssetPlaceIsPlayable = async (
  placeId: number,
  enableAudiencesReplacement: boolean,
) => {
  try {
    const placeUniverseId = await getPlaceUniverseId(placeId);

    if (!placeUniverseId) {
      return false;
    }

    const placeIsPlayable = (await isPlacePlayable(placeId)) ?? false;
    const placeIsPublic = await isPlacePublic(placeUniverseId, enableAudiencesReplacement);
    return placeIsPlayable && placeIsPublic;
  } catch {
    return null; // Fail open as this is only used to display an FYI warning to the user
  }
};

// ============================================================================
// Validation Rules and Patterns
// ============================================================================

// Regular expressions to validate the social link URIs in the form
// The backend will also validate the URIs
export const SocialLinkTypeToRegexPattern: Record<SocialLinkType, RegExp> = {
  [SocialLinkType.DISCORD]:
    /^\s*((http|https):\/\/)?(www\.)?discord\.(com|gg|io|me|li)\/[a-zA-Z0-9\-_/]+\s*$/,
  [SocialLinkType.FACEBOOK]:
    /^\s*((http|https):\/\/)?(www\.)?facebook\.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[?\w-]*\/)?(?:profile\.php\?id=(?=\d.*))?([\w-]*)\s*$/,
  [SocialLinkType.TWITCH]: /^\s*((http|https):\/\/)?(www\.)?twitch\.tv\/[a-zA-Z0-9\-/_]+\s*$/,
  [SocialLinkType.TWITTER]:
    /^(((http|https):\/\/)?(www\.)?(twitter|x)\.com\/|@)(?!logout(\/|$))([a-zA-Z0-9_]{1,15})$/,
  [SocialLinkType.YOUTUBE]:
    /^((http|https):\/\/)?(www\.)?youtube\.com\/(?!.*\bopensearch\b)(?!.*\blogout\b)[@a-zA-Z0-9\-/_]+$/,
  [SocialLinkType.GITHUB]:
    /(^((http|https):\/\/)?(www\.)?github\.com\/[a-zA-Z0-9\-/_]+$)|(^((http|https):\/\/)?([a-zA-Z0-9\-_]*)?\.github\.io$)/,
  [SocialLinkType.ROBLOX]:
    /^(?:(?:https?:\/\/)?(?:[a-z0-9-]{2,}\.)*)?(?:roblox(labs)?\.com\/)(?:(communities|games)\/)([\d]+)\/?(?:[A-Za-z0-9-]+)?(?:#!\/)?(?:[A-Za-z0-9]+)?$/,
  [SocialLinkType.DEVFORUM]:
    /^((http|https):\/\/)?(www\.)?devforum\.roblox\.com\/t\/(?:(?:[\w\d+-—]|%[0-9A-Fa-f]{2})*\/)?\d{5,7}(\/\d{1,6})?$/,
};

// Form validation rules
export const SocialLinkFormRules = {
  type: {
    required: '',
  },
  uri: {
    required: '',
    maxLength: {
      value: MAX_URI_LENGTH,
      message: '', // The translated message is handled in the SocialLinkFormItem component
    },
  },
  title: {
    maxLength: {
      value: MAX_TITLE_LENGTH,
      message: '', // The translated message is handled in the SocialLinkFormItem component
    },
  },
};

// ============================================================================
// Implementation
// ============================================================================

const useSocialLinks = (assetId: number, assetType: AssetType): SocialLinksContext => {
  const { translate } = useTranslation();
  const { pollForCompletedOperation } = useAssetsUploadApiOperationPolling();
  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const audiencesReplacementOn = enableAudiencesReplacement === true;

  const fetchAreSocialLinksEnabledForUser = useCallback(async () => {
    try {
      const ageBracketResponse: AgeBracketResponse = await usersClient.getAgeBracket();
      return ageBracketResponse.ageBracket === AGE_13_OR_OVER_AGE_BRACKET;
    } catch {
      return false; // Fail closed
    }
  }, []);

  // Mapping of SocialLinkType to the corresponding translated displayed name, helper text, and placeholder text
  const socialLinkTypeToTranslatedText = useMemo<
    Record<SocialLinkType, { displayName: string; helperText: string; placeholderText: string }>
  >(
    () => ({
      [SocialLinkType.DISCORD]: {
        displayName: 'Discord',
        helperText: translate('Label.DiscordSocialLinkHelperText'),
        placeholderText: 'https://discord.gg/roblox',
      },
      [SocialLinkType.FACEBOOK]: {
        displayName: 'Facebook',
        helperText: translate('Label.FacebookSocialLinkHelperText'),
        placeholderText: 'https://www.facebook.com/Roblox',
      },
      [SocialLinkType.TWITCH]: {
        displayName: 'Twitch',
        helperText: translate('Label.TwitchSocialLinkHelperText'),
        placeholderText: 'https://www.twitch.tv/roblox',
      },
      [SocialLinkType.TWITTER]: {
        // Only Twitter/X requires display name translation
        // "X (formerly Twitter)"	- translation is required for the "formerly" part
        displayName: translate('Label.XSocialLinkDisplayName'),
        helperText: translate('Label.TwitterSocialLinkHelperText'),
        placeholderText: '@Roblox',
      },
      [SocialLinkType.YOUTUBE]: {
        displayName: 'YouTube',
        helperText: translate('Label.YoutubeSocialLinkHelperText'),
        placeholderText: 'https://www.youtube.com/Roblox',
      },
      [SocialLinkType.GITHUB]: {
        displayName: 'GitHub',
        helperText: translate('Label.GithubSocialLinkHelperText'),
        placeholderText: 'https://github.com/Roblox',
      },
      [SocialLinkType.ROBLOX]: {
        displayName: 'Roblox',
        helperText: translate('Label.RobloxSocialLinkHelperText'),
        placeholderText: `https://www.${process.env.robloxSiteDomain}/games/10217794885/Roblox-Career-Center`,
      },
      [SocialLinkType.DEVFORUM]: {
        displayName: 'DevForum',
        helperText: translate('Label.DevForumSocialLinkHelperText'),
        placeholderText:
          'https://devforum.roblox.com/t/learn-how-to-build-immersive-3d-worlds/2979238',
      },
    }),
    [translate],
  );

  const fetchSocialLinks = useCallback(async () => {
    const allSocialLinksFieldMask = Object.values(InternalSocialLinkTypeToFieldMask);

    const asset = await assetsUploadApiClient.getAsset(assetId, allSocialLinksFieldMask);

    const socialLinksWithType = getSocialLinksWithType(asset);
    const tryAssetSocialLink = socialLinksWithType.find(
      (link: InternalSocialLinkWithType) => link.type === InternalSocialLinkType.TRY_ASSET,
    );
    const tryAssetPlaceId = tryAssetSocialLink?.uri ?? null;
    // For existing places, we know they were valid at the time of creation
    // However, those places may have since become unplayable for the public
    // In this case, we won't display the Try in Roblox button on the Creator Store
    // For these cases, we display a warning to the user
    // Skip playability check for DEFAULT as it will be resolved by the backend
    const tryAssetExistingPlaceIsPlayable =
      tryAssetPlaceId && tryAssetPlaceId !== TRY_ASSET_DEFAULT_PLACE_ID
        ? await getExistingTryAssetPlaceIsPlayable(
            parseInt(tryAssetPlaceId, 10),
            audiencesReplacementOn,
          )
        : null;

    // Convert internal social links to external format for processing
    const nonTryAssetSocialLinks = socialLinksWithType
      .filter((link: InternalSocialLinkWithType) => link.type !== InternalSocialLinkType.TRY_ASSET)
      .slice(0, MAX_SOCIAL_LINKS)
      .map((link: InternalSocialLinkWithType) => ({
        uri: link.uri,
        title: link.title,
        type: toExternalSocialLinkType(link.type),
      }));

    return {
      socialLinks: nonTryAssetSocialLinks,
      tryAssetPlaceId,
      tryAssetExistingPlaceIsPlayable,
    };
  }, [assetId, audiencesReplacementOn]);

  const updateSocialLinks = useCallback(
    async (
      existingSocialLinks: SocialLinkWithType[],
      updatedSocialLinksList: SocialLinkWithType[],
      existingTryAssetPlaceId: string | null,
      updatedTryAssetPlaceId: string | null,
    ) => {
      /*
       * The update fieldMask for the assets-upload-api needs to include:
       * 1. The social links to delete
       * 2. The desired social links, which includes both:
       *    - Existing link types that aren't being deleted
       *    - New link types
       */
      const existingSocialLinkTypes = existingSocialLinks.map(
        (link) => InternalSocialLinkTypeToFieldMask[toInternalSocialLinkType(link.type)],
      );

      const updatedSocialLinkTypes = updatedSocialLinksList
        .map((link) => InternalSocialLinkTypeToFieldMask[toInternalSocialLinkType(link.type)])
        .slice(0, MAX_SOCIAL_LINKS);

      const socialLinkTypesToDelete = existingSocialLinkTypes.filter(
        (type) => !updatedSocialLinkTypes.includes(type),
      );

      const socialLinksFieldMasks = [...socialLinkTypesToDelete, ...updatedSocialLinkTypes];

      // Convert external social links to internal format for processing
      const internalUpdatedSocialLinksList: InternalSocialLinkWithType[] =
        updatedSocialLinksList.map((link) => ({
          ...link,
          type: toInternalSocialLinkType(link.type),
        }));

      // Handle the TryAsset social link
      // This is treated differently as it is processed separately from the other social links
      // It also is exempted from the MAX_SOCIAL_LINKS limit
      if (TRY_ASSET_ENABLED_ASSET_TYPES.includes(assetType)) {
        // The only time we don't want to include the TryAsset field mask is
        // when both existing and updated TryAsset place IDs are null as this will
        // result in an assets-upload-api error
        if (existingTryAssetPlaceId || updatedTryAssetPlaceId) {
          socialLinksFieldMasks.push(FieldMask.TRY_ASSET_SOCIAL_LINK);
        }

        /*
         * However, we only want to include the TryAsset link itself if the PlaceId
         * is not null/empty.
         *
         * If it is null/empty, either:
         * 1. The user is trying to delete the TryAsset link, which is how the
         *    Assets API treats a provided FieldMask without a corresponding record.
         * 2. The existing and updated TryAsset links are both null/empty and
         *    accordingly, the FieldMask is not set.
         *
         * If we did include a null/empty value:
         * - In the first case, the Assets API would throw an error as it does not
         * allow explicit empty uri values.
         * - In the second case, there is no purpose to add it as the FieldMask is not set.
         */
        if (updatedTryAssetPlaceId) {
          internalUpdatedSocialLinksList.push({
            type: InternalSocialLinkType.TRY_ASSET,
            uri: updatedTryAssetPlaceId,
          });
        }
      }

      const asset = assignSocialLinkWithType(assetId, internalUpdatedSocialLinksList);

      const updateOperationId = await assetsUploadApiClient.updateAssetAndGetOperationId(
        assetId,
        socialLinksFieldMasks,
        asset,
      );
      await pollForCompletedOperation(updateOperationId);
    },
    [assetId, assetType, pollForCompletedOperation],
  );

  const validateTryAssetPlaceId = useCallback(
    async (placeId: string) => {
      try {
        const placeIdNumber = parseInt(placeId, 10);

        // Get the universe ID of the place
        const universeId = await getPlaceUniverseId(placeIdNumber);
        if (universeId === null) {
          return { isValid: false, errorMessage: translate('Error.InvalidPlaceId') };
        }

        // Confirm the universe is public
        const universeDetails = await getUniverseConfiguration(universeId);
        const universeIsPublic = audiencesReplacementOn
          ? computeUniverseIsPublic(universeDetails, true)
          : universeDetails?.privacyType === PUBLIC_UNIVERSE_PRIVACY_TYPE;
        if (!universeIsPublic) {
          return { isValid: false, errorMessage: translate('Error.TryInRobloxNonPublicPlace') };
        }

        // Confirm the place is playable
        const placeIsPlayable = await isPlacePlayable(placeIdNumber);
        if (!placeIsPlayable) {
          return { isValid: false, errorMessage: translate('Error.TryInRobloxNonPlayablePlace') };
        }

        // Confirm the user has permission to manage the universe
        const universesUserHasPermissionFor = await developClient.getUserUniversePermissions([
          universeId,
        ]);
        const userCanManageUniverse = universesUserHasPermissionFor.data?.find(
          (value) => value.universeId === universeId,
        )?.canManage;
        if (!userCanManageUniverse) {
          return {
            isValid: false,
            errorMessage: translate('Error.TryInRobloxInsufficientPermissionForPlace'),
          };
        }

        // Confirm the universe has permission for the asset
        const universeAssetPermission = await getUniverseHasPermission(assetId, [universeId]);
        const universeHasPermissionForAsset =
          universeAssetPermission?.at(0)?.value?.status === ApiPermissionStatus.HasPermission;
        if (!universeHasPermissionForAsset) {
          return {
            isValid: false,
            errorMessage: translate('Error.TryInRobloxPlaceDoesNotHaveAccessForAsset'),
          };
        }

        return { isValid: true, errorMessage: '' };
      } catch (error: unknown) {
        const errorResponse = getResponseFromError(error);
        const is403ForbiddenError = errorResponse?.status === 403;

        return {
          isValid: false,
          errorMessage: is403ForbiddenError
            ? translate('Error.TryInRobloxInsufficientPermissionForPlace')
            : translate('Error.TryInRobloxUnableToValidatePlace'),
        };
      }
    },
    [assetId, translate, audiencesReplacementOn],
  );

  return {
    socialLinkTypeToTranslatedText,
    fetchAreSocialLinksEnabledForUser,
    fetchSocialLinks,
    updateSocialLinks,
    validateTryAssetPlaceId,
  };
};

export default useSocialLinks;
