import {join as P} from 'path';

export const PROJECT_ROOT = global.GULP_ROOT;
export const DIST_ROOT = P(PROJECT_ROOT, 'dist');
export const SOURCE_ROOT = P(PROJECT_ROOT, 'src');
