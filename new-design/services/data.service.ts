import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { Storage } from '@ionic/storage';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import { ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class DataService {

  userProfile: any = {};
  loggedInUser: any;
  location: any;
  loadingPopup:any;
  constructor(private storage: Storage, private fireAuth: AngularFireAuth, public toastController: ToastController, private router: Router,private fireStore: AngularFirestore,public loadingController: LoadingController) {
    this.subscribeForAuthChange();
    this.initLoadingPopup();
    
  }
  async initLoadingPopup(){
   
    this.loadingPopup = await this.loadingController.create({
      message: 'Please Wait...'
    });
  }
  async showLoadingPopup(){
    this.loadingPopup = await this.loadingController.create({
      message: 'Please Wait...'
    });
    //await loading.present();
    await this.loadingPopup.present();
  }

  async hideLoadingPopup(){
    this.loadingPopup.dismiss();
  }

  presentBusySpinner(){
    return new Promise(async (resolve,reject)=>{
      try{
        let loadingPopup = await this.loadingController.create({message: 'Please Wait...'});
        await loadingPopup.present();
        resolve(loadingPopup);
      }catch(e){
        console.error(e);
        reject();
      }
    })
    

    //await loading.present();
    //await this.loadingPopup.present();
  }


  getCities() {
    return new Promise((res, rej) => {
      let cities = [
        { name: 'Bangalore', code: 'BLR', icon: 'assets/img/icons/bangalore.svg' },
        { name: 'Chennai', code: 'CHN', icon: 'assets/img/icons/chennai.svg' },
        { name: 'Mumbai', code: 'MUB', icon: 'assets/img/icons/mumbai.svg' }
      ];

      res(cities);
    })
  }
  
  getAreaNameFromCode(code) {

    return new Promise(async (res, rej) => {
      let areas: any = await this.getAllAreadList();
      let areaText = '';
      for (let i = 0; i < areas.length; i++) {
        if (areas[i].code == code) {
          areaText = areas[i].name + "," + areas[i].city;
          break;
        }
      }
      res(areaText);

    })



  }
  saveUserLocation(loc) {
    this.userProfile.location = loc;
  }
  getCarWashList() {
    return new Promise((res, rej) => {
      let carwashes = [
        { name: 'ABC Car Wash', code: '001', city: 'Bangalore', area: 'J P Nagar', rating: 4.0, services: ['car wash', 'car decore', 'interior', 'exterior', 'detailing'] },
        { name: 'SLV Car care', code: '002', city: 'Bangalore', area: 'E city', rating: 3.7, services: ['car wash', 'car decore', 'interior', 'exterior', 'detailing'] },
        { name: '3M Car Decore', code: '003', city: 'Bangalore', area: 'Maratahalli', rating: 2, services: ['car wash', 'car decore', 'interior', 'exterior', 'detailing'] },
        { name: 'My Car Wash', code: '004', city: 'Bangalore', area: 'Hosa Road', rating: 4.5, services: ['car wash', 'car decore', 'interior', 'exterior', 'detailing'] },
        { name: 'Forum Car Wash', code: '005', city: 'Bangalore', area: 'R R Nagar', rating: 2.7, services: ['car wash', 'car decore', 'interior', 'exterior', 'detailing'] },
        { name: 'Just Wash', code: '006', city: 'Bangalore', area: 'Vijay Nagar', rating: 4.9, services: ['car wash', 'car decore', 'interior', 'exterior', 'detailing'] },
        { name: 'Car Care 12', code: '007', city: 'Bangalore', area: 'Jaya Nagar', rating: 4.1, services: ['car wash', 'car decore', 'interior', 'exterior', 'detailing'] }
      ];

      res(carwashes);
    })
  }
  saveLoggedInUser(user) {

    if (user) {
      // set a key/value
      this.storage.set('loggedInUser', JSON.stringify(user));
    } else {
      this.storage.set('loggedInUser', null);
    }
  }
  getLoggedInUserFromLocalStorage() {
    return this.storage.get('loggedInUser');

    //let val =  await this.storage.get('loggedInUser');
    //console.log("loggerdin user", val);

    //  .then((val) => {
    //   console.log('Your age is', val);
    // });


  }

  subscribeForAuthChange() {
    this.loggedInUser = firebase.auth().currentUser;
    console.log("logged in user", this.loggedInUser);
  }
  getLoggedInUser() {

    return new Promise((res, rej) => {
      try {
        // if (this.loggedInUser) {
        //   res(this.loggedInUser)
        // } else {
          firebase.auth().onAuthStateChanged((user) => {
            
            this.loggedInUser = user;

            if (this.loggedInUser) {
              //by default if the user is logged in, then account verified is true
              this.loggedInUser['accountVerified'] = true;
              //get the email provider
              let emailProvider;
              for(let i=0;i<this.loggedInUser.providerData.length;i++){
                let provider = this.loggedInUser.providerData[i];
                if (provider && provider.providerId == "password") {
                  emailProvider = provider;
                  break;
                }
              }
              //if email provider then accountVerified = emailVerfied.
              if(emailProvider){
                this.loggedInUser['accountVerified'] =  this.loggedInUser.emailVerified;
              }
            }
            console.log("logged in user : ", this.loggedInUser);
            res(this.loggedInUser);
          })
        //}
      } catch (e) {
        rej(e)
      }

    })
  }
  logOutUser() {

    return new Promise((resolve, reject) => {

      firebase.auth().signOut()
        .then(() => {
          console.log("LOG Out");
          resolve();
        }).catch((error) => {
          reject();
        });

    })



  }

  async presentToast(msg) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 3000
    });
    toast.present();
  }
  async presentToastWithOptions(title, msg) {
    const toast = await this.toastController.create({
      header: title,
      message: msg,
      translucent: true,
      //color:'success', //primary", "secondary", "tertiary", "success", "warning", "danger", "light", "medium", and "dark"
      position: 'middle', //"bottom" | "middle" | "top"
      buttons: [
        {
          text: 'Done',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    toast.present();
  }

  navigateToMainPage() {
    this.router.navigate(['/main', 'vendors-list']); //main
  }
  navigateToLoginPage() {
    this.router.navigate(['/', 'login']); //main
  }
  isValidateEmail(mail) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
      return true
    } else {
      return false
    }
  }

  //storeage services
  //Start
  setLocation(locCode) {
    this.location = locCode;
    this.storage.set('userLocation', this.location);

  }
  async getLocation() {

    return new Promise(async (res, rej) => {

      if (!this.location) {
        this.location = await this.storage.get('userLocation');
        res(this.location);
      } else {
        res(this.location);
      }



    })



  }
  //on log out we can reset location
  resetLocation() {
    this.setLocation('');
  }
  //end





  //Database Service
  service_locations_ref;
  vendors_ref;
  getCollectionRef(collectionName){
    return this.fireStore.collection(collectionName);

  }
  getAllAreadList() {

    let service_locations_ref = this.fireStore.collection('service_locations');
    

    return service_locations_ref.snapshotChanges().pipe(
      map(actions => {
      return actions.map(a => {
          const data = a.payload.doc.data() as any;
          const id = a.payload.doc.id;
          return { id, ...data };
      });
      })
  )
  }

  //order managment system
  orderSummaryObj:any = {};
  selectedOrder:any;
  setCurrentOrderSumaryObj(vendor,selPackage,addons,slot,date){
    this.orderSummaryObj = {
      vendor:vendor,
      slot:slot,
      date:date,
      package:selPackage,
      addons:addons
    }
  }
  getOrerSummaryObj(){
    return this.orderSummaryObj;
  }
  formatDate(milliseconds){
    let givenDate = new Date(milliseconds)
    let dd:any = givenDate.getDate();
    let mm:any = givenDate.getMonth()+1; 
    let yyyy:any = givenDate.getFullYear();
    let hr:any = givenDate.getHours();
    let min:any = givenDate.getMinutes();
    if(dd<10) 
    {
        dd=`0${dd}`;
    } 
    if(mm<10) 
    {
        mm=`0${mm}`;
    } 

    let time = hr + (min / 60);

    return {"date" : `${dd}-${mm}-${yyyy}`, "time":time};
  }
  setSelectedOrder(order:any){
    this.selectedOrder = order;
  }
  getSelectedOrder(){
    return this.selectedOrder;
  }


}