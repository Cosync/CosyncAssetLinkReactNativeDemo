 //
//  Schema.js
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
 


exports.CosyncAsset = {
    "name":"CosyncAsset",
    "primaryKey":"_id",
    "properties": {
        "_id":{ "type": "objectId", "indexed": true },  
        "userId":{ "type": "string", "indexed": true },  
        "path":{ "type": "string", "default": ""},
        "expirationHours": { "type": "double", "default": 24}, 
        "expiration":  { "type": "date", "optional": true},
        "contentType":{ "type": "string", "optional": true}, 
        "size":{ "type": "int", "optional": true, "indexed": true },
        "storageSize":{ "type": "int", "optional": true, "indexed": true },
        "duration":{ "type": "double", "optional": true },
        "color": { "type": "string", "default":"#000000"},
        "xRes": { "type": "int", "default": 0 },
        "yRes": { "type": "int", "default": 0 }, 
        "caption": { "type": "string", "default": "" }, 
        "status":{ "type": "string", "default": "active", "indexed": true },
        "refCount":{ "type": "int", "default": 1, "indexed": true },
        "url":{ "type": "string", "optional": true },
        "urlSmall": { "type": "string", "optional": true },
        "urlMedium": { "type": "string", "optional": true },
        "urlLarge": { "type": "string", "optional": true },
        "urlVideoPreview": { "type": "string", "optional": true },
        "createdAt": { "type": "date" , "optional": true, "indexed": true },
        "updatedAt": { "type": "date" , "optional": true }  
    }
}; 

  