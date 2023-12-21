//
//  UploadScreen.js
//  CosyncStorageReactNative
//
//  Licensed to the Apache Software Foundation (ASF) under one
//  or more contributor license agreements.  See the NOTICE file
//  distributed with this work for additional information
//  regarding copyright ownership.  The ASF licenses this file
//  to you under the Apache License, Version 2.0 (the
//  "License"); you may not use this file except in compliance
//  with the License.  You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing,
//  software distributed under the License is distributed on an
//  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
//  KIND, either express or implied.  See the License for the
//  specific language governing permissions and limitations
//  under the License.
//
//  Created by Tola Voeung.
//  Copyright © 2023 cosync. All rights reserved.
//
// Import React
import React, {useState, useEffect, useRef, useContext} from 'react'; 
// Import required components
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image, FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import Image Picker
import {launchImageLibrary} from 'react-native-image-picker';  
import ImageResizer from '@bam.tech/react-native-image-resizer';
import { AuthContext } from '../context/AuthContext';
import Loader from '../components/Loader';  
import UploadFile from '../components/UploadFile';  
import Video from 'react-native-video';   
import Configure from '../config/Config';

const UploadScreen = props => { 
  let  upoadedSource, cosyncInitAsset;
  let videoPlayer = useRef(null);  
  const [assetSource, setAssetSource] = useState({type: 'image'}); 
  const [loading, setLoading] = useState(false);  
  const [uploading, setUploading] = useState(false);    
  const [uploadList, setUploadList] = useState([]); 
  let [expirationHours, setExpiredHour] = useState('24'); 
  const { realm, realmUser, setRealmUser, login } = useContext(AuthContext); 

  useEffect(() => { 
     
    let isMounted = true;
    if (isMounted) {

      setUploadList([]); 
      setAssetSource({type: 'image'});
      checkRealm();
    }

    return () => {
        isMounted = false; 
    } 
  }, [])



  async function checkRealm(){ 
         
    setLoading(true);

    try { 
      if(!realmUser || !realmUser.id){ 

        let userEmail = await AsyncStorage.getItem('user_email');
        let userPassword = await AsyncStorage.getItem('user_password');  
          
        if(!userEmail || !userPassword) setRealmUser();
        else {
          let user = await login(userEmail, userPassword);
          AsyncStorage.setItem('user_id', user.id);  
        } 
      }   
      
    } catch (error) {
      
    }
    finally{
      setLoading(false);
    }

  }


    const uploadRequest = async (source) => {    

      try { 

        let request = await realmUser.functions.CosyncInitAsset(source.filePath, parseFloat(expirationHours), source.type);

        setLoading(false);  
        cosyncInitAsset = JSON.parse(request);
      
        console.log("uploadRequest cosyncInitAsset = ", cosyncInitAsset);

        if (cosyncInitAsset.statusCode == 200){  
          renderUploadView(cosyncInitAsset); 
        }
        else {
          alert('Sorry! your upload is failing. Please try again.');
        }
      } catch (error) {
        console.log(error);
        alert('Sorry! your upload is failing. Please try again.');
        setLoading(false);  
      } 
        
    }

    const chooseFile = () => {

      if(uploading){
        alert('Please wait your asset is being upload.')
        return;
      }

      let options = {
        title: 'Choose Image or Video', 
        mediaType: 'mixed',
        noData: true,
        storageOptions: {
          skipBackup: true,
          path: 'images',
        },
      };

      launchImageLibrary(options, (response) => {
        console.log(response);

        if (response.didCancel) console.log('User cancelled image picker');
        else if (response.error)  alert(response.error)
        else if(response && response.assets){
          let asset = response.assets[0];
          asset.type = asset.type ? asset.type : 'video/quicktime';  
         
          setUploadList([]);   
          setLoading(true);

          upoadedSource = asset;
          let imageName = upoadedSource.uri.split('/').pop(); 
          upoadedSource.filePath =  upoadedSource.type.indexOf("image") > -1 ? `images/${imageName}` : `videos/${imageName}`; 
           
          setAssetSource(asset); 
          uploadRequest(upoadedSource);
           
        }
        else {
          setLoading(false);
          alert('Invalid file')
        }

      });
    };

 
    const renderUploadView = (initUploadData) => { 
      
      setUploadList([]);  // reset flat list item

      let item = {}; 
      let uploadData = initUploadData.writeUrls;
      console.log("renderUploadView upoadedSource ", upoadedSource); 
      
      item.uri = upoadedSource.uri;
      item.id = 'origin';
      item.sizeType = upoadedSource.type.indexOf('image') >= 0 ? 'origin' : 'video'; 
      item.upload = false;
      item.uploaded = false;
      item.contentType = upoadedSource.type;
      item.writeUrl = uploadData.writeUrl;
      item.path = upoadedSource.uri;
      item.size = (parseInt(upoadedSource.fileSize) / 1024) / 1024;
      item.size = item.size.toFixed(2);
      item.source = upoadedSource;
      item.initUploadData = initUploadData;

      setUploadList(prevItems => {
        return [item];
      });

      if(upoadedSource.type.indexOf('image') > -1){ 
        resizeImage(uploadData, item, 'small', 300, 300);
        resizeImage(uploadData, item, 'medium',600, 600);
        resizeImage(uploadData, item, 'large', 900, 900);
      } 

    }
 

    const startUpload = () => {

      console.log("startUpload uploadList ", uploadList); 

      if(uploadList.length == 0) {
        alert('Please choose an image!')
        return;
      }

      setUploading(true); 

      let newList = uploadList.map(el => (
        el.upload == false ? {...el, upload: true} : el
      ));

      // tell flat list item to upload
      setUploadList(prevItems => {
        return newList;
      });   
    }
 

    const resizeImage = async (uploadData, source, sizeType, maxWidth, maxHeight) => {
      
        ImageResizer.createResizedImage(source.uri, maxWidth, maxHeight, 'JPEG', 100)
        .then(response => { 

            let item = response;
            item.id = `${maxWidth}-${maxHeight}`;
            item.sizeType = sizeType;
            item.type = source.type;
            item.upload = false;
            item.uploaded = false; 
            item.size = (parseInt(item.size) / 1024) / 1024; 
            item.size = item.size.toFixed(2);

            item.writeUrl = sizeType == 'small' ?  uploadData.writeUrlSmall : 
                            sizeType == 'medium' ?  uploadData.writeUrlMedium : uploadData.writeUrlLarge; 

            setUploadList(prevItems => {
                return [...prevItems, item];
            }); 

            
        })
        .catch(err => {
            // Oops, something went wrong. Check that the filename is correct and
            // inspect err to get more details.
            console.error(err)
        });
    }


    const handleItemUploaded = async (id) => { 


      let newList = uploadList.map(el => (
        el.id === id ?  {...el, uploaded: true} : el
      ));

      if(id == 'origin' || id == 'video'){ 
        alert('Asset is uploaded.'); 
       
        console.log("handleItemUploaded uploadList", uploadList);

        let item = uploadList.filter(item => item.id == 'origin' || item.id == 'video')[0]; 
        console.log("handleItemUploaded item", item);
        
        try { 
          let result = await realmUser.functions.CosyncCreateAsset(item.source.filePath, item.initUploadData.contentId, item.source.type,  parseFloat(expirationHours), item.source.fileSize);
          console.log("handleItemUploaded requestCreateAsset", result);

          let cosyncAsset = JSON.parse(result);
          let asset = cosyncAsset.asset;
          asset._id = new Realm.BSON.ObjectId();

          console.log("handleItemUploaded cosyncAsset.asset", cosyncAsset.asset);


          realm.write(() => { 
            realm.create(Configure.Realm.cosyncAsset, cosyncAsset.asset);
          });

          setUploading(false); 
        } catch (error) {

          console.log("handleItemUploaded error", error);

          setUploading(false); 
        }
      } 

     

      setUploadList(prevItems => {
        return newList;
      }); 
    };

    const onChanged = (text) =>{ 

      let numbers = '.0123456789';
      let newText = '';
      for (var i=0; i < text.length; i++) {
          if(numbers.indexOf(text[i]) > -1 ) {
              newText = newText + text[i];
          } 
      }
      
      setExpiredHour(newText);
    }

 
      return (
        <SafeAreaView style={{flex: 1}}>
          <Loader loading={loading == true}/> 

          <View style={styles.container}> 
              <TouchableOpacity activeOpacity={0.5}
                  style={styles.imageButtonStyle}
                  onPress={chooseFile}>
                  <View  style={styles.uploadBoxStyle}>  
                    { assetSource.type.indexOf('image') > -1 ?   
 
                      <Image
                        source={assetSource} 
                        style={styles.uploadBoxStyle}
                      /> 
                      :
                      <Video 
                        controls = {true} 
                        paused = {true}
                        ref={p => { videoPlayer = p; }} 
                        source={assetSource} 
                        volume={10}
                        style={styles.uploadBoxStyle}
                      /> 
                      
                    }

                  </View>

                  <View style={styles.textClickStyle}>
                      <Text style={styles.textUploadStyle}>Choose Image/Video</Text>  
                        
                  </View>

              </TouchableOpacity>

              <View style={styles.expiredHour} >
                <Text>Asset Expired Hours:</Text>
                <TextInput 
                  style={styles.inputStyle} 
                  keyboardType = 'numeric'
                  blurOnSubmit={false}
                  textContentType={'none'}
                  autoComplete= {'off'}
                  value = {expirationHours}
                  onChangeText={expirationHours => onChanged(expirationHours)}
                />
              </View>

              <TouchableOpacity
                  activeOpacity={0.5}
                  style={styles.buttonStyle}
                  disabled = {uploading}
                  onPress={startUpload}>
                 
                  <Text style={styles.textButtonStyle}>
                  Upload
                  </Text>
              </TouchableOpacity> 
         

          <FlatList 
                numColumns = {2}
                data={uploadList}
                style={styles.containerFlatList} 
                renderItem={({item}) => (
                  <UploadFile 
                    item = {item} 
                    itemUploaded={handleItemUploaded} 
                  />
                )} 
              /> 
        </View>
        </SafeAreaView>
      );
  };

  export default UploadScreen;
  
