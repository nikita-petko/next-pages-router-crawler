import type { editor } from 'monaco-editor';
import { TTheme } from '@rbx/ui';
// Custom theme to match the docs site theme
// Adapted from https://github.rbx.com/Roblox/creator-doc-site/blob/master/services/doc-site-ssr/app/modules/ui/codeBlock/CodeBlock.tsx#L174
const rbxLight = (theme: TTheme): editor.IStandaloneThemeData => ({
  base: 'vs',
  inherit: true,
  rules: [
    {
      token: 'number.json',
      foreground: '#936900', // hljs-number
    },
    {
      token: 'string.key.json',
      foreground: '#111216', // hljs-params
    },
    {
      token: 'string.value.json',
      foreground: '#008147', // hljs-string
    },
    {
      token: 'keyword.json',
      foreground: '#CF2017', // hljs-keyword
    },
    {
      token: '',
      foreground: '696A6D', // hljs-puncutation
    },
    {
      token: 'delimiter.bracket.json',
      foreground: '#696A6D', // hljs-puncutation
    },

    {
      token: 'key',
      foreground: '#111216', // hljs-params
    },
    {
      token: 'string',
      foreground: '#008147', // hljs-string
    },
    {
      token: 'string.key',
      foreground: '#111216', // hljs-params
    },
    {
      token: 'number',
      foreground: '#936900', // hljs-number
    },
    {
      token: 'boolean',
      foreground: '#CF2017', // hljs-keyword
    },
    {
      token: 'keyword',
      foreground: '#CF2017', // hljs-keyword
    },
  ],
  colors: {
    'editor.background': theme.palette.surface[300],
    'editorLineNumber.foreground': '#696A6D', // hljs-puncutation
  },
});

export default rbxLight;
