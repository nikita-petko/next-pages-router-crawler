import type { FunctionComponent } from 'react';
import React, { Fragment, useState, useEffect } from 'react';
import _sodium from 'libsodium-wrappers';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import type { TTableSortLabelProps } from '@rbx/ui';
import {
  EditOutlinedIcon,
  DeleteOutlinedIcon,
  Tooltip,
  Grid,
  CircularProgress,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  TablePagination,
  Divider,
  Button,
  TableSortLabel,
  useDialog,
  AddIcon,
  Link,
} from '@rbx/ui';
import type { Secret } from '@modules/clients/secrets';
import secretsClient from '@modules/clients/secrets';
import { EmptyState } from '@modules/miscellaneous/components';
import { useUniversePermissions } from '@modules/react-query/organizations/organizationsQueries';
import {
  MAX_SECRETS,
  SECRETS_TABLE_ROWS_PER_PAGE_OPTIONS,
  DEFAULT_SECRETS_TABLE_ROWS_PER_PAGE,
} from '../constants/SecretsConstants';
import DeleteSecretDialog from './DeleteSecret';
import type { ApiError } from './EditSecret';
import EditSecretDialog, { formatError } from './EditSecret';
import useSecretsTableStyles from './SecretsTable.styles';

type Order = TTableSortLabelProps['direction'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- There is no single root for exceptions
async function translateError(err: any): Promise<ApiError> {
  if ('response' in err) {
    const response = err.response as Response;
    try {
      const body = await response.json();
      // may have "body" and "title" - but may also NOT have any of it
      let detail = '';
      if (body.title) {
        detail = `${detail} ${body.title}`;
      }
      if (body.detail) {
        detail = `${detail} (${body.detail})`;
      }
      const args = { url: response.url, code: response.status.toString() };
      return {
        template: 'Tooltip.HttpError',
        args,
        code: response.status,
        detail,
        field: body.field,
      };
    } catch {
      // no response body, or failed to receive it. Report whatever we have.
      const args = { url: response.url, code: response.status.toString() };
      return { template: 'Tooltip.HttpError', args, code: response.status };
    }
  } else if (err instanceof Error) {
    // likely, failed to send the request - so have no HTTP status
    return { template: 'Description.UnexpectedError', detail: err.toString() };
  } else {
    return { template: 'Description.UnexpectedError' };
  }
}

async function encryptSecret(
  universeId: number,
  plaintext: string,
): Promise<{ keyId: string; encrypted: string }> {
  await _sodium.ready;
  const { from_base64, to_base64, from_string, base64_variants, crypto_box_seal } = _sodium;

  const pubKey = await secretsClient.getPublicKey(universeId);
  // The check below is made to pacify type checker. Roots of this problem is
  // in EaaS that does not allow to add a non-nullable field to the schema, hence
  // we have to mark it nullable, and sprinkle useless non-null checks everywhere.
  if (pubKey.secret == null || pubKey.keyId == null) {
    throw new Error('Public key or key identifier is null');
  }
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  const binkey = from_base64(pubKey.secret, base64_variants.ORIGINAL);
  const binsec = from_string(plaintext);
  // Encrypt the secret using libsodium
  const encBytes = crypto_box_seal(binsec, binkey);
  // Convert the encrypted Uint8Array to Base64
  // NOTE (jcountryman, 2/6/24): Turned off to check in @rbx/ui upgrade. Codeowners is
  // responsible for triaging issue.
  const encrypted = to_base64(encBytes, base64_variants.ORIGINAL);
  return { keyId: pubKey.keyId, encrypted };
}

const linkContent = (href: string) => ({
  opening: 'linkStart',
  closing: 'linkEnd',
  content(chunks: React.ReactNode) {
    return <Link href={href}>{chunks}</Link>;
  },
});

export interface SecretsTableProps {
  universeId: number;
}

const SecretsTable: FunctionComponent<React.PropsWithChildren<SecretsTableProps>> = ({
  universeId,
}) => {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [hasError, setHasError] = useState<ApiError | null>(null);
  const { translate, translateHTML } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(DEFAULT_SECRETS_TABLE_ROWS_PER_PAGE);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Secret>('updateTime');
  // Currently, createSecrets, editSecrets, and deleteSecrets always share the same value because
  // they are granted together as a single permission. Therefore, using permissions?.createSecrets
  // to control UI visibility is sufficient for now.
  // In the future, if these permissions becomes separated, we should update this code to:
  // - Use permissions?.createSecrets to show/hide the "Create Secret" button,
  // - Use permissions?.editSecrets to show/hide the "Edit" button,
  // - Use permissions?.deleteSecrets to show/hide the "Delete" button.
  const { data: permissions } = useUniversePermissions(universeId);
  const canManageSecrets = permissions?.createSecrets;

  const {
    classes: {
      pagination,
      paginationToolbar,
      createButton,
      actionsCell,
      emptyTextContainer,
      titleDescription,
      namesColumn,
      domainColumn,
      timesColumn,
    },
  } = useSecretsTableStyles();

  const headCells = [
    {
      id: 'id' as keyof Secret,
      label: translate('Label.Id'),
      class: namesColumn,
      isSortable: true,
    },
    {
      id: 'domain' as keyof Secret,
      label: translate('Label.Domain'),
      class: domainColumn,
      isSortable: true,
    },
    {
      id: 'createTime' as keyof Secret,
      label: translate('Label.Created'),
      class: timesColumn,
      isSortable: true,
    },
    {
      id: 'updateTime' as keyof Secret,
      label: translate('Label.LastUpdated'),
      class: timesColumn,
      isSortable: true,
    },
  ];

  const handleRequestSort = (property: keyof Secret) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedData = secrets.sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    if (aValue && bValue) {
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue > bValue ? -1 : 1;
    }
    return -1;
  });

  useEffect(() => {
    async function loadSecrets() {
      setIsLoading(true);
      try {
        const listed = await secretsClient.list(universeId, MAX_SECRETS);
        if (listed?.secrets) {
          setSecrets(listed.secrets);
        }
        setHasError(null);
      } catch (error) {
        setHasError(await translateError(error));
      }
      setIsLoading(false);
    }

    loadSecrets();
  }, [universeId]);

  const { open, close, configure } = useDialog();

  const onCreateSecret = () => {
    configure(
      <EditSecretDialog
        id={undefined}
        domain='*'
        translate={translate}
        translateHTML={translateHTML}
        confirmSecret={async (id, secret, domain) => {
          try {
            const { keyId, encrypted } = await encryptSecret(universeId, secret);
            const newSecret = await secretsClient.create(universeId, id, domain, encrypted, keyId);
            newSecret.domain = domain;
            setSecrets([...secrets, newSecret]);
            return null;
          } catch (err) {
            return translateError(err);
          }
        }}
        close={close}
      />,
      { maxWidth: 'Medium', fullWidth: true },
    );
    open();
  };

  const onEditSecret = (id: string | undefined, domain: string | undefined) => {
    configure(
      <EditSecretDialog
        id={id}
        domain={domain}
        translate={translate}
        translateHTML={translateHTML}
        confirmSecret={async (secretId, secret, dom) => {
          try {
            const { keyId, encrypted } = await encryptSecret(universeId, secret);
            const updatedSecret = await secretsClient.update(
              universeId,
              secretId,
              dom,
              encrypted,
              keyId,
            );
            setSecrets(
              secrets.map((currentSecret: Secret) => {
                const s: Secret = { ...currentSecret };
                if (s.id === secretId) {
                  s.domain = dom;
                  s.updateTime = updatedSecret.updateTime;
                }

                return s;
              }),
            );
            return null;
          } catch (err) {
            return translateError(err);
          }
        }}
        close={close}
      />,
      { maxWidth: 'Medium', fullWidth: true },
    );
    open();
  };

  const OnDeleteSecret = (id: string) => {
    configure(
      <DeleteSecretDialog
        id={id}
        translate={translate}
        deleteSecret={async () => {
          try {
            await secretsClient.delete(universeId, id);
            setSecrets(secrets.filter((secret) => secret.id !== id));
            return null;
          } catch (error) {
            return translateError(error);
          }
        }}
        close={close}
      />,
      { maxWidth: 'Medium', fullWidth: true },
    );
    open();
  };

  if (isLoading) {
    return (
      <Grid container alignItems='center' justifyContent='center'>
        <CircularProgress />
      </Grid>
    );
  }

  const createBtn = (
    <Tooltip title={translate('Tooltip.CreateSecret')}>
      <Button onClick={onCreateSecret} size='large' variant='contained' className={createButton}>
        {translate('Button.CreateSecret')}
      </Button>
    </Tooltip>
  );

  return (
    <Grid container direction='column'>
      {!canManageSecrets && (
        <Typography variant='body1' color='secondary' className={titleDescription}>
          {translate('Message.ReadOnlyAccess')}
        </Typography>
      )}
      {hasError ? (
        // failed state
        <Tooltip title={formatError(hasError, translate)}>
          <Typography className={emptyTextContainer}>
            {translate(
              hasError.code === 403 ? 'Message.ErrorAccessDenied' : 'Message.ErrorLoading',
            )}
          </Typography>
        </Tooltip>
      ) : secrets.length === 0 ? (
        // empty table state
        <EmptyState
          title={translate('Header.NoSecrets')}
          description={
            <Typography>
              {translateHTML('Description.NoSecrets', [
                linkContent(
                  `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/reference/engine/datatypes/Secret`,
                ),
              ])}
            </Typography>
          }
          size='large'
          illustration='secrets'>
          {canManageSecrets && (
            <Button
              onClick={onCreateSecret}
              color='primary'
              size='large'
              variant='contained'
              startIcon={<AddIcon />}>
              {translate('Button.CreateSecret')}
            </Button>
          )}
        </EmptyState>
      ) : (
        // non-empty table state
        <>
          {canManageSecrets && <span>{createBtn}</span>}
          <Divider orientation='horizontal' />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {headCells.map((row) => (
                    <TableCell className={row.class} align='left' key={row.id}>
                      {row.isSortable ? (
                        <TableSortLabel
                          active={orderBy === row.id}
                          direction={orderBy === row.id ? order : 'asc'}
                          onClick={() => handleRequestSort(row.id)}>
                          {row.label}
                        </TableSortLabel>
                      ) : (
                        <Fragment>{row.label}</Fragment>
                      )}
                    </TableCell>
                  ))}
                  {canManageSecrets && (
                    <TableCell className={actionsCell} align='left'>
                      {translate('Label.Actions')}
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((secret: Secret) => (
                    <TableRow data-testid={secret.id} key={secret.id}>
                      <TableCell align='left'>{secret.id}</TableCell>
                      <TableCell align='left'>{secret.domain}</TableCell>
                      <TableCell align='left'>
                        {secret.createTime && new Date(secret.createTime).toLocaleString()}
                      </TableCell>
                      <TableCell align='left'>
                        {secret.updateTime && new Date(secret.updateTime).toLocaleString()}
                      </TableCell>
                      {canManageSecrets && (
                        <TableCell className={actionsCell} align='left'>
                          <Button
                            onClick={() => {
                              if (secret.id && secret.id != null)
                                onEditSecret(secret.id, secret.domain ?? undefined);
                            }}
                            variant='text'
                            color='primary'
                            startIcon={<EditOutlinedIcon />}>
                            <Typography variant='buttonMedium'>
                              {translate('Action.Edit')}
                            </Typography>
                          </Button>
                          <Button
                            onClick={() => {
                              if (secret.id && secret.id != null) OnDeleteSecret(secret.id);
                            }}
                            variant='text'
                            color='primary'
                            disabled={false}
                            startIcon={<DeleteOutlinedIcon />}>
                            <Typography variant='buttonMedium'>
                              {translate('Action.Delete')}
                            </Typography>
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    className={pagination}
                    classes={{ toolbar: paginationToolbar }}
                    rowsPerPageOptions={SECRETS_TABLE_ROWS_PER_PAGE_OPTIONS}
                    count={sortedData.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_event: unknown, newPage: number) => {
                      setPage(newPage);
                    }}
                    onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setRowsPerPage(parseInt(event.target.value, 10));
                      setPage(0);
                    }}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </>
      )}
    </Grid>
  );
};

export default SecretsTable;
