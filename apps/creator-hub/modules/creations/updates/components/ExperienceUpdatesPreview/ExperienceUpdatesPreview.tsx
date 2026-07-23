import React, { FunctionComponent, useMemo, useRef, useCallback } from 'react';
import { useLocalization, useTranslation, Locale } from '@rbx/intl';
import { Grid, Typography, MoreVertIcon, FormHelperText } from '@rbx/ui';
import { PreviewType } from '../types';
import useExperienceUpdatesPreviewStyles from './ExperienceUpdatesPreview.styles';

export interface ExperienceUpdatesPreviewProps {
  experienceName: string;
  updateText: string;
}

const placeholderGameIcon = `${process.env.assetPathPrefix}/common/placeholder_game_icon.png`;

const ExperienceUpdatesPreview: FunctionComponent<
  React.PropsWithChildren<ExperienceUpdatesPreviewProps>
> = ({ experienceName, updateText }) => {
  const { translate } = useTranslation();
  const {
    classes: {
      previewContainer,
      previewSection,
      placeholderIconStyle,
      previewContent,
      desktopContent,
      tabletContent,
      phoneContent,
      timeText,
      experienceNameStyle,
      updateInfoContainer,
      updateTextContainer,
      playButton,
      moreButton,
      warningText,
    },

    cx,
  } = useExperienceUpdatesPreviewStyles();

  const previewMessageContainerRefs = useRef<Map<PreviewType, HTMLDivElement | null>>(new Map());

  const previewClassMap = useMemo(() => {
    return new Map([
      [PreviewType.Desktop, desktopContent],
      [PreviewType.Tablet, tabletContent],
      [PreviewType.Phone, phoneContent],
    ]);
  }, [desktopContent, tabletContent, phoneContent]);

  const { locale } = useLocalization();

  const timeString = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return formatter.format(new Date(Date.now()));
  }, [locale]);

  const checkIsMsgTruncated = useCallback((divElement: HTMLDivElement | null) => {
    if (divElement) {
      return (
        divElement.scrollHeight > divElement.clientHeight ||
        divElement.scrollWidth > divElement.clientWidth
      );
    }
    return false;
  }, []);

  const isPreviewTypeMsgTruncated = useMemo(
    () => ({
      [PreviewType.Desktop]: checkIsMsgTruncated(
        previewMessageContainerRefs.current.get(PreviewType.Desktop) ?? null,
      ),
      [PreviewType.Tablet]: checkIsMsgTruncated(
        previewMessageContainerRefs.current.get(PreviewType.Tablet) ?? null,
      ),
      [PreviewType.Phone]: checkIsMsgTruncated(
        previewMessageContainerRefs.current.get(PreviewType.Phone) ?? null,
      ),
    }),
    [previewMessageContainerRefs.current.size, checkIsMsgTruncated],
  );

  return (
    <Grid container item classes={{ root: previewContainer }} XSmall={12}>
      <Grid item XSmall={12}>
        <Typography variant='h2' component='h2'>
          {translate('Heading.Previews')}
        </Typography>
      </Grid>
      <Grid item XSmall={12} classes={{ root: previewSection }}>
        <Typography variant='body1'>{translate('Message.Previews')}</Typography>
      </Grid>
      <Grid item XSmall={12} XLarge={9}>
        {[PreviewType.Desktop, PreviewType.Tablet, PreviewType.Phone].map((type) => (
          <Grid
            key={`${type}Preview`}
            container
            direction='row'
            item
            XSmall={12}
            classes={{ root: previewSection }}>
            <Grid item XSmall={12}>
              <Typography variant='h3' component='h3'>
                {translate(`Heading.${type}`)}
              </Typography>
            </Grid>
            <div className={cx(previewClassMap.get(type), previewContent)}>
              <img className={placeholderIconStyle} src={placeholderGameIcon} alt='logo' />
              <div className={updateInfoContainer}>
                <div
                  className={updateTextContainer}
                  ref={(element) => {
                    previewMessageContainerRefs.current.set(type, element);
                  }}>
                  <span className={experienceNameStyle}>{experienceName}</span>
                  <span>{`: `}</span>
                  <span>{updateText}</span>
                </div>
                <div className={timeText}>{timeString}</div>
              </div>
              {type === PreviewType.Desktop ? (
                <button type='button' className={playButton}>
                  {translate('Label.Play')}
                </button>
              ) : (
                <MoreVertIcon classes={{ root: moreButton }} />
              )}
            </div>
            {isPreviewTypeMsgTruncated[type] && (
              <Grid item XSmall={12}>
                <FormHelperText classes={{ root: warningText }}>
                  {translate('Message.UpdateTruncated')}
                </FormHelperText>
              </Grid>
            )}
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default ExperienceUpdatesPreview;
