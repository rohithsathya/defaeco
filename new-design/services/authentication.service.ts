import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';

@Injectable({ providedIn: 'root'})
export class AuthenticationService {

    private user:User;
    private authSubscription:any;
    getLoggedInUser():Promise<User> {
        return new Promise((resolve, reject) => {
            try{
                if (this.user) {
                    console.log("logged in user from local ->>>>>>>>>>>>>>>>>>>>",this.user);
                    resolve(this.user);
                } else {
                    firebase.auth().onAuthStateChanged((user:any) => {
                        this.user = user;
                        this.updateUserWithEmailVerification();
                        console.log("logged in user from server ->>>>>>>>>>>>>>>>>>",this.user);
                        resolve(this.user);
                    });
                }
            }catch(e){
                console.log("ERROR!!!",e);
                reject(e);
            }
        });
    }
    setupLoginUser():Promise<User> {
        return new Promise((resolve, reject) => {
            try{
                if (this.user) {
                    resolve(this.user);
                } else {
                    firebase.auth().onAuthStateChanged((user:any) => {
                        this.user = user;
                        this.updateUserWithEmailVerification();
                        resolve(this.user);
                    });
                }
            }catch(e){
                console.log("ERROR!!!",e);
                reject(e);
            }
        });
    }

    private updateUserWithEmailVerification() {
        if (this.user) {
            let accountVerified = true;
            for (let i = 0; i < this.user.providerData.length; i++) {
                let provider = this.user.providerData[i];
                if (provider && provider.providerId == "password") {
                    accountVerified = this.user.emailVerified;
                    break;
                }
            }
            this.user['accountVerified'] = accountVerified;
        }
    }
    async logoutUser(){
        return new Promise(async(resolve,reject)=>{
            try{
                await firebase.auth().signOut();
                this.user = null;
                resolve();
            }catch(e){
                console.log("ERROR!!!",e);
                reject(e);
            }
        })
       
    }


    constructor(private afAuth: AngularFireAuth) {}
    getLoginUser():Promise<User>{

        return new Promise(async (resolve,reject)=>{
            try{
                if(this.user){
                    resolve(this.user)
                }else{
                    this.authSubscription = await this.afAuth.authState.subscribe((auth)=>{
                        this.user = auth as any;
                        this.updateUserWithEmailVerification();
                        resolve(this.user);
                        //this.authSubscription?this.authSubscription.unsubscribe():true;
                    })
                }
            }catch(e){
                console.log("ERROR>>>>>>>authentication.service.ts>>>>getVerifiedLoginUser()",e);
                reject(e);
            }
            
        })

        
    }
    getVerifiedLoginUser():Promise<User>{

        return new Promise(async (resolve,reject)=>{
            try{
                if(this.user){
                    resolve(this.user)
                }else{
                    this.authSubscription = await this.afAuth.authState.subscribe((auth)=>{
                        this.user = auth as any;
                        this.updateUserWithEmailVerification();
                        let accountVerified = this.user && this.user.accountVerified ? true : false;
                        if(accountVerified){
                            resolve(this.user);
                        }else{
                            resolve(null);
                        }
                        //this.authSubscription?this.authSubscription.unsubscribe():true;
                    })
                }
            }catch(e){
                console.log("ERROR>>>>>>>authentication.service.ts>>>>getVerifiedLoginUser()",e);
                reject(e);
            }
            
        })

        
    }
    logOutUser() {

        return new Promise((resolve, reject) => {
    
          firebase.auth().signOut()
            .then(() => {
              console.log("LOG Out");
              resolve();
            }).catch((error) => {
              reject();
            });
    
        })
    
    
    
      }
    



}

export interface User {
    uid?: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
    accountVerified?:boolean;
    phoneNumber?:boolean;
    providerData?:any[];
    emailVerified?:boolean;

  }