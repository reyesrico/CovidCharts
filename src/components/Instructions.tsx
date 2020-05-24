import React, { Component } from 'react';
import './Instructions.scss';

export default class Instructions extends Component {
  render() {
    return (
      <div className="instructions"> 
        <h4 className="instructions__title">Instructions</h4>
        <ol className="instructions__list">
          <li>Select a country</li>
          <li>If country has states data: Select a state</li>
          <li>If country has cities data: Select a city</li>
        </ol>
      </div>
    );
  } 
}
