// Stub file for locale utils
import { assistantPathSuffix } from '../../assistant/constants/assistantNavConstants';
import coursesPathSuffix from '../../learning/constants/coursesNavConstants';

const pathsWithNoLocale = new Set([assistantPathSuffix, coursesPathSuffix, '/release-notes']);

export default pathsWithNoLocale;
