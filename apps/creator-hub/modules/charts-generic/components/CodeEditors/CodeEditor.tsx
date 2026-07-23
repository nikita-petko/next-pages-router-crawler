'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { type EditorProps, type Monaco } from '@monaco-editor/react';
import { useTheme } from '@rbx/ui';
import type { editor } from 'monaco-editor';
import useCodeEditorStyles from './CodeEditor.styles';
import { getEditorOptions } from './editorOptions';
import { registerThemes, useEditorTheme } from './themes/registerThemes';
import { DynamicCodeEditor, MonacoLoading } from './Monaco';
import CodeEditorSupportedLanguages from './CodeEditorSupportedLanguages';
import useFirstTimeDebounce from './useFirstTimeDebounce';

type CodeEditorProps = {
  value?: string;
  onChange?: (value: string | undefined) => void;
  onBlur?: (value: string | undefined) => void;
  className?: string;
  height?: string | 'auto' | '100%';
  language?: CodeEditorSupportedLanguages;
  placeholder?: string;
  formatOnBlur?: boolean;
  readOnly?: boolean;
  isInDiffContext?: boolean;
};

const getInitialHeight = (height: string | 'auto' | '100%' | undefined) => {
  if (height === 'auto') return '0';
  if (height === '100%') return '100%';
  return height;
};

const CodeEditor = ({
  value,
  onChange,
  onBlur,
  className,
  height,
  language,
  placeholder,
  formatOnBlur,
  readOnly = false,
  isInDiffContext = false,
}: CodeEditorProps) => {
  const { classes, cx } = useCodeEditorStyles();
  const theme = useTheme();
  const editorTheme = useEditorTheme(isInDiffContext ? 'diff' : 'editor');

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ignoreEventRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [currentHeight, setCurrentHeight] = useState<string | undefined>(getInitialHeight(height));
  const autoHeight = height === 'auto';
  const fillHeight = height === '100%';
  /** To fill the position:relative container, we need height: 100% all the way down */
  const fillHeightStyle = fillHeight ? { height: '100%' } : {};

  const editorOptions: EditorProps['options'] = useMemo(() => {
    return {
      ...getEditorOptions(theme, readOnly, autoHeight),
      placeholder,
    };
  }, [placeholder, readOnly, theme, autoHeight]);

  const handleEditorBeforeMount = useCallback(
    (monacoInstance: Monaco) => {
      registerThemes(monacoInstance, theme);
    },
    [theme],
  );

  const updateHeight = useCallback(() => {
    if (!autoHeight || !editorRef.current || !containerRef.current) return;

    const editor = editorRef.current;
    const container = containerRef.current;
    const contentHeight = editor.getContentHeight();

    try {
      ignoreEventRef.current = true;
      container.style.height = `${contentHeight}px`;
      setCurrentHeight(`${contentHeight}px`);
      setIsLoading(false);
    } finally {
      ignoreEventRef.current = false;
    }
  }, [autoHeight]);

  const firstTimeDebouncedUpdateHeight = useFirstTimeDebounce(updateHeight, 300);

  const handleBlur = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      if (formatOnBlur) {
        editorInstance.getAction('editor.action.formatDocument')?.run();
      }
      onBlur?.(editorInstance.getValue());
    },
    [formatOnBlur, onBlur],
  );

  const handleEditorOnMount = useCallback(
    (editorInstance: editor.IStandaloneCodeEditor) => {
      editorRef.current = editorInstance;
      editorInstance.onDidBlurEditorText(() => {
        handleBlur(editorInstance);
      });

      if (autoHeight) {
        const updateHeightOnChange = () => {
          if (!ignoreEventRef.current) {
            firstTimeDebouncedUpdateHeight();
          }
        };
        editorInstance.onDidContentSizeChange(updateHeightOnChange);
        firstTimeDebouncedUpdateHeight();
      } else {
        setIsLoading(false);
      }
    },
    [autoHeight, firstTimeDebouncedUpdateHeight, handleBlur],
  );

  // Force a re-render when the theme changes
  const forceRenderKey = useMemo(() => {
    return `${theme.palette.mode}-${editorTheme}`;
  }, [theme.palette.mode, editorTheme]);

  return (
    <div ref={containerRef} style={{ ...fillHeightStyle }}>
      {isLoading && <MonacoLoading />}
      {/* Hide editor until Monaco height is fully loaded to prevent height flickering */}
      <div
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.1s ease-in-out',
          ...fillHeightStyle,
        }}>
        <DynamicCodeEditor
          key={forceRenderKey}
          height={currentHeight}
          language={language}
          value={value}
          theme={editorTheme}
          onChange={onChange}
          options={editorOptions}
          className={cx(classes.editor, className)}
          beforeMount={handleEditorBeforeMount}
          onMount={handleEditorOnMount}
          loading={<MonacoLoading />}
        />
      </div>
    </div>
  );
};

export default CodeEditor;
