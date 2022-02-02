import { randomInt, randomUUID } from 'crypto';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { handleAction } from '../src/lib';

jest.mock('@actions/github', () => ({
  context: {
    sha: randomUUID().replaceAll('-', ''),
    repo: {
      owner: 'test_user',
      repo: 'test_repo',
    },
  },
  getOctokit: () => ({}),
}));

describe('Basic Tests', () => {
  it('Works As Expected', async () => {
    const patch = randomInt(255);
    const outputs: Record<string, string> = {};
    const inputs: Record<string, string> = {
      token: '1234567890FAKETOKEN0987654321',
      prefix: 'v0.0.1-dev.',
      tag: `v0.0.1-dev.${patch}`,
    };

    const getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name: string) => {
      return inputs[name];
    });
    const setFailedSpy = jest.spyOn(core, 'setFailed').mockImplementation((message: string | Error) => {
      throw message instanceof Error ? message : new Error(message);
    });
    const getOctokitSpy = jest.spyOn(github, 'getOctokit').mockImplementation(
      () =>
        ({
          rest: {
            git: {
              deleteRef: () => Promise.resolve(),
              createRef: () => Promise.resolve(),
              listMatchingRefs: () =>
                Promise.resolve({
                  data: [
                    { ref: `refs/tags/v0.0.1-dev.1` },
                    { ref: `refs/tags/v0.0.1-dev.2` },
                    { ref: `refs/tags/v0.0.1-dev.3` },
                    { ref: `refs/tags/v0.0.1-dev.4` },
                    { ref: `refs/tags/v0.0.1-dev.5` },
                  ],
                }),
            } as any,
          } as any,
        } as any)
    );

    try {
      expect(handleAction).not.toThrow();

      expect(getInputSpy).toBeCalledTimes(3);
      expect(getOctokitSpy).toBeCalledTimes(1);
      expect(setFailedSpy).not.toHaveBeenCalled();
    } finally {
      [getInputSpy, getOctokitSpy, setFailedSpy].forEach((s) => s.mockRestore());
    }
  });
});
