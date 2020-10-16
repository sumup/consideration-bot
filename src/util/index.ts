import { Application, Context } from 'probot'; // eslint-disable-line no-unused-vars

export async function release({
  app,
  context,
}: {
  app: Application;
  context: Context;
}) {
  const { title: name, body, head } = context.payload.pull_request;
  const labelName = context.payload.label.name;
  const { ref } = head;
  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;

  // the convention for creating releases is releases/[year].[week].[releaseNumber]
  const releaseVersion = ref.split('/')[1];

  if (/releases\/.+/g.test(ref) && labelName === 'deploy to staging') {
    // search for releases
    const releases = await context.github.repos.listReleases({
      owner,
      repo,
    });

    const currentRelease = releases.data.find((rel) =>
      rel.tag_name.includes(releaseVersion)
    );

    if (currentRelease) {
      app.log('updating a release');

      const [baseVersion, redeployVersion] = currentRelease?.tag_name.split(
        '-'
      );

      // transforms 2 => "02"
      const newRedeployVersion = ('0' + (Number(redeployVersion) + 1)).slice(-2);

      await context.github.repos.updateRelease({
        repo,
        owner,
        release_id: currentRelease?.id,
        tag_name: `${baseVersion}-${newRedeployVersion}`,
        body,
      });

      return { releaseStatus: 'UPDATED' };
    } else {
      app.log('creating a release');
      const tag_name = `v${releaseVersion}-01`;

      await context.github.repos.createRelease({
        repo,
        owner,
        tag_name,
        target_commitish: ref,
        name,
        body,
        draft: false,
        prerelease: false,
      });

      return { releaseStatus: 'CREATED' };
    }
  }

  return { releaseStatus: 'N/A' };
}

export async function reviewPr({
  context,
  body,
  event = 'APPROVE',
}: {
  context: Context;
  body: string;
  event?: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
}): Promise<any> {
  const prReview = context.pullRequest({
    body,
  });

  return context.github.pulls.createReview({
    ...prReview,
    event,
  });
}
