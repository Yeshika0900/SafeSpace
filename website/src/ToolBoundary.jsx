import React from 'react';
export class ToolBoundary extends React.Component {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() {
    return this.state.failed ? <div role="alert" className="error">This tool could not display its results. Select another tool, then return to try again.</div> : this.props.children;
  }
}
