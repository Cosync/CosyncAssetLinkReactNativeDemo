//
//  ProgressiveAsset.js
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

//Import React and Hook we needed
import React, {useContext, useState, useEffect} from 'react';

//Import all required component
import { StyleSheet, View, Text, Image, ActivityIndicator,TouchableOpacity } from 'react-native'; 
import VideoPlayer from './VideoPlayer'; 
import Sound from 'react-native-sound';
import { AuthContext } from '../context/AuthContext'; 
import Configure from '../config/Config';


const ProgressiveAsset = props => {
    const {  realmUser, realm } = useContext(AuthContext); 
    const { item, onDeleteAsset, onRefreshAsset, ...attributes } = props; 
    let [loading, setLoading] = useState(false); 
    let [error, setLoadingError] = useState(false); 
    let [asset, setAssetObject] = useState(item); 

    Sound.setCategory('Playback');
    

    useEffect(() => { 
        
        // if(asset.contentType.indexOf("video") >= 0){
        //     console.log("ProgressiveAsset url ",item.url)
        // }
    })

    const deleteAsset = () => {
        
        setLoading(true); 
        onDeleteAsset(asset) 
    } 
   

    const refreshAsset = async () => {
        
        setLoadingError(false);
        setLoading(true); 

        let id = asset._id.toString();
        try { 
            let newAsset = await realmUser.functions.CosyncRefreshAsset(id)
            let result = JSON.parse(newAsset);
            onRefreshAsset(result[0]) 
            setLoading(false); 
          
        } catch (error) {
            console.log("refreshAsset ", error)
          
            setLoading(false);
        }
       

    }

    const handleErrorAsset = (e) => { 
        console.log('handleErrorLoadImage ', e);
        setLoading(false);
        setLoadingError(true); 
    }


    const stopSound = () => {
        if(!global.sound) return;
        
        global.sound.stop(() => {
            console.log('Stop');
        });
    }

    const playSound = (item) => { 
        setLoading(true);

        if(global.sound) global.sound.stop();

        global.sound = new Sound(item.url, null, (error) => {
            setLoading(false);
            if (error) {
              console.log('failed to load the sound', error);
              return;
            }
            // loaded successfully
            //console.log('duration in seconds: ' + sound.getDuration() + 'number of channels: ' + sound.getNumberOfChannels());
           
            // Play the sound with an onEnd callback
            global.sound.play((success) => {
              if (success) {
                console.log('successfully finished playing');
              } else {
                console.log('playback failed due to audio decoding errors');
              }
              global.sound.release();
            });
          });
 
    }

    return ( 
        <View style={styles.container}>  
            <View style={styles.assetStyle}>
               
                { asset.contentType.indexOf("image") >= 0 && ImageAsset(asset) }  
                { asset.contentType.indexOf("video") >= 0 &&  VideoAsset(asset) }  
                { asset.contentType.indexOf("sound") >= 0 && SoundAsset(asset) }   
                { asset.caption != "" && asset.caption && <Text style={styles.captionBoxStyle} > {asset.caption} </Text>  }
                
            </View> 

            {
            error && <View style={styles.errorBoxStyle}>  
                <Text
                    style={styles.textErrorStyle}
                    onPress={refreshAsset}>
                    Expired Asset, Tap here to refresh
                </Text> 
            </View>
            } 

            {
                loading && <View style={styles.loadingBackground}> 
                    <ActivityIndicator animating={true} size='large' /> 
                </View>
               
            } 
            { !loading && <View style={styles.buttonRedStyle}>  
                    <TouchableOpacity onPress={ deleteAsset } >
                        <Text style={styles.soundBtnTextStyle}>Remove</Text>
                    </TouchableOpacity> 
                </View>
            }
      </View>

       
    );



    function ImageAsset(asset) {
        return (
            <View style={styles.mediaStyle}>   
                <Image 
                    onLoadStart={(e) => setLoading(true)}
                    onLoadEnd={(e) => setLoading(false)} 
                    onError={ handleErrorAsset }
                    source={{ uri: asset.urlMedium || 'undefined'}} 
                    style={[styles.imageThumbStyle]}
                />
            </View > 
        );
    }

    function VideoAsset(asset) {
        return (
            <View style={styles.mediaStyle}>   
                <VideoPlayer 
                    item = {asset}  
                    onLoadStart={(e) => setLoading(true)}
                    onLoadEnd={(e) => { setLoading(false)} }
                    onLoadError={handleErrorAsset}
                />
            </View > 
        );
    }

    function SoundAsset(asset) {
        return (
            <View style={styles.mediaStyle}> 
                <TouchableOpacity onPress={() => playSound(asset)}  style={styles.buttonStyle}>
                    <Text style={styles.soundBtnTextStyle}>Play Sound</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => stopSound()}  style={styles.buttonStyle}>
                    <Text style={styles.soundBtnTextStyle}>Stop Sound</Text>
                </TouchableOpacity>
            </View> 
        );
    }

};
export default ProgressiveAsset;


const styles = StyleSheet.create({
    container: { 
        flex: 1,  
        alignItems: 'center', 
        width: '100%',
        height: 250,  
        flexDirection: 'row', 
        marginBottom: 20,
    },  

    assetStyle : {
        width: 250,
        height: 250,  
        alignItems: 'center', 
    },

    mediaStyle : {   
        width: 250,
        height: 250,  
    }, 
    imageThumbStyle: {  
        width: 250,
        height: 250, 
    }, 
    loadingBackground: {
        left: 80,
        position: 'absolute',
        alignItems: 'center', 
        backgroundColor: '#00000090', 
        height: 100,
        width: 100,
        borderRadius: 10, 
        justifyContent: 'space-around', 
    }, 
    errorBoxStyle : { 
        backgroundColor: '#00000090',
        position: 'absolute',
        width: 250,
        height: 250, 
        justifyContent: 'space-around', 
        color: '#FFFFFF',
    },
    captionBoxStyle : { 
        position: 'absolute',
        top:0,
        backgroundColor: '#00000090',
        color: '#FFF',
    },
    textStyle: {  
        color: '#4638ab', 
        fontSize: 18,
        paddingLeft:10
    }, 
    textErrorStyle: {  
        color: '#390a10',
        fontSize: 18,
        paddingLeft:10
    }, 

    buttonStyle: {
        backgroundColor: '#4638ab',
        borderWidth: 0,
        color: '#FFFFFF',
        borderColor: '#7DE24E',
        height: 40,
        alignItems: 'center',
        borderRadius: 10,
        marginLeft: 35,
        marginRight: 35,
        marginTop: 20,
        
    },

    buttonRedStyle: {
        backgroundColor: 'red', 
        color: '#FFFFFF', 
        height: 40, 
        borderRadius: 10, 
        marginLeft: 15,
        width:80,
        paddingLeft:10
       
    },

    soundBtnTextStyle: {
        color: 'white',
        paddingVertical: 10,
        fontSize: 16,
    },
     
     
})