import * as core from '@actions/core';
import * as github from '@actions/github';
import { handleAction } from '../src/lib';

jest.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'test_user',
      repo: 'test_repo',
    },
  },
  getOctokit: () => ({}),
}));

describe('Basic Tests', () => {
  it('Works As Expected', async () => {
    const patch = Date.now();
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
              createTag: () => Promise.resolve(),
              createRef: () => Promise.resolve(),
            } as any,
            repos: {
              listTags: () => Promise.resolve({ data: [{ name: `` }] }),
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
