import { Badge, Button, IconButton } from '@rbx/foundation-ui';
import React from 'react';

/** Native tile is 344x499; the 3:1 logo is 133.6 wide, i.e. 38.8% of the tile. */
const LOGO_WIDTH_PERCENT = 38.8;

/** Which state of the 1x2 creative to render. */
export type OneByTwoTileView =
  /** Home-feed grid tile: badge, logo, headline, subtitle, CTA. */
  | 'tile'
  /** Expanded video player: same media plus the attribution bar. */
  | 'expanded';

/** Options for preview / embedded instances (e.g. scaled dialog, design tooling). */
export interface OneByTwoTilePreviewProps {
  /**
   * When true, the CTA renders as non-interactive markup (`<span>`) instead of a `<button>`.
   * Use when the tile is wrapped by another clickable control (e.g. parent `<button>`),
   * or when the tile is displayed in a read-only context (preview dialogs, design tooling).
   */
  disableCtaInteraction?: boolean;
}

export interface OneByTwoTileProps {
  /**
   * Square brand icon for the attribution bar, rendered from the ad's
   * `attributionThumbnailAssetId`. `expanded` view only.
   */
  attributionThumbnailImage?: React.ReactElement | null;
  backgroundImage: React.ReactElement | null;
  badgeText?: string;
  buttonText?: string;
  headline: string;
  logoImage: React.ReactElement | null;
  /** Accessible name for the overflow menu button. `tile` view only. */
  overflowMenuLabel?: string;
  /** Layout and CTA behavior overrides for preview / nested use cases. */
  previewProps?: OneByTwoTilePreviewProps;
  subtitle: string;
  view?: OneByTwoTileView;
}

/**
 * `OneByTwoTile` mirrors the lua-apps 1x2 vertical-video home-feed creative. It renders
 * two states off the same media: the `tile` grid cell (badge, 3:1 logo, headline,
 * subtitle, CTA) and the `expanded` video player, whose attribution bar shows the
 * square `attributionThumbnailAssetId` brand icon, the headline, the subtitle, and a
 * View button.
 *
 * The attribution bar only exists on brand tiles (ads with a clickout URL), which is
 * why the attribution thumbnail is invisible in the `tile` view — advertisers need the
 * `expanded` view to see what they uploaded.
 *
 * Both views carry the same headline and subtitle so this stays a preview of the
 * advertiser's own copy. The bar deliberately does not show the advertiser name or a
 * "Go to website" line: neither is authored in the creative form, so surfacing them
 * here told an advertiser nothing about the ad they were assembling.
 *
 * Like `TwoByOneTile`, the grid CTA is a native `<button>` rather than Foundation
 * `<Button>` so the rendered DOM stays identical to the lua-apps client. The
 * attribution bar's View button maps 1:1 to a Foundation `Button` in the design, so it
 * uses the real component.
 */
