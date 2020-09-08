import { Application } from 'probot'; // eslint-disable-line no-unused-vars

export default (app: Application) => {
  // @ts-ignore
  app.on('pull_request.labeled', async (context) => {
    const { title: name, body, head } = context.payload.pull_request;
    const labelName = context.payload.label.name;
    const { ref } = head;
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;

    if (/releases\/.+/g.test(ref) && labelName === 'bug') {
      // the convention for creating releases is releases/[year].[week].[releaseNumber]
      const releaseVersion = ref.split('/')[1];
      const tag_name = `v${releaseVersion}-01`;
      app.log('creating a release');
      try {
        await context.github.repos
          .createRelease({
            repo,
            owner,
            tag_name,
            target_commitish: ref,
            name,
            body,
            draft: false,
            prerelease: false,
          })
          .then(() => {
            app.log('release successfully created');
            const prReview = context.pullRequest({
              body:
                'Github Release successfully created. Deploy on staging is on the way.',
            });
            app.log('writing a review for the PR');
            return context.github.pulls.createReview({
              ...prReview,
              event: 'APPROVE',
            });
          });
        app.log('finished script');
      } catch (error) {
        app.log(error);
      }
    }
  });
};
