import { Injectable } from "@angular/core";
import { DataService } from "./data.service";
import { HttpClient } from "@angular/common/http";
import { AngularFirestore } from "@angular/fire/firestore";
import { DefaecoVendor } from "./interfaces/DefaecoVendor";
import { VendorDataService } from "./vendors.data.service";

@Injectable({
    providedIn: 'root',
})
export class SlotService {


    constructor(private readonly afs: AngularFirestore, private http: HttpClient, private dataService: DataService) { }


    //private methods
    private constructBaySlotMatrix(vendor,isTwoDays,isPremium){

        let allSlots = [];
        let baySlotsMatrix = {};

        let totalNoOfSlotsPerDay = this.getTotalNumberOfSlots(vendor);
        totalNoOfSlotsPerDay = isTwoDays ? (totalNoOfSlotsPerDay * 2) : totalNoOfSlotsPerDay;

        for (let i = 0; i < totalNoOfSlotsPerDay; i++) {
            allSlots.push(`${i}`);
        }
        
        //basic if only basic
        if (!isPremium) {
            for (let i = 0; i < vendor.basicBays.length; i++) {
                let slotsWithBayname = allSlots.map((slotname) => {
                    return {
                        "slotname": slotname,
                        "type": isPremium ? "premium" : "basic",
                        "booked": false
                    }
                });
                baySlotsMatrix[vendor.basicBays[i]] = slotsWithBayname;
            }
        }
        //since premium slot is available for basic also
        for (let i = 0; i < vendor.premiumBays.length; i++) {
            let slotsWithBayname = allSlots.map((slotname) => {
                return {
                    "slotname": slotname,
                    "type": isPremium ? "basic" : "premium",
                    "booked": false
                }
            });
            baySlotsMatrix[vendor.premiumBays[i]] = slotsWithBayname;
        }
        return baySlotsMatrix;

    }
    private blockAndReturnBlockObjForGivenSlot(vendor,slotNumber,date){
        let timePastSlotsBooked: any = [];
        //block basic slot
        for (let i = 0; i < vendor.basicBays.length; i++) {
            let bookObj = {
                "date": date,
                "slotname": `${slotNumber}`,
                "bayname": vendor.basicBays[i], 
                "type": "basic"
            }
            timePastSlotsBooked.push(bookObj);
        }
        //block premium slot
        for (let i = 0; i < vendor.premiumBays.length; i++) {
            let bookObj = {
                "date": date,
                "slotname": `${slotNumber}`,
                "bayname": vendor.premiumBays[i], 
                "type": "premium"
            }
            timePastSlotsBooked.push(bookObj);
        }
        return timePastSlotsBooked;

    }
    private getPastTimeSlotsForToday(vendor,currentDate,currentTime){
        let timePastSlotsBooked: any = [];
        let totalNumberOfSlotsToBeBooked = 0;
        if (currentTime > vendor.shopCloseTime) {
            currentTime = vendor.shopCloseTime;
        }
        if (currentTime > vendor.shopOpenTime) {
            totalNumberOfSlotsToBeBooked = Math.floor(currentTime - vendor.shopOpenTime) / vendor.slotDuration;
        }
        for(let i=0;i<totalNumberOfSlotsToBeBooked;i++){

            let bookedSlotsForSlotI = this.blockAndReturnBlockObjForGivenSlot(vendor,i,currentDate);
            timePastSlotsBooked = timePastSlotsBooked.concat(bookedSlotsForSlotI)
        }
        
        return timePastSlotsBooked;
    }
    private getAllBookedSlots(vendor,isToday,currentDate,currentTime,isTowDays,nextDate){

        return new Promise(async(resolve,reject)=>{
            try{

                let timePastSlotsBooked: any[] = [];
                let tomorrowsBookings:any[] = [];
                let todaysBookings: any[] = [];
        
                todaysBookings = await this.getBookedSlotsForGivenDate(currentDate,vendor.id) as any[];
                if(isToday){
                    timePastSlotsBooked = this.getPastTimeSlotsForToday(vendor,currentDate,currentTime);
                }
                if (isTowDays) {
                    tomorrowsBookings = await this.getBookedSlotsForGivenDate(nextDate,vendor.id) as any[];
                    //update slots number with new numbers
                    let totalNoOfSlots = this.getTotalNumberOfSlots(vendor);
                    tomorrowsBookings = tomorrowsBookings.map((d) => {
                        d['oldSlotname'] = `${d.slotname}`;
                        d.slotname = `${Number.parseInt(d.slotname) + totalNoOfSlots}`;
                        return d;
                    })
                }
        
                //club all there booked slots list and return
                let allBookedSlots = timePastSlotsBooked.concat(todaysBookings,tomorrowsBookings);
                resolve(allBookedSlots);

            }catch(e){
                console.log("ERROR!!!",e);
                reject();
            }
        })
    }
    private getTotalNumberOfSlots(vendor){
        let totalOperationalHours = vendor.shopCloseTime - vendor.shopOpenTime;
        let totalNumberOfSlots = totalOperationalHours / vendor.slotDuration;
        return totalNumberOfSlots;
    }
    private updateBaySlotMAtrixWithBookedSlots(baySlotMatrix,allBookedSlots){
        for (let i = 0; i < allBookedSlots.length; i++) {
            let matrixRef = baySlotMatrix[allBookedSlots[i].bayname];
            if (matrixRef) {
                for (let j = 0; j < matrixRef.length; j++) {
                    if (matrixRef[j].slotname == allBookedSlots[i].slotname) {
                        matrixRef[j].booked = true;
                    }
                }
            }
        }
        return baySlotMatrix;
    }
    private getSlotNumberAndTimeMapping(vendor,isTwoDays) {
        let slotTimeMapping = {};
        let slotNumber = 0
        let totalNoOfSlotsPerDay = this.getTotalNumberOfSlots(vendor);

        for (let i = 0; i <= totalNoOfSlotsPerDay; i++) { // = in loop becuase we want the last time also used in delivery time
            let time: any = (i * vendor.slotDuration) + vendor.shopOpenTime;
            time = this.convertDecimalTimeToRegularTime(time);
            slotTimeMapping[`${slotNumber}`] = time; // `Today :${time}`;
            slotNumber++;
        }
        if (isTwoDays) {
            for (let i = 0; i <= totalNoOfSlotsPerDay; i++) { // = in loop becuase we want the last time also used in delivery time
                let time: any = (i * vendor.slotDuration) + vendor.shopOpenTime;

                time = this.convertDecimalTimeToRegularTime(time);
                slotTimeMapping[`${slotNumber}`] = time; // `Tomorrow :${time}`;
                slotNumber++;
            }
        }
        return slotTimeMapping;

    }
    private getBookedSlotsForGivenDate(date: string,vendorId:string) {
        return new Promise(async (res, rej) => {
            try {
                let slotsBookedCollectionRef = this.afs.collection<any>('booked_slots'); 
                
                let slotsBookedCollection = this.afs.collection<any>('booked_slots', ref => ref.where('date', '==', date).where('vendorId','==',vendorId));
                
                let slotsList = await slotsBookedCollection.get().toPromise();
                let _tempList = [];
                slotsList.forEach((doc) => {
                    let vendor: any = doc.data() as any;
                    _tempList.push(vendor);
                });
                res(_tempList);
            } catch (e) {
                console.log("ERROR!!!", e);
                rej(e);
            }

        })
    }
    private convertDecimalTimeToRegularTime(decimalTime) {
        let twelveHourFormatTime = decimalTime;
        let isPM = false;
        if (decimalTime > 12) {
            isPM = true;
        }
        if (decimalTime >= 13) {
            twelveHourFormatTime = decimalTime - 12;

        }
        //get just decimal
        let justDecimal: any = (twelveHourFormatTime % 1).toFixed(2);
        let minutes: any = justDecimal * 60;

        let ampm = isPM ? 'PM' : 'AM';

        twelveHourFormatTime = Math.floor(twelveHourFormatTime);
        let twelveHourFormatTimeStr = ("0" + twelveHourFormatTime).slice(-2); //0 -> 00

        minutes = ("0" + minutes).slice(-2);

        return `${twelveHourFormatTimeStr}:${minutes} ${ampm}`;


    }
    private checkIfThenGivenSlotIsAvailable(slotsRequired: number, slotname,baySlotsMatrix) {
        let isSlotAvailable = false;
        let allBays = Object.keys(baySlotsMatrix);
        for (let i = 0; i < allBays.length; i++) {

            let currentBayname = allBays[i];
            let slots = baySlotsMatrix[currentBayname];
            let slotStartIndex = -1;
            for (let j = 0; j < slots.length; j++) {
                if (slots[j].slotname == slotname) {
                    slotStartIndex = j;
                    break;
                }
            }

            if (slotStartIndex >= 0) {

                let endIndex = slotStartIndex + slotsRequired;

                isSlotAvailable = true;
                for (let k = slotStartIndex; k < endIndex; k++) {

                    let currentSlot = slots[k];
                    if (!currentSlot) {
                        isSlotAvailable = false;
                        break;
                    }
                    if (currentSlot && currentSlot.booked) {
                        isSlotAvailable = false;
                        break;
                    }
                }
                if (isSlotAvailable) {
                    return currentBayname;
                }
            }

        }
        //no slot availble
        return null;
    }
    getAvailableSlots(vendor: DefaecoVendor, sloteRequired: number, isPremium: boolean, date: any, time: number, isToday: boolean, nextDate: string,isTwoDays:boolean){
        return new Promise(async(resolve,reject)=>{
            try{
                let baySlotMatrix = this.constructBaySlotMatrix(vendor,isTwoDays,isPremium);
                let allBookedSlots:any[] = await this.getAllBookedSlots(vendor,isToday,date,time,isTwoDays,nextDate) as any[];
                baySlotMatrix = this.updateBaySlotMAtrixWithBookedSlots(baySlotMatrix,allBookedSlots);
                let slotTimeMapping = this.getSlotNumberAndTimeMapping(vendor,isTwoDays)
                let totalNoOfSlotsPerDay = this.getTotalNumberOfSlots(vendor);
                let availableSlots:DefaecoSlot[] = [];
                for (let i = 0; i < totalNoOfSlotsPerDay; i++) {
                    let availableBay = this.checkIfThenGivenSlotIsAvailable(sloteRequired,i,baySlotMatrix);
                    if (availableBay) {
                        let deliverySlot = i + sloteRequired;
                        let deliveryDate = date;
                        let isExtended:boolean = false;
                        if(deliverySlot >totalNoOfSlotsPerDay){
                            deliveryDate = nextDate;
                            isExtended = true;
                        }

                        let slotObj = new DefaecoSlot();
                        slotObj.slot = i;
                        slotObj.bay = availableBay;
                        slotObj.time = slotTimeMapping[i];
                        slotObj.date = date;
                        slotObj.deliveryTime = slotTimeMapping[deliverySlot];
                        slotObj.deliveryDate = deliveryDate;
                        slotObj.isExtended = isExtended;

                        if (i > totalNoOfSlotsPerDay) {
                            slotObj.isTomorrow = true;
                            slotObj.isExtended = true;
                            slotObj.date = nextDate;
                        }
                        availableSlots.push(slotObj);
                    }
                }
                resolve(availableSlots);
            }catch(e){
                console.log("ERROR!!!",e);
                reject();
            }
        })
    }
    getSlotsInformation(vendor: any, date: any, slotNumber: any) {

        //this.vendor = vendor;
        //this.slotDuration = vendor.slotDuration;
        let totalOperationalHours = vendor.shopCloseTime - vendor.shopOpenTime;
        let totalNumberOfSlotsPerDay = totalOperationalHours / vendor.slotDuration;
        let currentslot = parseInt(slotNumber);
        let slotObj = {
            "slotname": slotNumber,
            "date": this.dataService.formatDate(date.getTime()).date
        }
        if (currentslot > totalNumberOfSlotsPerDay) {
            slotObj.slotname = currentslot - totalNumberOfSlotsPerDay;
            let tomorrow = new Date(date);
            tomorrow.setDate(date.getDate() + 1);
            slotObj.date = this.dataService.formatDate(tomorrow.getTime()).date;
        }

        return slotObj;
    }

