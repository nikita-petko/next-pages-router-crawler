import type { MonacoDiffEditor, Monaco } from '@monaco-editor/react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTheme } from '@rbx/ui';
import type CodeEditorSupportedLanguages from './CodeEditorSupportedLanguages';
import useDiffCodeEditorStyles from './DiffCodeEditor.styles';
import { getDiffEditorOptions } from './editorOptions';
import { DynamicDiffEditor, MonacoLoading } from './Monaco';
import { registerThemes, useEditorTheme } from './themes/registerThemes';
import useFirstTimeDebounce from './useFirstTimeDebounce';

type DiffCodeEditorProps = {
  original?: string;
  modified?: string;
  className?: string;
  height?: string | 'auto';
  language?: CodeEditorSupportedLanguages;
  readOnly?: boolean;
};

const DiffCodeEditor = ({
  original,
  modified,
  className,
  height,
  language,
  readOnly = false,
}: DiffCodeEditorProps) => {
  const {
    classes: { diffEditor },
    cx,
  } = useDiffCodeEditorStyles();
  const theme = useTheme();
  const editorTheme = useEditorTheme('diff');

  // Refs for editor state management
  const editorRef = useRef<MonacoDiffEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ignoreEventRef = useRef(false);

  // Component state
  const [isLoading, setIsLoading] = useState(true);
  const [currentHeight, setCurrentHeight] = useState<string | undefined>(
    height === 'auto' ? '0' : height,
  );
  const autoHeight = height === 'auto';

  const editorOptions = useMemo(() => {
    return getDiffEditorOptions(theme, readOnly, autoHeight);
  }, [readOnly, theme, autoHeight]);

  const handleEditorBeforeMount = useCallback(
    (monaco: Monaco) => {
      registerThemes(monaco, theme);
    },
    [theme],
  );

  const updateHeight = useCallback(() => {
    if (!autoHeight || !editorRef.current || !containerRef.current) {
      return;
    }

    const editor = editorRef.current;
    const container = containerRef.current;
    const contentHeight = Math.max(
      editor.getOriginalEditor().getContentHeight(),
      editor.getModifiedEditor().getContentHeight(),
    );

    try {
      ignoreEventRef.current = true;
      container.style.height = `${contentHeight}px`;
      setCurrentHeight(`${contentHeight}px`);
      setIsLoading(false);
    } finally {
      ignoreEventRef.current = false;
    }
  }, [autoHeight]);

  // We want to debounce the first update since monaco is still loading and content hasn't been fully formatted properly
  const firstTimeDebouncedUpdateHeight = useFirstTimeDebounce(updateHeight, 300);

  const handleEditorOnMount = useCallback(
    (editor: MonacoDiffEditor) => {
      editorRef.current = editor;

      // NOTE(shumingxu, 2025-04-29): Issue with glyph margin rendering. See https://github.com/microsoft/monaco-editor/issues/4448
      editor.getOriginalEditor().updateOptions({
        glyphMargin: false,
      });

      if (autoHeight) {
        const updateHeightOnChange = () => {
          if (!ignoreEventRef.current) {
            firstTimeDebouncedUpdateHeight();
          }
        };
        editor.getOriginalEditor().onDidContentSizeChange(updateHeightOnChange);
        editor.getModifiedEditor().onDidContentSizeChange(updateHeightOnChange);
        firstTimeDebouncedUpdateHeight();
      } else {
        setIsLoading(false);
      }
    },
    [autoHeight, firstTimeDebouncedUpdateHeight],
  );

  // Force a re-render when the theme changes
  const forceRenderKey = useMemo(() => {
    return `${theme.palette.mode}-${editorTheme}`;
  }, [theme.palette.mode, editorTheme]);

  return (
    <div ref={containerRef}>
      {isLoading && <MonacoLoading />}
      <div
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.1s ease-in-out',
        }}>
        <DynamicDiffEditor
          key={forceRenderKey}
          height={currentHeight}
          className={cx(diffEditor, className)}
          language={language}
          original={original}
          modified={modified}
          theme={editorTheme}
          options={editorOptions}
          beforeMount={handleEditorBeforeMount}
          onMount={handleEditorOnMount}
          loading={<MonacoLoading />}
        />
      </div>
    </div>
  );
};

export default DiffCodeEditor;
