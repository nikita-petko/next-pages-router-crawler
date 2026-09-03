import {
  DialogBody,
  DialogHeroMedia,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@rbx/foundation-ui';
import { type ReactElement, useState } from 'react';

import { openDialog } from '@components/common/dialog/actions';
import type { BaseInjectedDialogProps } from '@components/common/dialog/types';
import styles from '@components/common/dialogs/ReachCreativePreviewDialog.module.css';
import ReachHomeFeedTilePreview from '@components/common/ReachHomeFeedTilePreview';
import ReachVerticalTilePreview from '@components/common/ReachVerticalTilePreview';
import { ServerCtaButtonType } from '@constants/ad';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

// The attribution thumbnail only appears in the expanded player, so advertisers
// need both states to review everything they uploaded.
enum VerticalPreviewTab {
  EXPANDED = 'expanded',
  TILE = 'tile',
}

/**
 * Every field is optional because the campaign builder previews a form that is
 * still being filled in, so the creative, logo, or copy may not be chosen yet.
 * The management table always holds a complete `ReachTablePreviewData`, which
 * satisfies this shape.
 */
interface ReachCreativePreviewData {
  /** Only the campaign builder has age-rating data (via `useAgeRecommendationLabel`). */
  ageRating?: string;
  /**
   * When true, empty 1x2 copy falls back to the experience name and maturity
   * label. Only set for experience-targeted (non-clickout) ads.
   */
  applyExperienceCopyDefaults?: boolean;
  /** 1x2 only — the ad's 1:1 attribution thumbnail. */
  attributionThumbnailAssetId?: number;
  backgroundAssetId?: number;
  /** 1x2 only — advertiser-selected call-to-action button. */
  ctaButtonType?: ServerCtaButtonType;
  /** Experience name. 1x2 preview uses this as the headline when copy is empty. */
  experienceName?: string;
  headline?: string;
  /**
   * Renders the vertical (video) tile instead of the home-feed tile. Only the
   * campaign builder sets this; the management table is 2x1-only today.
   */
  isVerticalFormat?: boolean;
  logoAspectRatio?: string;
  logoAssetId?: number;
  subtitle?: string;
  /** 1x2 only — the uploaded video asset backing the tile. */
  videoAssetId?: string;
}

interface ReachCreativePreviewDialogProps extends BaseInjectedDialogProps {
  reachPreview: ReachCreativePreviewData;
}

/**
 * Media-first lightbox for the full Reach home-feed tile (logo, headline,
 * subtitle, CTA, badge). Mirrors `CreativePreviewDialog`'s shape but renders
 * the composite `TwoByOneTile` instead of a single asset image, so the
 * scaled-down version in the management table can collapse to a plain
 * thumbnail and the rich preview only appears on click. Shared with the
 * campaign builder's `ReachCreativePreview`, which previews the creative being
 * assembled through the same lightbox.
 *
 * For 1x2 vertical (video) creatives it renders the tabbed `OneByTwoTile`
 * preview instead, since the attribution thumbnail is only visible in the
 * expanded player and advertisers need to review both states.
 */
const ReachCreativePreviewDialog = ({
  reachPreview,
}: ReachCreativePreviewDialogProps): ReactElement => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const [verticalTab, setVerticalTab] = useState<VerticalPreviewTab>(VerticalPreviewTab.TILE);

  // The 1x2 preview is tabbed, so it can't be media-only the way the 2x1
  // lightbox is — the tabs need a body to live in above the tile.
  if (reachPreview.isVerticalFormat) {
    return (
      <>
        <DialogTitle hidden>{translate('Description.CreativeAlt')}</DialogTitle>
        <DialogBody className={styles.verticalBody}>
          <Tabs
            onValueChange={(value) => setVerticalTab(value as VerticalPreviewTab)}
            value={verticalTab}>
            <TabsList>
              <TabsTrigger
                className='content-default data-[state=active]:content-emphasis'
                data-testid='vertical-preview-tile-tab'
                value={VerticalPreviewTab.TILE}>
                {translateCampaign('Label.HomeFeedTile')}
              </TabsTrigger>
              <TabsTrigger
                className='content-default data-[state=active]:content-emphasis'
                data-testid='vertical-preview-expanded-tab'
                value={VerticalPreviewTab.EXPANDED}>
                {translateCampaign('Label.ExpandedVideo')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className={styles.verticalTileStage}>
            <ReachVerticalTilePreview
              ageRating={reachPreview.ageRating}
              applyExperienceCopyDefaults={reachPreview.applyExperienceCopyDefaults}
              attributionThumbnailAssetId={reachPreview.attributionThumbnailAssetId}
              backgroundAssetId={reachPreview.backgroundAssetId}
              ctaButtonType={reachPreview.ctaButtonType}
              experienceName={reachPreview.experienceName}
              headline={reachPreview.headline}
              logoAssetId={reachPreview.logoAssetId}
              previewProps={{ disableCtaInteraction: true }}
              subtitle={reachPreview.subtitle ?? ''}
              videoAssetId={reachPreview.videoAssetId}
              view={verticalTab}
            />
          </div>
        </DialogBody>
      </>
    );
  }

  return (
    <>
      <DialogHeroMedia className={styles.heroMedia}>
        <div className={styles.tileContainer}>
          <ReachHomeFeedTilePreview
            ageRating={reachPreview.ageRating}
            backgroundAssetId={reachPreview.backgroundAssetId}
            headline={reachPreview.headline}
            logoAspectRatio={reachPreview.logoAspectRatio}
            logoAssetId={reachPreview.logoAssetId}
            // Lightbox is a read-only preview — render the CTA as non-interactive
            // markup so it doesn't look clickable when it isn't wired to any action.
            previewProps={{ disableCtaInteraction: true }}
            subtitle={reachPreview.subtitle}
          />
        </div>
      </DialogHeroMedia>
      <DialogTitle hidden>{translate('Description.CreativeAlt')}</DialogTitle>
    </>
  );
};

export const openReachCreativePreviewDialog = (reachPreview: ReachCreativePreviewData): void => {
  openDialog({
    component: ReachCreativePreviewDialog,
    options: { hasCloseAffordance: true, size: 'Large' },
    props: { reachPreview },
  });
};

export default ReachCreativePreviewDialog;
