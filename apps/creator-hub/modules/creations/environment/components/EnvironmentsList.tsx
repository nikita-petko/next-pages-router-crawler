import React, { FunctionComponent, useState, useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import openCloudV2Client, { V2Protos } from '@modules/clients/openCloud';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/router';
import {
  useSnackbar,
  Grid,
  Typography,
  useMediaQuery,
  CircularProgress,
  Link,
  Button,
  IconButton,
  FileCopyOutlinedIcon,
  EditIcon,
  LockIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  Tooltip,
} from '@rbx/ui';
import { StatusCodes } from '@rbx/core';
import { useSettings } from '@modules/settings';
import { ErrorPage } from '@modules/miscellaneous/error';
import { useOverviewStyles } from '../../common';
import { isSpecialEnvironment } from '../utils/environmentUtils';

const EnvironmentsList: FunctionComponent = () => {
  const {
    classes: { overviewContainer },
  } = useOverviewStyles();

  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const { gameDetails: game, isLoadingGame, isErrorLoadingGame } = useCurrentGame();
  const [environments, setEnvironments] = useState<V2Protos.IEnvironment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showArchived = false;
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { settings } = useSettings();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const router = useRouter();

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      enqueue({
        message: translate('Message.CopiedToClipboard'),
        autoHide: true,
      });
    } catch {
      enqueue({
        message: translate('Error.CopyToClipboardFailed'),
        autoHide: true,
      });
    }
  };

  useEffect(() => {
    const fetchEnvironments = async () => {
      if (!game?.id) return;

      try {
        const response = openCloudV2Client.listEnvironments({
          parent: openCloudV2Client.universePath(game.id.toString()),
          filter: showArchived ? undefined : 'state == ACTIVE',
        });
        const iterator: AsyncIterator<V2Protos.IEnvironment> = response[Symbol.asyncIterator]();
        const allEnvironments: V2Protos.IEnvironment[] = [];

        const collectEnvironments = async () => {
          const { done, value } = await iterator.next();
          if (done) return;
          allEnvironments.push(value);
          await collectEnvironments();
        };

        await collectEnvironments();
        setEnvironments(allEnvironments);
      } catch (error) {
        if (error instanceof Error) {
          enqueue({
            message: error.message,
            autoHide: true,
          });
        } else {
          enqueue({
            message: translate('Error.EnvironmentsFetchFailed'),
            autoHide: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    (async () => {
      await fetchEnvironments();
    })();
  }, [game?.id, enqueue, translate, showArchived]);

  if (!settings.enableEnvironments) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  if (isLoadingGame === true) {
    return (
      <div className={overviewContainer}>
        <Grid container justifyContent='center' alignItems='center' style={{ minHeight: '200px' }}>
          <CircularProgress />
        </Grid>
      </div>
    );
  }

  if (isErrorLoadingGame === true) {
    return (
      <div className={overviewContainer}>
        <Typography variant='h6' color='error'>
          {translate('Error.GameLoadFailed')}
        </Typography>
      </div>
    );
  }

  if (!game?.id) {
    return (
      <div className={overviewContainer}>
        <Typography variant='h6' color='error'>
          {translate('Error.NoGameFound')}
        </Typography>
      </div>
    );
  }

  return (
    <div className={overviewContainer}>
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <Grid container alignItems='center' spacing={2}>
            <Grid item>
              <Typography variant={isCompactView ? 'h4' : 'h1'}>
                {translate('Heading.Environments')}
              </Typography>
            </Grid>
            <Grid item>
              <div
                style={{
                  height: '20px',
                  fontSize: '12px',
                  borderRadius: 'var(--Semantic-Radius-Smaller, 4px)',
                  backgroundColor: '#00145C',
                  color: '#ffffff',
                  padding: '0 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  lineHeight: '20px',
                }}>
                Early Preview
              </div>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <Typography variant='body1' color='secondary' component='div'>
            <ReactMarkdown>{translate('Body.FeatureExplanation')}</ReactMarkdown>
          </Typography>
        </Grid>
        <Grid item>
          <Grid
            container
            spacing={2}
            alignItems='center'
            justifyContent='space-between'
            sx={{ mb: 2 }}>
            <Grid item>
              <Button
                variant='contained'
                color='primaryBrand'
                size='large'
                onClick={() =>
                  router.push(
                    `/dashboard/creations/experiences/${game.id}/environments/new_environment`,
                  )
                }
                sx={{
                  borderRadius: 'var(--Semantic-Radius-Medium, 8px)',
                  backgroundColor: 'var(--Action-PrimaryBrand-Fill, #335FFF)',
                  '&:hover': {
                    backgroundColor: 'var(--Action-PrimaryBrand-Fill, #335FFF)',
                  },
                }}>
                {translate('Action.CreateEnvironment')}
              </Button>
            </Grid>
          </Grid>
        </Grid>

        {isLoading ? (
          <Grid
            container
            justifyContent='center'
            alignItems='center'
            style={{ minHeight: '200px' }}>
            <CircularProgress />
          </Grid>
        ) : (
          <Grid item sx={{ mt: 'var(--Semantic-Spacing-Medium, 16px)' }}>
            <TableContainer>
              <Table sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell width='30%'>{translate('Label.DisplayName')}</TableCell>
                    <TableCell width='40%'>{translate('Label.EnvironmentSlug')}</TableCell>
                    <TableCell width='25%'>{translate('Label.DateCreated')}</TableCell>
                    <TableCell width='5%' />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {environments
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((environment) => {
                      const configureUrl = `/dashboard/creations/experiences/${game.id}/environments/${environment.id}/configure`;

                      return (
                        <TableRow
                          key={environment.id}
                          sx={{
                            backgroundColor: (theme) => theme.palette.background.default,
                            '&:hover': {
                              backgroundColor: (theme) => theme.palette.action.hover,
                              '& .edit-icon': {
                                opacity: 1,
                              },
                              '& .copy-icon': {
                                opacity: 1,
                              },
                            },
                          }}>
                          <TableCell>{environment.displayName}</TableCell>
                          <TableCell>
                            <Grid container alignItems='center' spacing={1}>
                              <Grid item>{environment.slug}</Grid>
                              <Grid item>
                                <Tooltip title={translate('Action.CopySlug')}>
                                  <span>
                                    <IconButton
                                      size='medium'
                                      onClick={() => copyToClipboard(environment.slug!)}
                                      aria-label={translate('Action.CopySlug')}
                                      className='copy-icon'
                                      sx={{
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        backgroundColor: 'transparent',
                                        '&:hover': {
                                          opacity: 1,
                                          backgroundColor: 'transparent',
                                        },
                                        '& .MuiSvgIcon-root': {
                                          fontSize: '1.5rem',
                                          color: (theme) => theme.palette.grey[400],
                                        },
                                        '&:hover .MuiSvgIcon-root': {
                                          color: (theme) => theme.palette.common.white,
                                        },
                                      }}>
                                      <FileCopyOutlinedIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Grid>
                            </Grid>
                          </TableCell>
                          <TableCell>
                            {environment.createTime && Number(environment.createTime.seconds) > 0
                              ? new Date(
                                  Number(environment.createTime.seconds) * 1000,
                                ).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {isSpecialEnvironment(environment) ||
                            environment.state === 'ARCHIVED' ? (
                              <Tooltip
                                title={
                                  isSpecialEnvironment(environment)
                                    ? translate('Body.SpecialEnvironmentImmutable')
                                    : translate('Body.ArchivedEnvironmentImmutable')
                                }
                                disableInteractive>
                                <span>
                                  <IconButton
                                    size='medium'
                                    disabled
                                    className='edit-icon'
                                    aria-label={translate('Action.Configure')}
                                    sx={{
                                      opacity: 0,
                                      '&:hover': {
                                        backgroundColor: 'transparent',
                                      },
                                      '& .MuiSvgIcon-root': {
                                        fontSize: '1.5rem',
                                        color: (theme) => theme.palette.grey[400],
                                      },
                                    }}>
                                    <LockIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : (
                              <Link href={configureUrl} underline='none'>
                                <IconButton
                                  size='medium'
                                  className='edit-icon'
                                  aria-label={translate('Action.Configure')}
                                  sx={{
                                    opacity: 0,
                                    backgroundColor: (theme) => theme.palette.action.hover,
                                    '&:hover': {
                                      backgroundColor: (theme) => theme.palette.action.selected,
                                    },
                                    '& .MuiSvgIcon-root': {
                                      fontSize: '1.5rem',
                                      color: (theme) => theme.palette.common.white,
                                    },
                                  }}>
                                  <EditIcon />
                                </IconButton>
                              </Link>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      style={{
                        borderBottom: 'none',
                      }}
                      rowsPerPageOptions={[5, 10, 25]}
                      count={environments.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                  </TableRow>
                </TableFooter>
              </Table>
            </TableContainer>
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default EnvironmentsList;
