import React, { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { Grid, Typography, Button } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { components, urls } from '@modules/miscellaneous/common';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import errorIllustrationDark from '@rbx/foundation-images/pictograms/alert_dark.svg';
import errorIllustrationLight from '@rbx/foundation-images/pictograms/alert_light.svg';
import { TranslationNamespace } from '../../localization';
import { errorCodeKeyDictionary } from '../constants/errorCodeKeyConstants';
import usePageNotFoundStyles from './PageNotFound.styles';

const { Flex, ThemedImage } = components;
const {
  creatorHub: { creatorStore },
} = urls;

const PageNotFound = () => {
  const { translate, translateHTML } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    classes: { description, background, button },
  } = usePageNotFoundStyles();
  const { asPath: pathname } = useRouter();
  const { headingKey, descriptionKey } = errorCodeKeyDictionary[StatusCodes.NOT_FOUND];
  const [productName, productLink] = useMemo(() => {
    if (pathname.startsWith('/store')) {
      return ['Label.CreatorStore', creatorStore.getUrl()];
    }
    if (pathname.startsWith('/talent')) {
      return ['Label.TalentHub', `${process.env.baseUrl}/talent`];
    }
    if (pathname.startsWith('/docs')) {
      return ['Label.Documentation', `${process.env.baseUrl}/docs`];
    }
    return ['Label.CreatorHub', '/'];
  }, [pathname]);

  useEffect(() => {
    unifiedLogger.logImpressionEvent({
      eventName: CreatorDashboardEventType.PageNotFound,
      parameters: {
        pathname,
        productName,
        productLink,
      },
    });
  }, [unifiedLogger, pathname, productName, productLink]);

  const handleReturnButtonClick = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: CreatorDashboardEventType.PageNotFoundReturnButtonClick,
      parameters: {
        pathname,
        productName,
        productLink,
      },
    });
  }, [unifiedLogger, pathname, productName, productLink]);

  return (
    <Grid container classes={{ root: background }} direction='column' alignItems='center'>
      <Grid container item justifyContent='center'>
        <ThemedImage
          lightSrc={errorIllustrationLight}
          darkSrc={errorIllustrationDark}
          alt='Error Illustration'
        />
      </Grid>
      <Flex flexDirection='column' alignItems='center'>
        <Typography variant='h4' align='center'>
          {translateHTML(descriptionKey)}
        </Typography>

        <Typography classes={{ root: description }} color='secondary' align='center'>
          {translateHTML(headingKey)}
        </Typography>

        <Button
          classes={{ root: button }}
          color='primary'
          href={productLink}
          variant='contained'
          onClick={handleReturnButtonClick}>
          {translate('Action.ReturnToProduct1', {
            productLink: translate(productName),
          })}
        </Button>
      </Flex>
    </Grid>
  );
};

export default withTranslation(PageNotFound, [TranslationNamespace.Error]);
