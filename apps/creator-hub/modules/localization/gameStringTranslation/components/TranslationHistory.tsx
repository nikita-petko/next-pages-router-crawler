import React, { FunctionComponent, Fragment } from 'react';
import { Link, Divider, Grid, List, Typography, ReportProblemOutlinedIcon } from '@rbx/ui';
import { useLocalization, useTranslation } from '@rbx/intl';
import { dateTimeFormatter } from '@rbx/core';
import { PageLoading, urls } from '@modules/miscellaneous/common';
import Panel from '../../common/components/Panel';
import { HistoryEntry } from '../types';
import useTranslationHistoryStyles from './TranslationHistory.styles';

export interface TranslationHistoryProps {
  error: Error | null;
  isLoading: boolean;
  entries: HistoryEntry[];
}

function localTime(time: string, userLocale: string) {
  const date = new Date(time);
  return dateTimeFormatter(userLocale).getFullDate(date);
}

const { www } = urls;

const TranslationHistory: FunctionComponent<React.PropsWithChildren<TranslationHistoryProps>> = ({
  error,
  entries,
  isLoading,
}) => {
  const {
    classes: {
      container,
      entry,
      text,
      divider,
      errorText,
      errorGrid,
      emptyText,
      link,
      grid,
      metadataContainter,
    },
  } = useTranslationHistoryStyles();
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  let content;
  if (isLoading) {
    content = <PageLoading />;
  } else if (error) {
    content = (
      <Grid className={errorGrid} container alignItems='center'>
        <ReportProblemOutlinedIcon fontSize='small' />
        <Typography className={errorText} variant='largeLabel2'>
          {translate('Message.FailedToFetchTranslationHistory')}
        </Typography>
      </Grid>
    );
  } else if (entries.length === 0) {
    content = (
      <Typography className={emptyText} variant='largeLabel2'>
        {translate('Label.NoTranslationHistory')}
      </Typography>
    );
  } else {
    content = (
      <List disablePadding>
        {entries.map(({ changeAgent, translation }) => {
          const time = translation.createdTime?.toString() ?? '';
          const translatorLink = www.getUserUrl(changeAgent?.changeAgentId ?? 0);
          const translatorName = changeAgent?.changeAgentName;
          return (
            <Fragment key={translatorLink + time}>
              <Grid container className={entry}>
                <Grid container className={metadataContainter}>
                  <Grid XSmall item>
                    {process.env.buildTarget === 'luobu' ? (
                      <Typography variant='largeLabel1'>{translatorName}</Typography>
                    ) : (
                      <Link className={link} href={translatorLink}>
                        <Typography variant='largeLabel1'>{translatorName}</Typography>
                      </Link>
                    )}
                  </Grid>
                  <Grid item>
                    <Typography variant='footer' className={text}>
                      {localTime(time, locale?.toString() ?? 'en')}
                    </Typography>
                  </Grid>
                </Grid>
                <Grid>
                  <Typography variant='largeLabel2' className={text}>
                    {translation.translationText}
                  </Typography>
                </Grid>
              </Grid>
              <Divider className={divider} />
            </Fragment>
          );
        })}
      </List>
    );
  }

  return (
    <Panel className={container} title={translate('Title.TranslationHistory')}>
      <Grid className={grid}>{content}</Grid>
    </Panel>
  );
};

export default TranslationHistory;
