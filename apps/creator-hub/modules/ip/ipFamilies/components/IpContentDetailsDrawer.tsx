import {
  Button,
  CloseIcon,
  Container,
  Drawer,
  Divider,
  FormHelperText,
  Grid,
  IconButton,
  Typography,
  makeStyles,
  CircularProgress,
  Tooltip,
} from '@rbx/ui';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useLocalization, useTranslation } from '@rbx/intl';
import { useForm, Controller } from 'react-hook-form';
import {
  IPContent,
  IPContentContentTypeEnum,
  IPContentStatusEnum,
  IPContentStatusReasonEnum,
} from '@rbx/clients/rightsV1';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import IpContentStatusChip from './IpContentStatusChip';
import { getTranslationKeyFromLocale, LanguageCode } from '../utils/languages';
import getIpContentStatusReason from '../common/getIpContentStatusReason';
import LanguageSelect from './LanguageSelect';
import {
  getMaxLengthValidationRule,
  TextFieldWithEnhancedHelperText,
} from '../../components/TextFieldWithEnhancedHelperText';
import {
  MAX_IP_CONTENT_IMAGES,
  MAX_PRIMARY_KEYWORD_LENGTH,
  MAX_SECONDARY_KEYWORD_LENGTH,
  MAX_CITATION_LENGTH,
  MAX_IP_CONTENT_IMAGE_SIZE_MB,
} from '../constants';
import {
  useArchiveIpContentMutation,
  useListAllIpContentsByIpFamily,
  useUpdateIpContentMutation,
} from '../hooks/ipFamily';
import getApprovedPendingOrBlockedImages from '../common/getApprovedOrPendingImages';
import useIpSnackbar from '../../hooks/useIpSnackbar';
import { ImageAsset } from '../../utils/uploadImageAssetsIfNeeded';
import ImageBeforeUploadPreview from './ImageBeforeUploadPreview';
import validateIpContentImage from '../common/validateIpContentImage';
import canArchiveIpContent from '../common/canArchiveIpContent';

interface IpContentDetailsDrawerProps {
  ipContent: IPContent | null;
  defaultMode: IpContentDetailsMode;
  open: boolean;
  onClose: () => void;
}

