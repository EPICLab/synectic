import {uuid} from '#preload';
import {
  FormControl,
  InputBase,
  MenuItem,
  Select,
  styled,
  type SelectChangeEvent,
} from '@mui/material';
import type {Modal} from '@syn-types/modal';
import {useState} from 'react';
import {shallowEqual} from 'react-redux';
import {useAppDispatch, useAppSelector} from '/@/store/hooks';
import modalSelectors from '/@/store/selectors/modals';
import repoSelectors from '/@/store/selectors/repos';
import {modalAdded, modalRemoved} from '/@/store/slices/modals';

const GitGraphSelect = () => {
  const repos = useAppSelector(state => repoSelectors.selectAll(state));
  const [selected, setSelected] = useState('');
  const graphs: Modal[] = useAppSelector(
    state => modalSelectors.selectByType(state, 'GitGraph'),
    shallowEqual,
  );
  const dispatch = useAppDispatch();

  const handleChange = (event: SelectChangeEvent) => {
    if (graphs.length > 0) graphs.map(graph => dispatch(modalRemoved(graph.id)));
    setSelected(event.target.value);
    const selectedRepo = repos.find(r => r.id === event.target.value);
    if (selectedRepo) dispatch(modalAdded({id: uuid(), type: 'GitGraph', repo: selectedRepo.id}));
  };

  return (
    <StyledFormContainer>
      <FormControl sx={{margin: 4}}>
        <Select
          labelId="repo-select-label"
          id="repo-select"
          value={repos.find(r => r.id === selected) ? selected : ''}
          defaultValue=""
          displayEmpty
          disabled={repos.length === 0}
          onChange={handleChange}
          input={<StyledInput />}
        >
          <MenuItem
            key=""
            value=""
            sx={{color: 'rgba(125,125,125,1)'}}
          >
            {selected ? 'Clear Map' : 'Repository Map'}
          </MenuItem>
          {repos.map(repo => (
            <MenuItem
              key={repo.id}
              value={repo.id}
            >
              {repo.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </StyledFormContainer>
  );
};

const StyledFormContainer = styled('div')(() => ({
  marginLeft: 'auto',
  position: 'absolute',
  zIndex: 1,
}));

const StyledInput = styled(InputBase)(({theme}) => ({
  borderRadius: 4,
  position: 'relative',
  backgroundColor: theme.palette.background.paper,
  border: '1px solid #ced4da',
  fontSize: 14,
  padding: '10px 26px 10px 12px',
  transition: theme.transitions.create(['border-color', 'box-shadow']),
  '&:focus': {
    borderRadius: 4,
    borderColor: '#80bdff',
    boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
  },
}));
export default GitGraphSelect;