const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 10,
      alignItems: 'center' 
      
    },
    titleText: {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingVertical: 20,
    }, 
    uploadBoxStyle: {
      width: 320,
      height: 320 
    },
    textClickStyle :{
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      justifyContent: 'center', 
      alignItems: 'center', 
    }, 
    textUploadStyle: {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      color: 'white',
      backgroundColor: '#4638ab'
    },
    
    containerFlatList : {
      width: 300,
      flex: 1, 
      flexDirection: 'column',
    },
    buttonTextStyle: {
      color: 'white',
      paddingVertical: 10,
      fontSize: 16,
    },
    imageButtonStyle:{
      alignItems: 'center',
      flexDirection: 'row',
      backgroundColor: '#DDDDDD',
      padding: 10
    },

    buttonStyle: { 
      backgroundColor: '#4638ab',
      borderWidth: 0,
      color: '#FFFFFF',
      borderColor: '#7DE24E',
      height: 40,
      width:120,
      alignItems: 'center',
      borderRadius: 30,
      
    },
    textButtonStyle: {
      color: 'white',
      paddingVertical: 10,
      fontSize: 16,
    },
    inputStyle: { 
      height: 40,
      width: 100,  
      margin: 10, 
      color: '#4638ab',
      paddingLeft: 15,
      paddingRight: 15,
      borderWidth: 1,
      borderRadius: 30,
      borderColor: '#4638ab',
    },
    expiredHour : { 
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      marginTop: 10
    }
  });
