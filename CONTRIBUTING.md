# Contributing

First and foremost, thank you! We appreciate that you want to contribute to Synectic, your time is valuable, and your contributions mean a lot to us.

## Scope

Do not create issues about bumping dependencies unless a bug has been identified, and you can demonstrate that it effects this project. Synectic is a desktop application, and therefore is not subject to the same security concerns as web applications. However, we do take security seriously, and will address any security concerns that are identified.

## Help us to help you

Remember that we’re here to help, but not to make guesses about what you need help with:

- Whatever bug or issue you're experiencing, assume that it will not be as obvious to the maintainers as it is to you.
- Spell it out completely. Keep in mind that maintainers need to think about _all potential use cases_ of a library. It's important that you explain how you're using a library so that maintainers can make that connection and solve the issue.

_It can't be understated how frustrating and draining it can be to maintainers to have to ask clarifying questions on the most basic things, before it's even possible to start debugging. Please try to make the best use of everyone's time involved, including yourself, by providing this information up front._

## Contributing Code

Setup your development environment by following the [Development](https://github.com/EPICLab/synectic/blob/main/README.md#development) instructions in the README.

All development should occur in branches (or forks) and be submitted as a Pull Request (PR) back to the `main` branch. The following steps represent the preferred workflow, and include details about contribution requirements:

1. Create a feature or bugfix branch with a name that is representative of the development purpose (e.g. `feature/drag-n-highlight`, `fix/ghosting_images`, `feature/pixel-comparison`). Names that reference issue numbers, usernames, or random animals are not acceptable naming conventions.
2. Develop code and commit to the new branch with commit messages that provide context for underlying changes contained within each commit. [Avoid platform dependent code](http://flight-manual.atom.io/hacking-atom/sections/cross-platform-compatibility/).
3. When development is complete, and all requirements listed in any associated issues have been met, submit a PR to the `main` branch. Include a bulleted list of contribution features/bugfixes/alterations in the PR description. Do not include issue numbers in the PR title. Do try to use the [Linked issues](https://help.github.com/en/github/managing-your-work-on-github/linking-a-pull-request-to-an-issue) feature in GitHub to link the pull request to the related issue(s).
4. Review the results of continuous integration via [GitHub Actions](https://github.com/EPICLab/synectic/actions/workflows/pull_requests_development.yml). Pull Requests will not be accepted unless all tests are passing for that branch.
5. Wait for a code review from at least one other developer on the project. Address any changes requested during the review in order to gain approval.
6. Once merged, make updates to any related issues as needed for status tracking.

## Recommended Coding References

Several sections of the Synectic API include advanced TypeScript features and the codebase can be difficult to understand for a newcomer, therefore the following references are compiled here for reading as needed:

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/generics.html)
- [TypeScript Handbook: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Handbook: JSX](https://www.typescriptlang.org/docs/handbook/jsx.html)
- [TypeScript Deep Dive: Arrow Functions](https://basarat.gitbook.io/typescript/future-javascript/arrow-functions)
- [TypeScript Deep Dive: Rest Parameters](https://basarat.gitbook.io/typescript/future-javascript/rest-parameters)
- [TypeScript Deep Dive: Type Assertion](https://basarat.gitbook.io/typescript/type-system/type-assertion)
- [TypeScript Deep Dive: Type Guard](https://basarat.gitbook.io/typescript/type-system/typeguard)
- [Using `Async/Await` with Typescript Classes](http://ivanbatic.com/using-async-await-typescript-classes/)
- [Keep Your Promises in TypeScript using `async/await`](https://blog.bitsrc.io/keep-your-promises-in-typescript-using-async-await-7bdc57041308)
- [Asynchronous Processing with TypeScript and Generic Promises](https://visualstudiomagazine.com/articles/2015/03/01/asynchronous-processing.aspx)

React and Redux:

- [Hooks API Reference](https://reactjs.org/docs/hooks-reference.html)
- [Using the React useContext Hook](https://medium.com/digio-australia/using-the-react-usecontext-hook-9f55461c4eae)
- [Idiomatic Redux: Why use action creators?](https://blog.isquaredsoftware.com/2016/10/idiomatic-redux-why-use-action-creators/)
- [ES6 Map with React.useState](https://medium.com/@jalalazimi/es6-map-with-react-usestate-9175cd7b409b)
- [Understanding the React useMemo Hook](https://www.digitalocean.com/community/tutorials/react-usememo)
- [How to Persist Your Redux Store](https://www.cloudsavvyit.com/9778/how-to-persist-your-redux-store/)

Jest Testing:

- [Taking Advantage of Jest Matchers (Part 1)](https://benmccormick.org/2017/08/15/jest-matchers-1/)
- [Taking Advantage of Jest Matchers (Part 2)](https://benmccormick.org/2017/09/04/jest-matchers-2/)
- [Jest matching objects in array](https://medium.com/@andrei.pfeiffer/jest-matching-objects-in-array-50fe2f4d6b98)

Advanced typing features in TypeScript:

- [TypeScript Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Deep Dive: Literal Types](https://basarat.gitbook.io/typescript/type-system/literal-types)
- [TypeScript 2.1: `keyof` and Lookup Types](https://mariusschulz.com/blog/typescript-2-1-keyof-and-lookup-types)
- [keyof and Lookup Types in TypeScript](https://mariusschulz.com/blog/keyof-and-lookup-types-in-typescript)
- [Typing Destructured Object Parameters in TypeScript](https://mariusschulz.com/blog/typing-destructured-object-parameters-in-typescript)
- [Conditional Types in TypeScript](https://mariusschulz.com/blog/conditional-types-in-typescript)
