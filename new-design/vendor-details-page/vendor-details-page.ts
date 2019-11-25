import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor } from '../services/interfaces/DefaecoVendor';

@Component({
    selector: 'app-vendor-details-page',
    templateUrl: 'vendor-details-page.html',
    styleUrls: ['vendor-details-page.scss']
})
export class AppVendorDetailsPage implements OnInit {

    slideOpts = {
        initialSlide: 0,
        speed: 300
      };
    vendor:DefaecoVendor = new DefaecoVendor();
    vendorId:string;
      
    constructor(private router: Router,private vendorService:VendorDataService,private route: ActivatedRoute) { }
    ngOnInit(){}
    ionViewWillEnter(){
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
    parseDefaecTimeToTime(time){
        let timeStr = '';
        if(time == 12.5){
            timeStr = (time) + " PM";
        }
        else if(time > 12.5){
            timeStr = (time-12) + " PM";
        }else{
            timeStr = (time) + " AM";
        }
        return timeStr;
    }
    gobackToListingPage(){
        this.router.navigate(['/main', 'vendors-list']); //main
    }
    bookServiceClick(){
        let navigationExtras: NavigationExtras = {
            queryParams: {
                "vendorId": this.vendor.id
            }
          };
        this.router.navigate(['/', 'confirm-personal-details'],navigationExtras); //main
    }

}
