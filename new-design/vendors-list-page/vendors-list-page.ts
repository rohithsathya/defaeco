import { Component, OnInit } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { DataService } from '../services/data.service';
import { AppLocationSelectionPage } from '../location-selection-page/location-selection-page';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor } from '../services/interfaces/DefaecoVendor';
import { AuthenticationService, User } from '../services/authentication.service';

@Component({
  selector: 'app-vendors-list-page',
  templateUrl: 'vendors-list-page.html',
  styleUrls: ['vendors-list-page.scss']
})
export class AppVendorsListPagePage implements OnInit {

  vendorsList: DefaecoVendor[] = [];
  vendorsListMaster: DefaecoVendor[] = [];
  searchText: string = '';
  user:User;
  location;
  locationText;
  skeletonElements:any[] = Array(10);
  isLoading:boolean = false;
  constructor(private dataService: DataService, 
    private modalController: ModalController, 
    private vendorService: VendorDataService,
    private authService:AuthenticationService,
    private navCtrl: NavController) { }
  
  ngOnInit(){}
  ionViewWillEnter() {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.init();
    }else{
      this.navigateToWelcomePage();
    }
  }
  async init() {
    try {
      //if location is not set open the loc set popup
      this.isLoading = true;
      this.location = await this.dataService.getLocation();
      if (!this.location) {
        this.isLoading = false;
        this.showLocationSelectionModal();
      } else {
        this.vendorsListMaster = await this.vendorService.getVendorList(this.location.name) as DefaecoVendor[];
        this.vendorsList = this.vendorsListMaster.map((d) => {
          return d;
        });
        this.isLoading = false;
      }
    } catch (e) {
      console.log("Error>>>vendors-list-page.ts>>>init()");
      this.isLoading = false;
    }
  }
  getRatingColor(rating) {

    return 'success';

    if (rating >= 4) {
      return 'success'
    }
    if (rating < 4 && rating >= 3) {
      return 'warning'
    }
    if (rating < 3) {
      return 'danger'
    }
  }
  filterVendorsList(event) {

    this.vendorsList = [];
    this.searchText = event.target.value;
    let searchTokens = this.searchText.split(' ');
    for (let i = 0; i < this.vendorsListMaster.length; i++) {

      let descText = `${this.vendorsListMaster[i].name} ${this.vendorsListMaster[i].services}`;

      let ranking = 0;

      for (let j = 0; j < searchTokens.length; j++) {
        if (descText.search(new RegExp(searchTokens[j], 'i')) > -1) {
          ranking += 1;

        }
      }

      if (ranking > 0) {
        let obj = Object.assign({},this.vendorsListMaster[i]);
        obj['ranking'] = ranking;

        this.vendorsList.push(obj);
      }

    }
    //this.sortVendorListBasedOnRanking()

  }
  goToVendorDetails(vendor:DefaecoVendor) {
    this.vendorService.setCurrentVendor(vendor);
    this.navCtrl.navigateForward(`vendor-detail?vendorId=${encodeURI(vendor.id)}`);
  }
  async changeLocationClick() {
    await this.showLocationSelectionModal();
  }
  async showLocationSelectionModal() {
    const modal = await this.modalController.create({
      component: AppLocationSelectionPage
    });
    await modal.present();
    await modal.onWillDismiss();
    this.init();
  }
  navigateToWelcomePage(){
    this.navCtrl.navigateRoot('welcome', { animated: true });
  }


}
