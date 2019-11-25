import { Injectable, OnDestroy, OnInit } from "@angular/core";
import * as firebase from 'firebase/app';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from "@angular/fire/auth";

@Injectable({
    providedIn: 'root',
})
export class LoginService implements OnInit,OnDestroy {
    loggedInUser: any;
    authStateChangeUnsubscription: any;
    constructor(private fireStore: AngularFirestore,private fireAuth: AngularFireAuth) {}
    ngOnInit(){}
    ionViewWillEnter(){
        this.authStateChangeUnsubscription = firebase.auth().onAuthStateChanged((user) => {
            this.loggedInUser = user;
            this.updateUserWithEmailVerification();
        })
    }
    ngOnDestroy() {
        this.authStateChangeUnsubscription();
    }
    getLoggedInUser() {

        return new Promise((resolve, reject) => {
            if (this.loggedInUser) {
                resolve(this.loggedInUser);
            } else {
                let unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                    this.loggedInUser = user;
                    this.updateUserWithEmailVerification();
                    resolve(this.loggedInUser);
                    unsubscribe();
                });
            }
        });
    }
    async logoutUser(){
        return new Promise(async(resolve,reject)=>{
            try{
                await await this.fireAuth.auth.signOut();
                this.loggedInUser = null;
                resolve();
            }catch(e){
                console.log("ERROR!!!",e);
                reject(e);
            }
        })
       
    }
    updateUserWithEmailVerification() {
        if (this.loggedInUser) {
            let accountVerified = true;
            for (let i = 0; i < this.loggedInUser.providerData.length; i++) {
                let provider = this.loggedInUser.providerData[i];
                if (provider && provider.providerId == "password") {
                    accountVerified = this.loggedInUser.emailVerified;
                    break;
                }
            }
            this.loggedInUser['accountVerified'] = accountVerified;
        }
    }
    async checkIfAccountIsVerified() {
        return new Promise(async (resolve, reject) => {
            try {
                let user:any = await this.getLoggedInUser();
                let accountVerified = user && user.accountVerified ? true : false;
                if(accountVerified){
                    resolve(user);
                }else{
                    resolve(null);
                }
                
    
            } catch (e) {
                console.error(e);
                resolve(null);
            }
        })
    }


    //profile apis
    savePublicProfile(uid:string,profile:DefaecoUserProfile){
        profile.id = uid;
        let profile_pure = Object.assign({},profile);
        return this.fireStore.collection('public_profile').doc(uid).set(profile_pure);
    }
    getPublicProfile(uid){
        return new Promise(async(resolve,reject)=>{
            try{
                let public_profile_ref = await this.fireStore.collection('public_profile').doc(uid).get().toPromise();
                let userProfile:DefaecoUserProfile =  public_profile_ref.data() as DefaecoUserProfile;
                resolve(userProfile);
            }catch(e){
                console.log("ERROR!!!",e);
                reject(e);
            }
            
        });
    }

}
export class DefaecoUserProfile{
    id:string = '';
    email:string='';
    displayName:string='';
    phoneNumber:number;
    addressLine1:string='';
    addressLine2:string='';
    addressLine3:string='';
    addressLine4:string='';
    photoURL:string='';
    vehicleType:string='hatchback';
    regNo:string='';
    otherVehicles:any[] = [];
   



}