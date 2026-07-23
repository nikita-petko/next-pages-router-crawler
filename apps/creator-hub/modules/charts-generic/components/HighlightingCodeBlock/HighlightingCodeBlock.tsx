import React, { FC, useCallback, useMemo } from 'react';
import { Highlight, Token } from 'prism-react-renderer';
import { ExpandLessIcon, ExpandMoreIcon, Grid, IconButton, useTheme } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import useHighlightingCodeBlockStyles from './HighlightingCodeBlock.styles';
import useRobloxPrismTheme from './useRobloxPrismTheme';

export enum HighlightingCodeBlockLanguage {
  JSON = 'json',
  Lua = 'lua',
}

const codeBlockLanguageToPrismLanguage: Record<HighlightingCodeBlockLanguage, string> = {
  // NOTE(shumingxu, 03/25/2024): prism-react-renderer does not include json formatter by default,
  // so we fallback to jsx. Although this is not 100% JSON, it works for our simple use case without
  // needing to import another prism formatter.
  [HighlightingCodeBlockLanguage.JSON]: 'jsx',
  // TODO(gperkins@20250303): DSA-4100 to use a full lua grammar plugin here
  [HighlightingCodeBlockLanguage.Lua]: 'lua',
};

type HighlightingCodeBlockProps = {
  code: string;
  codePreviewSnippet: string;
  language: HighlightingCodeBlockLanguage;
  expanded?: boolean;
  secondaryActionButton?: React.ReactNode;
};

const HighlightingCodeBlock: FC<HighlightingCodeBlockProps> = ({
  code,
  codePreviewSnippet,
  language,
  expanded: expandedProp,
  secondaryActionButton,
}) => {
  const theme = useTheme();
  const prismTheme = useRobloxPrismTheme(theme);
  const {
    classes: { codeTextBlock, codeTextBlockEllipsis, iconButtonColor, codeBlockContainer },
    cx,
  } = useHighlightingCodeBlockStyles();

  const isExpandedControlled = expandedProp !== undefined;
  const [expanded, setExpanded] = React.useState(expandedProp ?? false);

  const displayCode = useMemo(
    () => (expanded ? code : codePreviewSnippet),
    [expanded, code, codePreviewSnippet],
  );
  const codeTextBlockClasses = useMemo(
    () => (expanded ? codeTextBlock : cx(codeTextBlock, codeTextBlockEllipsis)),
    [codeTextBlock, codeTextBlockEllipsis, cx, expanded],
  );

  const toggleExpansion = useCallback(() => setExpanded((value) => !value), []);
  const expandOrCollapseButton = useMemo(() => {
    if (isExpandedControlled) {
      return null;
    }
    const icon = expanded ? (
      <ExpandLessIcon className={iconButtonColor} />
    ) : (
      <ExpandMoreIcon className={iconButtonColor} />
    );

    return (
      <IconButton
        aria-label='expand'
        onClick={toggleExpansion}
        data-testid={expanded ? 'collapse-button' : 'expand-button'}>
        {icon}
      </IconButton>
    );
  }, [expanded, iconButtonColor, isExpandedControlled, toggleExpansion]);

  const buttons = useMemo(() => {
    if (!secondaryActionButton && !expandOrCollapseButton) {
      return null;
    }
    return (
      <Grid item alignContent='center'>
        <Flex flexDirection='row'>
          {secondaryActionButton}
          {expandOrCollapseButton}
        </Flex>
      </Grid>
    );
  }, [expandOrCollapseButton, secondaryActionButton]);

  return (
    <Grid container direction='row' justifyContent='space-between' wrap='nowrap'>
      <Grid item XSmall={11} className={codeBlockContainer}>
        <Highlight
          language={codeBlockLanguageToPrismLanguage[language]}
          code={displayCode}
          theme={prismTheme}>
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre style={style} className={codeTextBlockClasses}>
              {tokens.map((line: Token[], i) => (
                // eslint-disable-next-line react/no-array-index-key -- no other correct key
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token: Token, key) => (
                    // eslint-disable-next-line react/no-array-index-key -- no other correct key
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </Grid>
      {buttons}
    </Grid>
  );
};

export default HighlightingCodeBlock;
