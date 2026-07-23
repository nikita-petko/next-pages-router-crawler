import React, { FunctionComponent } from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Link } from '@modules/miscellaneous/common';
import type { TTypographyProps, TLinkProps } from '@rbx/ui';
import useOverviewInlineUrlStyles from './OverviewInlineUrlTranslationLabel.styles';

type TTypographyVariant = NonNullable<TTypographyProps['variant']>;
type TLinkVariant = NonNullable<TLinkProps['variant']>;

export interface OverviewInlineUrlTranslationLabelProps {
  translationKey: string; // the translation key (i.e. Label.EarnItemInGame)
  opening: string; // opening tag for translateHTML (i.e. gameLinkStart)
  closing: string; // closing tag for translateHTML (i.e. gameLinkEnd)
  anchorTargetName?: string; // name of the target entity the url is pointing to
  anchorTargetUrl: string; // url to target entity
  typographyColorOverride?: 'inherit' | 'secondary'; // optional Typography color override
  typographyVariantOverride?: TTypographyVariant | undefined; // optional Typography variant override
  linkVariantOverride?: TLinkVariant | undefined; // optional Link variant override
}

/**
 * Translation typography + Anchor wrapper for displaying a localized string of the (example) form 'Earn in {gameLinkStart}{gameLinkEnd}'
 *
 * I made this wrapper so it can be re-used for similar overview pages that need an anchor link (i.e. for game overview
 * 'By {creatorLinkStart}{creatorLinkEnd}' or game passes 'Purchase for {gameLinkStart}{gameLinkEnd}).
 *
 * Pass in the translation key (i.e. Label.EarnItemInGame), and the opening and closing tags (i.e. gameLinkStart and gameLinkEnd)
 * specififed in admin simulprod, as well as the target entity name (i.e. universe name) and target url (i.e. sitetest1/game/123)
 */
const OverviewInlineUrlTranslationLabel: FunctionComponent<
  React.PropsWithChildren<OverviewInlineUrlTranslationLabelProps>
> = ({
  translationKey,
  opening,
  closing,
  anchorTargetName,
  anchorTargetUrl,
  typographyColorOverride = 'secondary',
  typographyVariantOverride,
  linkVariantOverride,
}) => {
  const {
    classes: { awardingGameName },
  } = useOverviewInlineUrlStyles();
  const { translateHTML } = useTranslation();

  return (
    <Typography color={typographyColorOverride} variant={typographyVariantOverride || 'body1'}>
      {translateHTML(translationKey, [
        {
          opening,
          closing,
          content(chunks) {
            if (!anchorTargetUrl) {
              return anchorTargetName;
            }
            return (
              <Link
                variant={linkVariantOverride || 'h6'}
                className={awardingGameName}
                href={anchorTargetUrl}
                target='_blank'>
                {/* <Typography color='primary'> */}
                {anchorTargetName !== undefined ? anchorTargetName : chunks}
                {/* </Typography> */}
              </Link>
            );
          },
        },
      ])}
    </Typography>
  );
};

export default OverviewInlineUrlTranslationLabel;
