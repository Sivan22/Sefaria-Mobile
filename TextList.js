'use strict';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import HTMLView from 'react-native-htmlview';
const styles         = require('./Styles');
const strings        = require('./LocalizedStrings');
const TextListHeader = require('./TextListHeader');
const LinkFilter     = require('./LinkFilter');
const VersionsBox    = require('./VersionsBox');

const {
  CategoryColorLine,
  LoadingView,
  LibraryNavButton,
} = require('./Misc.js');

const DEFAULT_LINK_CONTENT = {en: "Loading...", he: "טוען...", sectionRef: ""};

class TextList extends React.Component {
  static propTypes = {
    theme:                PropTypes.object.isRequired,
    themeStr:             PropTypes.oneOf(["white", "black"]).isRequired,
    interfaceLang:        PropTypes.oneOf(["english", "hebrew"]).isRequired,
    settings:             PropTypes.object,
    openRef:              PropTypes.func.isRequired,
    setConnectionsMode:   PropTypes.func.isRequired,
    openFilter:           PropTypes.func.isRequired,
    closeCat:             PropTypes.func.isRequired,
    updateCat:            PropTypes.func.isRequired,
    linkSummary:          PropTypes.array,
    linkContents:         PropTypes.array,
    loading:              PropTypes.bool,
    segmentRef:           PropTypes.string.isRequired,
    connectionsMode:      PropTypes.string,
    filterIndex:          PropTypes.number,
    recentFilters:        PropTypes.array.isRequired, /* of the form [{title,heTitle,refList}...] */
    versionRecentFilters: PropTypes.array.isRequired,
    versionFilterIndex:   PropTypes.number,
    currVersions:         PropTypes.object.isRequired,
    versions:             PropTypes.array.isRequired,
    textLanguage:         PropTypes.oneOf(["english","hebrew","bilingual"]),
    onDragStart:          PropTypes.func.isRequired,
    onDragMove:           PropTypes.func.isRequired,
    onDragEnd:            PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    Sefaria = props.Sefaria; //Is this bad practice to use getInitialState() as an init function
    const dataSource = this.generateDataSource(props);

    this.state = {
      dataSource,
      isNewSegment: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.segmentRef !== nextProps.segmentRef) {
      this.setState({isNewSegment:true});
    } else if (this.props.recentFilters !== nextProps.recentFilters ||
               this.props.connectionsMode !== nextProps.connectionsMode ||
               this.props.filterIndex !== nextProps.filterIndex ||
               this.props.linkContents !== nextProps.linkContents) {
      this.setState({dataSource: this.generateDataSource(nextProps)});
    }
  }

  componentDidUpdate() {
    if (this.state.isNewSegment)
      this.setState({isNewSegment:false});
  }

  generateDataSource = (props) => {
    const linkFilter = props.recentFilters[props.filterIndex];
    if (!linkFilter) {
      return [];
    }
    const isCommentaryBook = linkFilter.category === "Commentary" && linkFilter.title !== "Commentary"
    return linkFilter.refList.map((linkRef, index) => {
      const key = `${props.segmentRef}|${linkRef}`;
      const loading = props.linkContents[index] === null;
      return {
        key,
        ref: linkRef,
        //changeString: [linkRef, loading, props.settings.fontSize, props.textLanguage].join("|"),
        pos: index,
        isCommentaryBook: isCommentaryBook,
        content: props.linkContents[index],
      };
    });
  };

  renderItem = ({ item }) => {
    const loading = item.content == null;
    const linkContentObj = loading ? DEFAULT_LINK_CONTENT : item.content;
    return (<LinkContent
              theme={this.props.theme}
              themeStr={this.props.themeStr}
              settings={this.props.settings}
              openRef={this.props.openRef}
              refStr={item.ref}
              linkContentObj={linkContentObj}
              textLanguage={this.props.textLanguage}
              loading={loading}
              isCommentaryBook={item.isCommentaryBook}
    />);
  };

  onViewableItemsChanged = ({viewableItems, changed}) => {
    for (let item of viewableItems) {
      if (item.item.content === null) {
        this.props.loadLinkContent(item.item.ref, item.item.pos);
      }
    }
  };

