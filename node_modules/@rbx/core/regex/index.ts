export const url = /(https?:\/\/(?:[-\w.]+)+(?::\d+)?(?:[-\w_.#!/]*)+(?:\?\S+)?)/g;
export const email =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function escape(unescapedString: string) {
  return unescapedString.replaceAll(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export default {
  url,
  email,
  escape,
};
