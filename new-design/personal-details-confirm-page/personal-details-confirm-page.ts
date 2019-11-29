import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor } from '../services/interfaces/DefaecoVendor';
import { LoginService, DefaecoUserProfile } from '../services/login.service';
import { DataService } from '../services/data.service';
import { NavController } from '@ionic/angular';

@Component({
    selector: 'app-personal-details-confirm-page',
    templateUrl: 'personal-details-confirm-page.html',
    styleUrls: ['personal-details-confirm-page.scss']
})
export class AppPersonalDetailConfirmPage implements OnInit {


    vendorId: string;
    vendor: DefaecoVendor;
    user: any;
    userProfile: DefaecoUserProfile = new DefaecoUserProfile();
    constructor(private router: Router, private vendorService: VendorDataService, private route: ActivatedRoute, private loginService: LoginService, private dataService: DataService,private navCtrl: NavController) { }
    ngOnInit(){}
    ionViewWillEnter() {
        this.route.queryParams.subscribe(async (params) => {
            this.vendorId = params["vendorId"];
            if (this.vendorId) {
                let busySpinner: any = await this.dataService.presentBusySpinner();
                this.vendor = await this.vendorService.getVendorById(this.vendorId) as DefaecoVendor;
                this.user = await this.loginService.checkIfAccountIsVerified();
                if (this.user) {
                    this.userProfile = await this.loginService.getPublicProfile(this.user.uid) as DefaecoUserProfile;
                } else {
                    this.dataService.navigateToLoginPage();
                }
                await busySpinner.dismiss();
            }
            else {
                //if vendor is not present go to listing page
                this.gobackToListingPage();
            }


        });
    }

    async proceedClick() {

        if (!this.userProfile.phoneNumber || !this.userProfile.regNo || !this.userProfile.vehicleType) {
            this.dataService.presentToast("Phone Number, Vehicle Reg No and Type are manadtory, please enter all required fields");
        } else {
            await this.loginService.savePublicProfile(this.user.uid, this.userProfile);
            let navigationExtras: NavigationExtras = {
                queryParams: {
                    "vendorId": this.vendor.id
                }
            };
            this.router.navigate(['/', 'pack-sel'], navigationExtras); //main
        }
    }
    navigateToVendorsDetailsPage(){
        let navigationExtras: NavigationExtras = {
            queryParams: {
                "vendorId": this.vendor.id
            }
        };
        this.router.navigate(['/', 'vendor-detail'], navigationExtras); //main
    }
    gobackToListingPage() {
        this.navCtrl.navigateRoot('', { animated: true });
    }

}
