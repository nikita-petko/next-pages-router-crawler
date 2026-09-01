/**
 * Main npm package here: https://www.npmjs.com/package/is-cidr
 *
 * Code reference from the following repo
 * https://github.com/silverwind/cidr-regex/blob/master/index.js
 */

import type { ValidatorOptions } from './ipRegex';
import ip from './ipRegex';

const defaultOpts: ValidatorOptions = { exact: false };

const v4str = `${ip.v4().source}\\/(3[0-2]|[12]?[0-9])`;
const v6str = `${ip.v6().source}\\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])`;

const v4exact = new RegExp(`^${v4str}$`);
const v6exact = new RegExp(`^${v6str}$`);
const v46exact = new RegExp(`(?:^${v4str}$)|(?:^${v6str}$)`);

const cidrValidator = ({ exact } = defaultOpts) =>
  exact ? v46exact : new RegExp(`(?:${v4str})|(?:${v6str})`, 'g');
cidrValidator.v4 = ({ exact } = defaultOpts) => (exact ? v4exact : new RegExp(v4str, 'g'));
cidrValidator.v6 = ({ exact } = defaultOpts) => (exact ? v6exact : new RegExp(v6str, 'g'));

export default cidrValidator;
