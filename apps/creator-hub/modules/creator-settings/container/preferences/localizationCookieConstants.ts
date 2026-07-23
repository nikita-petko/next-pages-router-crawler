const LOCALE_MAX_AGE = 1707109200;

const DocsLocaleCookie = {
  Name: 'roblox-docs-locale',
  Options: {
    // accessible on all pages
    path: '/',
    // expires at max num days from now (400 days)
    'max-age': LOCALE_MAX_AGE,
  },
};

export default DocsLocaleCookie;
