import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

class SimpleSelect extends React.Component {
    state = { age: 10 };

    handleChange = ((event: React.ChangeEvent<{ name?: string | undefined; value: unknown; }>): void => {
        if (event.target.name)
            return this.setState({ [event.target.name]: event.target.value });
        return;
    });

    // handleChange = (event: React.ChangeEvent<{ value: unknown }>) =>
    //     this.setState({ [event.target.name]: event.target.value });

    render(): JSX.Element {
        return (
            <Select
                value={this.state.age}
                onChange={this.handleChange}
                inputProps={{
                    name: 'age',
                    id: 'age-simple'
                }}
                MenuProps={{
                    anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left'
                    },
                    transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left'
                    },
                    getContentAnchorEl: null
                }}
            >
                <MenuItem value="">
                    <em>None</em>
                </MenuItem>
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
            </Select>
        );
    }
}

export default SimpleSelect;
