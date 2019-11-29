import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor } from '../services/interfaces/DefaecoVendor';
import { UiService } from '../services/ui.service';
import { NavController } from '@ionic/angular';
import { AuthenticationService, User } from '../services/authentication.service';

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
    user:User;
    isLoading:boolean = false;
      
    constructor(private router: Router,
        private vendorService:VendorDataService,
        private route: ActivatedRoute,
        private authService:AuthenticationService,
        private navCtrl: NavController) { }
    ngOnInit(){}
    ionViewWillEnter(){
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.route.queryParams.subscribe(async (params) => {
                try{
                    this.isLoading = true;
                    await this.handleVendorId(params);
                    this.isLoading = false;
                }catch(e){
                    console.log("Error",e);
                    this.isLoading = false;
                }
            }); 
        }else{
            this.navigateToWelcomePage();
        }
    }
    async handleVendorId(params) {
        return new Promise(async(resolve,reject)=>{
            try{
                if(params){
                    this.vendorId = params["vendorId"];
                    if (this.vendorId) {
                        this.vendor = await this.vendorService.getVendorById(this.vendorId) as DefaecoVendor;
                        resolve();
                    }
                    else {
                        resolve();
                        this.navigateToVendorsPage();
                    }
                }
    
            }catch(e){
                console.log("Error",e);
                reject(e);
            }
        })
 
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
    navigateToWelcomePage(){
        this.navCtrl.navigateRoot('welcome', { animated: true });
      }
    
    bookServiceClick(){
        // let navigationExtras: NavigationExtras = {
        //     queryParams: {
        //         "vendorId": this.vendor.id
        //     }
        //   };
        this.navCtrl.navigateForward(`confirm-personal-details?vendorId=${encodeURI(this.vendor.id)}`, { animated: true });
        
        //this.router.navigate(['/', 'confirm-personal-details'],navigationExtras); //main
    }

}
