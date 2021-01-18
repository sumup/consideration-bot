import { Application } from 'probot';
import { release, reviewPr, createDeployment } from './util';

export = (app: Application) => {
  // @ts-ignore
  app.on('pull_request.labeled', async (context) => {
    try {
      await createDeployment({ context });
      const { releaseStatus } = await release({ app, context });

      switch (releaseStatus) {
        case 'UPDATED':
          await reviewPr({
            context,
            body:
              'Github Release successfully updated. Redeploy on staging is on the way.',
          });
          return app.log('release has been updated');
        case 'CREATED':
          await reviewPr({
            context,
            body:
              'Github Release successfully created. Deploy on staging is on the way.',
          });
          return app.log('release has been created');
        default:
          return app.log('nothing happened');
      }
    } catch (error) {
      app.log(error);
    }
  });
};
