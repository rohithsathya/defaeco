import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { AppLocationSelectionComponent } from '../location-selection-component/location-selection-component';

@Component({
    selector: 'app-main-page',
    templateUrl: 'main-page.html',
    styleUrls: ['main-page.scss']
})
export class AppMainPage implements OnInit {
    constructor(private router: Router,public popoverController: PopoverController) { }

    ngOnInit(){}
    ionViewWillEnter(){
      //this.presentPopover(null);
    }

    async presentPopover(ev: any) {
        const popover = await this.popoverController.create({
          component: AppLocationSelectionComponent,
          event: ev,
          translucent: true,
          animated:true,
          backdropDismiss:false
        });
        return await popover.present();
      }

    navigateToSignUpPage() {
        this.router.navigate(['/', 'sign-up']);
    }

}
