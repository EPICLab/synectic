import * as remote from './git-remote';

describe('containers/git/git-remote', () => {
    it('processRemoteOutput resolves names of tracked repositories', () => {
        return expect(remote.processRemoteOutput('origin\nstaging')).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ remote: 'origin' }),
                expect.objectContaining({ remote: 'staging' })
            ])
        );
    });

    it('processRemoteOutput verbosely resolves tracked repositories', () => {
        const output = 'origin	https://github.com/SampleProj/sample.git (fetch)\norigin	https://github.com/SampleProj/sample.git (push)\nstaging	https://github.com/SampleProj/staging.git (fetch)\nstaging	https://github.com/SampleProj/staging.git (push)';
        return expect(remote.processRemoteOutput(output)).toStrictEqual(
            [
                { remote: 'origin', url: 'https://github.com/SampleProj/sample.git', type: 'fetch' },
                { remote: 'origin', url: 'https://github.com/SampleProj/sample.git', type: 'push' },
                { remote: 'staging', url: 'https://github.com/SampleProj/staging.git', type: 'fetch' },
                { remote: 'staging', url: 'https://github.com/SampleProj/staging.git', type: 'push' }
            ]);
    });
});