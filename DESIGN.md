# Project Design

The design for Synectic is based on bubbling up principles used in the underlying [ARCHITECTURE](ARCHITECTURE.md) projects that we built upon, and including them within our own design and development processes. In particular, we maintain the following design principles:

## Unidirectional Data Flow

_Data has one, and only one, way to be transferred to other parts of the application._

This means that all data in Synectic follows the same lifecycle pattern, making the logic more predictable and easier to understand. A UI **view** is a result of the application **state**. **State** can only change when **actions** happen. And when **actions** happen, the **state** is updated. This principle encourages data normalization, so that we don't end up with multiple, independent copies of the same data that are unaware of one another (see [Single source of truth](#single-source-of-truth), [State is read-only](#state-is-read-only), and [Changes are made with pure functions](#changes-are-made-with-pure-functions)).

Within our React component tree, this principles means that state is always owned by one component. Any data that is affected by this state can only affect components below it (i.e. it's children). Changing state on a component will never affect its parent, or its siblings, or any other component in the application; just its children. For this reason, a lot of the state is moved up in the component tree so that it can be shared between components that need access to it.

Derived from [Redux's Data Flow](https://redux.js.org/basics/data-flow).

## Separate Presentational and Container Components

_Presentational components maintain how things look, whereas Container components maintain how things work._

React bindings for Redux separate _presentational_ components from _container_ components. **Presentational** components are concerned with the visual presentation of data (e.g. markup, style, UI layout) and are _unaware of Redux_, which translates to all data being read through React component [props](https://reactjs.org/docs/components-and-props.html) and changes to data require invoking a props callback. **Container** components are concerned with the managing the state of data (e.g. data fetching, state updates) and are _aware of Redux_, which translates to all data being read by subscribing to Redux state and changes to data being propagated by dispatching Redux actions. This approach makes Synectic easier to understand and allow for more easily reusing components (see [Composite reuse](#composite-reuse)).

Derived from [Redux's Usage with React Tutorial](https://redux.js.org/basics/usage-with-react#presentational-and-container-components).

## Composite Reuse

_Components should be composed of reusable functionality, instead of inheriting predefined attributes._

Composition over inheritance (or composite reuse principle) in object-oriented programming (OOP) is the principle that classes should achieve polymorphic behavior and code reuse by their composition (by containing instances of other classes that implement the desired functionality) rather than inheritance from a base or parent class.

Derived from [React's Composition vs Inheritance](https://reactjs.org/docs/composition-vs-inheritance.html).

## Single source of truth

_The state of the whole application is stored in an object tree within a single store._

This makes it easy to create universal apps, as the state from the underlying server can be serialized and hydrated into the client with no extra coding effort. A single state tree also makes it easier to debug or inspect an application; it also enables you to persist your app's state in development, for a faster development cycle. Some functionality which has been traditionally difficult to implement - Undo/Redo, for example - can suddenly become trivial to implement, if all of your state is stored in a single tree.

Derived from [Redux's Three Principles](https://redux.js.org/introduction/three-principles#single-source-of-truth).

## State is read-only

_The only way to change the state is to emit an action, an object describing what happened._

This ensures that neither the views nor the network callbacks will ever write directly to the state. Instead, they express an intent to transform the state. Because all changes are centralized and happen one by one in a strict order, there are no subtle race conditions to watch out for. As actions are just plain objects, they can be logged, serialized, stored, and later replayed for debugging or testing purposes.

Derived from [Redux's Three Principles](https://redux.js.org/introduction/three-principles#state-is-read-only).

## Changes are made with pure functions

_To specify how the state tree is transformed by actions, you write pure reducers._

Reducers are just pure functions that take the previous state and an action, and return the next state. Remember to return new state objects, instead of mutating the previous state. You can start with a single reducer, and as your app grows, split it off into smaller reducers that manage specific parts of the state tree. Because reducers are just functions, you can control the order in which they are called, pass additional data, or even make reusable reducers for common tasks such as pagination.

Derived from [Redux's Three Principles](https://redux.jss.org/introduction/three-principles#changes-are-made-with-pure-functions).
