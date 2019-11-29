import { Component, OnInit } from '@angular/core';
import { LoginService, DefaecoUserProfile } from '../services/login.service';
import * as firebase from 'firebase';
import { User, AuthenticationService } from '../services/authentication.service';
import { NavController } from '@ionic/angular';
import { UiService } from '../services/ui.service';

@Component({
    selector: 'app-edit-personal-page',
    templateUrl: 'edit-personal-information.html',
    styleUrls: ['edit-personal-information.scss']
})
export class EditPersonalDetailsPage implements OnInit {

    user: User;
    userProfile: DefaecoUserProfile = new DefaecoUserProfile();
    private basePath = '/uploads/dp';
    private uploadTask: firebase.storage.UploadTask;
    constructor(private loginService: LoginService,private authService: AuthenticationService, private navCtrl: NavController,private uiService:UiService) { }
    ngOnInit(){}
    async ionViewWillEnter() {
        let busySpinner: any = await this.uiService.presentBusySpinner();
        this.user = await this.authService.getVerifiedLoginUser();
        if (this.user) {
            let userProfile:DefaecoUserProfile = await this.loginService.getPublicProfile(this.user.uid) as DefaecoUserProfile;
            if (userProfile) {
                this.userProfile = userProfile;
            }

        } else {
            this.navigateToLoginPage();
        }
        await busySpinner.dismiss();
    }
    private navigateToLoginPage(){
        this.navCtrl.navigateRoot("login");
    }
    updateUserPublicProfile() {
        if (!this.userProfile.phoneNumber) {
            this.uiService.presentToast("Phone number is required, please enter a valid phone number");
            return;
        }
        this.savePublicProfile();


    }
    async savePublicProfile() {
        let busySpinner: any = await this.uiService.presentBusySpinner();
        await this.loginService.savePublicProfile(this.user.uid,this.userProfile);
        await busySpinner.dismiss();
        this.uiService.presentToast("Details updated successfully");
        this.navigateToAccountPage();

    }
    async savePublicProfileAfterDP() {
        let busySpinner: any = await this.uiService.presentBusySpinner();
        await this.loginService.savePublicProfile(this.user.uid,this.userProfile);
        await busySpinner.dismiss();

    }
    async uploadFile(event) {

        const file = event.target.files[0];
        const id = Math.random().toString(36).substring(2);
        let storageRef = firebase.storage().ref();
        let busySpinner: any = await this.uiService.presentBusySpinner();
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
        this.navCtrl.navigateRoot("profile");
    }

}
