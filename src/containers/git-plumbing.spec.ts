import { extractRepoName } from "./git-plumbing";

describe('containers/git-plumbing', () => {
    it('extractRepoName resolves git://*', () => {
        expect(extractRepoName('git://github.com/octo-org/octo-repo')).toBe('octo-org/octo-repo');
    });

    it('extractRepoName resolves git://*.git', () => {
        expect(extractRepoName('git://github.com/octo-org/octo-repo.git')).toBe('octo-org/octo-repo');
    });

    it('extractRepoName resolves https://*', () => {
        expect(extractRepoName('https://treygriffith@bitbucket.org/bucket-org/cellar.git')).toBe('bucket-org/cellar');
    });

    it('extractRepoName resolves https://*.git', () => {
        expect(extractRepoName('https://gitlab.com/gitlab-org/omnibus-gitlab.git')).toBe('gitlab-org/omnibus-gitlab');
    });

    it('extractRepoName resolves ssh://*.git', () => {
        expect(extractRepoName('ssh://git@gitlab.com:labuser/lab-repo.git')).toBe('labuser/lab-repo');
    });

    it('extractRepoName resolves https://gist', () => {
        expect(extractRepoName('https://bitbucket.org/snippets/vmaric/oed9AM/hello-json-message')).toBe('vmaric/oed9AM/hello-json-message');
    });

    it('extractRepoName resolves git@gist', () => {
        expect(extractRepoName('git@gist.github.com:3135914.git')).toBe('3135914');
    });

    it('extractRepoName resolves git+https://*.git#tag', () => {
        expect(extractRepoName('git+https://github.com/octo-org/octo-repo.git#2.7.0')).toBe('octo-org/octo-repo');
    });
});