import type { editor } from 'monaco-editor';
import type { TTheme } from '@rbx/ui';
import { toHexColor } from './colorUtils';

// Custom theme to match the docs site theme
// Adapted from https://github.rbx.com/Roblox/creator-doc-site/blob/master/services/doc-site-ssr/app/modules/ui/codeBlock/CodeBlock.tsx#L174
const rbxDark = (theme: TTheme): editor.IStandaloneThemeData => ({
  base: 'vs-dark',
  inherit: true,
  rules: [
    {
      token: 'number.json',
      foreground: '#FFC600', // hljs-number
    },
    {
      token: 'string.key.json',
      foreground: '#FFFFFF', // hljs-params
    },
    {
      token: 'string.value.json',
      foreground: '#ADF195', // hljs-string
    },
    {
      token: 'keyword.json',
      foreground: '#F86D7C', // hljs-keyword
    },
    {
      token: '',
      foreground: 'CCCCCC', // hljs-puncutation
    },
    {
      token: 'delimiter.bracket.json',
      foreground: '#CCCCCC', // hljs-puncutation
    },

    {
      token: 'key',
      foreground: '#FFFFFF', // hljs-params
    },
    {
      token: 'string',
      foreground: '#ADF195', // hljs-string
    },
    {
      token: 'string.key',
      foreground: '#FFFFFF', // hljs-params
    },
    {
      token: 'number',
      foreground: '#FFC600', // hljs-number
    },
    {
      token: 'boolean',
      foreground: '#F86D7C', // hljs-keyword
    },
    {
      token: 'keyword',
      foreground: '#F86D7C', // hljs-keyword
    },
  ],
  colors: {
    'editor.background': toHexColor(theme.palette.surface[300]),
    'editorLineNumber.foreground': '#CCCCCC', // hljs-puncutation
  },
});

export default rbxDark;