  render() {
    const isSummaryMode = this.props.connectionsMode === null;
    const textListHeader = (
      <View
        onStartShouldSetResponder={(evt)=>this.props.onDragStart(evt)}
        onResponderMove={(evt)=>this.props.onDragMove(evt)}
        onResponderRelease={(evt)=>this.props.onDragEnd(evt)}>
        <TextListHeader
          Sefaria={Sefaria}
          theme={this.props.theme}
          themeStr={this.props.themeStr}
          interfaceLang={this.props.interfaceLang}
          setConnectionsMode={this.props.setConnectionsMode}
          closeCat={this.props.closeCat}
          category={isSummaryMode || true ? null : this.props.recentFilters[this.props.filterIndex].category}
          filterIndex={this.props.filterIndex}
          recentFilters={this.props.recentFilters}
          language={this.props.settings.language}
          connectionsMode={this.props.connectionsMode} />
      </View>
    );
    switch (this.props.connectionsMode) {
      case ('filter'):
        if (!this.state.isNewSegment) {
          // Using Dimensions to adjust marings on text at maximum line width because I can't figure out
          // how to get flex to center a component with maximum width without allows breaking the stretch
          // behavior of its contents, result in rows in the list view with small width if their content is small.
          var listViewStyles = [styles.textListContentListView];
          return (
            <View style={[styles.textColumn, this.props.theme.textListContentOuter, {maxWidth: null}]}>
              {textListHeader}
              <FlatList
                data={this.state.dataSource}
                renderItem={this.renderItem}
                getItemLayout={this.getItemLayout}
                contentContainerStyle={{justifyContent: "center"}}
                onViewableItemsChanged={this.onViewableItemsChanged}
                ListHeaderComponent={
                  <RecentFilterNav
                    theme={this.props.theme}
                    recentFilters={this.props.recentFilters}
                    filterIndex={this.props.filterIndex}
                    updateCat={this.props.updateCat}
                    language={this.props.settings.language}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.noLinks}>
                    <EmptyLinksMessage theme={this.props.theme} />
                  </View>
                }
              />
            </View>
          );
        } else {
          return null;
        }
      case 'versions': //note the "fall-through". see https://stackoverflow.com/questions/6513585/javascript-or-expression-in-a-switch-case
      case 'version open':
        return (
          <View style={[styles.textColumn, this.props.theme.textListContentOuter, {maxWidth: null}]}>
            {textListHeader}
            <VersionsBox
              interfaceLang={this.props.interfaceLang}
              theme={this.props.theme}
              mode={this.props.connectionsMode}
              currVersions={this.props.currVersions}
              mainVersionLanguage={this.props.textLanguage}
              vFilterIndex={this.props.versionFilterIndex}
              recentVFilters={this.props.versionRecentFilters}
              versions={this.props.versions}
              setConnectionsMode={this.props.setConnectionsMode}
              setFilter={()=>{}}
              selectVersion={()=>{}}
              onRangeClick={()=>{}}
            />
          </View>
        );
      default:
        // either `null` or equal to a top-level category
        let content;
        if (this.props.loading) {
          content = (<LoadingView />);
        } else {
          let viewList = [];
          for (let i = 0; i < this.props.linkSummary.length; i++) {
            const cat = this.props.linkSummary[i];
            const catFilterSelected = cat.category === this.props.connectionsMode;
            if (this.props.connectionsMode !== null && !catFilterSelected) { continue; }
            const heCategory = Sefaria.hebrewCategory(cat.category);
            const filter = new LinkFilter(cat.category, heCategory, cat.category, heCategory, cat.refList,cat.category);
            viewList.push(
                <LinkNavButton
                  theme={this.props.theme}
                  themeStr={this.props.themeStr}
                  settings={this.props.settings}
                  enText={cat.category}
                  heText={Sefaria.hebrewCategory(cat.category)}
                  isCat={true}
                  count={cat.count}
                  language={this.props.settings.language}
                  onPress={function(filter,category) {
                    if (catFilterSelected) {
                      this.props.openFilter(filter, "link");
                    } else {
                      this.props.setConnectionsMode(category);
                    }
                    Sefaria.track.event("Reader","Category Filter Click",category);
                  }.bind(this,filter,cat.category)}
                  key={cat.category} />);
            if (catFilterSelected) {
              //if true, means we have a category filter selected
              viewList = viewList.concat(cat.books.map((obook)=>{
                const filter = new LinkFilter(obook.title, obook.heTitle, obook.collectiveTitle, obook.heCollectiveTitle, obook.refList, cat.category);
                return (
                  <LinkNavButton
                    theme={this.props.theme}
                    themeStr={this.props.themeStr}
                    settings={this.props.settings}
                    enText={obook.collectiveTitle ? obook.collectiveTitle : obook.title} //NOTE backwards compatibility
                    heText={obook.heCollectiveTitle ? obook.heCollectiveTitle : obook.heTitle}
                    isCat={false}
                    count={obook.count}
                    language={this.props.settings.language}
                    onPress={function(filter,title) {
                      this.props.openFilter(filter, "link");
                      Sefaria.track.event("Reader","Text Filter Click",title);
                    }.bind(this,filter,obook.title)}
                    key={obook.title}
                  />
                );
              }));
              break;
            }
          }
          if (this.props.connectionsMode === null) {
            viewList.push(
              <ResourcesList
                key={"resourcesList"}
                theme={this.props.theme}
                themeStr={this.props.themeStr}
                interfaceLang={this.props.interfaceLang}
                versionsCount={this.props.versions.length}
                setConnectionsMode={this.props.setConnectionsMode}
              />
            );
          }
          content = (
            <ScrollView
              key={""+this.props.connectionsMode}
              contentContainerStyle={styles.textListSummaryScrollView}>
                {viewList}
            </ScrollView>
          );
        }
        return (
          <View style={[styles.textListSummary, this.props.theme.textListSummary]}>
            {textListHeader}
            {content}
          </View>);
    }
  }
}

