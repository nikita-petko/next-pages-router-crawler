import { useCallback, useMemo, useState } from 'react';
import type { IPFamily } from '@rbx/client-rights/v1';
import {
  IPContentContentTypeEnum,
  IPContentStatusEnum,
  type IPContent,
} from '@rbx/client-rights/v1';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Grid,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  makeStyles,
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
  ExpandMoreIcon,
  IconButton,
} from '@rbx/ui';
import { EmptyState, EmptyStateBorder, PageLoading } from '@modules/miscellaneous/components';
import { SupportedRobloxAssetTypeEnum } from '../../../ipFamilies/constants';
import {
  useIpFamiliesQuery,
  useListAllIpContentsByIpFamily,
} from '../../../ipFamilies/hooks/ipFamily';

interface ImageIPContentSelectorDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onImageChosen: (image: IPContent) => void;
}

const useStyles = makeStyles()((theme) => ({
  tile: {
    aspectRatio: '1',
    overflow: 'hidden',
    width: '100%',
    padding: 0,
    display: 'block',
  },
  tileClickable: {
    cursor: 'pointer',
  },
  tileSelected: {
    border: '3px solid',
    borderColor: theme.palette.content.standard,
  },
  thumbnailContainer: {
    display: 'block',
  },
  thumbnailImg: {
    display: 'block',
    objectFit: 'cover',
  },
  assetName: {
    marginTop: theme.spacing(1),
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

interface IpFamilySelectorTitleProps {
  ipFamilies: IPFamily[];
  selectedIpFamily: IPFamily | undefined;
  onSelect: (ipFamily: IPFamily) => void;
}

const IpFamilySelectorTitle = ({
  ipFamilies,
  selectedIpFamily,
  onSelect,
}: IpFamilySelectorTitleProps) => {
  const { translate } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | undefined>(undefined);

  const displayName = selectedIpFamily?.name ?? translate('Heading.IPLibrary');

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  const handleSelect = (ipFamily: IPFamily) => {
    onSelect(ipFamily);
    handleClose();
  };

  return (
    <>
      <Grid alignItems='center'>
        {translate('Heading.SelectImageFromIpFamily', {
          family: displayName,
        })}
        {ipFamilies.length > 0 && (
          <IconButton
            onClick={handleClick}
            color='inherit'
            disableRipple
            aria-label={translate('Label.IpFamily')}>
            <ExpandMoreIcon sx={{ fontSize: '32px' }} />
          </IconButton>
        )}
      </Grid>

      {ipFamilies.length > 0 && (
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}>
          {ipFamilies.map((ipFamily) => (
            <MenuItem
              key={ipFamily.id}
              onClick={() => handleSelect(ipFamily)}
              dense
              selected={ipFamily.id === selectedIpFamily?.id}>
              <Typography>{ipFamily.name}</Typography>
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};

interface SelectableImageProps {
  ipContent: IPContent;
  selectedImage: IPContent | undefined;
  setSelectedImage: (image: IPContent) => void;
}

const SelectableImage = ({ ipContent, selectedImage, setSelectedImage }: SelectableImageProps) => {
  const { classes } = useStyles();
  const { translate } = useTranslation();

  const assetId = parseInt(ipContent.contentValue ?? '', 10);
  const isSelected = selectedImage === ipContent;

  const thumbnail = (
    <Thumbnail2d
      targetId={assetId}
      type={ThumbnailTypes.assetThumbnail}
      alt={translate('Label.IpContentThumbnail')}
      returnPolicy={ReturnPolicy.PlaceHolder}
      includeBackground={false}
      skeletonVariant='square'
      containerClass={classes.thumbnailContainer}
      imgClassName={classes.thumbnailImg}
    />
  );

  return (
    <Grid item XSmall={4} key={ipContent.id}>
      <Button
        tabIndex={0}
        aria-checked={isSelected}
        className={`${classes.tile} ${classes.tileClickable} ${isSelected ? classes.tileSelected : ''}`}
        onClick={() => setSelectedImage(ipContent)}
        onDragStart={(event) => event.preventDefault()}>
        {thumbnail}
      </Button>
    </Grid>
  );
};

interface ImageSelectionGridProps {
  ipFamily: IPFamily; // IP family
  selectedImage: IPContent | undefined; // Drill down selected image
  setSelectedImage: (image: IPContent) => void; // Drill down selected image setter
}

const ImageSelectionGrid = ({
  ipFamily,
  selectedImage,
  setSelectedImage,
}: ImageSelectionGridProps) => {
  const { translate } = useTranslation();

  const {
    data,
    isLoading,
    isError: errorFetchingIpContents,
  } = useListAllIpContentsByIpFamily(
    { ipFamilyId: ipFamily.id ?? '' },
    {
      staleTime: Infinity, // Keep the ip contents in cache, so we don't repeat the fetch every time the dialog is closed and reopened
    },
  );

  // Get only approved images (TODO: let this part be a filter on the listAllIpContentsByIpFamily query)
  const approvedImages = useMemo(
    () =>
      data?.ipContents?.filter((ipContent) => {
        if (ipContent.status !== IPContentStatusEnum.Approved) {
          return false;
        }
        if (ipContent.contentType === IPContentContentTypeEnum.Image) {
          return true;
        }
        if (
          ipContent.contentType === IPContentContentTypeEnum.Asset &&
          ipContent.robloxAssetType === SupportedRobloxAssetTypeEnum.Image
        ) {
          return true;
        }
        return false;
      }) ?? [],
    [data?.ipContents],
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress color='secondary' />
      </div>
    );
  }

  if (errorFetchingIpContents) {
    return (
      <EmptyStateBorder>
        <EmptyState
          title={translate('Heading.GenericError')}
          description={translate('Response.TryAgainLater')}
          size='small'
          illustration='oof'
        />
      </EmptyStateBorder>
    );
  }

  if (approvedImages.length === 0) {
    return (
      <EmptyStateBorder>
        <EmptyState
          title={translate('Heading.NoImagesAvailable')}
          description={translate('Description.UpdateIPLibrary')}
          size='small'
          illustration='oof'
        />
      </EmptyStateBorder>
    );
  }

  return (
    <Grid container alignItems='center' spacing={2}>
      {approvedImages.map((ipContent) => (
        <SelectableImage
          key={ipContent.id}
          ipContent={ipContent}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
        />
      ))}
    </Grid>
  );
};

/**
 * Open a dialog for the user to select an image IP content from their IP library.
 * @param open - Whether the dialog is open (the dialog should always be present on the parent, just not always open)
 * @param setOpen - Function to set the open state of the dialog
 * @param onImageChosen - This is called when the user selects an image
 */
const ImageIPContentSelectorDialog = ({
  open,
  setOpen,
  onImageChosen,
}: ImageIPContentSelectorDialogProps) => {
  const { translate } = useTranslation();

  const { data, isLoading, error } = useIpFamiliesQuery();
  const ipFamilies = useMemo(() => data?.ipFamilies ?? [], [data?.ipFamilies]);

  const [selectedImage, setSelectedImage] = useState<IPContent | undefined>(undefined);
  const [selectedIpFamily, setSelectedIpFamily] = useState<IPFamily | undefined>(undefined);

  // If none is explicitly selected, use the first ip family
  const effectiveIpFamily = selectedIpFamily ?? ipFamilies[0];

  const onClose = useCallback(() => {
    setOpen(false);
    setSelectedImage(undefined);
  }, [setOpen]);

  const handleIpFamilyChange = useCallback((ipFamily: IPFamily) => {
    setSelectedIpFamily(ipFamily);
    setSelectedImage(undefined);
  }, []);

  let dialogContent: React.ReactNode | undefined = undefined;

  if (effectiveIpFamily) {
    dialogContent = (
      <ImageSelectionGrid
        ipFamily={effectiveIpFamily}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />
    );
  } else if (isLoading) {
    dialogContent = <PageLoading />;
  } else {
    dialogContent = (
      <EmptyStateBorder>
        <EmptyState
          title={error ? translate('Heading.GenericError') : translate('Heading.NoImagesAvailable')}
          description={
            error ? translate('Response.TryAgainLater') : translate('Description.UpdateIPLibrary')
          }
          size='small'
          illustration='oof'
        />
      </EmptyStateBorder>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='Medium'>
      <DialogTitle>
        <IpFamilySelectorTitle
          ipFamilies={ipFamilies}
          selectedIpFamily={effectiveIpFamily}
          onSelect={handleIpFamilyChange}
        />
      </DialogTitle>
      <DialogContent sx={{ maxHeight: '500px', overflowY: 'auto' }}>{dialogContent}</DialogContent>
      <DialogActions>
        <Grid container spacing={2}>
          <Grid item XSmall={6}>
            <Button
              onClick={() => {
                if (selectedImage) {
                  // Should always be the case since the button is disabled if selectedImage is undefined
                  onImageChosen(selectedImage);
                }
                onClose();
              }}
              color='primaryBrand'
              variant='contained'
              fullWidth
              disabled={!selectedImage}>
              {translate('Action.Select')}
            </Button>
          </Grid>
          <Grid item XSmall={6}>
            <Button onClick={onClose} color='secondary' variant='outlined' fullWidth>
              {translate('Label.Cancel')}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default ImageIPContentSelectorDialog;
