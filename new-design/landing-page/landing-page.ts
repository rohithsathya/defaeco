import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';

@Component({
    selector: 'app-landing-page',
    templateUrl: 'landing-page.html',
    styleUrls: ['landing-page.scss']
})
export class LandingPage implements OnInit {

    user;
    slideOpts = {
        initialSlide: 0,
        speed: 300
      };

    constructor(private router: Router,private dataService:DataService ) { }
      ngOnInit(){}
    async ionViewWillEnter(){
        this.dataService.showLoadingPopup();
        this.user = await this.dataService.getLoggedInUser();
        this.dataService.hideLoadingPopup();
        
        if(this.user && this.user.accountVerified){
            this.dataService.navigateToMainPage();
        }
        
    }

    navigateToLoginPage() {
        this.dataService.navigateToLoginPage();
    }

}