export default function OneByTwoTile({
  attributionThumbnailImage,
  backgroundImage,
  badgeText = 'Ad',
  buttonText = 'View',
  headline,
  logoImage,
  overflowMenuLabel = 'More options',
  previewProps,
  subtitle,
  view = 'tile',
}: OneByTwoTileProps) {
  const disableCtaInteraction = previewProps?.disableCtaInteraction ?? false;

  const rootClassName = `relative width-full height-full radius-medium clip stroke-default stroke-muted
    bg-[var(--color-extended-gray-800)]
    [font-family:var(--config-text-font),_'Helvetica_Neue',_Helvetica,_Arial,_sans-serif]`;

  const media = backgroundImage && (
    <div className='absolute inset-[0] [overflow:hidden] width-full height-full'>
      {backgroundImage}
    </div>
  );

  if (view === 'expanded') {
    return (
      <div className={rootClassName}>
        {media}
        <div
          className='absolute bottom-[0] left-[0] right-[0] flex flex-col gap-large
            [padding:80px_20px_20px_20px]'
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)',
          }}>
          <div className='flex'>
            <Badge label={badgeText} variant='OverMedia' />
          </div>
          {/* justify-between, not a grow utility on the copy: the Foundation
              Tailwind preset allowlists corePlugins and leaves flexGrow,
              flexShrink and flexBasis out, so `flex-1` compiles to nothing and
              the CTA ends up hugging the text instead of sitting at the edge.

              max-width must stay an arbitrary value. Foundation maps it to the
              size-token scale, so `max-width-600` is token 600 — 24px — which
              collapses the copy to zero width and spills the CTA out the left. */}
          <div className='flex items-center justify-between gap-medium width-full max-width-[600px]'>
            <div className='flex items-center gap-medium min-width-0'>
              {attributionThumbnailImage && (
                <div className='size-1000 radius-medium clip shrink-0'>
                  {attributionThumbnailImage}
                </div>
              )}
              {/* The advertiser's own copy, not brand attribution. This is a
                  preview surface: the headline and subtitle are the two fields
                  they just filled in, and showing anything else here leaves
                  them with no way to check what they typed against the video
                  it sits on. */}
              <div className='flex flex-col justify-center min-width-0'>
                {headline && (
                  <p className='text-label-medium content-emphasis [margin:0] text-no-wrap text-truncate-end'>
                    {headline}
                  </p>
                )}
                {subtitle && (
                  <p className='text-body-medium content-default [margin:0] text-no-wrap text-truncate-end'>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <Button isDisabled={disableCtaInteraction} size='Medium' variant='Emphasis'>
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Shared CTA visual styling. The interactive path (native <button>) and the
  // read-only preview path (<span>, opted in via previewProps.disableCtaInteraction)
  // both use these classes so the two render visually identical.
  const ctaSharedClassName = `height-1000 text-title-medium radius-medium
    [background:var(--color-extended-white-20)] [color:var(--color-extended-white-100)]
    hover:[background:var(--color-extended-white-15)] active:[background:var(--color-extended-white-10)]
    [transition:background_150ms_ease] [border:none] [padding-inline:calc(var(--padding-large)*2)]
    [font-family:inherit]`;

  return (
    <div className={rootClassName}>
      {media}

      <div
        className='absolute bottom-[0] left-[0] right-[0] height-[250px]'
        style={{
          backgroundImage: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.75) 100%)',
        }}
      />

      <div className='absolute inset-[0] flex flex-col justify-between padding-medium [z-index:2]'>
        <div className='flex justify-between items-start'>
          <Badge label={badgeText} variant='OverMedia' />
          {logoImage && (
            <div
              className='radius-small [overflow:hidden] [aspect-ratio:3/1]'
              style={{ width: `${LOGO_WIDTH_PERCENT}%` }}>
              {logoImage}
            </div>
          )}
        </div>

        <div className='flex flex-col gap-medium'>
          <div className='flex flex-col [word-wrap:break-word]'>
            {headline && (
              <p className='text-heading-medium content-emphasis [margin:0]'>{headline}</p>
            )}
            {subtitle && <p className='text-body-medium content-default [margin:0]'>{subtitle}</p>}
          </div>
          <div className='flex'>
            {disableCtaInteraction ? (
              // Non-interactive preview: <span> with explicit centering since it
              // doesn't inherit the user-agent button defaults.
              <span
                className={`${ctaSharedClassName} inline-flex items-center justify-center [cursor:default] [box-sizing:border-box]`}>
                {buttonText}
              </span>
            ) : (
              <button className={`${ctaSharedClassName} [cursor:pointer]`} type='button'>
                {buttonText}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overflow menu sits at the tile root (not inside the padded lockup) so it
          keeps the 11px inset from the Figma spec. */}
      <div className='absolute top-[11px] right-[11px] [z-index:3]'>
        <IconButton
          ariaLabel={overflowMenuLabel}
          icon='icon-filled-three-dots-horizontal'
          isCircular
          isDisabled={disableCtaInteraction}
          size='Small'
          variant='OverMedia'
        />
      </div>
    </div>
  );
}
