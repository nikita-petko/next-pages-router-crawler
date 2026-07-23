import { buttonClasses, makeStyles } from '@rbx/ui';

import { LogoSize, ThumbnailSize } from '@constants/campaignBuilder';

const useCreativesStyles = makeStyles<void, 'removeButtonOverlay' | 'trashIconWrapper'>()(
  (theme, _params, classes) => ({
    // Tile-shaped Add-thumbnail button per Figma node 17315:135712 — a 160x90
    // dark-surface card that contains a centered circle-plus icon. Hover /
    // active backgrounds promote the whole tile (not just the icon) to be
    // the interactive target so the click affordance matches the live tiles
    // beside it. Uses theme surface tokens so it tracks light/dark mode and
    // stays consistent with the row-hover background used in the management
    // tables (surface[200]).
    addThumbnailTile: {
      '&:active': {
        backgroundColor: theme.palette.surface[300],
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.actionV2.primary.containedHoverFocus}`,
        outlineOffset: 2,
      },
      '&:hover': {
        backgroundColor: theme.palette.surface[200],
      },
      alignItems: 'center',
      backgroundColor: theme.palette.surface[100],
      border: 'none',
      borderRadius: '8px',
      color: 'inherit',
      cursor: 'pointer',
      display: 'flex',
      height: ThumbnailSize.height,
      justifyContent: 'center',
      padding: 0,
      transition: 'background-color 0.15s ease',
      width: ThumbnailSize.width,
    },

    // Error decoration for `addThumbnailTile`. Painted as `outline` rather
    // than `border` so the tile keeps its inner content box (no layout
    // shift) and the focus-visible outline can still take over when the
    // user tabs to it. Composed on top of `addThumbnailTile` via `cx`.
    addThumbnailTileError: {
      outline: `1px solid ${theme.palette.components.input.outlined.errorBorder}`,
    },

    checkIconWrapper: {
      position: 'absolute',
      right: 2,
      top: 2,
    },

    creativeGlass: {
      '&:hover': {
        [`& .${classes.trashIconWrapper}`]: {
          opacity: 1,
        },
        backgroundColor: theme.palette.components.backdrop.fill,
      },
      height: '100%',
      left: 0,
      padding: 0,
      position: 'absolute',
      top: 0,
      width: '100%',
    },

    creativeSectionPreviewContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      position: 'relative',
      top: '3px',
    },

    creativeUploadButton: {
      alignItems: 'center',
      // Reset native <button> chrome (background/padding/font/color) so only
      // the explicit border + centered icon below show through.
      background: 'none',
      border: `1px solid ${theme.palette.surface.outline}`,
      color: 'inherit',
      cursor: 'pointer',
      display: 'flex',
      font: 'inherit',
      height: ThumbnailSize.height,
      justifyContent: 'center',
      padding: 0,
      width: ThumbnailSize.width,
    },

    creativeUploadButtonWrapper: {
      display: 'inline-block',
    },

    creativeUploadDrawerBody: {
      color: theme.palette.content.muted,
    },

    creativeUploadDrawerBold: {
      color: theme.palette.actionV2.primary.containedHoverFocus,
      fontWeight: 700,
    },

    creativeUploadDrawerHeader: {
      color: theme.palette.actionV2.primary.containedHoverFocus,
      display: 'inline-block',
      marginBottom: '8px',
      marginTop: '0px',
      width: 'fit-content',
    },

    creativeUploadDrawerInfoIcon: {
      marginLeft: '4px',
      position: 'relative',
      top: '3px',
    },

    creativeUploadDrawerNumSelected: {
      display: 'block',
      margin: '32px 0',
      width: '100%',
    },

    creativeUploadDrawerThumbnail: {
      marginRight: '16px',
      position: 'relative',
    },

    creativeUploadDrawerThumbnailsMarginTop: {
      marginTop: '48px',
    },

    disabledCreativeGlass: {
      backgroundColor: theme.palette.components.backdrop.fill,
      cursor: 'default',
      outline: 'none',
    },

    disabledTrashIconWrapper: {
      color: theme.palette.content.disabled,
      height: '20px',
      left: 2,
      margin: '8px',
      position: 'absolute',
      top: 2,
      width: '20px',
    },

    errorBorder: {
      borderColor: theme.palette.components.input.outlined.errorBorder,
    },

    lockIconWrapper: {
      height: '20px',
      margin: '8px',
      position: 'absolute',
      right: 2,
      top: 2,
      width: '20px',
    },

    logoStyle: {
      alignItems: 'center',
      backgroundColor: theme.palette.surface[400],
      borderRadius: '8px',
      display: 'flex',
      height: LogoSize.height,
      justifyContent: 'center',
    },

    // Positions the AssetTileImage + remove-X overlay as a stacking context
    // so the Foundation OverMedia IconButton can anchor to the top-right
    // corner of the thumbnail. Width matches the tile so the wrapper
    // doesn't stretch the flex row.
    removableCreativeWrapper: {
      [`&:hover .${classes.removeButtonOverlay}`]: {
        opacity: 1,
        pointerEvents: 'auto',
      },
      display: 'inline-block',
      position: 'relative',
      width: ThumbnailSize.width,
    },

    // Anchors the Foundation IconButton (variant=OverMedia, size=Small,
    // isCircular) to the top-right corner of the tile per Figma node
    // 17551:54225. Applied to a wrapper div around the IconButton rather
    // than the button itself because Foundation IconButton hard-codes
    // `position: relative` in its own class string — putting `position:
    // absolute` directly on the button loses the cascade race against the
    // Tailwind `relative` utility, which made the X drop below the tile
    // instead of overlaying it.
    removeButtonOverlay: {
      opacity: 0,
      pointerEvents: 'none',
      position: 'absolute',
      right: 8,
      top: 8,
      transition: theme.transitions.create('opacity', {
        duration: theme.transitions.duration.short,
      }),
      zIndex: 1,
    },

    selectedCreativeGlass: {
      [`.${buttonClasses.disabled}`]: {
        backgroundColor: theme.palette.components.backdrop.fill,
        outline: 'none',
      },
      backgroundColor: theme.palette.components.backdrop.fill,
      borderRadius: '8px',
      outline: `2px solid ${theme.palette.actionV2.primary.containedHoverFocus}`,
    },

    showPreviewButton: {
      margin: 0,
      padding: 0,
    },

    thumbnailStyle: {
      alignItems: 'center',
      backgroundColor: theme.palette.surface[400],
      borderRadius: '8px',
      display: 'flex',
      height: ThumbnailSize.height,
      justifyContent: 'center',
      overflow: 'hidden',
      width: ThumbnailSize.width,
    },

    // 160x90 16:9 tile that holds the AssetTileImage. radius-medium (8px)
    // matches the Figma's radius/medium token and the Foundation Media
    // container already clips the image with object-fit: cover so off-ratio
    // sources crop instead of stretching.
    thumbnailTile: {
      borderRadius: '8px',
      height: ThumbnailSize.height,
      overflow: 'hidden',
      width: ThumbnailSize.width,
    },

    trashIconWrapper: {
      left: 2,
      opacity: 0,
      position: 'absolute',
      top: 2,
      transition: theme.transitions.create('opacity', {
        duration: theme.transitions.duration.short,
      }),
    },

    videoErrorContainer: {
      alignItems: 'center',
      backgroundColor: theme.palette.components.alert.informContent,
      borderRadius: 4,
      display: 'flex',
      flexDirection: 'column',
      fontSize: '10px',
      height: '100%',
      justifyContent: 'center',
      padding: '4px',
      textAlign: 'center',
      width: '100%',
    },

    // Styles matching VideoUploadCard but with 160x90 dimensions
    videoUploadContainer: {
      '&:hover': {
        '& video': {
          opacity: 0.8,
        },
      },
      display: 'flex',
      height: ThumbnailSize.height,
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      width: ThumbnailSize.width,
    },

    videoUploadContainerClickable: {
      '&:hover': {
        '& video': {
          opacity: 0.8,
        },
      },
      cursor: 'pointer',
      display: 'flex',
      height: ThumbnailSize.height,
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      width: ThumbnailSize.width,
    },

    videoUploadThumbnail: {
      borderRadius: 4,
      height: ThumbnailSize.height,
      margin: '0 auto',
      objectFit: 'cover',
    },

    videoUploadThumbnailPlaceholder: {
      width: ThumbnailSize.width,
    },
  }),
);

export default useCreativesStyles;
