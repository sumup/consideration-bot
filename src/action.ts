// @ts-nocheck
import { run } from '@probot/adapter-github-actions';
import { appHandler } from './index';

run(appHandler).catch((error) => {
  console.error(error);
  process.exit(1);
});
