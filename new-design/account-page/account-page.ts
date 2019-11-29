import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthenticationService, User } from '../services/authentication.service';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-account-page',
  templateUrl: 'account-page.html',
  styleUrls: ['account-page.scss']
})
export class AppAccountPage {

  user: User = {};
  userProfile: any = {};
  constructor(private dataService: DataService, private fireStore: AngularFirestore, private authService: AuthenticationService, private navCtrl: NavController) { }
  async ionViewWillEnter() {
    let busySpinner: any = await this.dataService.presentBusySpinner();
    this.user = await this.authService.getVerifiedLoginUser();
    if (this.user) {
      this.getUsersPublicProfile();
    } else {
      this.navigateToLoginPage();
    }
    await busySpinner.dismiss();
  }
  async signOutClick() {
    await this.authService.logoutUser();
    this.dataService.resetLocation();
    this.dataService.saveLoggedInUser(null);
    this.navigateToLoginPage();

  }
  navigateToLoginPage() {
    this.navCtrl.navigateRoot('login', { animated: true });
  }
  navigateToEditProfile() {
    this.navCtrl.navigateRoot('edit-profile', { animated: true });
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
