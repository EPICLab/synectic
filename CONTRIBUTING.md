# Contributing Code
All development must occur on feature or bugfix branches and be submitted via Pull Request. The following steps represent the preferred workflow, and include details about contribution requirements:
1. Create a feature or bugfix branch with a name that is representative of the development purpose (e.g. `feature/drag-n-highlight`, `bugfix/ghosting_images`, `feature/pixel-comparison`). Names that reference issue numbers, usernames, or random animals are not acceptable naming conventions.
2. Develop code and commit to the new branch with commit messages that provide context for underlying changes contained within each commit. [Avoid platform dependent code](http://flight-manual.atom.io/hacking-atom/sections/cross-platform-compatibility/).
3. When development is complete, and all requirements listed in any associated issues have been met, submit a Pull Request to the `development` branch. Include a bulleted list of contribution features/bugfixes/alterations in the PR description. Do not include issue numbers in the PR title, but do use the [Linked issues](https://help.github.com/en/github/managing-your-work-on-github/linking-a-pull-request-to-an-issue) feature in GitHub to link the pull request to the related issue(s) and close them when the pull request is merged.
4. Review the results of [Travis-CI](https://travis-ci.org/EPICLab/synectic). Pull Requests will not be accepted unless all tests are passing for that branch.
5. Wait for a code review from at least one other developer on the project. Address any changes requested during the review in order to gain approval.
6. Once merged, make updates to any related issues as needed for status tracking.

# Recommended Coding References
Several sections of the Synectic API include advanced TypeScript features and the codebase can be difficult to understand for a newcomer, therefore the following references are compiled here for reading as needed:
* [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/generics.html)
* [TypeScript Handbook: JSX](https://www.typescriptlang.org/docs/handbook/jsx.html)
* [TypeScript Deep Dive: Arrow Functions](https://basarat.gitbook.io/typescript/future-javascript/arrow-functions)
* [TypeScript Deep Dive: Rest Parameters](https://basarat.gitbook.io/typescript/future-javascript/rest-parameters)
* [TypeScript Deep Dive: Type Assertion](https://basarat.gitbook.io/typescript/type-system/type-assertion)
* [TypeScript Deep Dive: Type Guard](https://basarat.gitbook.io/typescript/type-system/typeguard)
* [TypeScript Deep Dive: Literal Types](https://basarat.gitbook.io/typescript/type-system/literal-types)
* [Using `Async/Await` with Typescript Classes](http://ivanbatic.com/using-async-await-typescript-classes/)
* [Keep Your Promises in TypeScript using `async/await`](https://blog.bitsrc.io/keep-your-promises-in-typescript-using-async-await-7bdc57041308)
* [Asynchronous Processing with TypeScript and Generic Promises](https://visualstudiomagazine.com/articles/2015/03/01/asynchronous-processing.aspx)
* [TypeScript 2.1: `keyof` and Lookup Types](https://mariusschulz.com/blog/typescript-2-1-keyof-and-lookup-types)
