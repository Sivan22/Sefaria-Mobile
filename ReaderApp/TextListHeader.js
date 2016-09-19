'use strict';
import React, { Component } from 'react';
import {
  View,
  Text,
  TouchableOpacity
} from 'react-native';
var styles = require('./Styles.js');
var {
  CategoryColorLine,
  TripleDots
} = require('./Misc.js');

var TextListHeader = React.createClass({
	propTypes: {
		Sefaria:        React.PropTypes.object.isRequired,
    theme:          React.PropTypes.object.isRequired,
		updateCat:      React.PropTypes.func.isRequired,
		closeCat:       React.PropTypes.func.isRequired,
		category:       React.PropTypes.string,
		filterIndex:    React.PropTypes.number,
		recentFilters:  React.PropTypes.array,
		columnLanguage: React.PropTypes.string
	},
	getInitialState: function() {
		Sefaria = this.props.Sefaria; //Is this bad practice to use getInitialState() as an init function
		return {

		};
	},
	render: function() {
		var style = {"borderColor": Sefaria.palette.categoryColor(this.props.category)};

		var viewList = this.props.recentFilters.map((filter,i)=>{
			return (<TextListHeaderItem
            theme={this.props.theme}
						columnLanguage={this.props.columnLanguage}
						filter={filter}
						filterIndex={i}
						selected={i == this.props.filterIndex}
						updateCat={this.props.updateCat}
					/>
					);
		});

		return (
			<View style={[styles.textListHeader, this.props.theme.textListHeader, style]}>
				{viewList}
				<TripleDots onPress={this.props.closeCat}/>
			 </View>
			);
	}
});

var TextListHeaderItem = React.createClass({
	propTypes: {
    theme:          React.PropTypes.object.isRequired,
		updateCat:      React.PropTypes.func.isRequired,
		filter:         React.PropTypes.object,
		filterIndex:    React.PropTypes.number,
		columnLanguage: React.PropTypes.string,
		selected:       React.PropTypes.bool
	},
	render: function() {
		var filterStr = this.props.columnLanguage == "hebrew" ?
			this.props.filter.heTitle :
			this.props.filter.title;
		var stylesArray = [styles.textListHeaderItem, this.props.theme.textListHeaderItem, this.props.theme.text];
    if (this.props.selected)
      stylesArray.push(this.props.theme.textListHeaderItemSelected);
		return (
			<TouchableOpacity onPress={()=>{this.props.updateCat(null,this.props.filterIndex)}}>
				<Text style={stylesArray}>{filterStr}</Text>
			</TouchableOpacity>
			);
	}
});

module.exports = TextListHeader;
