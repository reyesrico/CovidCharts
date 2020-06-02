import React, { Component } from 'react';
import ReactLoading from 'react-loading';
import LoadingProps from '../types/LoadingProps';

import './Loading.scss';

class Loading extends Component<LoadingProps, any> {
  getSize(): number {
    switch(this.props.size) {
      case 'sm':
        return 8;
      case 'md':
        return 16;
      case 'lg':
        return 32;
      case 'xl':
        return 64;
      default:
        return 8;
    }
  }

  render() {
    const { message, showProgress } = this.props;
    const size = this.getSize();

    return (
      <div className={showProgress? "stuffie-loading-progress" : "stuffie-loading"}>
        <ReactLoading type="spin" color="#00f" height={size} width={size} />
        {message && (<div className="stuffie-loading__message">{message}</div>)} 
      </div>
    );
  }
}

export default Loading;
 