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

    //new methods
    private new_updateUserWithEmailVerification(user:User) {
        if (user) {
            let accountVerified = true;
            for (let i = 0; i < user.providerData.length; i++) {
                let provider = user.providerData[i];
                if (provider && provider.providerId == "password") {
                    accountVerified = user.emailVerified;
                    break;
                }
            }
            user.accountVerified = accountVerified;
        }
        return user;
    }
    loginWithEmail(email,password):Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL); //https://firebase.google.com/docs/auth/web/auth-state-persistence
                await this.afAuth.auth.signInWithEmailAndPassword(email, password);
                await this.setupUser();
                resolve()
            } catch (e) {
                console.log("Error>>>>authentication.service.ts>>>loginWithEmail", e);
                reject(e);
            }

        })
    }
    signUpWithEmail(email,password):Promise<any>{
        return this.afAuth.auth.createUserWithEmailAndPassword(email,password)
    }
    //should be called only once when app opens or on success
    setupUser(){
        return new Promise((resolve, reject) => {
            try{
                firebase.auth().onAuthStateChanged((user:any) => {
                        if(user){
                            let updatedUser:User =  this.new_updateUserWithEmailVerification(user);
                            this.user = updatedUser.accountVerified?updatedUser:null;
                        }else{
                            this.user = null; 
                        }
                        resolve(this.user);
                    });
            }catch(e){
                console.log("ERROR!!!",e);
                reject(e);
            }
        });

    }
    getCurrentUser():User{
        return this.user;
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