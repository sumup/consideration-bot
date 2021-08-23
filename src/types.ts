import { Context } from 'probot';

export interface IContext extends Omit<Context, 'github'> {
  octokit: Context['github'];
}
