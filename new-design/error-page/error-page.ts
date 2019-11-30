import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthenticationService, User } from '../services/authentication.service';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-error-page',
    templateUrl: 'error-page.html',
    styleUrls: ['error-page.scss']
})
export class ErrorPage {
    errorOnPage:string='';
    constructor( private route: ActivatedRoute,
        private navCtrl: NavController){}
    
    ionViewWillEnter(){
        this.route.queryParams.subscribe(async (params) => {
            this.errorOnPage = params["errorOn"];
        });
    }
    navigateToErrorOnPage(){
        this.navCtrl.back();
    }
    navigateToHomePage(){
        this.navCtrl.navigateRoot("",{animated: true});
    }

}