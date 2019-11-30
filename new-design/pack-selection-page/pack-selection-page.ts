import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor, DefaecoVendorPackage } from '../services/interfaces/DefaecoVendor';
import { NavController } from '@ionic/angular';
import { AuthenticationService, User } from '../services/authentication.service';

@Component({
    selector: 'app-pack-selection-page',
    templateUrl: 'pack-selection-page.html',
    styleUrls: ['pack-selection-page.scss']
})
export class AppPackSelectionPage implements OnInit {

    vendor: DefaecoVendor;
    vendorId:string;
    subTotal:number = 0;
    selectedPackage:DefaecoVendorPackage;
    user:User;
    skeletonElements:any[] = Array(3);
    isLoading:boolean = false;
    constructor(
        private vendorService:VendorDataService,
        private route: ActivatedRoute,
        private navCtrl: NavController,
        private authService:AuthenticationService) { }
    ngOnInit(){}
    ionViewWillEnter() {
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.init();
        } else {
            this.navigateToWelcomePage();
        }
       
    }
    init(){
        this.isLoading = true;
        this.route.queryParams.subscribe(async (params) => {
            try{
                this.vendorId = params["vendorId"];
                if(this.vendorId){
                    this.vendor =  await this.vendorService.getVendorById(this.vendorId) as DefaecoVendor;
                    this.isLoading = false;
                }
                else{
                    this.isLoading = false;
                    this.gobackToListingPage();
                }
            }catch(e){
                console.log("Error",e);
                this.isLoading = false;
                this.navigateToErrorPage();
            }
        }); 
    }
    packageSelectionchange(event){
        for(let i=0;i<this.vendor.packageMatrix.length;i++){
            if(this.vendor.packageMatrix[i].code == event.target.value){
                this.selectedPackage = this.vendor.packageMatrix[i];
            }
        }
        this.subTotal = this.selectedPackage.price;
    }
    navigateToPersonalDetailsConfirmationPage(){
        this.navCtrl.navigateForward(`confirm-personal-details?vendorId=${encodeURI(this.vendor.id)}`, { animated: true });
    }
    gobackToListingPage() {
        this.navCtrl.navigateRoot('', { animated: true });
    }
    navigateToWelcomePage(){
        this.navCtrl.navigateRoot('welcome', { animated: true });
      }
    proceedClick() {
        this.navCtrl.navigateForward(`add-options?vendorId=${encodeURI(this.vendor.id)}&selectedPackage=${this.selectedPackage.code}`, { animated: true });
    }
    navigateToErrorPage() {
        this.navCtrl.navigateForward("error", { animated: true });
    }


}
