import React, { Component } from 'react';
import './Instructions.scss';

export default class Instructions extends Component<any, any> {
  render() {
    const { countrySelected } = this.props;

    return (
      <div className="instructions"> 
        <h4 className="instructions__title">Instructions</h4>
        <ol className="instructions__list">
          <li>Select a country</li>
          <li>If country has states data: select a state</li>
          <li>If country has cities data: select a city</li>
        </ol>
        <div className="instructions__examples">
          <div>Flatten Curves Examples: <b>Germany, Korea (South), United States (NY, NY)</b></div>
          <button
            className="instructions__button"
            onClick={event => event && localStorage.setItem("country", countrySelected.value)}>
            Save Default Country
          </button>
        </div>
      </div>
    );
  } 
}
