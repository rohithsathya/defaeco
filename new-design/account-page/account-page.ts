import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-account-page',
  templateUrl: 'account-page.html',
  styleUrls: ['account-page.scss']
})
export class AppAccountPage implements OnInit{

  user:any = {};
  userProfile:any={};
  constructor(private dataService:DataService,private fireAuth: AngularFireAuth,private router:Router,private fireStore: AngularFirestore,private loginService: LoginService) {}
  ngOnInit(){}
  async ionViewWillEnter(){
    let busySpinner: any = await this.dataService.presentBusySpinner();
    this.user = await this.loginService.getLoggedInUser();
    await busySpinner.dismiss();
    if (this.user && this.user.accountVerified) {

        // console.log("logged in user", this.user);
        // this.userProfile["displayName"] = this.user.displayName;
        // this.userProfile["email"] = this.user.email;
        // this.userProfile["photoURL"] = this.user.photoURL;

        this.getUsersPublicProfile();

    } else {
        this.dataService.navigateToLoginPage();
    }

    // let userVal = await this.dataService.getLoggedInUserFromLocalStorage();
    // if(userVal){
    //     this.user = JSON.parse(userVal);
        
    // }
  }
  async signOutClick(){
    await this.loginService.logoutUser();
    //await this.fireAuth.auth.signOut();
    this.dataService.resetLocation();
    this.dataService.saveLoggedInUser(null);
    this.navigateToLoginPage();

  }
  navigateToLoginPage(){
    this.router.navigate(['/', 'login']); //main
  }
  navigateToEditProfile(){
    this.router.navigate(['/', 'edit-profile']);
  }
  async getUsersPublicProfile() {
    let busySpinner: any = await this.dataService.presentBusySpinner();
    let public_profile_ref = await this.fireStore.collection('public_profile').doc(this.user.uid).get().toPromise();
    let userProfile = await public_profile_ref.data() //.toPromise();

    if (userProfile) {
        this.userProfile = userProfile;
    }
    await busySpinner.dismiss();


}

}
