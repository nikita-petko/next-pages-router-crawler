import { Badge } from '@rbx/foundation-ui';
import React from 'react';

const SMALL_SCREEN_BREAKPOINT = 600;

const LOGO_HEIGHT_PERCENT_SQUARE = 36;
const LOGO_HEIGHT_PERCENT_LANDSCAPE = 24;

function logoHeightCalc(percent: number) {
  return `${percent}cqh`;
}

function useIsSmallScreen() {
  const [isSmall, setIsSmall] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(`(max-width: ${SMALL_SCREEN_BREAKPOINT}px)`).matches;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${SMALL_SCREEN_BREAKPOINT}px)`);
    setIsSmall(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsSmall(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isSmall;
}

/** Options for preview / embedded instances (e.g. scaled table cell, design tooling). */
export interface TwoByOneTilePreviewProps {
  /**
   * When true, the CTA renders as non-interactive markup (`<span>`) instead of a `<button>`.
   * Use when the tile is wrapped by another clickable control (e.g. parent `<button>`),
   * or when the tile is displayed in a read-only context (preview dialogs, design tooling).
   */
  disableCtaInteraction?: boolean;
  /** Override responsive breakpoint: force small or large layout. */
  forceSmall?: boolean;
}

export interface TwoByOneTileProps {
  ageRating?: string;
  backgroundImage: React.ReactElement | null;
  badgeText?: string;
  buttonText?: string;
  /**
   * @deprecated Prefer `previewProps.forceSmall`.
   */
  forceSmall?: boolean;
  headline: string;
  logoAspectRatio?: [number, number];
  logoImage: React.ReactElement | null;
  /** Layout and CTA behavior overrides for preview / nested use cases. */
  previewProps?: TwoByOneTilePreviewProps;
  subtitle: string;
}

/**
 * `TwoByOneTile` mirrors the lua-apps `TwoByOneGameTile` Variant2 home-feed creative:
 * a 510×190 (native) background image with badge, optional logo, headline, subtitle,
 * an age-rating label, and a transparent-white CTA. The CTA is a native `<button>`
 * (not Foundation `<Button>`) so the rendered DOM and styling stay byte-identical to
 * the lua-apps client. Set `previewProps.disableCtaInteraction` to render the CTA as
 * an inert `<span>` when the tile is read-only or wrapped in a parent clickable.
 */
export default function TwoByOneTile({
  ageRating: ageRatingLabel,
  backgroundImage,
  badgeText = 'Sponsored',
  buttonText = 'Join',
  forceSmall,
  headline,
  logoAspectRatio = [1, 1],
  logoImage,
  previewProps,
  subtitle,
}: TwoByOneTileProps) {
  const isSmallScreen = useIsSmallScreen();
  const resolvedForceSmall =
    previewProps?.forceSmall !== undefined ? previewProps.forceSmall : forceSmall;
  const isSmall = resolvedForceSmall ?? isSmallScreen;
  const disableCtaInteraction = previewProps?.disableCtaInteraction ?? false;

  const [w, h] = logoAspectRatio;
  const contentPadding = isSmall ? 'var(--padding-medium)' : 'var(--padding-large)';
  const logoPercent = w / h >= 2 ? LOGO_HEIGHT_PERCENT_LANDSCAPE : LOGO_HEIGHT_PERCENT_SQUARE;
  const logoHeight = logoHeightCalc(logoPercent);

  // Shared CTA visual styling. The interactive path (native <button>) and the
  // read-only preview path (<span>, opted in via previewProps.disableCtaInteraction)
  // both use these classes so the two render visually identical. Matches the
  // v0.4.0 lua-apps `TwoByOneGameTile` Variant2 CTA, with the v0.6.0 responsive
  // height/typography breakpoint at 600px.
  const ctaSharedClassName = `${isSmall ? 'height-800 text-title-small' : 'height-1000 text-title-medium'} radius-medium
    [background:var(--color-extended-white-20)] [color:var(--color-extended-white-100)]
    hover:[background:var(--color-extended-white-15)] active:[background:var(--color-extended-white-10)]
    [transition:background_150ms_ease] [border:none] [padding-inline:calc(var(--padding-large)*2)]
    [font-family:inherit]`;

  return (
    <div
      className="relative width-full height-full radius-medium clip
        bg-[var(--color-extended-gray-800)]
        [font-family:var(--config-text-font),_'Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
      {backgroundImage && (
        <div className='absolute inset-[0] [overflow:hidden] width-full height-full'>
          {backgroundImage}
        </div>
      )}

      <div
        className={`absolute inset-[0] [container-type:size] flex flex-col justify-between ${isSmall ? 'padding-medium' : 'padding-large'} [z-index:2]`}>
        <div className='flex justify-between items-start'>
          <Badge label={badgeText} variant='OverMedia' />
          {logoImage && (
            <div className='max-width-[50%] [overflow:hidden]' style={{ height: logoHeight }}>
              {logoImage}
            </div>
          )}
        </div>

        <div
          className={`absolute top-[47%] [transform:translateY(-50%)] flex flex-col ${isSmall ? 'gap-xxsmall' : 'gap-xsmall'}`}
          style={{
            left: contentPadding,
            right: contentPadding,
          }}>
          {headline && (
            <p
              className={`${isSmall ? 'text-heading-small' : 'text-heading-medium'} [line-height:0.95] [color:var(--color-extended-white-100)] [margin:0] [word-wrap:break-word]`}>
              {headline}
            </p>
          )}
          {subtitle && (
            <p
              className={`${isSmall ? 'text-body-small' : 'text-body-medium'} [font-weight:300] [line-height:1.10] [color:var(--color-extended-white-100)] [margin:0] [word-wrap:break-word]`}>
              {subtitle}
            </p>
          )}
        </div>

        <div className='flex justify-between items-end'>
          {disableCtaInteraction ? (
            // Non-interactive preview: <span> with explicit centering since it
            // doesn't inherit the user-agent button defaults.
            <span
              className={`${ctaSharedClassName} inline-flex items-center justify-center [cursor:default] [box-sizing:border-box]`}>
              {buttonText}
            </span>
          ) : (
            // Interactive path: native <button> for lua-apps parity (v0.4.0).
            // Foundation <Button> would add wrapper DOM/styling that diverges
            // from the lua-apps `TwoByOneGameTile` Variant2 implementation.
            <button className={`${ctaSharedClassName} [cursor:pointer]`} type='button'>
              {buttonText}
            </button>
          )}
          {ageRatingLabel && (
            <span className='text-body-small [color:var(--color-extended-gray-400)] text-no-wrap [margin-left:auto]'>
              {ageRatingLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
