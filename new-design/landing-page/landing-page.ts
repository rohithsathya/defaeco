import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthenticationService, User } from '../services/authentication.service';

@Component({
    selector: 'app-landing-page',
    templateUrl: 'landing-page.html',
    styleUrls: ['landing-page.scss']
})
export class LandingPage {
    
    slideOpts = {
        initialSlide: 0,
        speed: 300
      };
      user:User;

    constructor(private navCtrl: NavController,
        private authService:AuthenticationService) { }

    async ionViewWillEnter(){
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.navigateToMainPage();
        }
    }
    navigateToLoginPage() {
        this.navCtrl.navigateForward("login",{animated: true});
    }
    private navigateToMainPage(){
        this.navCtrl.navigateRoot("",{animated: true});
    }

}
