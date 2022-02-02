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
    const resp = await client.rest.repos.listTags({ ...opts.repo });
    const tags = resp.data.filter((tag) => tag.name.toLowerCase().startsWith(opts.prefix));
    core.info(`Deleting tags: ${tags.map((t) => t.name).join(', ')}`);
    for (const tag of tags) {
      ops.push(client.rest.git.deleteRef({ ...opts.repo, ref: tag.name }));
    }
    await Promise.all(ops);

    core.info(`Creating tag: ${opts.tag} @ ${github.context.sha}`);
    await client.rest.git.createTag({
      ...opts.repo,
      tag: opts.tag,
      type: 'commit',
      message: opts.tag,
      object: github.context.sha,
    });

    core.info(`Creating ref: refs/heads/${opts.tag} @ ${github.context.sha}`);
    await client.rest.git.createRef({
      ...opts.repo,
      ref: `refs/heads/${opts.tag}`,
      sha: github.context.sha,
    });
  } catch (error) {
    core.setFailed(error);
  }
}
