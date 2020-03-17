# Contributing Code

All Synectic development should occur on purpose-specific branches that originate from the `development` branch, and when finished are submitted back to `development` through a pull request. The specific infrastructure and dependencies included in Synectic, along with descriptions of why each component is included and how it is configured, are found in the [DESIGN](DESIGN.md) document.

## Versioning

Synectic adheres to the [Semantic Versioning 2.0.0](https://semver.org/) standard (also known as `SemVer`), which states that:
```
Given a version number MAJOR.MINOR.PATCH, increment the:
  1. MAJOR version when you make incompatible API changes,
  2. MINOR version when you add functionality in a backwards compatible manner, and
  3. PATCH version when you make backwards compatible bug fixes.
```
When contributing a pull request to `development`, please select all version changes that are warranted based upon your proposed changes.

## Recommended Development Workflow

The following steps represent the preferred development workflow, and include details about contribution requirements:

1. Create a branch from `development` which has a name using either the `fix/` or `feature/` prefix followed by a brief descriptor (e.g. `fix/signin-issue` or `feature/file-explorer-card`). If your branch name includes multiple items, this is a strong indicator that they should be split into multiple branches and developed separately.

2. Develop code and commit to your branch using commit messages that provide a brief context for the underlying changes (e.g. *"adds enable/disable boolean parameter to draggable function"* or *"fixes infinite loop in Card initialization"*). Wherever possible, avoid adding [platform dependent code](http://flight-manual.atom.io/hacking-atom/sections/cross-platform-compatibility/).

3. Add additional [Jest](https://jestjs.io/) and [Enzyme](https://airbnb.io/enzyme/) tests to the `__test__` directory for any new or modified functionality within Synectic. Pull requests will not be submitted with failing or missing tests.

4. Verify JavaScript, TypeScript, and React code meets the project standards for readability, maintainability, and no functionality errors according to [ESLint]([ESLint](https://eslint.org/)) (`yarn lint`).

5. When code is complete, submit a pull request to the `development` branch. Use the *PULL_REQUEST_TEMPLATE* to provide the necessary descriptions for your PR, and link all related GitHub issues to the PR by using the *"This PR resolves #[XXXX], ..."* line to include the issue numbers (GitHub automatically adds the appropriate URLs for each issue).

6. The new PR will automatically trigger a [Travis-CI](https://travis-ci.org/nelsonni/synectic) build to verify that the code included in your PR will compile, passes all tests and linting rules, and will properly build MacOS, Linux, and Windows application distribution packages. Any issues in the CI build must be fixed within your branch and pushed to GitHub so that a new CI build can be triggered.

7. Once your PR has passed all tests and checks included in the CI build system, you will need to receive at least one code review and approval from a lead project maintainer. You can request code reviews from project members within the GitHub pull request interface (["Requesting a pull request review"](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/requesting-a-pull-request-review)). This process can require multiple rounds of comments and change requests from the reviewers.

8. Any merge conflicts that arise between your PR and `development` must be fixed within your branch. This can occur when your PR becomes stale (i.e. new commits that conflict with your code are added to the `development` branch after you created your PR). Unfortunately, this is a common downside of distribution version control (["Pull Requests: The Good, The Bad and The Ugly"](http://allyouneedisbackend.com/blog/2017/08/24/pull-requests-good-bad-and-ugly/)). You will need to refactor your code so that any merge conflicts are resolved, and new or modificed functionality is incorporated with your changes.

9. If all requirements listed above are met, then your PR should automatically merge into the `development` branch. The commits included in your PR will be squashed into a single commit that uses your PR description as the commit message, and further development on the branch used for that PR should be halted (a new branch with an appropriate branch name should be created instead).

# Recommended Developer References

Several sections of the Synectic API include advanced TypeScript and React features and the codebase can be difficult to understand for a newcomer, therefore the following references are compiled here for reading as needed:

* [TypeScript Deep Dive: Iterators](https://basarat.gitbooks.io/typescript/docs/iterators.html)
* [Simplify your JavaScript - Use `.map()`, `.reduce()`, and `.filter()`](https://medium.com/poka-techblog/simplify-your-javascript-use-map-reduce-and-filter-bd02c593cc2d)
* [Using `Async/Await` with Typescript Classes](http://ivanbatic.com/using-async-await-typescript-classes/)
* [Keep Your Promises in TypeScript using `async/await`](https://blog.bitsrc.io/keep-your-promises-in-typescript-using-async-await-7bdc57041308)
* [Asynchronous Processing with TypeScript and Generic Promises](https://visualstudiomagazine.com/articles/2015/03/01/asynchronous-processing.aspx)
* [TypeScript 2.1: `keyof` and Lookup Types](https://mariusschulz.com/blog/typescript-2-1-keyof-and-lookup-types)
* [YouTube: React Today and Tomorrow and 90% Cleaner React With Hooks](https://www.youtube.com/watch?v=dpw9EHDh2bM)
* [React: Refs and the DOM](https://reactjs.org/docs/refs-and-the-dom.html)
* [React: Building Your Own Hooks](https://reactjs.org/docs/hooks-custom.html)
* [React Higher-Order Components in TypeScript](https://medium.com/@jrwebdev/react-higher-order-component-patterns-in-typescript-42278f7590fb)
* [Unit Testing using Jest with TypeScript](https://basarat.gitbooks.io/typescript/docs/testing/jest.html)
* [Testing TypeScript with Jest](https://rjzaworski.com/2016/12/testing-typescript-with-jest)
* [Tutorial: TypeScript, React, and Redux](https://rjzaworski.com/2016/08/typescript-redux-and-react)
* [Testing React Components: Complete Guide](https://www.freecodecamp.org/news/testing-react-hooks/)
