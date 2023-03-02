import * as gitShowBranch from './git-show-branch';

describe('containers/git/git-show-branch', () => {
    it('processShowBranchOutput resolves tracked repositories using --list option (default)', () => {
        const output = '* [fix/serializable-state-invariant-perf] removeNullableProperties fn properly conveys inaccessible nullable properties and refined union types for #1122\n  [main] Default view set to `metadata` instead of `branches` to always display data (even when not a versioned metafile)';
        const remotes = ['origin'];
        return expect(gitShowBranch.processShowBranchOutput(output, remotes)).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: 'fix/serializable-state-invariant-perf', remote: 'origin', scope: 'local' }),
                expect.objectContaining({ ref: 'main', remote: 'origin', scope: 'local' })
            ])
        );
    });

    it('processShowBranchOutput resolves tracked repositories using --remote option', () => {
        const output = '  [storage/v1.0.5] release version 1.0.5\n  [origin/HEAD] Store MD5 checksum values for `Cache` file content (#1083)\n  [origin/dependabot/npm_and_yarn/http-cache-semantics-4.1.1] Bump http-cache-semantics from 4.1.0 to 4.1.1';
        const remotes = ['origin', 'storage'];
        return expect(gitShowBranch.processShowBranchOutput(output, remotes)).toStrictEqual(
            expect.arrayContaining([
                { ref: 'v1.0.5', remote: 'storage', scope: 'remote' },
                { ref: 'HEAD', remote: 'origin', scope: 'remote' },
                { ref: 'dependabot/npm_and_yarn/http-cache-semantics-4.1.1', remote: 'origin', scope: 'remote' },
            ])
        );
    });

    it('processShowBranchOutput resolves tracked repositories using --all option', () => {
        const output = 'warning: ignoring origin/fix/serializable-state-invariant-perf; cannot handle more than 26 refs\nwarning: ignoring origin/main; cannot handle more than 26 refs\n* [fix/serializable-state-invariant-perf] Expand<T> and ExpandRecursively<T> utility types for expanding and resolving object types\n  [main] Default view set to `metadata` instead of `branches` to always display data (even when not a versioned metafile)\n  [storage/v1.0.5] release version 1.0.5\n  [origin/HEAD] Store MD5 checksum values for `Cache` file content (#1083)\n  [origin/dependabot/npm_and_yarn/http-cache-semantics-4.1.1] Bump http-cache-semantics from 4.1.0 to 4.1.1';
        const remotes = ['origin', 'storage'];
        return expect(gitShowBranch.processShowBranchOutput(output, remotes)).toStrictEqual(
            expect.arrayContaining([
                { ref: 'fix/serializable-state-invariant-perf', remote: 'origin', scope: 'local' },
                { ref: 'v1.0.5', remote: 'storage', scope: 'remote' },
                { ref: 'main', remote: 'origin', scope: 'local' },
                { ref: 'HEAD', remote: 'origin', scope: 'remote' },
                { ref: 'dependabot/npm_and_yarn/http-cache-semantics-4.1.1', remote: 'origin', scope: 'remote' }
            ])
        );
    });
});