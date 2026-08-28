import type { ReactElement, ReactNode } from 'react';
import React, { Fragment } from 'react';
import { dateTimeFormatter } from '@rbx/core';
import { useLocalization, useTranslation } from '@rbx/intl';
import { Link, Divider, Grid, List, Typography, ReportProblemOutlinedIcon } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { www } from '@modules/miscellaneous/urls';
import Panel from '../../../common/components/Panel';
import useTranslationHistoryStyles from './TranslationHistory.styles';

// The generic shell only needs the change-agent metadata and a timestamp to render each record's
// header; the record body (translated text, an image thumbnail, …) is supplied via `renderContent`.
export interface BaseTranslationHistoryEntry {
  changeAgent: {
    changeAgentId?: number;
    changeAgentName?: string;
  };
  translation: {
    createdTime: Date | null;
  };
}

export interface TranslationHistoryProps<TEntry extends BaseTranslationHistoryEntry> {
  error: Error | null;
  isLoading: boolean;
  entries: TEntry[];
  // Renders the body of a single history record. Game strings render the translated text; other
  // surfaces (e.g. images) render their own representation such as a thumbnail.
  renderContent: (entry: TEntry) => ReactNode;
}

function localTime(time: string, userLocale: string) {
  const date = new Date(time);
  return dateTimeFormatter(userLocale).getFullDate(date);
}

const TranslationHistory = <TEntry extends BaseTranslationHistoryEntry>({
  error,
  entries,
  isLoading,
  renderContent,
}: TranslationHistoryProps<TEntry>): ReactElement => {
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
  const { translateWithNamespace } = useTranslation();
  const { locale } = useLocalization();

  let content;
  if (isLoading) {
    content = <PageLoading />;
  } else if (error) {
    content = (
      <Grid className={errorGrid} container alignItems='center'>
        <ReportProblemOutlinedIcon fontSize='small' />
        <Typography className={errorText} variant='largeLabel2'>
          {translateWithNamespace(
            TranslationNamespace.GameStringTranslation,
            'Message.FailedToFetchTranslationHistory',
          )}
        </Typography>
      </Grid>
    );
  } else if (entries.length === 0) {
    content = (
      <Typography className={emptyText} variant='largeLabel2'>
        {translateWithNamespace(
          TranslationNamespace.GameStringTranslation,
          'Label.NoTranslationHistory',
        )}
      </Typography>
    );
  } else {
    content = (
      <List disablePadding>
        {entries.map((historyEntry) => {
          const { changeAgent, translation } = historyEntry;
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
                <Grid>{renderContent(historyEntry)}</Grid>
              </Grid>
              <Divider className={divider} />
            </Fragment>
          );
        })}
      </List>
    );
  }

  return (
    <Panel
      className={container}
      title={translateWithNamespace(
        TranslationNamespace.GameStringTranslation,
        'Title.TranslationHistory',
      )}>
      <Grid className={grid}>{content}</Grid>
    </Panel>
  );
};

export default TranslationHistory;