class LinkNavButton extends React.Component {
  static propTypes = {
    theme:    PropTypes.object.isRequired,
    themeStr: PropTypes.string.isRequired,
    settings: PropTypes.object.isRequired,
    onPress:  PropTypes.func.isRequired,
    enText:   PropTypes.string,
    heText:   PropTypes.string,
    language: PropTypes.string,
    count:    PropTypes.number,
    isCat:    PropTypes.bool.isRequired,
  };

  render() {
    return (
      <LibraryNavButton
        theme={this.props.theme}
        themeStr={this.props.themeStr}
        settings={this.props.settings}
        isCat={this.props.isCat}
        onPress={this.props.onPress}
        enText={this.props.enText}
        heText={this.props.heText}
        count={this.props.count}
        withArrow={false} />
    );
  }
}


class LinkContent extends React.PureComponent {
  static propTypes = {
    theme:             PropTypes.object.isRequired,
    settings:          PropTypes.object,
    openRef:           PropTypes.func.isRequired,
    refStr:            PropTypes.string,
    linkContentObj:    PropTypes.object, /* of the form {en,he} */
    textLanguage:      PropTypes.string,
    loading:           PropTypes.bool,
    isCommentaryBook:  PropTypes.bool
  };
  constructor(props) {
    super(props);
    this.state = {
      resetKeyEn: 0,
      resetKeyHe: 1,
    };
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.themeStr !== nextProps.themeStr ||
        this.props.settings.fontSize !== nextProps.settings.fontSize) {
      this.setState({ resetKeyEn: Math.random(), resetKeyHe: Math.random() }); //hacky fix to reset htmlview when theme colors change
    }
  }
  render() {
    var lco = this.props.linkContentObj;
    var lang = Sefaria.util.getTextLanguageWithContent(this.props.textLanguage,lco.en,lco.he);
    var textViews = [];

    var hebrewElem =  <HTMLView
                        key={this.state.resetKeyHe}
                        stylesheet={styles}
                        value={"<hediv>"+lco.he+"</hediv>"}
                        textComponentProps={
                          {
                            style: [styles.hebrewText, styles.linkContentText, this.props.theme.text, {fontSize: this.props.settings.fontSize, lineHeight: this.props.settings.fontSize * 1.1}],
                            key: this.props.refStr+"-he"
                          }
                        }
                      />;
    var englishElem = <HTMLView
                        key={this.state.resetKeyEn}
                        stylesheet={styles}
                        value={"<endiv>"+"&#x200E;"+lco.en+"</endiv>"}
                        textComponentProps={
                          {
                            style: [styles.englishText, styles.linkContentText, this.props.theme.text, {fontSize: 0.8 * this.props.settings.fontSize, lineHeight: this.props.settings.fontSize}],
                            key: this.props.refStr+"-en"
                          }
                        }
                      />;
    if (lang == "bilingual") {
      textViews = [hebrewElem, englishElem];
    } else if (lang == "hebrew") {
      textViews = [hebrewElem];
    } else if (lang == "english") {
      textViews = [englishElem];
    }

    return (
      <TouchableOpacity style={[styles.searchTextResult, this.props.theme.searchTextResult]} onPress={()=>{this.props.openRef(this.props.refStr, this.props.linkContentObj.sectionRef)}}>
        {this.props.isCommentaryBook ? null : <Text style={[styles.en, styles.textListCitation, this.props.theme.textListCitation]}>{this.props.refStr}</Text>}
        {textViews}
      </TouchableOpacity>
    );
  }
}

class EmptyLinksMessage extends React.Component {
  static propTypes = {
    theme:         PropTypes.object.isRequired,
    interfaceLang: PropTypes.string
  };

