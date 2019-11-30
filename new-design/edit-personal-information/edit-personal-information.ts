import { Component, OnInit } from '@angular/core';
import { LoginService, DefaecoUserProfile } from '../services/login.service';
import * as firebase from 'firebase';
import { User, AuthenticationService } from '../services/authentication.service';
import { NavController } from '@ionic/angular';
import { UiService } from '../services/ui.service';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
    selector: 'app-edit-personal-page',
    templateUrl: 'edit-personal-information.html',
    styleUrls: ['edit-personal-information.scss']
})
export class EditPersonalDetailsPage implements OnInit {

    user: User;
    userProfile: DefaecoUserProfile = new DefaecoUserProfile();
    isLoading:boolean = false;
    skeletonElements:any[] = Array(4);
    private basePath = '/uploads/dp';
    private uploadTask: firebase.storage.UploadTask;
    constructor(private loginService: LoginService,
        private fireStore: AngularFirestore,
        private authService: AuthenticationService, 
        private navCtrl: NavController,
        private uiService:UiService) { }
    ngOnInit(){}
    async ionViewWillEnter() {

        try{
            this.isLoading = true;
            this.user = this.authService.getCurrentUser();
            if (this.user) {
              await this.getUsersPublicProfile();
              this.isLoading = false;
            } else {
              this.navigateToWelcomePage();
              this.isLoading = false;
            }
          }catch(e){
            this.isLoading = false;
            console.log("Error",e);
            this.navigateToErrorPage();
          }
    }
    async getUsersPublicProfile() {
        return new Promise(async(resolve,reject)=>{
          try{
            let public_profile_ref = await this.fireStore.collection('public_profile').doc(this.user.uid).get().toPromise();
            let userProfile = await public_profile_ref.data() as DefaecoUserProfile;
            this.userProfile = userProfile?userProfile:new DefaecoUserProfile();
            resolve();
          }catch(e){
            console.log("Error",e);
            reject(e);
          }
        })
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
    navigateToWelcomePage() {
        this.navCtrl.navigateRoot('welcome', { animated: true });
    }
    navigateToErrorPage() {
      this.navCtrl.navigateForward("error", { animated: true });
    }

}
