import * as React from 'react';

export class CheckboxWithLabel extends React.Component<{
  labelOn: string;
  labelOff: string;
}, {
  isChecked: boolean;
}> {
  constructor(props: Readonly<{ labelOn: string; labelOff: string }>) {
    super(props);
    this.state = { isChecked: false };
  }

  onChange = (): void => {
    this.setState({ isChecked: !this.state.isChecked });
  }

  render(): JSX.Element {
    return (
      <label>
        <input
          type="checkbox"
          checked={this.state.isChecked}
          onChange={this.onChange}
        />
        {this.state.isChecked ? this.props.labelOn : this.props.labelOff}
      </label>
    );
  }
}