  render() {
    return (<Text style={[styles.emptyLinksMessage, this.props.theme.secondaryText]}>{strings.noConnectionsMessage}</Text>);
  }
}

class ResourcesList extends React.Component {
  static propTypes = {
    theme:              PropTypes.object.isRequired,
    themeStr:           PropTypes.string.isRequired,
    interfaceLang:      PropTypes.oneOf(["english", "hebrew"]).isRequired,
    setConnectionsMode: PropTypes.func.isRequired,
    versionsCount:      PropTypes.number.isRequired,
  }

  render() {
    const isWhite = this.props.themeStr === "white";
    return (
      <View>
        <ToolsButton
          interfaceLang={this.props.interfaceLang}
          text={strings.versions}
          icon={isWhite ? require("./img/layers.png") : require("./img/layers-light.png")}
          theme={this.props.theme}
          count={this.props.versionsCount}
          onPress={()=>{ this.props.setConnectionsMode("versions"); }}
        />
      </View>
    );
  }
}

class ToolsButton extends React.Component {
  static propTypes = {
    interfaceLang: PropTypes.oneOf(["english", "hebrew"]).isRequired,
    theme:         PropTypes.object.isRequired,
    text:          PropTypes.string.isRequired,
    onPress:       PropTypes.func.isRequired,
    icon:          PropTypes.number,
    count:         PropTypes.number,
  }

  render() {
    const { count, theme, icon, interfaceLang } = this.props;
    const textStyle = interfaceLang === "english" ? styles.enInt : styles.heInt;
    const flexDir = interfaceLang === "english" ? null : styles.rtlRow;
    const iconComp = icon ? (<Image source={icon} style={styles.menuButton} resizeMode={Image.resizeMode.contain}></Image>) : null;
    const countComp = !!count || count === 0 ? <Text style={[styles.enInt, theme.secondaryText, styles.spacedText]}>{`(${count})`}</Text> : null
    return (
      <TouchableOpacity style={[styles.searchFilterCat, styles.toolsButton, flexDir, theme.bordered]} onPress={this.props.onPress}>
        { iconComp }
        <Text style={[textStyle, styles.spacedText, styles.toolsButtonText, theme.tertiaryText]}>{this.props.text}</Text>
        { countComp }
      </TouchableOpacity>
    );
  }
}

class RecentFilterNav extends React.Component {
  static propTypes = {
    theme:          PropTypes.object.isRequired,
    updateCat:      PropTypes.func.isRequired,
    recentFilters:  PropTypes.array,
    filterIndex:    PropTypes.number,
    language:       PropTypes.oneOf(["english","hebrew","bilingual"]),
  }

  render() {
    return (
      <View style={[styles.textListRecentFilterNav, {flexDirection: this.props.language === "hebrew" ? "row-reverse" : "row"}]}>
        { this.props.recentFilters.map((filter, i) =>
          <RecentFilterNavItem
            theme={this.props.theme}
            language={this.props.language}
            updateCat={this.props.updateCat}
            filter={filter}
            filterIndex={i}
            selected={i === this.props.filterIndex}
            key={filter.title + "|" + filter.category}
          />
        )}
      </View>
    );
  }
}

class RecentFilterNavItem extends React.Component {
    static propTypes = {
    theme:          PropTypes.object.isRequired,
    updateCat:      PropTypes.func.isRequired,
    filter:         PropTypes.object,
    filterIndex:    PropTypes.number,
    language:       PropTypes.oneOf(["english","hebrew","bilingual"]),
    selected:       PropTypes.bool
  };

    render() {
    var filterStr = this.props.language == "hebrew" ?
      (this.props.filter.heCollectiveTitle ? this.props.filter.heCollectiveTitle : this.props.filter.heTitle) : //NOTE backwards compatibility
      (this.props.filter.collectiveTitle ? this.props.filter.collectiveTitle : this.props.filter.title);

    const touchStyles = [styles.textListHeaderItem, this.props.theme.textListHeaderItem];
    var textStyles = [styles.textListHeaderItemText, this.props.theme.textListHeaderItemText, this.props.language == "hebrew" ? styles.hebrewText : styles.englishText];
    if (this.props.selected) {
      touchStyles.push(this.props.theme.textListHeaderItemSelected);
      textStyles.push(this.props.theme.textListHeaderItemTextSelected);
    }
    return (
      <TouchableOpacity
        style={touchStyles}
        disabled={this.props.selected}
        onPress={()=>{this.props.updateCat(null, this.props.filterIndex)}}
      >
        <Text style={textStyles}>{filterStr}</Text>
      </TouchableOpacity>
      );
  }
}


module.exports = TextList;
