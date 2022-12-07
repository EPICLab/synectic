import * as branch from './git-branch';

describe('containers/git/git-branch', () => {
    it('processBranchOutput handles local branches', () => {
        const output = '  bugfix/handleHTTPS                                            efa41605007195577e57f71446d6195489d4e329 [gone] Add HTTPS processor\n  main                                                                      31e4d1636e687737f02905f29b9c0d0e5c442f4e Fail only on stderr messages';
        return expect(branch.processBranchOutput(output)).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: 'main', scope: 'local', remote: 'origin', head: '31e4d1636e687737f02905f29b9c0d0e5c442f4e' }),
                expect.objectContaining({ ref: 'bugfix/handleHTTPS', scope: 'local', remote: 'origin', head: 'efa41605007195577e57f71446d6195489d4e329' })
            ])
        );
    });

    it('processBranchOutput handles remote branches', () => {
        const output = '  remotes/origin/feature-ext                                    4a72a5333ef48a0668a3c1228787db9f326096bd demonstration sorting algorithm\n  remotes/origin/main                                                       31e4d1636e687737f02905f29b9c0d0e5c442f4e Fail only on stderr messages';
        return expect(branch.processBranchOutput(output)).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: 'main', scope: 'remote', remote: 'origin', head: '31e4d1636e687737f02905f29b9c0d0e5c442f4e' })
            ])
        );
    });
});