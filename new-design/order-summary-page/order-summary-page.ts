import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { DataService } from '../services/data.service';
import { SlotService } from '../services/slot.service';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase';
import { LoginService } from '../services/login.service';
import { resolve } from 'url';
import { DefaecoOrder, OrderService } from '../services/order.service';
import { UiService } from '../services/ui.service';
import { AuthenticationService, User } from '../services/authentication.service';
import { NavController } from '@ionic/angular';
import { CloudFunctionHelper } from '../services/cloudFunctionHelper';
import { HttpHeaders, HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-order-summary-page',
    templateUrl: 'order-summary-page.html',
    styleUrls: ['order-summary-page.scss']
})
export class AppOrderSummaryPage implements OnInit {

    vendor: any = {};
    package: any = {};
    addonIds: any = [];
    slot: any = {};
    selectedDate: any = {};


    grandTotal: number = 0;
    totalSlotsRequired: number = 0;
    addOns: any = [];
    startTime: any = {};
    endTime: any = {};
    user: User;
    slotsCollectionToSave = []
    constructor(private router: Router,
        private dataService: DataService,
        private slotService: SlotService,
        private afs: AngularFirestore,
        private orderService: OrderService,
        private authService: AuthenticationService,
        private uiService: UiService,
        private navCtrl: NavController,
        private http: HttpClient) { }
    ngOnInit() { }
    async ionViewWillEnter() {

        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.init();
        } else {
            this.navigateToWelcomePage();
        }
    }
    async init() {

        try {

            let orderSummary = this.dataService.getOrerSummaryObj();
            if (orderSummary) {
                this.vendor = orderSummary.vendor;
                this.package = orderSummary.package;
                this.addonIds = orderSummary.addons?orderSummary.addons : [];
                this.slot = orderSummary.slot;
                this.selectedDate = orderSummary.date;
                this.grandTotal = this.package.price;
                this.totalSlotsRequired = this.package.noOfSlotsNeeded;
                this.addOns = [];
                for (let i = 0; i < this.package.addOns.length; i++) {
                    let currentAddOn = this.package.addOns[i];
                    if (this.addonIds.indexOf(currentAddOn.code) >= 0) {
                        this.addOns.push(currentAddOn);
                        this.grandTotal = this.grandTotal + currentAddOn.price;
                        this.totalSlotsRequired = this.totalSlotsRequired + currentAddOn.noOfSlotsNeeded;
                    }
                }
                this.startTime = this.slot.isTomorrow ? 'Tomorrow' : 'Today';
                this.startTime = `${this.startTime} ${this.slot.time}`;

                this.endTime = this.slot.isExtended ? 'Tomorrow' : 'Today';
                this.endTime = `${this.endTime} ${this.slot.deliveryTime}`;

            } else {
                this.navigateToMainPage();
            }

        } catch (e) {
            console.log("Error", e);
            this.navigateToErrorPage();
        }


    }

    async saveSlots() {

        return new Promise(async (resolve, reject) => {

            try {
                for (let i = 0; i < this.slotsCollectionToSave.length; i++) {
                    const id = this.slotsCollectionToSave[i].date + "_" + this.vendor.id + "_" + this.slotsCollectionToSave[i].bayname + "_" + this.slotsCollectionToSave[i].slotname;       //this.afs.createId();
                    this.slotsCollectionToSave[i]["id"] = id;
                    this.slotsCollectionToSave[i]["vendorId"] = this.vendor.id;
                    await this.afs.collection('booked_slots').doc(id).set(this.slotsCollectionToSave[i]);

                    if (i == this.slotsCollectionToSave.length - 1) {
                        resolve();
                    }

                }
            } catch (e) {
                console.log("ERROR!!!", e);
                resolve();
            }


        })

    }

    async proceedClick() {
        let orderID: any = '';
        let busySpinner: any = await this.uiService.presentBusySpinner();
        try {
            let slotStart = parseInt(this.slot.slot);
            let slotEnd = slotStart + this.totalSlotsRequired;
            this.slotsCollectionToSave = []
            for (let i = slotStart; i < slotEnd; i++) {
                let slotTosave = this.slotService.getSlotsInformation(this.vendor, this.selectedDate, i);
                slotTosave["bayname"] = this.slot.bay;
                slotTosave["type"] = this.package.type;
                slotTosave["ui"] = {
                    "packageName": this.package.packageName,
                    "vendorName": this.vendor.name,
                    "userName": this.user.displayName,
                    "package": this.package,
                    "addonIds": this.addonIds ? this.addonIds : []
                };


                this.slotsCollectionToSave.push(slotTosave);
            }
            //cloud function code
            const dateInmilli = this.selectedDate.getTime();
            let placedOrder:DefaecoOrder = await this.orderService.placeOrderApi(dateInmilli,this.vendor.id,this.package.code,this.addonIds,this.slotsCollectionToSave[0].slotname,this.slotsCollectionToSave[0].bayname)
            
            
    //         console.log("slots to save and order obj");
    //         console.log(this.slotsCollectionToSave);
    //         let orderObj: DefaecoOrder = this.getOrderObject();
    //         console.log(orderObj);


    //         let req = {
    //             "body": {
    //                 "slotsToSave": Object.assign([], this.slotsCollectionToSave),
    //                 "orderObj": Object.assign({}, orderObj),
    //                 "date":this.selectedDate.getTime(),
    //                 "vendorId":this.vendor.id,
    //                 "packageId":this.package.code,
    //                 "addonIds":this.addonIds ? this.addonIds : [],
    //                 "startingSlot":this.slotsCollectionToSave[0].slotname,
    //                 "bayName":this.slotsCollectionToSave[0].bayname

    //             }
    //         };

    //         let token: any = await this.getUserToken();
    //   const httpOptions = {
    //     headers: new HttpHeaders({
    //       'Content-Type': 'application/json',
    //       'Authorization': token
    //     })
    //   };
    //   let data = req.body;
      //let placedOrder:DefaecoOrder = await this.http.post<DefaecoOrder>('https://us-central1-defaeco3.cloudfunctions.net/webApi/createOrder', data, httpOptions).toPromise();







      /*

            debugger;
           let cfHelper:CloudFunctionHelper = new CloudFunctionHelper();
           let placedOrderObj:DefaecoOrder = await cfHelper.placeOrder(req,this.user) as DefaecoOrder;
           await busySpinner.dismiss();
           this.orderPlacedSuccessfully(placedOrderObj.id);

            debugger;
            return;

            await this.saveSlots();
            //let orderObj: DefaecoOrder = this.getOrderObject();
            orderID = await this.orderService.placeOrder(orderObj);
            */
            await busySpinner.dismiss();
            this.orderPlacedSuccessfully(placedOrder.id);

        } catch (e) {
            console.log("ERROR!!!", e);
            await busySpinner.dismiss();
            this.uiService.presentToast("Error placing order, please contact us through our support page.")

        }


    }
    orderPlacedSuccessfully(orderID) {
        this.navCtrl.navigateRoot(`booking-confirmed?orderId=${encodeURI(orderID)}`, { animated: true });

    }
    getOrderObject(): DefaecoOrder {
        let orderObj = new DefaecoOrder();
        orderObj.date = this.selectedDate.getTime();
        orderObj.slot = this.slot;
        orderObj.allSlots = this.slotsCollectionToSave;
        orderObj.totalPrice = this.grandTotal;
        orderObj.vendorId = this.vendor.id;
        orderObj.packageId = this.package.code;
        orderObj.addonIds = this.addonIds ? this.addonIds : [];
        orderObj.ui = {
            "packageName": this.package.packageName,
            "vendorName": this.vendor.name,
            "userName": this.user.displayName,
            "package": this.package,
            "addonIds": this.addonIds ? this.addonIds : []
        };
        return orderObj;
    }
    navigateToWelcomePage() {
        this.navCtrl.navigateRoot('welcome', { animated: true });
    }
    navigateToMainPage() {
        this.navCtrl.navigateRoot('', { animated: true });
    }
    navigateToSlotSelectionPage() {
       this.navCtrl.navigateRoot(`pick-slot?vendorId=${encodeURI(this.vendor.id)}&selectedPackage=${encodeURI(this.package.code)}&addons=${encodeURI(this.addonIds)}`, { animated: true });
    }
    navigateToErrorPage() {
        this.navCtrl.navigateForward("error", { animated: true });
    }

}
