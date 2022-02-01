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
};

function getOptions(): DevTaggerOptions {
  return {
    tag: core.getInput('tag', { required: true }),
    token: core.getInput('token', { required: true }),
    prefix: core.getInput('prefix', { required: true }).toLowerCase(),
    repo: github.context.repo,
  };
}

export async function handleAction() {
  try {
    const opts = getOptions();
    const client = github.getOctokit(opts.token);

    const ops: Promise<any>[] = [];
    const resp = await client.rest.repos.listTags({ ...opts.repo });
    const tags = resp.data.filter((tag) => tag.name.toLowerCase().startsWith(opts.prefix));
    for (const tag of tags) {
      ops.push(client.rest.git.deleteRef({ ...opts.repo, ref: tag.name }));
    }
    await Promise.all(ops);

    await client.rest.git.createTag({
      ...opts.repo,
      tag: opts.tag,
      type: 'commit',
      message: opts.tag,
      object: github.context.sha,
    });
    await client.rest.git.createRef({
      ...opts.repo,
      ref: `refs/heads/${opts.tag}`,
      sha: github.context.sha,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
}
