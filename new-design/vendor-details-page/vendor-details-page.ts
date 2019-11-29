import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor } from '../services/interfaces/DefaecoVendor';
import { UiService } from '../services/ui.service';
import { NavController } from '@ionic/angular';

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
      
    constructor(private router: Router,private vendorService:VendorDataService,private route: ActivatedRoute,private uiService:UiService,private navCtrl: NavController) { }
    ngOnInit(){}
    ionViewWillEnter(){
        this.route.queryParams.subscribe(async (params) => {
            this.vendorId = params["vendorId"];
            if(this.vendorId){
                this.vendor =  await this.vendorService.getVendorById(this.vendorId) as DefaecoVendor;
            }
            else{
                //if vendor is not present go to listing page
                this.navigateToVendorsPage();
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
    navigateToVendorsPage(){
        this.navCtrl.navigateRoot('', { animated: true });
    }
    
    bookServiceClick(){
        let navigationExtras: NavigationExtras = {
            queryParams: {
                "vendorId": this.vendor.id
            }
          };
        //this.navCtrl.navigateRoot(`vendors?vendorId=${encodeURI(this.vendor.id)}`, { animated: true });
        
        this.router.navigate(['/', 'confirm-personal-details'],navigationExtras); //main
    }

}
