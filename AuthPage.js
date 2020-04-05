'use strict';

import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import remoteConfig from '@react-native-firebase/remote-config';

import {
  RainbowBar,
  CircleCloseButton,
  SystemButton,
} from './Misc';
import { GlobalStateContext, DispatchContext, STATE_ACTIONS, getTheme } from './StateManager';
import Sefaria from './sefaria';
import strings from './LocalizedStrings';
import styles from './Styles';

const onSubmit = async (formState, authMode, setErrors, onLoginSuccess, setIsLoading) => {
  setIsLoading(true);
  const mobileAppKey = await getMobileAppKey();
  formState.mobile_app_key = mobileAppKey;
  let errors = await Sefaria.api.authenticate(formState, authMode);
  if (!errors) { errors = {}; }
  setErrors(errors);
  setIsLoading(false);
  if (Object.keys(errors).length === 0 && Sefaria._auth.uid) {
    onLoginSuccess();
  }

};

const getMobileAppKey = async () => {
  remoteConfig().setDefaults({ mobile_app_key: '' });
  await remoteConfig().fetch(0);
  const activated = await remoteConfig().activate();
  if (!activated) { console.log('Fetch data not activated'); return ''; }
  const snapshot = await remoteConfig().getValue('mobile_app_key');
  return snapshot.value;
};

const useAuthForm = (authMode, onLoginSuccess) => {
  const [first_name, setFirstName] = useState(null);
  const [last_name, setLastName] = useState(null);
  const [email, setEmail] = useState(null);
  const [password, setPassword] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const formState = {
    first_name,
    last_name,
    email,
    password,
  };
  return {
    errors,
    setFirstName,
    setLastName,
    setEmail,
    setPassword,
    isLoading,
    onSubmit: () => { onSubmit(formState, authMode, setErrors, onLoginSuccess, setIsLoading) },
  }
}

const AuthPage = ({ authMode, close, showToast, openLogin, openRegister, openUri, syncHistory }) => {
  const dispatch = useContext(DispatchContext);
  const { themeStr, interfaceLanguage } = useContext(GlobalStateContext);
  const {
    errors,
    setFirstName,
    setLastName,
    setEmail,
    setPassword,
    isLoading,
    onSubmit,
  } = useAuthForm(authMode, async () => {
    dispatch({
      type: STATE_ACTIONS.setIsLoggedIn,
      value: true,
    });
    // try to sync immediately after login
    syncHistory();
    close();
    showToast(strings.loginSuccessful);
  });
  const theme = getTheme(themeStr);
  const isLogin = authMode === 'login';
  const placeholderTextColor = themeStr == "black" ? "#BBB" : "#777";
  const isHeb = interfaceLanguage === 'hebrew';
  return(
    <ScrollView style={{flex:1, alignSelf: "stretch"}} contentContainerStyle={{alignItems: "center", paddingBottom: 50}} keyboardShouldPersistTaps='handled'>
      <RainbowBar />
      <View style={{ flex: 1, alignSelf: "stretch", alignItems: "flex-end", marginHorizontal: 10}}>
        <CircleCloseButton onPress={close} />
      </View>
      <Text style={[styles.pageTitle, theme.text]}>{isLogin ? strings.log_in : strings.sign_up}</Text>
      <View style={{flex: 1, alignSelf: "stretch",  marginHorizontal: 37}}>
        <View style={styles.logInMotivator}>
          {
            [
              {iconStr: 'star', text: strings.saveTexts},
              {iconStr: 'sync', text: strings.syncYourReading},
              {iconStr: 'sheet', text: strings.readYourSheets},
              {iconStr: 'mail', text: strings.getUpdates},
            ].map(x => (<LogInMotivator key={x.iconStr} { ...x } />))
          }
        </View>
        { isLogin ? null :
          <AuthTextInput
            placeholder={strings.first_name}
            placeholderTextColor={placeholderTextColor}
            error={errors.first_name}
            errorText={errors.first_name}
            onChangeText={setFirstName}
          />
        }
        { isLogin ? null :
          <AuthTextInput
            placeholder={strings.last_name}
            placeholderTextColor={placeholderTextColor}
            error={errors.last_name}
            errorText={errors.last_name}
            onChangeText={setLastName}
          />
        }
        <AuthTextInput
          placeholder={strings.email}
          autoCapitalize={'none'}
          placeholderTextColor={placeholderTextColor}
          error={errors.username || errors.email}
          errorText={errors.username || errors.email}
          onChangeText={setEmail}
        />
        <AuthTextInput
          placeholder={strings.password}
          placeholderTextColor={placeholderTextColor}
          isPW={true}
          error={errors.password || errors.password1}
          errorText={errors.password || errors.password1}
          onChangeText={setPassword}
        />
        <ErrorText error={errors.non_field_errors} errorText={errors.non_field_errors} />
        <SystemButton
          isLoading={isLoading}
          onPress={onSubmit}
          text={isLogin ? strings.log_in : strings.sign_up}
          isHeb={isHeb}
          isBlue
        />
        {
          isLogin ?
            <View style={{ alignItems: 'center', marginTop: 15 }}>
              <View style={{flexDirection: isHeb ? 'row-reverse' : 'row', alignItems: 'center'}}>
                <Text style={[theme.secondaryText, isHeb ? styles.heInt : styles.enInt]}>{strings.dontHaveAnAccount}</Text>
                <TouchableOpacity onPress={openRegister}>
                  <Text style={[theme.text, isHeb ? styles.heInt : styles.enInt]}>{` ${strings.createAnAccount}`}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => { openUri('https://www.sefaria.org/password/reset')}}>
                <Text style={[theme.text, isHeb ? styles.heInt : styles.enInt]}>{strings.forgotPassword}</Text>
              </TouchableOpacity>
            </View>
          :
            <View style={{alignItems: 'center', marginTop: 15}}>
              <View style={{flexDirection: isHeb ? 'row-reverse' : 'row', alignItems: 'center'}}>
                <Text style={[theme.secondaryText, isHeb ? styles.heInt : styles.enInt]}>{strings.alreadyHaveAnAccount}</Text>
                <TouchableOpacity onPress={openLogin}>
                  <Text style={[theme.text, isHeb ? styles.heInt : styles.enInt]}>{` ${strings.log_in}.`}</Text>
                </TouchableOpacity>
              </View>

              <View style={{alignItems: 'center'}}>
                <Text style={[theme.secondaryText, isHeb ? styles.heInt : styles.enInt]}>{strings.byClickingSignUp}</Text>
                <TouchableOpacity onPress={() => { openUri('https://www.sefaria.org/terms')}}>
                  <Text style={[theme.text, isHeb ? styles.heInt : styles.enInt]}>{` ${strings.termsOfUseAndPrivacyPolicy}.`}</Text>
                </TouchableOpacity>
              </View>
            </View>
        }
      </View>
    </ScrollView>
  )
}
AuthPage.propTypes = {
  authMode: PropTypes.string.isRequired,
  close:    PropTypes.func.isRequired,
  showToast:PropTypes.func.isRequired,
  openLogin: PropTypes.func.isRequired,
  openRegister: PropTypes.func.isRequired,
  openUri: PropTypes.func.isRequired,
};

