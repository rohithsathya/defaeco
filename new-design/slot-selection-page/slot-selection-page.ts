import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { VendorDataService } from '../services/vendors.data.service';
import { DefaecoVendor, DefaecoVendorPackageAddons, DefaecoVendorPackage } from '../services/interfaces/DefaecoVendor';
import { SlotService, DefaecoSlot } from '../services/slot.service';
import { AlertController, NavController } from '@ionic/angular';
import { DataService } from '../services/data.service';
import { AuthenticationService, User } from '../services/authentication.service';
import { UiService } from '../services/ui.service';

@Component({
    selector: 'app-slot-selection-page',
    templateUrl: 'slot-selection-page.html',
    styleUrls: ['slot-selection-page.scss']
})
export class AppSlotSelectionPage implements OnInit {
  
    addOnOptions:DefaecoVendorPackageAddons[] = [];
    vendorId:string;
    selectedPackageId:string;
    selectedPackage:DefaecoVendorPackage;
    vendor:DefaecoVendor;
    selectedAddOns:string[] = [];
    grandTotal:number = 0;
    isPremium:boolean = false;
    selectedAddonIds:string[] = [];
    totalSlotsRequired:number = 0;
    availableSlots:DefaecoSlot[] = [];
    availableSlotsToday:DefaecoSlot[] = [];
    selectedData:any = new Date().toDateString();
    userPickedTime:any = new Date();
    selectedSlot:any = {};
    user:User;
    isLoading:boolean = false;
    constructor(private router: Router, 
        private vendorService:VendorDataService,
        private route: ActivatedRoute,
        private slotService:SlotService,
        public alertController: AlertController,
        private dataService: DataService,
        private navCtrl: NavController,
        private authService:AuthenticationService,
        private uiService: UiService
        ) { }
    ngOnInit(){}
    ionViewWillEnter(){
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.init();
        } else {
            this.navigateToWelcomePage();
        }

        
    }
    init(){

        this.route.queryParams.subscribe(async (params) => {
            try{
                this.isLoading = true;
                this.vendorId = params["vendorId"];
                this.selectedPackageId = params["selectedPackage"];
                this.selectedAddonIds = params["addons"];
                if(this.vendorId){
                    this.vendor =  await this.vendorService.getVendorById(this.vendorId) as DefaecoVendor;
                    this.parseVendorAndGetAddons();
                    //this.selectedPackage.type: "Basic" "Premium"
                    this.isPremium = this.selectedPackage.type =="Premium" ? true:false;
                    this.grandTotal = this.selectedPackage.price;
                    this.totalSlotsRequired = this.selectedPackage.noOfSlotsNeeded;
                    for(let i=0;i<this.selectedPackage.addOns.length;i++){
                        let currentAddOn = this.selectedPackage.addOns[i];
                        if(this.selectedAddonIds.indexOf(currentAddOn.code) >=0){
                            this.grandTotal = this.grandTotal + currentAddOn.price;
                            this.totalSlotsRequired = this.totalSlotsRequired + currentAddOn.noOfSlotsNeeded;
                        }
                    }   
                    await this.showAvailableSlots(this.userPickedTime,this.totalSlotsRequired);
                    this.prepareUi();
                    this.getslotsMatrixForGivenDate(this.userPickedTime,this.totalSlotsRequired,this.isPremium);
                    this.isLoading=false;
                }
                else{
                    this.isLoading=false;
                    //if vendor is not present go to listing page
                    this.gobackToListingPage();
                }

            }catch(e){
                this.isLoading = false;
                console.log("Error",e);
                this.navigateToErrorPage();
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

    allSlotsForNextSevenDays:any = {};
    slotsMatrix:any={};
    nextSevenDaysDate:Date[] = [];
    selectedDate:Date = new Date;
    prepareUi(){
        for(let i=0;i<7;i++){
            let date = new Date();
            let otherDate = new Date();
            otherDate.setDate(date.getDate() + i);
            this.nextSevenDaysDate.push(otherDate);
        }
        this.selectedDate = this.nextSevenDaysDate[0];
    }
    getDayNameFromDate(date:Date){
        let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
    }
    getMonthNameFromDate(date:Date){
        let days = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul','Aug','Sep','Oct','Nov','Dec'];
        return days[date.getMonth()];
    }
    userPickedDateEvent(date:Date){
        this.selectedDate = date;
        this.getslotsMatrixForGivenDate(this.selectedDate,this.totalSlotsRequired,this.isPremium);
    }
    async getslotsMatrixForGivenDate(selectedDateInput:Date,slotsRequired:number,isPremium:boolean){
        let selDate:Date = new Date(selectedDateInput);
        this.allSlotsForNextSevenDays = await this.slotService.getAvailableSlots_new(this.vendor);
        const noOfSlots = (this.vendor.shopCloseTime - this.vendor.shopOpenTime) / this.vendor.slotDuration;
        this.slotsMatrix = {};
        //check if the slots avaialble individualy
        let bays = this.isPremium?this.vendor.premiumBays: this.vendor.basicBays.concat(this.vendor.premiumBays);
                
        for(let i=0;i<noOfSlots;i++){
            this.slotsMatrix[i] = {"bay":"NA","available":false}
            //now for each bays
            let currentBay:any;
            let isAvailable:boolean = false;
            for(let j=0;j<bays.length;j++){
                currentBay = bays[j];
                isAvailable =  this.slotService.isSlotAvailableInTheBay(this.vendor,this.allSlotsForNextSevenDays,i,slotsRequired,selDate,isPremium,currentBay);
                if(isAvailable){
                    break;
                }
            }
            if(isAvailable){
                //slot is available
                this.slotsMatrix[i] = {"bay":currentBay,"available":isAvailable}
            }
        }
        console.log("slot Matrix for >>>>>",selectedDateInput.toString());
        console.log(this.slotsMatrix);

    }


    showAvailableSlots(selectedDateInput,slotsRequired:number,isPremium?:boolean){
        return new Promise(async (resolve,reject)=>{

            try{
                //3 dates -> today, selected date, next day to selected date.
                let todayMilliSeconds:any = await this.vendorService.getServerTimestamp();
                let todayDate = new Date(todayMilliSeconds);
                let selDate = new Date(selectedDateInput);
                let selNextDate = new Date(selDate);
                selNextDate.setDate(selDate.getDate()+1);

                let selDate_defaecoFormat = this.vendorService.formatDate(selDate.getTime());
                let selNextDate_defaecoFormat = this.vendorService.formatDate(selNextDate.getTime());
                let todayDate_defaecoFormat = this.vendorService.formatDate(todayDate.getTime());

                let isToday:boolean = false; 
                let timeToday:number = 0;
                if(selDate_defaecoFormat.date == todayDate_defaecoFormat.date){
                    isToday = true;
                    timeToday = todayDate_defaecoFormat.time;
                }
                /*
                //this.slotService.getAvailableSlotsForGivenDate(this.vendor, slotsRequired,selDate.getTime());   
                //this.slotService.getAvailableSlotsForGivenDateForPremium(this.vendor, slotsRequired,selDate.getTime());          
                this.allSlotsForNextSevenDays = await this.slotService.getAvailableSlots_new(this.vendor);
                debugger;
                const noOfSlots = (this.vendor.shopCloseTime - this.vendor.shopOpenTime) / this.vendor.slotDuration;
                let slotsMatrix:any = {};
                //check if the slots avaialble individualy
                let bays = this.isPremium?this.vendor.premiumBays: this.vendor.basicBays.concat(this.vendor.premiumBays);
                
                for(let i=0;i<noOfSlots;i++){
                    slotsMatrix[i] = {"bay":"NA","available":false}
                    //now for each bays
                    let currentBay:any;
                    let isAvailable:boolean = false;
                    for(let j=0;j<bays.length;j++){
                        currentBay = bays[j];
                        isAvailable =  this.slotService.isSlotAvailableInTheBay(this.vendor,this.allSlotsForNextSevenDays,i,4,todayMilliSeconds,this.isPremium,currentBay);
                        if(isAvailable){
                            break;
                        }
                    }
                    if(isAvailable){
                        //slot is available
                        slotsMatrix[i] = {"bay":currentBay,"available":isAvailable}

                    }


                }
                debugger;

                */

                this.availableSlots = await this.slotService.getAvailableSlots(this.vendor, slotsRequired, this.isPremium, selDate_defaecoFormat.date, timeToday, isToday, selNextDate_defaecoFormat.date,false) as DefaecoSlot[];
                if(this.availableSlots.length <= 0){
                    //since no slots available for today will look for slots in next day.
                    this.availableSlots = await this.slotService.getAvailableSlots(this.vendor, slotsRequired, this.isPremium, selDate_defaecoFormat.date, timeToday, isToday, selNextDate_defaecoFormat.date,true) as DefaecoSlot[];
                }
                this.availableSlotsToday = [];
                for(let i=0;i<this.availableSlots.length;i++){
                    if(!this.availableSlots[i].isTomorrow){
                        this.availableSlotsToday.push(this.availableSlots[i]);
                    }
                }
                console.log("All slots today",this.availableSlotsToday);
                resolve();

            }catch(e){
                console.log("ERROR!!!",e);
                resolve();
            }


        })
    }
    
    slotSelectionChange(slot:any){
        this.presentSlotConfirmationAlert(slot)
    }
    selectSlot(slot:DefaecoSlot){
         //deselect all
         this.availableSlotsToday.map((d)=>{
            d['isSelected'] = false;
        })
        slot['isSelected'] = true;
        this.selectedSlot = slot;
    }

    async presentSlotConfirmationAlert(slot:any) {

        let startTime = slot.isTomorrow? 'Tomorrow':'Today';
        startTime = `${startTime} ${slot.time}`;

        let endTime = slot.isExtended? 'Tomorrow':'Today';
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

    async dateChange(event){
        this.userPickedTime = new Date(event.target.value);
        let busySpinner:any = await this.uiService.presentBusySpinner();                
        await this.showAvailableSlots(this.userPickedTime,this.totalSlotsRequired);
        this.getslotsMatrixForGivenDate(this.userPickedTime,this.totalSlotsRequired,this.isPremium);
        await busySpinner.dismiss();
    }
    navigateToAddonPage(){
        this.navCtrl.navigateForward(`add-options?vendorId=${encodeURI(this.vendor.id)}&selectedPackage=${encodeURI(this.selectedPackage.code)}&addons=${encodeURI(this.selectedAddonIds.toString())}`, { animated: true });
    }
    gobackToListingPage() {
        this.navCtrl.navigateRoot('', { animated: true });
    }
    
    proceedClick(){
        if(this.selectedSlot && this.selectedSlot.isSelected){
            this.dataService.setCurrentOrderSumaryObj(this.vendor,this.selectedPackage,this.selectedAddonIds,this.selectedSlot,this.userPickedTime);
            this.navCtrl.navigateForward('order-summary', { animated: true });
        }
       
    }
    navigateToWelcomePage(){
        this.navCtrl.navigateRoot('welcome', { animated: true });
    }
    navigateToErrorPage() {
        this.navCtrl.navigateForward("error", { animated: true });
    }

}
