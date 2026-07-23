'use client';

import React from 'react';
import { EmptyGrid } from '@modules/miscellaneous/common';

import dynamic from 'next/dynamic';
import { CircularProgress } from '@rbx/ui';
import { useMonaco } from '@monaco-editor/react';

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  import('@monaco-editor/react').then((mod) => {
    const { loader } = mod;
    loader.config({
      paths: {
        // NOTE(shumingxu, 2025-04-29): 0.52 has bug with unmounting diff editor. See https://github.com/microsoft/monaco-editor/issues/4779
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs',
      },
    });

    loader.init().then(async (monaco) => {
      // We need to set up custom JSON tokenizer because the default one is not tokenizing on colorizeElement.
      // This is needed for CodeColumnCell to work. Before removing this, make sure CodeColumnCell is highlighting json correctly.
      // See https://github.com/microsoft/monaco-editor/issues/3105
      monaco.languages.json.jsonDefaults.setModeConfiguration({ tokens: false });

      // Set up JSON tokens provider
      monaco.languages.setMonarchTokensProvider('json', {
        defaultToken: '',
        tokenPostfix: '.json',

        keywords: ['true', 'false', 'null'],
        symbols: /[{}[\],:]/,
        escapes: /\\(?:["\\/bfnrt]|u[0-9A-Fa-f]{4})/,

        brackets: [
          { open: '{', close: '}', token: 'delimiter.curly' },
          { open: '[', close: ']', token: 'delimiter.bracket' },
          { open: '(', close: ')', token: 'delimiter.parenthesis' },
        ],
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
        ],

        tokenizer: {
          root: [
            { include: '@whitespace' },
            { include: '@numbers' },
            { include: '@strings' },

            [/[,:]/, 'delimiter'],
            [/[[\]]/, 'delimiter.bracket'],
            [/[{}]/, 'delimiter.curly'],

            [/@symbols/, { cases: { '@keywords': 'keyword', '@default': '' } }],
          ],

          strings: [
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, { token: 'string.key', next: '@stringKey' }],
          ],

          stringKey: [
            [/[^\\"]+/, 'string.key'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/"/, { token: 'string.key', next: '@afterKey' }],
          ],

          afterKey: [{ include: '@whitespace' }, [/:/, { token: 'delimiter', next: '@value' }]],

          stringValueStart: [
            [/"([^"\\]|\\.)*$/, 'string.invalid'],
            [/"/, { token: 'string.value', next: '@stringValue' }],
          ],

          stringValue: [
            [/[^\\"]+/, 'string.value'],
            [/@escapes/, 'string.escape'],
            [/\\./, 'string.escape.invalid'],
            [/"/, { token: 'string.value', next: '@pop' }],
          ],

          value: [
            { include: '@whitespace' },
            [/[{}]/, { token: 'delimiter.curly', next: '@root' }],
            [/[[\]]/, { token: 'delimiter.bracket', next: '@root' }],
            [/,/, { token: 'delimiter', next: '@root' }],
            { include: '@numbers' },
            { include: '@stringValueStart' },
            // identifiers and keywords
            [
              /#?[a-z_$][\w$]*/,
              {
                cases: {
                  '@keywords': 'keyword',
                  '@default': 'identifier',
                },
              },
            ],
          ],

          whitespace: [[/[ \t\r\n]+/, '']],

          numbers: [[/-?\d+/, 'number']],
        },
      });
    });
  });
}

export const MonacoLoading = () => (
  <EmptyGrid>
    <CircularProgress />
  </EmptyGrid>
);

export const DynamicCodeEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <MonacoLoading />,
});

export const DynamicDiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: () => <MonacoLoading />,
  },
);

export { useMonaco };
