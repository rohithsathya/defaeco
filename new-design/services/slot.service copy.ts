import { Injectable } from "@angular/core";
import { DataService } from "./data.service";
import { HttpClient } from "@angular/common/http";
import { AngularFirestore } from "@angular/fire/firestore";
import { DefaecoVendor } from "./interfaces/DefaecoVendor";
import { VendorDataService } from "./vendors.data.service";
import { reject, async } from 'q';

@Injectable({
    providedIn: 'root',
})
export class SlotService {

    allSlots: any[] = [];
    baySlotsMatrix: any = {};
    vendor: DefaecoVendor = new DefaecoVendor();
    slotDuration: number = 0.5;
    slotTimeMapping: any = {};

    constructor(private readonly afs: AngularFirestore, private http: HttpClient, private dataService: DataService) { }

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



    //private methods
    getDefaultSlotsReady(isTwoDays) {
        this.allSlots = [];
        let slotNumber = 0;

        let totalNoOfSlotsPerDay = (this.vendor.shopCloseTime - this.vendor.shopOpenTime) / this.slotDuration;
        totalNoOfSlotsPerDay = isTwoDays ? (totalNoOfSlotsPerDay * 2) : totalNoOfSlotsPerDay;
        for (let i = 0; i < totalNoOfSlotsPerDay; i++) {
            this.allSlots.push(`${i}`);
        }
        /*
        for(let i=this.vendor.shopOpenTime;i<=(this.vendor.shopCloseTime-this.slotDuration);i=i+this.slotDuration){
            this.allSlots.push(`${slotNumber}`);
            slotNumber++;
        }
        if(isTwoDays){

            for(let i=this.vendor.shopOpenTime;i<=(this.vendor.shopCloseTime-this.slotDuration);i=i+this.slotDuration){
                this.allSlots.push(`${slotNumber}`);
                slotNumber++;
            }
        }*/


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

        /*
        for(let i=this.vendor.shopOpenTime;i<=this.vendor.shopCloseTime;i=i+this.slotDuration){
            this.slotTimeMapping[`${slotNumber}`] = `Today :${i}-${i+this.slotDuration}`;
            slotNumber++;
        }
        if(isTwoDays){
             //add for next day
            for(let i=this.vendor.shopOpenTime;i<=this.vendor.shopCloseTime;i=i+this.slotDuration){
                this.slotTimeMapping[`${slotNumber}`] = `Tomorrow :${i}-${i+this.slotDuration}`;
                slotNumber++;
            }
        }
        */

    }
    getBookedSlotsForGivenDate(date: string,vendorId:string) {
        return new Promise(async (res, rej) => {
            try {
                let slotsBookedCollectionRef = this.afs.collection<any>('booked_slots'); 
                
                let slotsBookedCollection = this.afs.collection<any>('booked_slots', ref => ref.where('date', '==', date).where('vendorId','==',vendorId));
                
                let slotsList = await slotsBookedCollection.get().toPromise();
                let _tempList = [];
                slotsList.forEach((doc) => {
                    let vendor: any = doc.data() as any;
                    // vendor.city = 'Bangalore';
                    // vendor.rating = 3;
                    _tempList.push(vendor);
                });
                console.log("already booked slots", _tempList);
                res(_tempList);
            } catch (e) {
                console.log("ERROR!!!", e);
                rej(e);
            }

        })





        return [{
            "date": "12-11-2019",
            "slotname": "2",
            "bayname": "B1",
            "type": "basic"
        }, {
            "date": "12-11-2019",
            "slotname": "2",
            "bayname": "B2",
            "type": "basic"
        }, {
            "date": "12-11-2019",
            "slotname": "3",
            "bayname": "B2",
            "type": "basic"
        },
        {
            "date": "12-11-2019",
            "slotname": "1",
            "bayname": "B4",
            "type": "basic"
        },
        {
            "date": "12-11-2019",
            "slotname": "1",
            "bayname": "B5",
            "type": "basic"
        }
        ];
    }
    convertDecimalTimeToRegularTime(decimalTime) {
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

}