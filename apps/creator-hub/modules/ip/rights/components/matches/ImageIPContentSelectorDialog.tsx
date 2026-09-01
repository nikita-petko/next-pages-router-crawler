import { useCallback, useMemo, useState } from 'react';
import type { IPFamily } from '@rbx/client-rights/v1';
import {
  IPContentContentTypeEnum,
  IPContentStatusEnum,
  type IPContent,
} from '@rbx/client-rights/v1';
import { Dropdown, Button, Menu, MenuItem, MenuSection } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import {
  Grid,
  Button as RbxUIButton,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  makeStyles,
  CircularProgress,
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

// Override z-index to 1000 instead of 1300 default, since foundation-ui's dropdown
// has a z-index of 1050 and we want the dropdown on top of the dialog.
const DIALOG_Z_INDEX = 1000;

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
  const { translate, translateHTML } = useTranslation();

  const byId = useMemo(
    () => new Map(ipFamilies.map((ipFamily) => [ipFamily.id, ipFamily])),
    [ipFamilies],
  );

  const handleSelect = useCallback(
    (id: string) => {
      const ipFamily = byId.get(id);
      if (ipFamily !== undefined) {
        onSelect(ipFamily);
      }
    },
    [byId, onSelect],
  );

  const ipFamilySelector = (
    <div className='grow-1 min-width-0'>
      <Dropdown
        size='Large'
        className='width-full'
        placeholder={translate('Label.IpFamily')}
        value={selectedIpFamily?.id}
        onValueChange={handleSelect}>
        <Menu>
          <MenuSection>
            {ipFamilies.map((ipFamily) => (
              <MenuItem key={ipFamily.id} title={ipFamily.name ?? ''} value={ipFamily.id ?? ''} />
            ))}
          </MenuSection>
        </Menu>
      </Dropdown>
    </div>
  );

  return (
    <div className='flex items-center gap-small width-full'>
      {translateHTML('Heading.SelectImageFromIpFamily', null, {
        family: ipFamilySelector,
      })}
    </div>
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

  // Foundation UI Button component only works with text
  return (
    <Grid item XSmall={4} key={ipContent.id}>
      <RbxUIButton
        tabIndex={0}
        aria-checked={isSelected}
        className={`${classes.tile} ${classes.tileClickable} ${isSelected ? classes.tileSelected : ''}`}
        onClick={() => setSelectedImage(ipContent)}
        onDragStart={(event) => event.preventDefault()}>
        {thumbnail}
      </RbxUIButton>
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
    // Can't use a tailwind z-[1000] class since it doesn't exist at runtime.
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='Medium'
      style={{ zIndex: DIALOG_Z_INDEX }}>
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
              className='width-full'
              onClick={() => {
                if (selectedImage) {
                  // Should always be the case since the button is disabled if selectedImage is undefined
                  onImageChosen(selectedImage);
                }
                onClose();
              }}
              variant='Emphasis'
              size='Large'
              isDisabled={!selectedImage}>
              {translate('Action.Select')}
            </Button>
          </Grid>
          <Grid item XSmall={6}>
            <Button className='width-full' onClick={onClose} variant='Standard' size='Large'>
              {translate('Label.Cancel')}
            </Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default ImageIPContentSelectorDialog;
