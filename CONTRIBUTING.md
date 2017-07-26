# Contributing Code
All development must occur on feature branches and be submitted via Pull Request. The following steps represent the preferred workflow, and include details about contribution requirements:
1. Create a feature branch with a name that is representative of the feature (e.g. `drag-n-highlight`, `bugfix-ghosting`, `pixel-comparison`). Names that reference issue numbers, usernames, or random animals are not acceptable naming conventions.
2. Develop code and commit to the feature branch with commit messages that provide context for underlying changes contained within each commit. [Avoid platform dependent code](http://flight-manual.atom.io/hacking-atom/sections/cross-platform-compatibility/).
3. When feature is complete, and all requirements listed in any associated issues have been met, submit a Pull Request to the `master` branch. Include a bulleted list of contribution features/bugfixes/alterations in the PR description. Do not include issue numbers in the PR title.
4. Review the results of [Travis-CI](https://travis-ci.org/nelsonni/synectic). Pull Requests will not be accepted unless all tests are passing for that branch.
5. Wait for a code review from [@nelsonni](https://github.com/nelsonni). Address any changes requested during the review in order to gain approval.
6. Profit!
