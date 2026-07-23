import React, { useEffect } from 'react';
import IALayoutExperiment from '@modules/creator-hub-layout/IALayoutExperiment';
import { ViewModeProvider } from '../../contexts/ViewModeContext';
import { TalentHubBreadcrumbs } from './TalentHubBreadcrumbs';
import { TalentHubSideNav } from './TalentHubSideNav';
import type { Crumb } from './TalentHubBreadcrumbs';

type TalentHubLayoutProps = {
  crumbs: Crumb[];
  children: React.ReactNode;
};

/**
 * The app shell grid (@rbx/creator-hub-navigation `CreatorHubLayout`) renders
 * `MuiGrid` containers with `width: 100vw`, which includes the scrollbar gutter
 * and causes horizontal overflow. This injects a scoped stylesheet (removed on
 * unmount) that constrains the page and grid to the visible viewport. The
 * `<style>` tag is appended last in `<head>`, so equal-specificity rules win by
 * source order. Where the shell uses higher specificity, we boost ours with
 * repeated class selectors or element-qualified selectors.
 *
 * TODO: Remove once the shell adopts a layout that respects `100%` instead of `100vw`.
 */
const SHELL_GRID_FIX_CSS = [
  'html, body, #__next { overflow-x: hidden; max-width: 100vw; }',
  '.MuiGrid-root.MuiGrid-root { min-width: 0; }',
  'html .MuiGrid-root:not(.MuiGrid-root .MuiGrid-root) {',
  '  width: 100%;',
  '  max-width: 100vw;',
  '}',
].join('\n');

function useFixShellGridWidth() {
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-th2-grid-fix', '');
    style.textContent = SHELL_GRID_FIX_CSS;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);
}

export const TalentHubLayout: React.FC<TalentHubLayoutProps> = ({ crumbs, children }) => {
  useFixShellGridWidth();

  return (
    <ViewModeProvider>
      <IALayoutExperiment
        product='Talent'
        title={<TalentHubBreadcrumbs crumbs={crumbs} />}
        noBreadCrumbs
        secondarySize='small'
        secondaryRail={<TalentHubSideNav />}>
        {children}
      </IALayoutExperiment>
    </ViewModeProvider>
  );
};

export default TalentHubLayout;