const useStyles = makeStyles()(() => {
  const drawerContentHorizontalPadding = 20;
  return {
    drawerPaper: {
      position: 'fixed',
      top: '71.5px',
      right: '7.5px',
      bottom: '11.5px',
      width: `min(35vw, 600px)`,
      height: 'auto',
      border: 'unset',
      borderRadius: '16px',
    },
    drawer: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
    },

    drawerContent: {
      boxSizing: 'border-box',
      height: '100%',
      paddingTop: '24px',
      paddingLeft: `${drawerContentHorizontalPadding}px`,
      paddingRight: `${drawerContentHorizontalPadding}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    drawerFields: {
      flexGrow: 1,
      flexShrink: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      flexBasis: '0',
    },
    sectionDivider: {
      margin: '24px 0',
    },
    drawerBottomDivider: {
      marginTop: '0',
      marginBottom: '20px',
    },
    drawerBottomSection: {
      paddingBottom: '20px',
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: 'auto',
    },
    drawerTitle: {
      marginTop: '16px',
      padding: `0 ${drawerContentHorizontalPadding}px`,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fieldLabel: {
      marginBottom: '8px',
      fontWeight: 700,
      display: 'block',
    },
    imageContainer: {
      width: '116px',
      height: '116px',
      overflow: 'hidden',
      borderRadius: '8px',
    },
    thumbnailContainer: {
      display: 'block',
      borderRadius: '4px',
    },
    imageUploadContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      width: '100%',
      height: '100%',
      borderRadius: '8px',
      gap: '16px',
    },
    replacedImageContainer: {
      flexShrink: 0,
      flexBasis: 'auto',
    },
    imageReplaceControl: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      width: '100%',
      gap: '4px',
    },
    imageError: {
      marginTop: '10px',
    },
    drawerBottomButton: {
      minWidth: 'auto',
      padding: '4px 12px',
    },
    thumbnailImg: {
      objectFit: 'cover',
      width: '100%',
      height: '100%',
    },
    editDescription: {
      marginBottom: '24px',
    },
    bottomDivider: {
      margin: '20px 0 20px',
    },
    blockDisplay: {
      display: 'block',
    },
    fullWidth: {
      width: '100%',
    },
    archiveMessage: {
      marginTop: '16px',
    },
  };
});

type IpContentDetailsMode = 'view' | 'edit' | 'archive';

interface IpContentDisplayProps {
  ipContent: IPContent;
}

const IpContentDisplay: FunctionComponent<IpContentDisplayProps> = ({ ipContent }) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();

  if (!ipContent.contentValue) {
    return <div />;
  }
  switch (ipContent.contentType) {
    case IPContentContentTypeEnum.Text:
      return (
        <Typography variant='body2' sx={{ display: 'block' }}>
          {ipContent.contentValue}
        </Typography>
      );

    case IPContentContentTypeEnum.Image:
      return (
        <div className={classes.imageContainer}>
          <Thumbnail2d
            targetId={parseInt(ipContent.contentValue, 10)}
            type={ThumbnailTypes.assetThumbnail}
            alt={translate('Label.IpContentThumbnail')}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground={false}
            containerClass={classes.thumbnailContainer}
            imgClassName={classes.thumbnailImg}
            // eslint-disable-next-line no-underscore-dangle -- external enum
            size={AssetThumbnailSize._150x150}
          />
        </div>
      );
    default:
      return <div />;
  }
};

interface ViewIpContentDetailsProps {
  ipContent: IPContent;
  onEdit: () => void;
  onArchive: () => void;
}

const ViewIpContentDetails = ({ ipContent, onEdit, onArchive }: ViewIpContentDetailsProps) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { locale } = useLocalization();
  const ipContentsReq = useListAllIpContentsByIpFamily({
    ipFamilyId: ipContent.ipFamilyId ?? '',
    pageSize: 500,
  });
  const approvedPendingOrBlockedImagesCount = getApprovedPendingOrBlockedImages(
    ipContentsReq.data?.ipContents || [],
  ).length;

  const localeDefault = locale ?? 'en-US';
  const maxImagesLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(MAX_IP_CONTENT_IMAGES);

  const getIpContentTypeText = (): string => {
    switch (ipContent.contentType) {
      case IPContentContentTypeEnum.Text:
        return translate(ipContent.isPrimary ? 'Label.PrimaryKeyword' : 'Label.SecondaryKeyword');
      case IPContentContentTypeEnum.Image:
        return translate('Label.Image');
      default:
        return '';
    }
  };

  const getLocaleText = (): string => {
    switch (ipContent.contentType) {
      case IPContentContentTypeEnum.Text:
        return ipContent.locale
          ? translate(getTranslationKeyFromLocale(ipContent.locale as LanguageCode))
          : '';
      case IPContentContentTypeEnum.Image:
        return translate('Label.NotApplicable');
      default:
        return '';
    }
  };

  if (!ipContentsReq.data) {
    return <CircularProgress />;
  }

  let editButton = null;
  if (ipContent.status === IPContentStatusEnum.Rejected) {
    if (approvedPendingOrBlockedImagesCount < MAX_IP_CONTENT_IMAGES) {
      editButton = (
        <Button
          variant='contained'
          color='secondary'
          fullWidth
          onClick={onEdit}
          className={classes.drawerBottomButton}>
          {translate('Action.Edit')}
        </Button>
      );
    } else {
      editButton = (
        <Tooltip
          title={translate('Error.UploadMediaDisabled', {
            maxLimit: maxImagesLocalized,
          })}>
          <Button
            variant='contained'
            color='secondary'
            fullWidth
            disabled
            className={classes.drawerBottomButton}>
            {translate('Action.Edit')}
          </Button>
        </Tooltip>
      );
    }
  }

  let archiveButton = null;
  if (canArchiveIpContent(ipContent)) {
    archiveButton = (
      <Button
        variant='contained'
        color='secondary'
        fullWidth
        onClick={onArchive}
        className={classes.drawerBottomButton}>
        {translate('Action.Archive')}
      </Button>
    );
  }

  let buttonsCount = 0;
  if (editButton) {
    buttonsCount += 1;
  }
  if (archiveButton) {
    buttonsCount += 1;
  }

  return (
    <div className={classes.drawerContent}>
      <div className={classes.drawerFields}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Typography variant='body1' className={classes.fieldLabel}>
              {translate('Label.IP')}
            </Typography>

            <IpContentDisplay ipContent={ipContent} />
          </Grid>

          <Grid item>
            <Typography variant='body2' className={classes.fieldLabel}>
              {translate('Label.Status')}
            </Typography>
            <IpContentStatusChip status={ipContent.status} />
          </Grid>

          {ipContent.status === IPContentStatusEnum.Rejected && ipContent.statusReason && (
            <Grid item>
              <Typography variant='body2' className={classes.fieldLabel}>
                {translate('Label.RejectionReason')}
              </Typography>
              <Typography variant='body2'>
                {getIpContentStatusReason(
                  ipContent.statusReason as IPContentStatusReasonEnum,
                  ipContent,
                  translate,
                )}
              </Typography>
            </Grid>
          )}

          <Grid item>
            <Typography variant='body2' className={classes.fieldLabel}>
              {translate('Label.Type')}
            </Typography>
            <Typography variant='body2' className={classes.blockDisplay}>
              {getIpContentTypeText()}
            </Typography>
          </Grid>
          {ipContent.contentType === IPContentContentTypeEnum.Text && (
            <Grid item>
              <Typography variant='body2' className={classes.fieldLabel}>
                {translate('Label.Locale')}
              </Typography>
              <Typography variant='body2' className={classes.blockDisplay}>
                {getLocaleText()}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Divider className={classes.sectionDivider} />

        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Typography variant='body2' className={classes.fieldLabel}>
              {translate('Label.Citation')}
            </Typography>
            <Typography variant='body2' className={classes.blockDisplay}>
              {ipContent.citation || translate('Label.NA')}
            </Typography>
          </Grid>
        </Grid>

        <Divider className={classes.sectionDivider} />

        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Typography variant='body2' className={classes.fieldLabel}>
              {translate('Label.LastUpdated')}
            </Typography>
            <Typography variant='body2' className={classes.blockDisplay}>
              {ipContent.updatedAt
                ? new Intl.DateTimeFormat(localeDefault).format(ipContent.updatedAt)
                : ''}
            </Typography>
          </Grid>
        </Grid>
      </div>
      {buttonsCount > 0 && (
        <div className={classes.drawerBottomSection}>
          <Divider className={classes.drawerBottomDivider} />
          <Grid container direction='row' spacing={2} className={classes.fullWidth}>
            {editButton && (
              <Grid item XSmall={6}>
                {editButton}
              </Grid>
            )}
            {archiveButton && (
              <Grid item XSmall={6}>
                {archiveButton}
              </Grid>
            )}
          </Grid>
        </div>
      )}
    </div>
  );
};

interface EditIpContentForm {
  image: ImageAsset;
  contentValue: string;
  locale: string;
  citation: string;
}

const EditIpContentDetails = ({
  ipContent,
  onSubmitSuccess,
  onCancel,
}: {
  ipContent: IPContent;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { locale } = useLocalization();

  const { control, setValue, handleSubmit } = useForm<EditIpContentForm>({
    defaultValues: {
      image: { type: 'existing', assetId: parseInt(ipContent.contentValue ?? '0', 10) },
      contentValue: ipContent.contentValue || '',
      locale: ipContent.locale || '',
      citation: ipContent.citation || '',
    },
  });
  const ipContentsReq = useListAllIpContentsByIpFamily({
    ipFamilyId: ipContent.ipFamilyId ?? '',
    pageSize: 500,
  });
  const localeDefault = locale ?? 'en-US';
  const maxIpContentImageSizeMBLocalized = new Intl.NumberFormat(localeDefault, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(MAX_IP_CONTENT_IMAGE_SIZE_MB);

  const { enqueueErrorSnackbar } = useIpSnackbar();

  const updateIpContentMutation = useUpdateIpContentMutation();
  const isSubmitting = updateIpContentMutation.isPending;

  const handleSave = async (data: EditIpContentForm) => {
    let updateBody;
    switch (ipContent.contentType) {
      case IPContentContentTypeEnum.Text:
        updateBody = {
          type: 'text' as const,
          text: data.contentValue,
          locale: data.locale,
          citation: data.citation,
        };
        break;
      case IPContentContentTypeEnum.Image:
        updateBody = {
          type: 'image' as const,
          image: data.image,
          citation: data.citation,
        };
        break;
      default:
        ipContent.contentType satisfies undefined;
        return;
    }
    updateIpContentMutation.mutate(
      {
        ipContentId: ipContent.id ?? '',
        ipContent,
        ...updateBody,
      },
      {
        onSuccess: () => {
          onSubmitSuccess();
        },
        onError: () => {
          enqueueErrorSnackbar();
        },
      },
    );
  };

  if (!ipContentsReq.data) {
    return <CircularProgress />;
  }

  return (
    <form className={classes.drawerContent} onSubmit={handleSubmit(handleSave)}>
      <div className={classes.drawerFields}>
        <Typography
          variant='body1'
          component='p'
          color='secondary'
          className={classes.editDescription}>
          {translate('Description.IpFamilySubmission')}
        </Typography>
        <Grid container direction='column' spacing={2}>
          {ipContent.contentType === IPContentContentTypeEnum.Text && (
            <React.Fragment>
              <Grid item>
                <Controller
                  name='contentValue'
                  control={control}
                  rules={{
                    required: translate('Label.FieldIsRequired'),
                    validate: getMaxLengthValidationRule(
                      ipContent.isPrimary
                        ? MAX_PRIMARY_KEYWORD_LENGTH
                        : MAX_SECONDARY_KEYWORD_LENGTH,
                      translate,
                    ),
                  }}
                  render={({ field, fieldState }) => (
                    <TextFieldWithEnhancedHelperText
                      {...field}
                      id='ip-content-value'
                      label={translate(
                        ipContent.isPrimary ? 'Label.PrimaryKeyword' : 'Label.SecondaryKeyword',
                      )}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      maxLength={
                        ipContent.isPrimary
                          ? MAX_PRIMARY_KEYWORD_LENGTH
                          : MAX_SECONDARY_KEYWORD_LENGTH
                      }
                      fullWidth
                      disabled={isSubmitting}
                      showCharacterCount
                    />
                  )}
                />
              </Grid>

              <Grid item>
                <Controller
                  name='locale'
                  control={control}
                  rules={{
                    required: translate('Label.FieldIsRequired'),
                    validate: (value) => {
                      const hasConflictingPrimary = ipContentsReq.data.ipContents.find(
                        (item) =>
                          item.isPrimary && item.locale === value && item.id !== ipContent.id,
                      );
                      if (hasConflictingPrimary) {
                        return translate('Error.PrimaryKeywordExists');
                      }
                      return true;
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <LanguageSelect
                      value={field.value}
                      onChange={field.onChange}
                      label={translate('Label.Locale')}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      disabled={isSubmitting}
                    />
                  )}
                />
              </Grid>
            </React.Fragment>
          )}

          {ipContent.contentType === IPContentContentTypeEnum.Image && (
            <Grid item>
              <Controller
                name='image'
                control={control}
                rules={{
                  validate: async (image) => {
                    if (image.type !== 'new') {
                      return true;
                    }
                    const validationMessage = await validateIpContentImage(
                      image.file,
                      translate,
                      localeDefault,
                    );
                    return validationMessage || true;
                  },
                }}
                render={({ field, fieldState }) => (
                  <React.Fragment>
                    <div className={classes.imageUploadContainer}>
                      <div
                        className={`${classes.imageContainer} ${classes.replacedImageContainer}`}>
                        {field.value?.type === 'existing' && (
                          <Thumbnail2d
                            targetId={field.value.assetId}
                            type={ThumbnailTypes.assetThumbnail}
                            alt={translate('Label.IpContentThumbnail')}
                            returnPolicy={ReturnPolicy.PlaceHolder}
                            includeBackground={false}
                            containerClass={classes.thumbnailContainer}
                            imgClassName={classes.thumbnailImg}
                            // eslint-disable-next-line no-underscore-dangle -- external enum
                            size={AssetThumbnailSize._150x150}
                          />
                        )}
                        {field.value?.type === 'new' && (
                          <ImageBeforeUploadPreview
                            file={field.value.file}
                            className={classes.thumbnailImg}
                          />
                        )}
                      </div>
                      <div className={classes.imageReplaceControl}>
                        <Button
                          variant='outlined'
                          component='label'
                          color='primary'
                          size='small'
                          disabled={isSubmitting}>
                          {translate('Action.Replace')}
                          <input
                            type='file'
                            hidden
                            accept='image/png, image/jpeg'
                            aria-label={translate('Action.Replace')}
                            aria-describedby='image-errors'
                            disabled={isSubmitting}
                            onChange={(event) => {
                              if (event.target.files?.[0]) {
                                setValue(
                                  'image',
                                  { type: 'new', file: event.target.files[0] },
                                  { shouldValidate: true },
                                );
                              }
                            }}
                          />
                        </Button>
                        <FormHelperText>
                          {translate('Label.IpContentImageRestrictions2', {
                            maxSize: maxIpContentImageSizeMBLocalized,
                          })}
                        </FormHelperText>
                      </div>
                    </div>
                    {fieldState.error && (
                      <FormHelperText id='image-errors' error className={classes.imageError}>
                        {fieldState.error.message}
                      </FormHelperText>
                    )}
                  </React.Fragment>
                )}
              />
            </Grid>
          )}
        </Grid>

        <Divider className={classes.sectionDivider} />

        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Controller
              name='citation'
              control={control}
              rules={{
                required: translate('Label.FieldIsRequired'),
                validate: getMaxLengthValidationRule(150, translate),
              }}
              render={({ field, fieldState }) => (
                <TextFieldWithEnhancedHelperText
                  {...field}
                  id='ip-content-citation'
                  label={translate('Label.Citation')}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                  multiline
                  placeholder={translate('Label.NA')}
                  maxLength={MAX_CITATION_LENGTH}
                  disabled={isSubmitting}
                  showCharacterCount
                />
              )}
            />
          </Grid>
        </Grid>
      </div>

      <div className={classes.drawerBottomSection}>
        <Divider className={classes.drawerBottomDivider} />
        <Grid container direction='row' spacing={2}>
          <Grid item XSmall={6}>
            <Button
              variant='contained'
              color='primaryBrand'
              fullWidth
              type='submit'
              loading={isSubmitting}
              disabled={isSubmitting}
              className={classes.drawerBottomButton}>
              {translate('Action.ReSubmit')}
            </Button>
          </Grid>
          <Grid item XSmall={6}>
            <Button
              variant='contained'
              color='primary'
              onClick={onCancel}
              fullWidth
              disabled={isSubmitting}
              className={classes.drawerBottomButton}>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
          {/* Buttons will be added here later */}
        </Grid>
      </div>
    </form>
  );
};

const ArchiveIpContentDetails = ({
  ipContent,
  onArchiveSuccess,
  onCancel,
}: {
  ipContent: IPContent;
  onArchiveSuccess: () => void;
  onCancel: () => void;
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const archiveIpContentMutation = useArchiveIpContentMutation();
  const { enqueueErrorSnackbar } = useIpSnackbar();

  const isSubmitting = archiveIpContentMutation.isPending;
  const handleArchive = async () => {
    archiveIpContentMutation.mutate(
      { ipContentId: ipContent.id ?? '' },
      {
        onSuccess: () => {
          onArchiveSuccess();
        },
        onError: () => {
          enqueueErrorSnackbar();
        },
      },
    );
  };

  let archiveMessage;
  switch (ipContent.contentType) {
    case IPContentContentTypeEnum.Image:
      archiveMessage = translate('Description.ArchiveImage');
      break;
    case IPContentContentTypeEnum.Text:
      archiveMessage = translate('Description.ArchiveKeyword');
      break;
    default:
      ipContent.contentType satisfies undefined;
  }

  return (
    <div className={classes.drawerContent}>
      <div className={classes.drawerFields}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Typography variant='body1' className={classes.fieldLabel}>
              {translate('Label.IP')}
            </Typography>

            <IpContentDisplay ipContent={ipContent} />
          </Grid>
        </Grid>
        <Divider className={classes.sectionDivider} />

        <Typography variant='body1'>{archiveMessage}</Typography>
      </div>

      <div className={classes.drawerBottomSection}>
        <Divider className={classes.drawerBottomDivider} />
        <Grid container direction='row' spacing={2}>
          <Grid item XSmall={6}>
            <Button
              variant='contained'
              color='primaryBrand'
              fullWidth
              onClick={handleArchive}
              disabled={isSubmitting}
              className={classes.drawerBottomButton}>
              {translate('Action.Archive')}
            </Button>
          </Grid>
          <Grid item XSmall={6}>
            <Button
              variant='contained'
              color='primary'
              disabled={isSubmitting}
              onClick={onCancel}
              fullWidth
              className={classes.drawerBottomButton}>
              {translate('Action.Cancel')}
            </Button>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

const IpContentDetailsDrawer: FunctionComponent<IpContentDetailsDrawerProps> = ({
  ipContent,
  defaultMode,
  open,
  onClose,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const [mode, setMode] = useState<IpContentDetailsMode>(defaultMode);

  useEffect(() => {
    if (open) {
      setMode(defaultMode);
    }
  }, [open, defaultMode]);

  if (!ipContent) {
    return null;
  }
  const handleClose = () => {
    setMode('view');
    onClose();
  };

  let title = '';
  let content = null;
  switch (mode) {
    case 'view':
      title = translate('Header.ViewIp');
      content = (
        <ViewIpContentDetails
          ipContent={ipContent}
          onEdit={() => setMode('edit')}
          onArchive={() => setMode('archive')}
        />
      );
      break;
    case 'edit':
      title = translate('Header.EditIp');
      content = (
        <EditIpContentDetails
          ipContent={ipContent}
          onSubmitSuccess={handleClose}
          onCancel={() => setMode('view')}
        />
      );
      break;
    case 'archive':
      title = translate('Header.ArchiveIp');
      content = (
        <ArchiveIpContentDetails
          ipContent={ipContent}
          onArchiveSuccess={handleClose}
          onCancel={() => setMode('view')}
        />
      );
      break;
    default:
      mode satisfies never;
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      anchor='right'
      PaperProps={{
        className: classes.drawerPaper,
      }}>
      <Container className={classes.drawer}>
        <Grid container className={classes.drawerTitle}>
          <Typography variant='h5'>{title}</Typography>
          <IconButton onClick={handleClose} color='inherit' aria-label={translate('Action.Close')}>
            <CloseIcon />
          </IconButton>
        </Grid>
        {content}
      </Container>
    </Drawer>
  );
};

export default IpContentDetailsDrawer;
