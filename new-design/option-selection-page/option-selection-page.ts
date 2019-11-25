import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor, DefaecoVendorPackageAddons, DefaecoVendorPackage } from '../services/interfaces/DefaecoVendor';

@Component({
    selector: 'app-option-selection-page',
    templateUrl: 'option-selection-page.html',
    styleUrls: ['option-selection-page.scss']
})
export class AppOptionSelectionPage implements OnInit {

    // addOnOptions:DefaecoVendorPackageAddons = [
    //     {name:'Car Wash',selected:true,price:'120',code:'001', desc:'Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit. '},
    //     {name:'Car Detailing',selected:false,price:'125',code:'002', desc:'Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit. '},
    //     {name:'Car Interior',selected:false,price:'900',code:'003', desc:'Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit. '},
    //     {name:'Car Extrior',selected:false,price:'300',code:'004', desc:'Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit. '}
    // ];

    addOnOptions:DefaecoVendorPackageAddons[] = [];

    vendorId:string;
    selectedPackageId:string;
    selectedPackage:DefaecoVendorPackage;
    vendor:DefaecoVendor;
    selectedAddOns:string[] = [];
    grandTotal:number = 0;
    selectedAddonIds:string[] = [];
    constructor(private router: Router, private vendorService:VendorDataService,private route: ActivatedRoute) { }
    ngOnInit(){}
    ionViewWillEnter(){
        this.route.queryParams.subscribe(async (params) => {
            this.vendorId = params["vendorId"];
            this.selectedPackageId = params["selectedPackage"];
            if(this.vendorId){
                this.vendor =  await this.vendorService.getVendorById(this.vendorId) as DefaecoVendor;
                this.parseVendorAndGetAddons();
                this.grandTotal = this.selectedPackage.price;
                this.selectedPackage.addOns = this.selectedPackage.addOns.map((d)=>{
                    //d.meta = {};
                    d.meta.selected = false;
                    return d;
                })
                //this.addOnOptions = this.selectedPackage.addOns;
            }
            else{
                //if vendor is not present go to listing page
                this.gobackToListingPage();
              }
        }); 
    }
    parseVendorAndGetAddons(){
        for(let i=0;i<this.vendor.packageMatrix.length;i++){
            if(this.vendor.packageMatrix[i].code == this.selectedPackageId){
                this.selectedPackage = this.vendor.packageMatrix[i];
                break;
            }
        }
    }
    addOnSelectionChange(event){
        this.grandTotal = this.selectedPackage.price;
        this.selectedAddonIds = []
        for(let i=0;i<this.selectedPackage.addOns.length;i++){
            let addon = this.selectedPackage.addOns[i];
            if(addon.meta.selected){
                this.grandTotal = this.grandTotal + addon.price;
                this.selectedAddonIds.push(addon.code);
            }
        }


    }
    gobackToListingPage() {
        this.router.navigate(['/main', 'vendors-list']); //main
    }
    proceedClick(){
        let navigationExtras: NavigationExtras = {
            queryParams: {
                "vendorId": this.vendor.id,
                "selectedPackage":this.selectedPackageId,
                "addons":this.selectedAddonIds
            }
          };
        this.router.navigate(['/', 'pick-slot'],navigationExtras);
    }

}
