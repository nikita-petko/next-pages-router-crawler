import { withScope } from '@sentry/nextjs';

/**
 * In general we should first try to use the typechecker to prevent false assumptions.
 * If we cannot, we should normally throw an Error instead of using this function.
 *
 * This should be used in situations where:
 * - we cannot use the type checker
 * - AND we have a reasonable fallback
 * - AND we do not think the issue is currently happening in production
 * By logging to sentry, we can bring these errors to the attention of developers.
 *
 * Once the issue is known to be happening in production, we should:
 * - create a JIRA ticket
 * - remove the callsite to this function
 * - add a specific logger to analyticsKnownErrorLoggers
 */
const logAnalyticsError = (...args: Parameters<typeof console.error>) => {
  withScope((scope) => {
    scope.setTag('team', 'analytics');
    console.error(...args);
  });
};
export default logAnalyticsError;
