import React from 'react';
import preloadScript, { hash } from './WebViewInitScript.rawjs';

const WebViewInitTags = () => {
  // eslint-disable-next-line react/no-danger
  return <script data-hash={hash} dangerouslySetInnerHTML={{ __html: preloadScript }} />;
};
export default WebViewInitTags;
