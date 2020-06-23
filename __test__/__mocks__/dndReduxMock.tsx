/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable import/named */

/**
 * The `react-dnd` library requires all draggable components to be wrapped by a `DndProvider` higher-order
 * component (HOC) in order to manage the drag-and-drop interactions, which causes issues when testing in
 * conjunction with Enzyme (per bug: https://github.com/enzymejs/enzyme/issues/1852). Enzyme currently
 * handles forwardRefs by returning the Enzyme `WrapperComponent` via ref.current (when mounted within an
 * Enzyme test environment), instead of the internal component wrapped by `WrapperComponent`. This issue
 * is documented in https://github.com/react-dnd/react-dnd/issues/1506, and partially resolved in
 * https://github.com/react-dnd/react-dnd/pull/1570.
 * 
 * However, we also require a Redux Store context provider and therefore wrap the component with a 
 * `react-redux.Provider` before also wrapping the `DndProvider` by using the 
 * `react-dnd-test-utils/wrapInTestContext` method. However, this introduces errors when used in 
 * conjunction with React Function Components, since `decoratedComponentRef` is injected into the wrapped
 * component when calling `wrapInTestContext()` (as documented in 
 * https://github.com/react-dnd/react-dnd/issues/904).
 */
import React from 'react';
import { wrapInTestContext } from 'react-dnd-test-utils';
import { Store, AnyAction } from 'redux';
import { Provider } from 'react-redux';
import { DragDropManager } from 'dnd-core';

interface RefType {
  getManager: () => DragDropManager | undefined,
  getDecoratedComponent<T>(): T
}

export const wrapInReduxContext = <T,>(WrappedComponent: React.ComponentType<T>, store: Store<any, AnyAction>):
  React.ForwardRefExoticComponent<Pick<any, string | number | symbol> & React.RefAttributes<RefType>> => {
  const TestContextWrapper: React.ComponentType<any> = props => (
    <Provider store={store}>
      <WrappedComponent {...props} />
    </Provider>
  );
  return wrapInTestContext(TestContextWrapper);
};