import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthenticationService, User } from '../services/authentication.service';
import { NavController } from '@ionic/angular';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-account-page',
  templateUrl: 'account-page.html',
  styleUrls: ['account-page.scss']
})
export class AppAccountPage {

  user: User = {};
  userProfile: any = {};
  isLoading: boolean = false;
  skeletonElements: any[] = Array(4);
  constructor(private dataService: DataService,
    private fireStore: AngularFirestore,
    private authService: AuthenticationService,
    private navCtrl: NavController,
    private uiService: UiService) { }

  async ionViewWillEnter() {
    try {
      this.isLoading = true;
      this.user = this.authService.getCurrentUser();
      if (this.user) {
        await this.getUsersPublicProfile();
        this.isLoading = false;
      } else {
        this.navigateToWelcomePage();
        this.isLoading = false;
      }
    } catch (e) {
      this.isLoading = false;
      console.log("Error", e);
      this.navigateToErrorPage();
    }

  }

  async signOutClick() {
    let busySpinner: any = await this.uiService.presentBusySpinner();
    try {
      await this.authService.logoutUser();
      this.dataService.resetLocation();
      this.dataService.saveLoggedInUser(null);
      busySpinner.dismiss();
      this.navigateToWelcomePage();
    } catch (e) {
      busySpinner.dismiss();
      console.log("Error", e);
    }


  }
  navigateToLoginPage() {
    this.navCtrl.navigateRoot('login', { animated: true });
  }
  navigateToEditProfile() {
    this.navCtrl.navigateForward('edit-profile', { animated: true });
  }
  async getUsersPublicProfile() {
    return new Promise(async (resolve, reject) => {
      try {
        let public_profile_ref = await this.fireStore.collection('public_profile').doc(this.user.uid).get().toPromise();
        let userProfile = await public_profile_ref.data();
        this.userProfile = userProfile ? userProfile : {};
        resolve();
      } catch (e) {
        console.log("Error", e);
        reject(e);
      }
    })
  }
  navigateToWelcomePage() {
    this.navCtrl.navigateRoot('welcome', { animated: true });
  }
  navigateToErrorPage() {
    this.navCtrl.navigateForward("error", { animated: true });
  }

}
