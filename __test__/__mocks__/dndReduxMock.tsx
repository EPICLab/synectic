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
 * However, we also require a Redux Store context provider and therefore replicate the 
 * `react-dnd-test-utils/wrapInTestContext()` from source and inject the necessary `react-redux.Provider`,
 * see https://github.com/react-dnd/react-dnd/blob/main/packages/testing/test-utils/src/utils.tsx. This
 * also introduces errors when used in conjunction with React Function Components, as documented in
 * https://github.com/react-dnd/react-dnd/issues/904.
 */
import React from 'react';
import { wrapInTestContext } from 'react-dnd-test-utils';
import { Store, AnyAction } from 'redux';
import { Provider } from 'react-redux';

export const wrapInReduxContext = (WrappedComponent: React.ComponentType<any>, store: Store<any, AnyAction>) => {
  const TestContextWrapper: React.ComponentType<any> = props => (
    <Provider store={store}>
      <WrappedComponent {...props} />
    </Provider>
  );
  return wrapInTestContext(TestContextWrapper);
};