import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
//import { LoginPage } from '../../login/login';

@Component({
    selector: 'app-location-selection',
    templateUrl: 'location-selection-component.html',
    styleUrls: ['location-selection-component.scss']
})
export class AppLocationSelectionComponent {

    constructor(public popoverController: PopoverController) { }

    closePopover(){
        this.popoverController.dismiss();
    }



}
