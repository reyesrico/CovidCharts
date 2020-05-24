import React, { Component } from 'react';
import './Footer.scss';

class Footer extends Component {
  render() {
    return (
      <div className="footer">
        <div>
          Covid Charts&trade; is a platform coded by &nbsp;
          <a href="http://stuffie.azurewebsites.net/PM_Carlos-Reyes2.html" target="_blank" rel="noopener noreferrer">Carlos Reyes-Rico</a>.
        </div>
        <div>Why?: Click <a href="https://github.com/reyesrico/CovidCharts/blob/master/README.md">here</a></div>
        <div>Code: <a href="https://github.com/reyesrico/CovidCharts">https://github.com/reyesrico/CovidCharts</a></div>
        <div>Contact and Follow Me! Twitter: <a href="https://twitter.com/reyesrico">@reyesrico</a></div>

      </div>
    );
  }
};

export default Footer;
