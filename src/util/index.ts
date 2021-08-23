import { Application } from 'probot'; // eslint-disable-line no-unused-vars
import { IContext } from '../types';

export async function release({
  app,
  context,
}: {
  app: Application;
  context: IContext
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
    const releases = await context.octokit.repos.listReleases({
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
      const newRedeployVersion = ('0' + (Number(redeployVersion) + 1)).slice(
        -2
      );

      await context.octokit.repos.updateRelease({
        repo,
        owner,
        release_id: currentRelease?.id,
        tag_name: `${baseVersion}-${newRedeployVersion}`,
        body: body || '',
      });

      return { releaseStatus: 'UPDATED' };
    } else {
      app.log('creating a release');
      const tag_name = `v${releaseVersion}-01`;

      await context.octokit.repos.createRelease({
        repo,
        owner,
        tag_name,
        target_commitish: ref,
        name,
        body: body || '',
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
  context: IContext
  body: string;
  event?: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
}): Promise<any> {
  const prReview = context.pullRequest({
    body,
  });

  return context.octokit?.pulls.createReview({
    ...prReview,
    event,
  });
}

export async function createDeployment({
  context,
  app,
}: {
  context: IContext
  app: Application;
}) {
  const labelName = context.payload.label.name;
  app.log(`Found label name: ${labelName}`);

  if (labelName !== 'on staging') {
    return;
  }

  const { head } = context.payload.pull_request;
  const { ref } = head;
  const owner = context.payload.repository.owner.login;
  const repo = context.payload.repository.name;

  const deployment: any = await context.octokit.repos.createDeployment({
    owner,
    repo,
    ref,
    environment: 'staging',
    production_environment: false,
    required_contexts: [],
  });

  const deploymentId = deployment.data.id;
  app.log(`Successfully created a deployment with the id: ${deploymentId}`);

  await context.octokit.repos.createDeploymentStatus({
    owner,
    repo,
    deployment_id: deploymentId,
    state: 'success',
    environment_url: 'https://br.sam-app.ro',
  });
}
