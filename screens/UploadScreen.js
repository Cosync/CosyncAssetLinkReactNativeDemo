//
//  UploadScreen.js
//  CosyncAssetLinkReactNativeDemo
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
import Realm from 'realm' 

const UploadScreen = props => { 
  
  let videoPlayer = useRef(null);  
  const [assetSource, setAssetSource] = useState({asset:{type: 'image'}, uploadData:{}}); 
  const [loading, setLoading] = useState(false);  
  const [uploading, setUploading] = useState(false);   
  const [uploadingSuccessed, setUploadingSuccessed] = useState(false);  
  const [uploadList, setUploadList] = useState([]); 
  let [expirationHours, setExpiredHour] = useState('24'); 
  let [caption, setCaption] = useState(''); 
  const { realm, realmUser, setRealmUser, login } = useContext(AuthContext); 

  useEffect(() => { 
     
    let isMounted = true;
    if (isMounted) {

     // setUploadList([]); 
     // setAssetSource({asset:{type: 'image'}});
      checkRealm();
    }

    return () => {
        isMounted = false; 
    } 
  }, [])



  async function checkRealm(){ 
         
    console.log("checkRealm check session....");
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


    const uploadRequest = async () => {    

      try { 

        let source = assetSource.asset 
        console.log("uploadRequest source = ", source);

        if(!source.filePath){
          alert('Please choose an image/video.'); 
          return;
        }
        
        setLoading(true);  
       

        let request = await realmUser.functions.CosyncInitAsset(source.filePath, parseFloat(expirationHours), source.type);

        
        let cosyncInitAsset = JSON.parse(request);
      
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
         
          //setUploadList([]);   

          let updatedSource = asset;
          let imageName = updatedSource.uri.split('/').pop(); 
          updatedSource.filePath =  updatedSource.type.indexOf("image") > -1 ? `images/${imageName}` : `videos/${imageName}`; 
           
          setAssetSource(prev => ({...prev, asset, updatedSource})); // update the values in state
          //setAssetSource(asset); 
          //setLoading(true);
          //uploadRequest(updatedSource);
           
        }
        else {
          //setLoading(false);
          alert('Invalid file')
        }

      });
    };

 
    const renderUploadView = async (initUploadData) => { 
      
      //setUploadList([]); // reset flat list item

      let item = {}; 
      let uploadData = initUploadData.writeUrls;
      let updatedSource = assetSource.updatedSource
      console.log("renderUploadView updatedSource ", updatedSource); 
      
      item.uri = updatedSource.uri;
      item.id = 'origin';
      item.sizeType = updatedSource.type.indexOf('image') >= 0 ? 'origin' : 'video'; 
      item.status = 'init'; 
      item.uploading = false
      item.contentType = updatedSource.type;
      item.writeUrl = uploadData.writeUrl;
      item.path = updatedSource.uri;
      item.size = (parseInt(updatedSource.fileSize) / 1024) / 1024;
      item.size = item.size.toFixed(2);
      item.storageSize = item.size;
      item.source = updatedSource;
      item.initUploadData = initUploadData;
      

      setUploadList(prevItems => { 
        return [...prevItems, item];
      }); 
     
    

      if(updatedSource.type.indexOf('image') > -1){ 
        await resizeImage(uploadData, item, 'small', 300, 300);
        await resizeImage(uploadData, item, 'medium',600, 600);
        await resizeImage(uploadData, item, 'large', 900, 900);
      }  
  

      setLoading(false)
      
      
      // const myNextList = [...uploadList];
      // const updatedList = myNextList.map((item) => 
      //   item.status === 'init' ? {...item, status: 'start'} : item
      // );

      // setUploadList(updatedList)

    }
 
    const uploadAllItems = () => {

      console.log("uploadAllItems uploadList  ", uploadList.length);  


      setUploadList(uploadList.map(item => {
        if ( item.status === 'init') { 
          return {...item, status: 'start'} ;
        } else {
          // No changes
          return item;
        }

        
      }));

      // const myNextList = [...uploadList];
      // const updatedList = myNextList.map((item) => 
      //   item.status === 'init' ? {...item, status: 'start'} : item
      // );

      // setUploadList(updatedList)
 
    }
 
 

    const resizeImage = async (uploadData, source, sizeType, maxWidth, maxHeight) => {
      
      let item = await ImageResizer.createResizedImage(source.uri, maxWidth, maxHeight, 'JPEG', 100) 
    
      item.id = sizeType;
      item.sizeType = sizeType;
      item.type = source.type;
      item.status = 'init'; 
      item.size = (parseInt(item.size) / 1024) / 1024; 
      item.size = item.size.toFixed(2);
      item.uploading = false
      console.log(`resizeImage cut: ${sizeType} zise: ${ item.size}`);

      item.writeUrl = sizeType == 'small' ?  uploadData.writeUrlSmall : 
                      sizeType == 'medium' ?  uploadData.writeUrlMedium : uploadData.writeUrlLarge;  
      setUploadList(prevItems => { 
        return [...prevItems, item];
      }); 
      return true;
         
    }

    const resetUpload = () => {

      setAssetSource(prev => ({...prev, asset:{}, updatedSource:{}})); // update the values in state

    
      setUploadList(uploadList => {
        return [];
      });   

      setUploading(false); 
      setUploadingSuccessed(false); 

    }

    const handleItemUploadedProgress = (id) => {
      if(id === 'origin' || id === 'video'){
        setUploadingSuccessed(true)
      }

      console.log("handleItemUploadedProgress id", id); 

    }


    const handleItemUploaded = async (id) => { 
      console.log("handleItemUploaded id", id); 
 

      if(id === 'origin' || id === 'video'){ 
        alert('Asset is uploaded.'); 
        
        let item = uploadList.filter(item => item.id == 'origin' || item.id == 'video')[0]; 

        console.log("handleItemUploaded item", item.id);
        
        try {  

          const storageSize = uploadList.reduce( function (accumulator, asset){ 
            return accumulator + asset.size 
          } , 0 );


          let result = await realmUser.functions.CosyncCreateAsset(item.source.filePath, item.initUploadData.contentId, item.source.type,  parseFloat(expirationHours), item.source.fileSize, storageSize, 0, "0", 0, 0, caption);
         
          
          let cosyncAsset = JSON.parse(result);
          console.log("handleItemUploaded CosyncCreateAsset cosyncAsset ", cosyncAsset.statusCode); 

          resetUpload();

          if (cosyncAsset.statusCode == 200) { 
            let asset = cosyncAsset.asset;
            asset._id = new Realm.BSON.ObjectId(asset._id);

            console.log("handleItemUploaded creating CosyncAsset  ", asset);  

            realm.write(() => { 
              realm.create(Configure.Realm.cosyncAsset, asset);
            });
          }
          else {
            alert('Invalid Upload Data.'); 
          }
         

        } catch (error) {

          console.log("handleItemUploaded error", error);
          alert('Invalid Upload Data.'); 
          resetUpload();
        }
      } 
 
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
                    {  assetSource.asset.type && assetSource.asset.type.indexOf('image') > -1 ?   
 
                      <Image
                        source={assetSource.asset} 
                        style={styles.uploadBoxStyle}
                      /> 
                      :
                      <Video 
                        controls = {true} 
                        paused = {true}
                        ref={p => { videoPlayer = p; }} 
                        source={assetSource.asset} 
                        volume={10}
                        style={styles.uploadBoxStyle}
                      />  
                    }

                  </View>

                  <View style={styles.textClickStyle}>
                      <Text style={styles.textUploadStyle}>Choose Image/Video</Text>  
                  </View>

              </TouchableOpacity>

              <View style={styles.assetTextBox} >
                <Text>Expired Hours:</Text>
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

              <View style={styles.assetTextBox} >
                <Text>Asset Caption:</Text>
                <TextInput 
                  style={styles.inputStyle}  
                  blurOnSubmit={false}
                  textContentType={'none'}
                  autoComplete= {'off'}
                  value = {caption} 
                  onChangeText={value => setCaption(value)}
                />
              </View>

             
              <TouchableOpacity
                  activeOpacity={0.5}
                  style={styles.buttonStyle}
                  disabled = {uploading}
                  onPress={uploadList.length ? uploadAllItems :uploadRequest}>
                 
                  <Text style={styles.textButtonStyle}>
                  {uploadList.length ? 'Upload' : 'Request Upload'}
                  </Text>
              </TouchableOpacity> 
              {uploadingSuccessed && <Text style={{ fontSize: 18 }}>Your Asset is being created...</Text>} 

          <FlatList 
                numColumns = {2}
                data={uploadList}
                style={styles.containerFlatList} 
                renderItem={({item}) => (
                  <UploadFile 
                    item = {item} 
                    itemUploaded={handleItemUploaded} 
                    itemUploadedPregress = {handleItemUploadedProgress}
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
      width: 250,
      height: 250 
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
      width:180,
      alignItems: 'center',
      borderRadius: 15,
      marginTop:20
    },
    textButtonStyle: {
      color: 'white',
      paddingVertical: 10,
      fontSize: 16,
    },
    inputStyle: { 
      height: 40,
      width: 150,  
      margin: 5, 
      color: '#4638ab',
      paddingLeft: 15,
      paddingRight: 15,
      borderWidth: 1,
      borderRadius: 15,
      borderColor: '#4638ab',
    },
    assetTextBox : { 
      flexDirection: 'row',
      alignItems: 'center', 
      marginTop: 10
    }
  });
