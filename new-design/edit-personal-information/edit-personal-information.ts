import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { LoginService, DefaecoUserProfile } from '../services/login.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import * as firebase from 'firebase'; 
import { async } from 'q';

@Component({
    selector: 'app-edit-personal-page',
    templateUrl: 'edit-personal-information.html',
    styleUrls: ['edit-personal-information.scss']
})
export class EditPersonalDetailsPage implements OnInit {

    user: any = {};
    userProfile: DefaecoUserProfile = new DefaecoUserProfile();
    private basePath = '/uploads/dp';
    private uploadTask: firebase.storage.UploadTask;
    constructor(private dataService: DataService, private fireAuth: AngularFireAuth, private router: Router, private loginService: LoginService, private fireStore: AngularFirestore, private afStorage: AngularFireStorage) { }
    ngOnInit(){}
    async ionViewWillEnter() {

        let busySpinner: any = await this.dataService.presentBusySpinner();
        this.user = await this.loginService.getLoggedInUser();
        await busySpinner.dismiss();
        if (this.user && this.user.accountVerified) {

            console.log("logged in user", this.user);
            this.userProfile.displayName = this.user.displayName;
            this.userProfile.email = this.user.email;
            this.userProfile.photoURL = this.user.photoURL;
            this.getUsersPublicProfile();

        } else {
            this.dataService.navigateToLoginPage();
        }
    }

    async getUsersPublicProfile() {
        let busySpinner: any = await this.dataService.presentBusySpinner();
        let userProfile:DefaecoUserProfile = await this.loginService.getPublicProfile(this.user.uid) as DefaecoUserProfile;
        if (userProfile) {
            this.userProfile = userProfile;
        }
        await busySpinner.dismiss();


    }

    updateUserPublicProfile() {
        if (!this.userProfile.phoneNumber) {
            this.dataService.presentToast("Phone number is required, please enter a valid phone number");
            return;
        }
        this.savePublicProfile();


    }
    async savePublicProfile() {
        let busySpinner: any = await this.dataService.presentBusySpinner();
        await this.loginService.savePublicProfile(this.user.uid,this.userProfile);
        await busySpinner.dismiss();
        this.dataService.presentToast("Details updated successfully");
        this.navigateToAccountPage();

    }
    async savePublicProfileAfterDP() {
        let busySpinner: any = await this.dataService.presentBusySpinner();
        await this.loginService.savePublicProfile(this.user.uid,this.userProfile);
        await busySpinner.dismiss();

    }
    async uploadFile(event) {

        const file = event.target.files[0];
        const id = Math.random().toString(36).substring(2);
        let storageRef = firebase.storage().ref();
        let busySpinner: any = await this.dataService.presentBusySpinner();
        this.uploadTask = storageRef.child(`${this.basePath}/${this.user.uid}`).put(file);
        this.uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
        (snapshot) =>  {
            // upload in progress
            let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            console.log("progress",progress);
            
        },
        async(error) => {
            // upload failed
            console.log(error);
            await busySpinner.dismiss();
        },
        async () => {
            this.userProfile.photoURL = await this.uploadTask.snapshot.ref.getDownloadURL();
            await busySpinner.dismiss();
            console.log("upload success",this.userProfile.photoURL);
            this.savePublicProfileAfterDP();
        }
        );
    }
    navigateToAccountPage() {
        this.router.navigate(['/main', 'account']);
    }

}
