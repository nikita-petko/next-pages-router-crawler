import React, {
  Fragment,
  FunctionComponent,
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, Grid, Link, Typography, useSnackbar } from '@rbx/ui';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import { CreatorDetails, EntityDetails } from '../utils/types';

type TranslationFunction = ReturnType<typeof useTranslation>['translateHTML'];

type TranslationContextType = {
  translate: TranslationFunction;
  displayMessage: (msg: string) => void;
};

export type TranslationContextProps = {
  entity: EntityDetails;
  selectedCreator?: CreatorDetails;
};

const TranslationContextContext = createContext<TranslationContextType | null>(null);

const TranslationContextWithoutTranslation: FunctionComponent<
  PropsWithChildren<TranslationContextProps>
> = ({ children, entity, selectedCreator }) => {
  const { translateHTML }: { translateHTML: TranslationFunction } = useTranslation();
  const { enqueue: enqueueMessage, close: closeSnackbar } = useSnackbar();
  const { open: openStudio, dialog } = useStudio();

  const contextValue: TranslationContextType = useMemo(() => {
    const baseTags = [
      {
        opening: 'strongStart',
        closing: 'strongEnd',
        content(chunks: React.ReactNode) {
          return <strong>{chunks}</strong>;
        },
      },
      {
        opening: 'gridStart',
        closing: 'gridEnd',
        content(chunks: React.ReactNode) {
          return (
            <Grid container direction='row'>
              {chunks}
            </Grid>
          );
        },
      },
      {
        opening: 'contentStart',
        closing: 'contentEnd',
        content(chunks: React.ReactNode) {
          return (
            <Grid container direction='column' flex='1 1 0'>
              {chunks}
            </Grid>
          );
        },
      },
      {
        opening: 'actionStart',
        closing: 'actionEnd',
        content(chunks: React.ReactNode) {
          return <Grid flex='0 0 auto'>{chunks}</Grid>;
        },
      },
      {
        opening: 'headStart',
        closing: 'headEnd',
        content(chunks: React.ReactNode) {
          return <Typography variant='alertTitle'>{chunks}</Typography>;
        },
      },
      {
        opening: 'bodyStart',
        closing: 'bodyEnd',
        content(chunks: React.ReactNode) {
          return <Typography variant='body1'>{chunks}</Typography>;
        },
      },
      {
        opening: 'studioLinkStart',
        closing: 'studioLinkEnd',
        content(chunks: React.ReactNode) {
          return (
            <Button
              onClick={() =>
                openStudio({
                  task: EStudioTaskType.Default,
                })
              }>
              {chunks}
            </Button>
          );
        },
      },
      {
        opening: 'creatorLinkStart',
        closing: 'creatorLinkEnd',
        content(chunks: React.ReactNode) {
          return selectedCreator?.link ? (
            <Link href={selectedCreator?.link}>{chunks}</Link>
          ) : (
            <Fragment>{chunks}</Fragment>
          );
        },
      },
    ];

    const baseArgs = {
      entityName: entity.name,
      creatorName: selectedCreator?.name,
    };

    const newTranslateHTML: TranslationFunction = (key, tagsParam, argsParam = {}) => {
      const updatedTagsParam = [...baseTags, ...(tagsParam ?? [])];
      const updatedArgsParam = { ...baseArgs, ...argsParam };

      return (
        translateHTML(
          `${entity.type}.${selectedCreator?.type}.${key}`,
          updatedTagsParam,
          updatedArgsParam,
        ) ||
        translateHTML(`${entity.type}.${key}`, updatedTagsParam, updatedArgsParam) ||
        translateHTML(key, updatedTagsParam, updatedArgsParam)
      );
    };

    const displayMessage = (key: string) => {
      closeSnackbar();
      enqueueMessage({
        message: newTranslateHTML(key),
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
      });
    };

    return { translate: newTranslateHTML, displayMessage };
  }, [
    entity.name,
    entity.type,
    selectedCreator?.name,
    selectedCreator?.type,
    selectedCreator?.link,
    translateHTML,
    enqueueMessage,
    closeSnackbar,
    openStudio,
  ]);

  return (
    <TranslationContextContext.Provider value={contextValue}>
      {children}
      {dialog}
    </TranslationContextContext.Provider>
  );
};

export const TranslationContext = withTranslation(TranslationContextWithoutTranslation, [
  TranslationNamespace.Permissions,
  // for studio dialog translations
  TranslationNamespace.Home,
  // for generic error UIs
  TranslationNamespace.Error,
]);

export function useTranslationContext(): TranslationContextType {
  const translationContext = useContext(TranslationContextContext);
  if (!translationContext) {
    throw new Error('useTranslationContext must be used within a TranslationContextProvider');
  }
  return translationContext;
}
