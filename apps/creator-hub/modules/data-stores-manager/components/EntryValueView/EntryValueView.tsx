import React, { FunctionComponent } from 'react';
import { withTranslation, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid, Typography, useTheme, Card, CardContent, Button, CircularProgress } from '@rbx/ui';
import { V2CloudProtos } from '@rbx/open-cloud';
import { Highlight, Token } from 'prism-react-renderer';
import useEntryValueViewPrismTheme from './useEntryValueViewPrismTheme';
import useEntryValueViewStyles from './EntryValueView.styles';

interface EntryValueViewProps {
  value?: V2CloudProtos.IDataStoreEntry;
  isLoading?: boolean;
  isError?: boolean;
}

const EntryValueView: FunctionComponent<EntryValueViewProps> = ({
  value,
  isLoading = false,
  isError = false,
}) => {
  const theme = useTheme();
  const { translate } = useTranslation();
  const prismTheme = useEntryValueViewPrismTheme(theme);
  const {
    classes: {
      button,
      copyButton,
      cardContentContainer,
      metadataCardContainer,
      metaDataCardContentContainer,
      cardContainer,
      emptyValueText,
      loadingContainer,
    },
  } = useEntryValueViewStyles();

  // Extract the actual value from the protobuf IValue structure
  const entryData = (() => {
    // If no entry is selected, return undefined to show "Select a key" message
    if (!value) {
      return undefined;
    }

    // Check if this is an error state
    if ((value as V2CloudProtos.IDataStoreEntry & { isError?: boolean }).isError) {
      return translate('Description.InvalidJson');
    }

    // Null is a valid value for data store entry, so just display it
    if (!value.value) {
      return null;
    }

    const protoValue = value.value;

    try {
      let actualValue;
      if (protoValue.stringValue !== undefined) {
        actualValue = protoValue.stringValue;
      } else if (protoValue.numberValue !== undefined) {
        actualValue = protoValue.numberValue;
      } else if (protoValue.boolValue !== undefined) {
        actualValue = protoValue.boolValue;
      } else if (protoValue.structValue !== undefined) {
        actualValue = protoValue.structValue;
      } else if (protoValue.listValue !== undefined) {
        actualValue = protoValue.listValue;
      } else if (protoValue.nullValue !== undefined) {
        return null;
      } else {
        // Fallback: try to JSON stringify the entire value
        actualValue = protoValue;
      }

      // If it's a string, try to parse it as JSON first
      if (typeof actualValue === 'string') {
        try {
          const parsed = JSON.parse(actualValue);
          return JSON.stringify(parsed, null, 2);
        } catch {
          return actualValue; // Return as-is if not valid JSON
        }
      }

      // For objects, arrays, numbers, booleans - stringify with indentation
      return JSON.stringify(actualValue, null, 2);
    } catch {
      // If all else fails, try to stringify the raw protobuf value
      try {
        return JSON.stringify(protoValue, null, 2);
      } catch {
        return String(protoValue);
      }
    }
  })();

  const metadata = (() => {
    if (!value) {
      return undefined;
    }

    try {
      return JSON.stringify(
        {
          attributes: value.attributes || '',
          users: value.users || '',
        },
        null,
        2,
      );
    } catch {
      return null;
    }
  })();

  const copyToClipboard = (data: string | null | undefined) => {
    if (data !== undefined) {
      navigator.clipboard.writeText(data === null ? 'null' : data);
    }
  };

  const copyValue = () => copyToClipboard(entryData);
  const copyMetadata = () => copyToClipboard(metadata);

  const highlightingCodeBlock = (
    codeValue: string | null | undefined,
    placeholderText: string,
    onCopy: () => void,
    showLoading: boolean = false,
    disableCopy: boolean = false,
  ) => {
    if (showLoading) {
      return (
        <div className={loadingContainer}>
          <CircularProgress color='secondary' size={24} />
        </div>
      );
    }

    if (codeValue === undefined) {
      return (
        <div>
          <div className={copyButton}>
            <Typography variant='body2' color='secondary' className={emptyValueText}>
              {placeholderText}
            </Typography>
            <Button
              onClick={onCopy}
              aria-label='copy-code'
              color='secondary'
              variant='contained'
              size='small'
              className={button}
              disabled>
              {translate('Action.Copy')}
            </Button>
          </div>
        </div>
      );
    }

    if (codeValue === null) {
      return (
        <div>
          <div className={copyButton}>
            <Highlight language='json' code='null' theme={prismTheme}>
              {({ style, tokens, getLineProps, getTokenProps }) => (
                <pre
                  style={{
                    ...style,
                    opacity: 0.8,
                    fontSize: '12px',
                    fontFamily: 'Builder Mono',
                    fontWeight: 50,
                    margin: 0,
                  }}>
                  {tokens.map((line: Token[], i) => (
                    <div key={line[i]?.content} {...getLineProps({ line })}>
                      {line.map((token: Token) => (
                        <span key={token.content} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  ))}
                </pre>
              )}
            </Highlight>
            <Button
              onClick={onCopy}
              aria-label='copy-code'
              color='secondary'
              variant='contained'
              size='small'
              className={button}
              disabled={disableCopy}>
              {translate('Action.Copy')}
            </Button>
          </div>
        </div>
      );
    }

    if (codeValue.trim() === '') {
      return (
        <div>
          <div className={copyButton}>
            <Typography variant='body2' color='secondary'>
              {placeholderText}
            </Typography>
            <Button
              onClick={onCopy}
              aria-label='copy-code'
              color='secondary'
              variant='contained'
              size='small'
              className={button}
              disabled>
              {translate('Action.Copy')}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className={copyButton}>
          <Highlight language='json' code={codeValue} theme={prismTheme}>
            {({ style, tokens, getLineProps, getTokenProps }) => (
              <pre
                style={{
                  ...style,
                  opacity: 0.8,
                  fontSize: '12px',
                  fontFamily: 'Builder Mono',
                  fontWeight: 50,
                  margin: 0,
                }}>
                {tokens.map((line: Token[], i) => (
                  <div key={line[i]?.content} {...getLineProps({ line })}>
                    {line.map((token: Token) => (
                      <span key={token.content} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
          <Button
            onClick={onCopy}
            aria-label='copy-code'
            color='secondary'
            variant='contained'
            size='small'
            className={button}
            disabled={disableCopy}>
            {translate('Action.Copy')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Grid container XSmall={12} spacing={1} direction='row'>
      <Grid item XSmall={12}>
        <Typography variant='body2'>{translate('Label.Value')}</Typography>
      </Grid>
      <Grid item XSmall={12}>
        <Card className={cardContainer}>
          <CardContent className={cardContentContainer}>
            {highlightingCodeBlock(
              entryData,
              'Select a key to view its value',
              copyValue,
              isLoading,
              isError,
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item XSmall={12}>
        <Typography variant='body2'>{translate('Label.Metadata')}</Typography>
      </Grid>
      <Grid item XSmall={12}>
        <Card className={metadataCardContainer}>
          <CardContent className={metaDataCardContentContainer}>
            {highlightingCodeBlock(
              metadata,
              'Select a key to view its metadata',
              copyMetadata,
              isLoading,
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default withTranslation(EntryValueView, [TranslationNamespace.DataStoresManager]);
