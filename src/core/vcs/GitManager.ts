import { PathLike } from 'fs-extra';
import { Repository } from './Repository';
import * as git from '../../core/vcs/git';
import * as path from 'path';

export class GitManager {

  private repositories: Map<string, Repository> = new Map();

  constructor() {
    // TODO: GitManager should reload the repositories map when Synectic is reopened.
  }

  /**
   * Asynchronously check whether a unique Repository exists for a git repository.
   * @param filepath A valid path for a file or directory.
   * @return A boolean indicating a Repository already exists for the git repository.
   */
  async has(filepath: PathLike): Promise<boolean> {
    const repoRoot = await git.getRepoRoot(filepath);
    const repoName = path.basename(repoRoot.toString());
    return this.repositories.has(repoName);
  }

  /**
   * Asynchronously retrieve the unique Repository for a git repository, creating
   * a new Repository if none previously existed.
   * @param filepath A valid path for a file or directory.
   * @return A Repository instance for the git repository containing the filepath.
   */
  async get(filepath: PathLike): Promise<Repository> {
    const repoRoot = await git.getRepoRoot(filepath);
    const repoName = path.basename(repoRoot.toString());
    let repo = this.repositories.get(repoName);
    if (repo) {
      return repo;
    } else {
      repo = new Repository(repoName, filepath);
      this.repositories.set(repoName, repo);
      return repo;
    }
  }

}
