import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor } from '../services/interfaces/DefaecoVendor';
import { LoginService, DefaecoUserProfile } from '../services/login.service';
import { NavController } from '@ionic/angular';
import { AuthenticationService, User } from '../services/authentication.service';
import { UiService } from '../services/ui.service';

@Component({
    selector: 'app-personal-details-confirm-page',
    templateUrl: 'personal-details-confirm-page.html',
    styleUrls: ['personal-details-confirm-page.scss']
})
export class AppPersonalDetailConfirmPage implements OnInit {


    vendorId: string;
    user: User;
    userProfile: DefaecoUserProfile = new DefaecoUserProfile();
    isLoading:boolean = false;
    constructor(private route: ActivatedRoute, 
        private loginService: LoginService,
        private navCtrl: NavController,
        private authService:AuthenticationService,
        private uiService:UiService) { }
    ngOnInit(){}
    ionViewWillEnter() {

        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.route.queryParams.subscribe(async (params) => {
                try {
                    this.vendorId = params["vendorId"];
                    if (this.vendorId) {
                        this.isLoading = true;
                        this.userProfile = await this.loginService.getPublicProfile(this.user.uid) as DefaecoUserProfile;
                        this.isLoading = false;
                    }
                    else {
                        this.gobackToListingPage();
                    }

                } catch (e) {
                    console.log("Error", e);
                    this.isLoading = false;
                    this.navigateToErrorPage();
                }
            })
        } else {
            this.navigateToLandingPage();
        }
    }

    async proceedClick() {
        let busySpinner:any= await this.uiService.presentBusySpinner();
        try{
            if (!this.userProfile.phoneNumber || !this.userProfile.regNo || !this.userProfile.vehicleType) {
                busySpinner.dismiss();
                this.uiService.presentToast("Phone Number, Vehicle Reg No and Type are manadtory, please enter all required fields");
            } else {
                await this.loginService.savePublicProfile(this.user.uid, this.userProfile);
                busySpinner.dismiss();
                this.navCtrl.navigateForward(`pack-sel?vendorId=${encodeURI(this.vendorId)}`, { animated: true });
            }
        }catch(e){
            busySpinner.dismiss();
            console.log("Error",e);
        }
    }
    navigateToVendorsDetailsPage(){

        this.navCtrl.navigateBack(`vendor-detail?vendorId=${encodeURI(this.vendorId)}`, { animated: true });
    }
    gobackToListingPage() {
        this.navCtrl.navigateRoot('', { animated: true });
    }
    private navigateToLandingPage(){
        this.navCtrl.navigateRoot("welcome",{animated: true})
    }
    navigateToErrorPage() {
        this.navCtrl.navigateForward("error", { animated: true });
    }

}