const ErrorText = ({ error, errorText }) => (
  error ?
    (
      <Text>
        { errorText }
      </Text>
    ) : null
);

const AuthTextInput = ({
  isPW,
  placeholder,
  placeholderTextColor,
  autoCapitalize,
  error,
  errorText,
  onChangeText,
}) => (
  <GlobalStateContext.Consumer>
    {
      ({ themeStr, interfaceLanguage }) => (
        <View>
          <TextInput
            style={[
              styles.textInput,
              styles.systemButton,
              styles.boxShadow,
              styles.authTextInput,
              interfaceLanguage === 'hebrew' ? styles.heInt : styles.enInt,
              getTheme(themeStr).text,
              getTheme(themeStr).mainTextPanel
            ]}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor}
            secureTextEntry={isPW}
            autoCapitalize={autoCapitalize}
            onChangeText={onChangeText}
          />
          <ErrorText error={error} errorText={errorText} />
        </View>
      )
    }
  </GlobalStateContext.Consumer>
);

const LogInMotivator = ({
  iconStr,
  text
}) => {
  const { themeStr, interfaceLanguage } = useContext(GlobalStateContext);
  const theme = getTheme(themeStr);
  const isHeb = interfaceLanguage === 'hebrew';
  let icon;
  if (themeStr === 'white') {
    if (iconStr === 'star')  { icon = require('./img/starUnfilled.png'); }
    if (iconStr === 'sync')  { icon = require('./img/sync.png'); }
    if (iconStr === 'sheet') { icon = require('./img/sheet.png'); }
    if (iconStr === 'mail')  { icon = require('./img/mail.png'); }
  } else {
    if (iconStr === 'star')  { icon = require('./img/starUnfilled-light.png'); }
    if (iconStr === 'sync')  { icon = require('./img/sync-light.png'); }
    if (iconStr === 'sheet') { icon = require('./img/sheet-light.png'); }
    if (iconStr === 'mail')  { icon = require('./img/mail-light.png'); }
  }
  return (
    <View style={{
        flexDirection: isHeb ? 'row-reverse' : 'row',
        marginBottom: 20,
      }}
    >
      <Image style={{height: 20, width: 20}} source={icon} resizeMode={'contain'} />
      <Text style={[{marginHorizontal: 20, fontSize: 16}, isHeb ? styles.heInt : styles.enInt, theme.text]}>{ text }</Text>
    </View>
  );
}

export {
  AuthPage,
  AuthTextInput,
};
