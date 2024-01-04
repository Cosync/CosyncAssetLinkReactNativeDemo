//
//  AssetScreen.js
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
import React, {useState, useEffect, useContext} from 'react';
// Import required components
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList
   
} from 'react-native'; 
import Configure from '../config/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from '../components/Loader';  
import ProgressiveAsset from '../components/ProgressiveAsset';   
import { AuthContext } from '../context/AuthContext';

const AssetScreen = props => {
  
  const [loading, setLoading] = useState(false);  
  const [flateListItem, setFlateListItem] = useState([]);
  const { realm, realmUser, setRealmUser, login } = useContext(AuthContext); 

  useEffect(() => { 
    
    let isMounted = true;
    if (isMounted) { 
      checkRealm();
    }

    setFlateListItem(prevItems => { 
      return [];
    }); 
    
    const assets = realm.objects(Configure.Realm.cosyncAsset).filtered(`userId = '${realmUser.id}' && status='active'`).sorted("createdAt", false); 
    assets.addListener(assetsEventListener);

    for (let index = 0; index < assets.length; index++) {
      const item = convertCosyncAsset(assets[index]);   
      setFlateListItem(prevItems => { 
        return [item, ...prevItems];
      });  
    }

    return () => {
      assets.removeListener(assetsEventListener); 
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
        else if (!realmUser){
          let user = await login(userEmail, userPassword);
          AsyncStorage.setItem('user_id', user.id);  
        } 
      }   

      
    } catch (error) {
      console.error(error);
    }
    finally{
      setLoading(false);
    }

  }

    

  function assetsEventListener(assets, changes) { 
    
    console.log("assetsEventListener ... insertions ", changes);
    
    try {  
      // Update UI in response to inserted objects
      changes.insertions.forEach((index) => {
        let item = convertCosyncAsset(assets[index]);  
        if(item.status == 'active'){  
          setFlateListItem(prevItems => { 
            return [item, ...prevItems];
          }); 
          
        }
      });

      // changes.newModifications.forEach((index) => {  
      // }) 
      

      // changes.deletions.forEach((index) => {   
      //   console.log(`Looks like asset index #${index} has left the realm.`); 
      // }) 

    } catch (error) {
      console.log("assetsEventListener changes  error", error);
    }

  }

  function convertCosyncAsset(cosyncAsset){
    let asset = {
      id:cosyncAsset._id.toString(),
      _id:cosyncAsset._id,
      userId: cosyncAsset.userId,
      path:cosyncAsset.path,
      expirationHours:cosyncAsset.expirationHours,
      expiration:cosyncAsset.expiration,
      contentType:cosyncAsset.contentType,
      size:cosyncAsset.size,
      duration:cosyncAsset.duration,
      color:cosyncAsset.color,
      xRes:cosyncAsset.xRes,
      yRes:cosyncAsset.yRes,
      caption:cosyncAsset.caption,
      status:cosyncAsset.status,
      url:cosyncAsset.url,
      urlSmall:cosyncAsset.urlSmall,
      urlMedium:cosyncAsset.urlMedium,
      urlLarge:cosyncAsset.urlLarge,
      urlVideoPreview:cosyncAsset.urlVideoPreview,
      createdAt:cosyncAsset.createdAt,
      updatedAt:cosyncAsset.updatedAt
    };

    return asset
  }
      

  function handleDeleteAsset(asset){
    console.log("handleDeleteAsset ", asset.id);
    setFlateListItem(flateListItem.filter(item => item.id !== asset.id )) 
    realm.write(() => { 
      // let realm function do the asset clean up
      realm.create(Configure.Realm.cosyncAsset, {_id: asset._id, status: 'deleted'}, 'modified');
    });
  }

  function handleRefreshAsset(asset){
    console.log("handleRefreshAsset ", asset);

    setFlateListItem((prev) => {
      const list = [...prev];
      for (let index = 0; index < list.length; index++) { 
        const item = list[index];
        if (item.id === asset._id) {
          list[index].url = asset.url;
          list[index].urlSmall = asset.urlSmall;
          list[index].urlMedium = asset.urlMedium;
        } 
      } 
      return list
    })

     

  }

    return (
      <SafeAreaView style={styles.container}>
        <Loader loading={loading} />  

        {flateListItem.length ?

        <FlatList 
          numColumns = {1}
          data={flateListItem}
          refreshing = {loading} 
          renderItem={({item}) => (
            <ProgressiveAsset item = {item} onDeleteAsset={handleDeleteAsset} onRefreshAsset={handleRefreshAsset}/>
          )}  
          horizontal={false}
          
        /> 
        : 
        <View style={styles.container}> 
          <Text style={styles.titleText}>
            No Asset
          </Text>
          
        </View> 
      }
          
      </SafeAreaView>
    );
};

export default AssetScreen;
    
const styles = StyleSheet.create({
    container: {
      flex: 1, 
      backgroundColor: '#fff',
      alignItems: 'center', 
    },
    titleText: {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      paddingVertical: 20,
    }, 
      
});
