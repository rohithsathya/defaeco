import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

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

    constructor(private navCtrl: NavController) { }

    navigateToLoginPage() {
        this.navCtrl.navigateForward("login");
    }

}
