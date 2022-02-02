import * as core from '@actions/core';
import * as github from '@actions/github';

type DevTaggerOptions = {
  token: string;
  prefix: string;
  tag: string;
  repo: {
    owner: string;
    repo: string;
  };
  workspace: string;
};

function getOptions(): DevTaggerOptions {
  const inAct = !!process.env.ACT;
  return {
    tag: core.getInput('tag', { required: true }),
    token: core.getInput('token', { required: true }),
    prefix: core.getInput('prefix', { required: true }).toLowerCase(),
    repo: github.context.repo,
    workspace: `${process.env.GITHUB_WORKSPACE ?? ''}${inAct ? '/action-dev-tagger' : ''}`,
  };
}

export async function handleAction() {
  try {
    const opts = getOptions();
    const client = github.getOctokit(opts.token);

    const ops: Promise<any>[] = [];
    const resp = await client.rest.git.listMatchingRefs({ ...opts.repo, ref: `tags/${opts.prefix}` });
    const tags = resp.data.filter((tag) => tag.ref.split('/').pop().toLowerCase().startsWith(opts.prefix));
    core.info(`Deleting tags: ${tags.map((t) => t.ref).join(', ')}`);
    for (const tag of tags) {
      ops.push(client.rest.git.deleteRef({ ...opts.repo, ref: tag.ref.split('/').slice(1).join('/') }));
    }
    await Promise.all(ops);

    core.info(`Creating ref: refs/tags/${opts.tag} @ ${github.context.sha}`);
    await client.rest.git.createRef({
      ...opts.repo,
      ref: `refs/tags/${opts.tag}`,
      sha: github.context.sha,
    });
  } catch (error) {
    core.setFailed(error);
  }
}
