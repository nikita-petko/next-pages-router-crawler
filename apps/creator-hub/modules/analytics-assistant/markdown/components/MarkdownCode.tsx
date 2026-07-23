import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Highlight } from 'prism-react-renderer';
import type { Token } from 'prism-react-renderer';
import { Button } from '@rbx/foundation-ui';
import { useTheme } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRobloxPrismTheme from '@modules/charts-generic/components/HighlightingCodeBlock/useRobloxPrismTheme';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const MarkdownCodeBlockContext = createContext(false);

const INLINE_CODE_CLASS_NAME =
  'bg-surface-100 radius-xsmall padding-x-xxsmall [font-family:monospace] text-body-small';
const CODE_BLOCK_CLASS_NAME =
  'bg-surface-100 stroke-standard stroke-default radius-medium margin-y-medium overflow-hidden text-align-x-left';
const CODE_BLOCK_HEADER_CLASS_NAME =
  'flex items-center justify-between gap-small bg-surface-200 border-b border-stroke-default padding-y-xxsmall padding-x-small';
const LANGUAGE_LABEL_CLASS_NAME =
  '[font-family:monospace] text-body-small content-muted lowercase text-no-wrap text-truncate-end overflow-hidden min-width-0';
const COPY_BUTTON_CLASS_NAME = 'shrink-0';
const PREFORMATTED_CODE_CLASS_NAME =
  'text-align-x-left margin-none scroll-x padding-small [background:transparent_!important]';
// Keep copy success/error visible briefly, then return the control to its default action label.
const COPY_STATUS_RESET_DELAY_MS = 2000;

type CopyStatus = 'idle' | 'copied' | 'error';

const mergeClassNames = (...classNames: Array<string | undefined>) =>
  classNames.filter(Boolean).join(' ');

const SupportedLanguages = new Set([
  'bash',
  'css',
  'html',
  'javascript',
  'json',
  'jsx',
  'lua',
  'markdown',
  'python',
  'sql',
  'tsx',
  'typescript',
  'xml',
  'yaml',
]);

const LanguageAliases: Record<string, string> = {
  js: 'javascript',
  md: 'markdown',
  py: 'python',
  shell: 'bash',
  sh: 'bash',
  ts: 'typescript',
  yml: 'yaml',
};

const getTextContent = (children: ReactNode): string => {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getTextContent).join('');
  }

  return '';
};

const getLanguage = (className?: string) => {
  const language = className?.match(/language-([\w-]+)/)?.[1].toLowerCase();
  if (!language) {
    return undefined;
  }

  return LanguageAliases[language] ?? language;
};

const normalizeCode = (children: ReactNode) => getTextContent(children).replace(/\n$/, '');

const getLanguageLabel = (language?: string) => language ?? 'text';

const MarkdownCodeBlock: React.FC<
  React.PropsWithChildren<{
    code: string;
    language?: string;
  }>
> = ({ children, code, language }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  useEffect(() => {
    if (copyStatus === 'idle') {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setCopyStatus('idle'), COPY_STATUS_RESET_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const copyLabel = translate(
    translationKey('Action.CopyCodeBlock', TranslationNamespace.AnalyticsAssistant),
  );
  const copiedLabel = translate(
    translationKey('Label.CodeBlockCopied', TranslationNamespace.AnalyticsAssistant),
  );
  const copyFailedLabel = translate(
    translationKey('Error.CodeBlockCopyFailed', TranslationNamespace.AnalyticsAssistant),
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  }, [code]);

  const buttonLabel =
    copyStatus === 'copied' ? copiedLabel : copyStatus === 'error' ? copyFailedLabel : copyLabel;

  return (
    <div className={CODE_BLOCK_CLASS_NAME}>
      <div className={CODE_BLOCK_HEADER_CLASS_NAME}>
        <span className={LANGUAGE_LABEL_CLASS_NAME}>{getLanguageLabel(language)}</span>
        <Button
          type='button'
          variant='Utility'
          size='Small'
          icon={copyStatus === 'copied' ? 'icon-regular-check' : 'icon-regular-clipboard-pencil'}
          onClick={handleCopy}
          className={COPY_BUTTON_CLASS_NAME}
          aria-label={buttonLabel}>
          {buttonLabel}
        </Button>
      </div>
      {children}
    </div>
  );
};

const MarkdownCode: React.FC<ComponentPropsWithoutRef<'code'>> = ({
  children,
  className,
  ...props
}) => {
  const theme = useTheme();
  const prismTheme = useRobloxPrismTheme(theme);
  const language = getLanguage(className);
  const code = useMemo(() => normalizeCode(children), [children]);
  const isBlockCode = useContext(MarkdownCodeBlockContext);

  if (!isBlockCode) {
    return (
      <code {...props} className={mergeClassNames(INLINE_CODE_CLASS_NAME, className)}>
        {children}
      </code>
    );
  }

  if (!language) {
    return (
      <MarkdownCodeBlock key={code} code={code}>
        <pre className={PREFORMATTED_CODE_CLASS_NAME}>
          <code {...props}>{code}</code>
        </pre>
      </MarkdownCodeBlock>
    );
  }

  if (!SupportedLanguages.has(language)) {
    return (
      <MarkdownCodeBlock key={code} code={code} language={language}>
        <pre className={PREFORMATTED_CODE_CLASS_NAME}>
          <code {...props}>{code}</code>
        </pre>
      </MarkdownCodeBlock>
    );
  }

  return (
    <MarkdownCodeBlock key={code} code={code} language={language}>
      <Highlight language={language} code={code} theme={prismTheme}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre style={style} className={PREFORMATTED_CODE_CLASS_NAME}>
            {tokens.map((line: Token[], lineIndex) => (
              // eslint-disable-next-line react/no-array-index-key -- Prism line order is stable for this render.
              <div key={lineIndex} {...getLineProps({ line })}>
                {line.map((token: Token, tokenIndex) => (
                  // eslint-disable-next-line react/no-array-index-key -- Prism token order is stable for this render.
                  <span key={tokenIndex} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </MarkdownCodeBlock>
  );
};

export default MarkdownCode;
