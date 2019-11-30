import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor, DefaecoVendorPackageAddons, DefaecoVendorPackage } from '../services/interfaces/DefaecoVendor';
import { SlotService, DefaecoSlot } from '../services/slot.service';
import { AlertController, NavController } from '@ionic/angular';
import { DataService } from '../services/data.service';
import { OrderService, DefaecoOrder } from '../services/order.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { LoginService } from '../services/login.service';
import { AuthenticationService, User } from '../services/authentication.service';
import { UiService } from '../services/ui.service';

@Component({
    selector: 'app-slot-reschudle-page',
    templateUrl: 'slot-reschudle-page.html',
    styleUrls: ['slot-reschudle-page.scss']
})

//reschdule-slot
export class AppSlotReshudlePage implements OnInit {

    addOnOptions: DefaecoVendorPackageAddons[] = [];
    vendorId: string;
    selectedPackageId: string;
    selectedPackage: DefaecoVendorPackage;
    vendor: DefaecoVendor;
    selectedAddOns: string[] = [];
    grandTotal: number = 0;
    isPremium: boolean = false;
    selectedAddonIds: string[] = [];
    totalSlotsRequired: number = 0;
    availableSlots: DefaecoSlot[] = [];
    availableSlotsToday: DefaecoSlot[] = [];
    selectedData: any = new Date().toDateString();
    userPickedTime: any = new Date();
    selectedSlot: any = {};
    order: DefaecoOrder;
    orderId: string;
    user: User;
    slotsCollectionToSave: any[] = [];
    isLoading:boolean = false;
    constructor( 
        private vendorService: VendorDataService, 
        private route: ActivatedRoute, 
        private slotService: SlotService, 
        public alertController: AlertController,
        private afs: AngularFirestore, 
        private orderService: OrderService,
        private authService: AuthenticationService, 
        private navCtrl: NavController,
        private uiService:UiService) { }
    ngOnInit(){}
    ionViewWillEnter() {

        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.init();
        } else {
            this.navigateToWelcomePage();
        }
    }
    init() {

        this.route.queryParams.subscribe(async (params) => {
            try {
                this.isLoading = true;

                this.vendorId = params["vendorId"];
                this.selectedPackageId = params["selectedPackage"];
                this.selectedAddonIds = params["addons"];
                this.orderId = params["orderId"];

                if (this.vendorId && this.orderId && this.selectedPackageId) {
                    this.vendor = await this.vendorService.getVendorById(this.vendorId) as DefaecoVendor;
                    this.parseVendorAndGetAddons();
                    //this.selectedPackage.type: "Basic" "Premium"
                    this.isPremium = this.selectedPackage.type == "Premium" ? true : false;
                    this.grandTotal = this.selectedPackage.price;
                    this.totalSlotsRequired = this.selectedPackage.noOfSlotsNeeded;
                    for (let i = 0; i < this.selectedPackage.addOns.length; i++) {
                        let currentAddOn = this.selectedPackage.addOns[i];
                        if (this.selectedAddonIds.indexOf(currentAddOn.code) >= 0) {
                            this.grandTotal = this.grandTotal + currentAddOn.price;
                            this.totalSlotsRequired = this.totalSlotsRequired + currentAddOn.noOfSlotsNeeded;
                        }
                    }
                    await this.showAvailableSlots(this.userPickedTime, this.totalSlotsRequired);
                    this.isLoading = false;
                }
                else {
                    this.isLoading = false;
                    this.navigateToOrderListingPage();
                }

            } catch (e) {
                console.log("error", e);
                this.isLoading = false;
            }

        });

    }
    parseVendorAndGetAddons() {
        for (let i = 0; i < this.vendor.packageMatrix.length; i++) {
            if (this.vendor.packageMatrix[i].code == this.selectedPackageId) {
                this.selectedPackage = this.vendor.packageMatrix[i];
                break;
            }
        }
    }

    showAvailableSlots(selectedDateInput, slotsRequired: number, isPremium?: boolean) {
        return new Promise(async (resolve, reject) => {

            try {
                //3 dates -> today, selected date, next day to selected date.
                let todayMilliSeconds: any = await this.vendorService.getServerTimestamp();
                let todayDate = new Date(todayMilliSeconds);
                let selDate = new Date(selectedDateInput);
                let selNextDate = new Date(selDate);
                selNextDate.setDate(selDate.getDate() + 1);

                let selDate_defaecoFormat = this.vendorService.formatDate(selDate.getTime());
                let selNextDate_defaecoFormat = this.vendorService.formatDate(selNextDate.getTime());
                let todayDate_defaecoFormat = this.vendorService.formatDate(todayDate.getTime());

                let isToday: boolean = false;
                let timeToday: number = 0;
                if (selDate_defaecoFormat.date == todayDate_defaecoFormat.date) {
                    isToday = true;
                    timeToday = todayDate_defaecoFormat.time;
                }

                this.availableSlots = await this.slotService.getAvailableSlots(this.vendor, slotsRequired, this.isPremium, selDate_defaecoFormat.date, timeToday, isToday, selNextDate_defaecoFormat.date, false) as DefaecoSlot[];
                if (this.availableSlots.length <= 0) {
                    //since no slots available for today will look for slots in next day.
                    this.availableSlots = await this.slotService.getAvailableSlots(this.vendor, slotsRequired, this.isPremium, selDate_defaecoFormat.date, timeToday, isToday, selNextDate_defaecoFormat.date, true) as DefaecoSlot[];
                }
                this.availableSlotsToday = [];
                for (let i = 0; i < this.availableSlots.length; i++) {
                    if (!this.availableSlots[i].isTomorrow) {
                        this.availableSlotsToday.push(this.availableSlots[i]);
                    }
                }
                console.log("All slots today", this.availableSlotsToday);
                resolve();

            } catch (e) {
                console.log("ERROR!!!", e);
                resolve();
            }


        })
    }

    slotSelectionChange(slot: any) {
        this.presentSlotConfirmationAlert(slot)
    }
    selectSlot(slot: DefaecoSlot) {
        //deselect all
        this.availableSlotsToday.map((d) => {
            d['isSelected'] = false;
        })
        slot['isSelected'] = true;
        this.selectedSlot = slot;
    }

    async presentSlotConfirmationAlert(slot: any) {

        let startTime = slot.isTomorrow ? 'Tomorrow' : 'Today';
        startTime = `${startTime} ${slot.time}`;

        let endTime = slot.isExtended ? 'Tomorrow' : 'Today';
        endTime = `${endTime} ${slot.deliveryTime}`;

        startTime = `${slot.date} At ${slot.time}`;
        endTime = `${slot.deliveryDate} At ${slot.deliveryTime}`;

        const alert = await this.alertController.create({
            header: 'Confirm Slot',
            subHeader: 'Subtitle',
            message: `
          <p>Start At :${startTime}  </p>
          <p>Ends At : ${ endTime} </p>
          `,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                        console.log('Confirm Cancel');
                    }
                }, {
                    text: 'Ok',
                    handler: () => {
                        this.selectSlot(slot);
                    }
                }
            ]
        });

        await alert.present();
    }

    async dateChange(event) {
        this.userPickedTime = new Date(event.target.value);
        let busySpinner: any = await this.uiService.presentBusySpinner();
        await this.showAvailableSlots(this.userPickedTime, this.totalSlotsRequired);
        await busySpinner.dismiss();
    }
    
    async proceedClick() {
        if (this.selectedSlot && this.selectedSlot.isSelected) {
            let busySpinner: any = await this.uiService.presentBusySpinner();
            try {
                this.order = await this.orderService.getMyOrderById(this.orderId) as DefaecoOrder;
                console.log("order", this.order);
                //repoen old slots
                await this.reopenTheSlots();
                //add new slots
                await this.addNewSlots();
                //update the order
                this.updateOrderObj();
                await this.orderService.updateOrder(this.order);
                busySpinner.dismiss();
                //show successmessage and take him to order listing page
                this.uiService.presentToast("Order Rescheduled Successfully");
                this.navigateToOrderListingPage();

            } catch (e) {
                console.log("error", e);
                this.uiService.presentToast("Error occurred");
                busySpinner.dismiss();

            }
        }
    }
    async reopenTheSlots() {

        return new Promise(async(resolve,reject)=>{

            try{
                for (let i = 0; i < this.order.allSlots.length; i++) {
                    let idToDelete = this.order.allSlots[i].id;
                    console.log("slots deleting are", idToDelete);
                    await this.afs.collection<any>('booked_slots').doc(idToDelete).delete();
                    if (i == this.order.allSlots.length - 1) {
                        resolve();
                    }
                }
            }catch(e){
                console.log("Error!!!",e);
                reject(e);
            }


        })

        
    }
    async addNewSlots() {

        return new Promise(async (resolve, reject) => {
            try {
                let slotStart = parseInt(this.selectedSlot.slot);
                let slotEnd = slotStart + this.totalSlotsRequired;
                this.slotsCollectionToSave = [];
                for (let i = slotStart; i < slotEnd; i++) {
                    let slotTosave = this.slotService.getSlotsInformation(this.vendor, this.userPickedTime, i);
                    slotTosave["bayname"] = this.selectedSlot.bay;
                    slotTosave["type"] = this.selectedPackage.type;
                    slotTosave["ui"] = {
                        "packageName": this.selectedPackage.packageName,
                        "vendorName": this.vendor.name,
                        "userName": this.user.displayName,
                        "package": this.selectedPackage,
                        "addonIds": this.selectedAddonIds ? this.selectedAddonIds : []
                    };
                    this.slotsCollectionToSave.push(slotTosave);
                }
                await this.saveSlots();
                resolve();
            } catch (e) {
                console.log("ERROR!!!", e)
                reject();
            }

        })




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
                reject();
            }


        })

    }
    updateOrderObj() {
        this.order.date = this.userPickedTime.getTime();
        this.order.slot = this.selectedSlot;
        this.order.allSlots = this.slotsCollectionToSave;
    }

    navigateToOrderListingPage() {
        this.navCtrl.navigateRoot('bookings', { animated: true });
    }
    navigateToBookingDetailsPage(){
        this.navCtrl.navigateBack('booking-detail', { animated: true });
    }
    navigateToWelcomePage() {
        this.navCtrl.navigateRoot('welcome', { animated: true });
    }

}
