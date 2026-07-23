import React, { useMemo } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Card, CardContent, Grid, Typography, useMediaQuery } from '@rbx/ui';
import { HttpControllerGetNotApprovedResponseViolation } from '@rbx/client-behavior-intervention/v1';
import {
  isPlatformElementValid,
  isValidatedPlatformEvidence,
} from '../../utils/platformEvidenceTypes';
import ImageWithProgress from './ImageWithProgress';

export type TModerationViolationProps = {
  violation?: HttpControllerGetNotApprovedResponseViolation;
  beginDate?: Date;
};

/**
 * Displays a box with the abuse type along with any evidence elements.
 * Based off of `ItemInfo` in
 * Roblox.ModerationPortal.WebApp/ts/react/pages/ViolationDetails/ItemInfo.tsx
 */
const ModerationViolation: React.FunctionComponent<TModerationViolationProps> = ({
  violation,
  beginDate,
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const dateFormatter = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale ?? Locale.English, {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    return formatter.format;
  }, [locale]);

  // This check should always pass but is needed to ensure evidence can be treated like PlatformEvidenceFullyTyped
  if (!violation?.evidence?.elements) {
    return null;
  }

  const validElements = violation.evidence.elements?.filter((element: object) => {
    return isPlatformElementValid(element);
  });
  const evidence = {
    ...violation.evidence,
    elements: validElements,
  };
  if (!isValidatedPlatformEvidence(evidence)) {
    return null;
  }

  return (
    <Card variant='outlined'>
      <CardContent>
        <Grid container spacing={3} direction={isSmallScreen ? 'column' : 'row'}>
          {evidence.elements?.map((elem) =>
            elem.type === 'image' ? (
              <Grid container item direction='column' key='violation-image' width='auto'>
                <ImageWithProgress url={elem.url} altLabelKey={elem.labelKey} />
              </Grid>
            ) : null,
          )}
          <Grid container item direction='column' spacing={2} width='auto'>
            {violation.abuseTypeTranslationKeys &&
              violation.abuseTypeTranslationKeys.length > 0 && (
                <Grid container item direction='column'>
                  <Typography variant='captionHeader'>{translate('Label.Violation')}</Typography>
                  <Typography variant='body2'>
                    {violation.abuseTypeTranslationKeys
                      .map((key) => translate(key) ?? translate('Label.AbuseType.Other'))
                      .join(', ')}
                  </Typography>
                </Grid>
              )}
            {evidence.elements?.map((elem) =>
              elem.type !== 'image' ? (
                <Grid container item direction='column' key={elem.text}>
                  {elem.labelKey && (
                    <Typography variant='captionHeader' className='text-secondary'>
                      {translate(elem.labelKey)}
                    </Typography>
                  )}
                  <Typography variant='body2'>{elem.text}</Typography>
                </Grid>
              ) : null,
            )}
            <Grid container item direction='column'>
              <Typography variant='captionHeader'>{translate('Label.ReviewDate')}</Typography>
              <Typography variant='body2'>{dateFormatter(beginDate)}</Typography>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ModerationViolation;
