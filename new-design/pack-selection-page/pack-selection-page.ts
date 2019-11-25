import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor, DefaecoVendorPackage } from '../services/interfaces/DefaecoVendor';

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
    constructor(private router: Router, private vendorService:VendorDataService,private route: ActivatedRoute) { }
    ngOnInit(){}
    ionViewWillEnter() {

        this.route.queryParams.subscribe(async (params) => {
            this.vendorId = params["vendorId"];
            if(this.vendorId){
                this.vendor =  await this.vendorService.getVendorById(this.vendorId) as DefaecoVendor;
            }
            else{
                //if vendor is not present go to listing page
                this.gobackToListingPage();
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
    gobackToListingPage() {
        this.router.navigate(['/main', 'vendors-list']); //main
    }
    proceedClick() {
        let navigationExtras: NavigationExtras = {
            queryParams: {
                "vendorId": this.vendor.id,
                "selectedPackage":this.selectedPackage.code
            }
          };
        this.router.navigate(['/', 'add-options'],navigationExtras); //main
    }

}
