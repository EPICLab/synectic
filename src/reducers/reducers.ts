import { combineReducers } from 'redux';
import {
  // ADD_TODO,
  // TOGGLE_TODO,
  SET_VISIBILITY_FILTER,
  VisibilityFilters,
  ActionType
} from '../actions/actions';

const { SHOW_ALL } = VisibilityFilters;

// type TodoItem = {
//   text: string;
//   completed: boolean;
// }

// type TodoState = {
//   visibilityFilter: string;
//   todos: TodoItem[];
// }

function visibilityFilter(state = SHOW_ALL, action: ActionType) {
  switch (action.type) {
    case SET_VISIBILITY_FILTER:
      return action.filter;
    default:
      return state;
  }
}

// function todos(state: TodoItem[] = [], action: ActionType) {
//   switch (action.type) {
//     case ADD_TODO:
//       return [
//         ...state,
//         {
//           text: action.text,
//           completed: false
//         }
//       ];
//     case TOGGLE_TODO:
//       return state.map((todo, index) => {
//         if (index === action.index) {
//           return Object.assign({}, todo, {
//             completed: !todo.completed
//           });
//         }
//         return todo;
//       });
//     default:
//       return state;
//   }
// }

const todoApp = combineReducers({
  visibilityFilter
});

export default todoApp;