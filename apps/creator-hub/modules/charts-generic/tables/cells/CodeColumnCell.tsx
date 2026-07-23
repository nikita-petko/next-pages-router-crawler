'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import {
  ErrorOutlineOutlinedIcon,
  makeStyles,
  Tooltip,
  TTheme,
  useTheme,
  WarningIcon,
} from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import CodeEditorSupportedLanguages from '../../components/CodeEditors/CodeEditorSupportedLanguages';
import { useMonaco } from '../../components/CodeEditors/Monaco';
import { registerThemes, useEditorTheme } from '../../components/CodeEditors/themes/registerThemes';

type CodeColumnCellProps = {
  value: string;
  language?: CodeEditorSupportedLanguages;
  useMonoFont?: boolean;
  tooltip?: { message?: string; severity: 'error' | 'warning' };
};

const useStyles = makeStyles()((theme: TTheme) => ({
  code: {
    fontFamily: theme.typography.code.fontFamily,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  monoFont: {
    fontFamily: theme.typography.code.fontFamily,
  },
}));

const FormatWithMonaco = ({
  value,
  language,
}: {
  value: string;
  language: CodeEditorSupportedLanguages;
}) => {
  const monaco = useMonaco();
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { classes } = useStyles();

  const editorTheme = useEditorTheme();

  useEffect(() => {
    if (ref.current && monaco) {
      registerThemes(monaco, theme);
      monaco.editor.colorizeElement(ref.current, {
        theme: editorTheme,
      });
    }
  }, [editorTheme, monaco, theme, value]);

  return (
    <div ref={ref} data-lang={language} className={classes.code}>
      {value}
    </div>
  );
};

const FormatWithPlainText = ({ value, useMonoFont }: { value: string; useMonoFont?: boolean }) => {
  const { classes } = useStyles();
  return <span className={useMonoFont ? classes.monoFont : ''}>{value}</span>;
};

const CodeColumnCell = ({ value, language, useMonoFont, tooltip }: CodeColumnCellProps) => {
  const content = useMemo(() => {
    if (language) {
      return <FormatWithMonaco value={value} language={language} />;
    }
    return <FormatWithPlainText value={value} useMonoFont={useMonoFont} />;
  }, [language, value, useMonoFont]);
  const icon = useMemo(() => {
    const severity = tooltip?.severity;
    if (!severity) return undefined;
    switch (severity) {
      case 'error':
        return <ErrorOutlineOutlinedIcon color='error' fontSize='small' />;
      case 'warning':
        return <WarningIcon color='warning' fontSize='small' />;
      default: {
        const exhaustiveCheck: never = severity;
        throw new Error(`Unhandled severity: ${exhaustiveCheck}`);
      }
    }
  }, [tooltip]);

  return (
    <Flex alignItems='center' gap={8}>
      <span>{content}</span>
      {tooltip && icon ? (
        <Tooltip
          title={tooltip.message}
          placement='bottom'
          arrow
          enterTouchDelay={0}
          leaveTouchDelay={3000}>
          {icon}
        </Tooltip>
      ) : null}
    </Flex>
  );
};

export default CodeColumnCell;
