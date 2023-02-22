'use strict';
import PropTypes from 'prop-types';
import React from 'react';

import {
  View,
  TextInput,
} from 'react-native';

import {
  CancelButton,
  SearchButton,
} from '../Misc.js';

import styles from '../Styles';
import strings from '../LocalizedStrings';
import {useGlobalState, useRtlFlexDir} from "../Hooks";

const SearchBar = ({
  search,
  setIsNewSearch,
  query,
  onChange,
  onFocus,
  autoFocus,
}) => {
  const { themeStr, theme, interfaceLanguage } = useGlobalState();
  const isHeb = interfaceLanguage === "hebrew";
  const submitSearch = () => {
    if (query) {
      setIsNewSearch(true);
      search('text', query, true, false, true);
      search('sheet', query, true, false, true);
    }
  };
  const textInputStyle = [styles.searchInput, isHeb ? styles.hebrewSystemFont : null, {textAlign: isHeb ? "right" : "left"}, theme.text];
  const placeholderTextColor = themeStr === "black" ? "#BBB" : "#777";
  const flexDirection = useRtlFlexDir(interfaceLanguage);
  return (
    <View style={[{flexDirection, alignItems: "center", borderRadius: 250, paddingHorizontal: 8}, theme.lighterGreyBackground]}>
        <SearchButton onPress={submitSearch} />
        <TextInput
          autoFocus={autoFocus}
          style={textInputStyle}
          onChangeText={onChange}
          onSubmitEditing={submitSearch}
          onFocus={onFocus}
          value={query}
          underlineColorAndroid={"transparent"}
          placeholder={strings.search}
          placeholderTextColor={placeholderTextColor}
          autoCorrect={false} />
        {query.length ?
          <CancelButton extraStyles={[{height: 12, width: 12}]} onPress={() => { onChange(""); }} />
          : null
        }
    </View>
  );
}
SearchBar.propTypes = {
  search:          PropTypes.func.isRequired,
  setIsNewSearch:  PropTypes.func.isRequired,
  query:           PropTypes.string.isRequired,
  onChange:        PropTypes.func.isRequired,
  onFocus:         PropTypes.func,
};

export default SearchBar;
