/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable import/named */

/**
 * The react-dnd library has an issue with Enzyme tests that interact with the DragDropManager on
 * context-aware components, per https://github.com/react-dnd/react-dnd/issues/1506. This solution
 * was created by JKillian (https://github.com/JKillian) and published here: 
 * https://github.com/react-dnd/react-dnd/pull/1570
 */
import React from 'react';
import TestBackendImpl from 'react-dnd-test-backend';
import { DndProvider, DndContext } from 'react-dnd';
import { DragDropManager } from 'dnd-core';
import { Store, AnyAction } from 'redux';
import { Provider } from 'react-redux';

interface RefType {
  getManager: () => DragDropManager | undefined;
}

export function wrapInTestContext(DecoratedComponent: any, store: Store<any, AnyAction>): any {
  const forwardRefFunc = (props: any, ref: React.Ref<RefType>) => {
    const dragDropManager = React.useRef<any>(undefined);

    React.useImperativeHandle(ref, () => ({
      getManager: () => dragDropManager.current,
    }));

    return (
      <Provider store={store}>
        <DndProvider backend={TestBackendImpl}>
          <DndContext.Consumer>
            {ctx => {
              dragDropManager.current = ctx.dragDropManager;
              return null;
            }}
          </DndContext.Consumer>
          <DecoratedComponent {...props} />
        </DndProvider>
      </Provider>
    );
  };
  forwardRefFunc.displayName = 'TestContextWrapper';

  return React.forwardRef(forwardRefFunc);
}