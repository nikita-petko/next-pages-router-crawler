import React, { FC, useState, useCallback } from 'react';
import {
  Alert,
  AlertTitle,
  CloseIcon,
  Collapse,
  IconButton,
  makeStyles,
  useMediaQuery,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const useStyles = makeStyles()(() => ({
  alertContainer: {
    marginBottom: '16px',
  },
  alertTitle: {
    lineHeight: 'unset',
  },
  action: {
    paddingTop: 'unset',
    alignItems: 'center',
    flex: '0 0 fit-content',
  },
}));

type SpammyThumbnailAlertProps = {
  hasSpammyThumbnail: boolean;
};

const SpammyThumbnailAlert: FC<SpammyThumbnailAlertProps> = ({ hasSpammyThumbnail }) => {
  const {
    classes: { alertContainer, alertTitle, action },
  } = useStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { translate } = useTranslationWrapper(useTranslation());
  const [closed, setClosed] = useState(false);
  const close = useCallback(() => setClosed(true), []);

  return (
    <Collapse in={hasSpammyThumbnail && !closed}>
      <Alert
        classes={{ root: alertContainer, action }}
        severity='error'
        variant='outlined'
        action={
          isCompactView ? undefined : (
            <IconButton aria-label='' onClick={close} size='small' color='inherit'>
              <CloseIcon />
            </IconButton>
          )
        }>
        <AlertTitle classes={{ root: alertTitle }}>
          {translate(
            translationKey(
              'Description.ThumbnailPersonalizationWithSpammyThumbnail',
              TranslationNamespace.PlaceThumbnails,
            ),
          )}
        </AlertTitle>
      </Alert>
    </Collapse>
  );
};

export default SpammyThumbnailAlert;
