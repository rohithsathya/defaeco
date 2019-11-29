import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppLocationSelectionComponent } from '../location-selection-component/location-selection-component';
import { PopoverController, ModalController, NavController } from '@ionic/angular';
import { DataService } from '../services/data.service';
import { Router, NavigationExtras } from '@angular/router';
import { AppLocationSelectionPage } from '../location-selection-page/location-selection-page';
import { Subscription } from 'rxjs';
import { VendorDataService } from '../services/vendors.data.service';
import { LoginService } from '../services/login.service';
import { DefaecoVendor } from '../services/interfaces/DefaecoVendor';
import { AuthenticationService, User } from '../services/authentication.service';

@Component({
  selector: 'app-vendors-list-page',
  templateUrl: 'vendors-list-page.html',
  styleUrls: ['vendors-list-page.scss']
})
export class AppVendorsListPagePage implements OnInit, OnDestroy {

  vendorsList: DefaecoVendor[] = [];
  vendorsListMaster: DefaecoVendor[] = [];
  searchText: string = '';
  user:User;
  location;
  locationText;
  vendorListSubscription: Subscription;
  constructor(public popoverController: PopoverController, public dataService: DataService, private router: Router, public modalController: ModalController, public vendorService: VendorDataService, private loginService: LoginService,private authService:AuthenticationService,private navCtrl: NavController) { }
  ngOnInit(){}

  ionViewCanEnter(){
    console.log("Can Enter");
  }
  ionViewCanLeave(){
    console.log("Can Leave");
  }


  async ionViewWillEnter() {
    let busySpinner: any;
    try {

      busySpinner = await this.dataService.presentBusySpinner();
      this.user = await this.authService.getVerifiedLoginUser();
     
      if (this.user) {
        this.init();
      } else {
        this.navigateToWelcomePage();
      }
      await busySpinner.dismiss();
    } catch (e) {
      console.error(e);
      await busySpinner.dismiss();
    }
  }
  async init() {
    //temp
    //await this.vendorService.saveVendor();



    //if location is not set open the loc set popup
    let busySpinner: any = await this.dataService.presentBusySpinner();
    this.location = await this.dataService.getLocation();
    await busySpinner.dismiss();

    if (!this.location) {
      this.showLocationSelectionModal();
    } else {
      this.getVendorList();
    }
  }
  ngOnDestroy() {
    if (this.vendorListSubscription) {
      this.vendorListSubscription.unsubscribe();
    }
  }
  async getVendorList() {
    let busySpinner;
    try {

      busySpinner = await this.dataService.presentBusySpinner();
      this.vendorsListMaster = await this.vendorService.getVendorList(this.location.name) as DefaecoVendor[];
      this.vendorsList = this.vendorsListMaster.map((d) => {
        return d;
      })
      await busySpinner.dismiss();

    } catch (e) {
      console.error(e);
      await busySpinner.dismiss();
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
  // sortVendorListBasedOnRanking() {
  //   this.vendorsList.sort((a, b) => {
  //     return b.ranking - a.ranking;
  //   })
  // }
  goToVendorDetails(vendor:DefaecoVendor) {
    this.vendorService.setCurrentVendor(vendor);

    let navigationExtras: NavigationExtras = {
      queryParams: {
          "vendorId": vendor.id
      }
    };


    this.router.navigate(['/', 'vendor-detail'],navigationExtras);
    //vendor-detail
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
    //this.getVendorList();
    this.init();
  }
  navigateToWelcomePage(){
    this.navCtrl.navigateRoot('welcome', { animated: true });
  }


}