    /*
     allSlots: any[] = [];
    baySlotsMatrix: any = {};
    vendor: DefaecoVendor = new DefaecoVendor();
    slotDuration: number = 0.5;
    slotTimeMapping: any = {};
    //exposed methods
    async getAvailableSlotsForOneDay(vendor: DefaecoVendor, sloteRequired: number, isPremium: boolean, date: any, time: number, isToday: boolean, nextDate: string) {

        return new Promise(async (resolve, reject) => {

            try {

                this.vendor = vendor;
                this.slotDuration = vendor.slotDuration;
                this.getDefaultSlotsReady(false);
                this.getBaySlotMatrix(isPremium);
                await this.updateBaySlotMatrixWithBooking(false, isToday, time, date, nextDate);

                this.setupSlotNumberAndTimeMapping(false);
                let availableSlots: any = [];
                let totalNoOfSlotsPerDay = (this.vendor.shopCloseTime - this.vendor.shopOpenTime) / this.vendor.slotDuration;
                for (let i = 0; i < this.allSlots.length; i++) {
                    let availableBay = this.checkIfSlotAvailable(sloteRequired, this.allSlots[i]);
                    let deliverySlot = parseInt(this.allSlots[i]) + sloteRequired;
                    let slotObj = {
                        "slot": this.allSlots[i],
                        "bay": availableBay,
                        "time": this.slotTimeMapping[this.allSlots[i]],
                        "deliveryTime": this.slotTimeMapping[deliverySlot],
                        "isExtended": false,
                        "extendedSlot": this.allSlots[i],
                        "isTomorrow": false
                    }
                    if (availableBay) {
                        if (this.allSlots[i] >= totalNoOfSlotsPerDay) {
                            slotObj.extendedSlot = slotObj.slot - totalNoOfSlotsPerDay;
                            slotObj.isExtended = true;
                        }
                        availableSlots.push(slotObj);
                    }

                }
                resolve(availableSlots);

            } catch (e) {
                console.log("ERROR!!!", e);
                resolve([]);
            }


        })


    }
    async getAvailableSlotsForTwoDays(vendor: any, sloteRequired: number, isPremium: boolean, date: any, time: number, isToday: boolean, nextDate: string) {

        return new Promise(async (resolve, reject) => {


            try {


                this.vendor = vendor;
                this.slotDuration = vendor.slotDuration;
                this.getDefaultSlotsReady(true);
                this.getBaySlotMatrix(isPremium);
                await this.updateBaySlotMatrixWithBooking(true, isToday, time, date, nextDate);
                this.setupSlotNumberAndTimeMapping(true);
                let availableSlots: any = [];
                let totalNoOfSlotsPerDay = (this.vendor.shopCloseTime - this.vendor.shopOpenTime) / this.vendor.slotDuration;
                for (let i = 0; i < this.allSlots.length; i++) {
                    let availableBay = this.checkIfSlotAvailable(sloteRequired, this.allSlots[i]);
                    let deliverySlot = parseInt(this.allSlots[i]) + sloteRequired;
                    let slotObj = {
                        "slot": this.allSlots[i],
                        "bay": availableBay,
                        "time": this.slotTimeMapping[this.allSlots[i]],
                        "deliveryTime": this.slotTimeMapping[deliverySlot],
                        "isExtended": true,
                        "extendedSlot": this.allSlots[i],
                        "isTomorrow": false,

                    }

                    if (availableBay) {

                        if (this.allSlots[i] >= totalNoOfSlotsPerDay) {
                            slotObj.isTomorrow = true;
                            slotObj.extendedSlot = slotObj.slot - totalNoOfSlotsPerDay;
                            slotObj.isExtended = true;
                        }
                        availableSlots.push(slotObj);
                    }
                }
                resolve(availableSlots);
            } catch (e) {
                console.log("ERROR!!!", e);
                resolve([]);
            }


        })





    }
    getSlotsInformation(vendor: any, date: any, slotNumber: any) {

        //this.vendor = vendor;
        //this.slotDuration = vendor.slotDuration;
        let totalOperationalHours = vendor.shopCloseTime - vendor.shopOpenTime;
        let totalNumberOfSlotsPerDay = totalOperationalHours / vendor.slotDuration;
        let currentslot = parseInt(slotNumber);
        let slotObj = {
            "slotname": slotNumber,
            "date": this.dataService.formatDate(date.getTime()).date
        }
        if (currentslot > totalNumberOfSlotsPerDay) {
            slotObj.slotname = currentslot - totalNumberOfSlotsPerDay;
            let tomorrow = new Date(date);
            tomorrow.setDate(date.getDate() + 1);
            slotObj.date = this.dataService.formatDate(tomorrow.getTime()).date;
        }

        return slotObj;
    }

    getDefaultSlotsReady(isTwoDays) {
        this.allSlots = [];
        let slotNumber = 0;

        let totalNoOfSlotsPerDay = (this.vendor.shopCloseTime - this.vendor.shopOpenTime) / this.slotDuration;
        totalNoOfSlotsPerDay = isTwoDays ? (totalNoOfSlotsPerDay * 2) : totalNoOfSlotsPerDay;

        for (let i = 0; i < totalNoOfSlotsPerDay; i++) {
            this.allSlots.push(`${i}`);
        }
        // 
        // for(let i=this.vendor.shopOpenTime;i<=(this.vendor.shopCloseTime-this.slotDuration);i=i+this.slotDuration){
        //     this.allSlots.push(`${slotNumber}`);
        //     slotNumber++;
        // }
        // if(isTwoDays){

        //     for(let i=this.vendor.shopOpenTime;i<=(this.vendor.shopCloseTime-this.slotDuration);i=i+this.slotDuration){
        //         this.allSlots.push(`${slotNumber}`);
        //         slotNumber++;
        //     }
        // }


    }
    getBaySlotMatrix(isPremium) {
        this.baySlotsMatrix = {};
        //basic if only basic
        if (!isPremium) {
            for (let i = 0; i < this.vendor.basicBays.length; i++) {
                let slotsWithBayname = this.allSlots.map((slotname) => {
                    return {
                        "slotname": slotname,
                        "type": isPremium ? "premium" : "basic",
                        "booked": false
                    }
                });
                this.baySlotsMatrix[this.vendor.basicBays[i]] = slotsWithBayname;
            }
        }
        //since premium slot is available for basic also
        for (let i = 0; i < this.vendor.premiumBays.length; i++) {
            let slotsWithBayname = this.allSlots.map((slotname) => {
                return {
                    "slotname": slotname,
                    "type": isPremium ? "basic" : "premium",
                    "booked": false
                }
            });
            this.baySlotsMatrix[this.vendor.premiumBays[i]] = slotsWithBayname;
        }

    }

    async updateBaySlotMatrixWithBooking(isTowDays, isToday, givenTime, currentDay, nextDay) {

        return new Promise(async (resolve, reject) => {

            try {




                //if isPremium then fectch booking for today and tomorrow and bay in premium bay array.
                let timePastSlotsBooked: any = [];
                if (isToday) {
                    let totalOperationalHours = this.vendor.shopCloseTime - this.vendor.shopOpenTime;
                    let totalNumberOfSlots = totalOperationalHours / this.slotDuration;
                    totalNumberOfSlots = totalNumberOfSlots + 1; //added +1;
                    let slotTimeMapping = {};
                    let slotNumber = 0;

                    for (let i = this.vendor.shopOpenTime; i <= this.vendor.shopCloseTime; i = i + this.slotDuration) {
                        slotTimeMapping[slotNumber] = i;// `Today :${i}-${i+this.slotDuration}`;
                        slotNumber++;
                    }

                    if (givenTime > this.vendor.shopCloseTime) {
                        givenTime = this.vendor.shopCloseTime;
                    }
                    if (givenTime > this.vendor.shopOpenTime) {
                        for (let i = 0; i <= totalNumberOfSlots; i++) {
                            let slotTime = slotTimeMapping[i];
                            if (givenTime > slotTime) {

                                //block for basic bays
                                for (let k = 0; k < this.vendor.basicBays.length; k++) {
                                    let bookObj = {
                                        "date": currentDay,
                                        "slotname": `${i}`,
                                        "bayname": this.vendor.basicBays[k], //should be all bays
                                        "type": "basic"
                                    }
                                    timePastSlotsBooked.push(bookObj);
                                }
                                //block for premium bays
                                for (let k = 0; k < this.vendor.premiumBays.length; k++) {
                                    let bookObj = {
                                        "date": currentDay,
                                        "slotname": `${i}`,
                                        "bayname": this.vendor.premiumBays[k], //should be all bays
                                        "type": "basic"
                                    }
                                    timePastSlotsBooked.push(bookObj);
                                }
                            }

                        }
                    }
                }

                //booked slots for today
                let bookedSlots: any = await this.getBookedSlotsForGivenDate(currentDay,this.vendor.id);

                if (isTowDays) {
                    //if premium add tomorrows data also
                    // let tomorrowsBookings:any = [
                    //     {
                    //         "date": "13-11-2019",
                    //         "slotname": "1",
                    //         "bayname": "B4",
                    //         "type": "premium"
                    //     },
                    //     {
                    //         "date": "13-11-2019",
                    //         "slotname": "8",
                    //         "bayname": "B5",
                    //         "type": "premium"
                    //     }
                    // ];
                    let tomorrowsBookings: any = await this.getBookedSlotsForGivenDate(nextDay,this.vendor.id);
                    //update slots number with new numbers
                    let totalOperationalHours = this.vendor.shopCloseTime - this.vendor.shopOpenTime;
                    let totalNumberOfSlots = totalOperationalHours / this.slotDuration;
                    tomorrowsBookings = tomorrowsBookings.map((d) => {
                        d['oldSlotname'] = `${d.slotname}`;
                        d.slotname = `${Number.parseInt(d.slotname) + totalNumberOfSlots}`;
                        return d;
                    })

                    //join both of them
                    bookedSlots = bookedSlots.concat(tomorrowsBookings);
                }

                bookedSlots = bookedSlots.concat(timePastSlotsBooked);
                for (let i = 0; i < bookedSlots.length; i++) {
                    let matrixRef = this.baySlotsMatrix[bookedSlots[i].bayname];
                    if (matrixRef) {
                        for (let j = 0; j < matrixRef.length; j++) {
                            if (matrixRef[j].slotname == bookedSlots[i].slotname) {
                                matrixRef[j].booked = true;
                            }
                        }
                    }


                }
                resolve();













            } catch (e) {
                console.log("ERROR!!!", e);
                resolve();

            }
        })
    }
    checkIfSlotAvailable(slotsRequired: number, slotname) {
        let isSlotAvailable = false;
        let allBays = Object.keys(this.baySlotsMatrix);
        for (let i = 0; i < allBays.length; i++) {

            let currentBayname = allBays[i];
            let slots = this.baySlotsMatrix[currentBayname];
            let slotStartIndex = -1;
            for (let j = 0; j < slots.length; j++) {
                if (slots[j].slotname == slotname) {
                    slotStartIndex = j;
                    break;
                }
            }

            if (slotStartIndex >= 0) {

                let endIndex = slotStartIndex + slotsRequired;

                isSlotAvailable = true;
                for (let k = slotStartIndex; k < endIndex; k++) {

                    let currentSlot = slots[k];
                    if (!currentSlot) {
                        isSlotAvailable = false;
                        break;
                    }
                    if (currentSlot && currentSlot.booked) {
                        isSlotAvailable = false;
                        break;
                    }
                }
                if (isSlotAvailable) {
                    return currentBayname;
                }
            }

        }
        //no slot availble
        return null;
    }
    setupSlotNumberAndTimeMapping(isTwoDays) {

        this.slotTimeMapping = {};
        let slotNumber = 0
        let totalNoOfSlotsPerDay = (this.vendor.shopCloseTime - this.vendor.shopOpenTime) / this.slotDuration;

        for (let i = 0; i < totalNoOfSlotsPerDay; i++) {
            let time: any = (i * this.slotDuration) + this.vendor.shopOpenTime;
            time = this.convertDecimalTimeToRegularTime(time);
            this.slotTimeMapping[`${slotNumber}`] = time; // `Today :${time}`;
            slotNumber++;
        }
        if (isTwoDays) {
            for (let i = 0; i < totalNoOfSlotsPerDay; i++) {
                let time: any = (i * this.slotDuration) + this.vendor.shopOpenTime;

                time = this.convertDecimalTimeToRegularTime(time);

                //0.5


                this.slotTimeMapping[`${slotNumber}`] = time; // `Tomorrow :${time}`;
                slotNumber++;
            }
        }

        // 
        // for(let i=this.vendor.shopOpenTime;i<=this.vendor.shopCloseTime;i=i+this.slotDuration){
        //     this.slotTimeMapping[`${slotNumber}`] = `Today :${i}-${i+this.slotDuration}`;
        //     slotNumber++;
        // }
        // if(isTwoDays){
        //      //add for next day
        //     for(let i=this.vendor.shopOpenTime;i<=this.vendor.shopCloseTime;i=i+this.slotDuration){
        //         this.slotTimeMapping[`${slotNumber}`] = `Tomorrow :${i}-${i+this.slotDuration}`;
        //         slotNumber++;
        //     }
        // }
        // 

    }
    */
   

}
export class DefaecoSlot{

    slot:number = -1;
    bay:string;
    date:string;
    time:string;
    id:string;
    deliveryDate:string;
    deliveryTime:string;
    isExtended:boolean;  
    isTomorrow:boolean; 
}