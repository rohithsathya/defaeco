import { Injectable } from "@angular/core";
import { AngularFirestoreCollection, AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import {HttpClient, HttpHeaders} from '@angular/common/http'
import { DataService } from "./data.service";
import { SlotService } from "./slot.service";
import { DefaecoVendor, DefaecoVendorPackage, DefaecoVendorPackageAddons } from "./interfaces/DefaecoVendor";
import { reject } from "q";

import * as firebase from "firebase";
@Injectable({
    providedIn: 'root',
  })
  export class VendorDataService {

    private vendorsCollection: AngularFirestoreCollection<DefaecoVendor>;
    private selectedVendor:DefaecoVendor;

    constructor(private readonly afs: AngularFirestore,private http:HttpClient,private dataService:DataService,private slotService:SlotService) {
        this.vendorsCollection = afs.collection<DefaecoVendor>('vendors'); 
    }

    async getServerTimestamp(){
        return new Promise(async (resolve,reject)=>{
            try{
                let id = this.afs.createId();
                let timestampObj = {
                    "timestamp": firebase.firestore.FieldValue.serverTimestamp()
                };
                let timeRef = this.afs.collection("timeQuery").doc("time");
                await timeRef.set(timestampObj);
                let timeStampData:any = await timeRef.get().toPromise();
                timeStampData = timeStampData.data();
                let milliSeconds = timeStampData.timestamp.seconds * 1000;
                let today:any = new Date(milliSeconds);
                console.log(today);
                resolve(milliSeconds)

            }catch(e){
                console.error(e);
                resolve(0);
            }
        })
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

    async saveVendor(){
        return new Promise(async (resolve,reject)=>{
            let id = this.afs.createId();
            let vendor:DefaecoVendor = new DefaecoVendor();
            vendor.id = 'newDocument';
            vendor.name = 'Test Vendor';

            let package1 = new DefaecoVendorPackage();
            package1.noOfSlotsNeeded = 2;
            package1.packageName = "Basic Carwash";
            package1.type = "basic";
            package1.price = 120;
            package1.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit.";
            package1.code = 'code1';

            let package2 = new DefaecoVendorPackage();
            package2.noOfSlotsNeeded = 3;
            package2.packageName = "Intermidiate Carwash";
            package2.type = "basic";
            package2.price = 250;
            package2.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit.";
            package2.code = 'code2';

            let package3 = new DefaecoVendorPackage();
            package3.noOfSlotsNeeded = 3;
            package3.packageName = "Car Detailing";
            package3.type = "premium";
            package3.price = 1200;
            package3.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit.";
            package3.code = 'code3';

            let addOn1 = new DefaecoVendorPackageAddons();
            addOn1.code = "addon1";
            addOn1.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit.";
            addOn1.name = "AddOn 1";
            addOn1.noOfSlotsNeeded = 2;
            addOn1.packageCode = "code1";
            addOn1.price = 100;
            addOn1.type = "basic";

            let addOn2 = new DefaecoVendorPackageAddons();
            addOn2.code = "addon2";
            addOn2.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit.";
            addOn2.name = "AddOn 2";
            addOn2.noOfSlotsNeeded = 2;
            addOn2.packageCode = "code1";
            addOn2.price = 150;
            addOn2.type = "basic";

            let addOn3 = new DefaecoVendorPackageAddons();
            addOn3.code = "addon3";
            addOn3.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit.";
            addOn3.name = "AddOn 3";
            addOn3.noOfSlotsNeeded = 1;
            addOn3.packageCode = "code2";
            addOn3.price = 50;
            addOn3.type = "basic";

            let addOn4 = new DefaecoVendorPackageAddons();
            addOn4.code = "addon4";
            addOn4.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit.";
            addOn4.name = "AddOn 4";
            addOn4.noOfSlotsNeeded = 2;
            addOn4.packageCode = "code2";
            addOn4.price = 100;
            addOn4.type = "basic";

            let addOn5 = new DefaecoVendorPackageAddons();
            addOn5.code = "addon5";
            addOn5.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit.";
            addOn5.name = "AddOn 5";
            addOn5.noOfSlotsNeeded = 2;
            addOn5.packageCode = "code3";
            addOn5.price = 100;
            addOn5.type = "premium";

            let addOn6 = new DefaecoVendorPackageAddons();
            addOn6.code = "addon6";
            addOn6.description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit,consectetur adipiscing elit.";
            addOn6.name = "AddOn 6";
            addOn6.noOfSlotsNeeded = 2;
            addOn6.packageCode = "code1";
            addOn6.price = 200;
            addOn6.type = "premium";


            package1.addOns.push(Object.assign({},addOn1));
            package1.addOns.push(Object.assign({},addOn2));
            package2.addOns.push(Object.assign({},addOn3));
            package2.addOns.push(Object.assign({},addOn4));
            package3.addOns.push(Object.assign({},addOn5));
            package3.addOns.push(Object.assign({},addOn6));



            vendor.packageMatrix.push(Object.assign({}, package1));
            vendor.packageMatrix.push(Object.assign({}, package2));
            vendor.packageMatrix.push(Object.assign({}, package3));

            let vendorPureJsObj = Object.assign({}, vendor);
            debugger;
            await this.afs.collection('vendors').doc(vendor.id).set(vendorPureJsObj);
            debugger;
            resolve();
        })
        
    }

    
    async addVendor(vendor: DefaecoVendor) {
        let vendorsCollection = this.afs.collection<DefaecoVendor>('vendors');
        const id = this.afs.createId();
        vendor.id = id;
        await vendorsCollection.doc(id).set(vendor);
    }
    async getLoggedInuserInfo(){
        /*
        try{
            console.log("logged in user=====>",this.dataService.loggedInUser);

            // let headers = new HttpHeaders().set('authorization', 'Bearer ' + this.dataService.loggedInUser.refreshToken);
            // //headers = headers.set('header-name-2', 'header-value-2');
            // const requestOptions = {                                                                                                                                                                                 
            //     'headers': headers, 
            //   };
            //   let data = {
            //     'authorization' :  this.dataService.loggedInUser.refreshToken
            //   }
            //   debugger;

            const httpOptions = {
                headers: new HttpHeaders({
                'Content-Type':  'application/json',
                'Authorization': 'my-auth-token'
               })
           };
           let data = {
               'vendorId':'74Yaxp4BDnHQaNxcyy90'
           }



              


              //let headersG = new Headers({'Authorization': 'Bearer ' + this.dataService.loggedInUser.refreshToken});

           //https://us-central1-defaeco3.cloudfunctions.net/widgets/test
           //https://us-central1-defaeco3.cloudfunctions.net/webApi/api/v1/loggedInUser
            let vendor = await this.http.post<any>('https://us-central1-defaeco3.cloudfunctions.net/widgets/test',data,httpOptions).toPromise();
            this.vendor = vendor;
            console.log("Vendors",vendor);

           let basicSlotsForToday:any =  await this.slotService.getAvailableSlotsForOneDay(this.vendor,3,false,'date',0,true,'');
           let premiumSlotsForToday:any =  await this.slotService.getAvailableSlotsForOneDay(this.vendor,5,true,'date',0,true,'');
           console.log("basic slots for today",basicSlotsForToday);
           console.log("premium slots for today",premiumSlotsForToday);
           if(premiumSlotsForToday.length ==0){
               console.log("no slots available for premuim service Today");
               premiumSlotsForToday =  this.slotService.getAvailableSlotsForTwoDays(this.vendor,5,true,'date',0,true,'');
               console.log("premium slots for today and tomorrow",premiumSlotsForToday);
           }
           return;


            //for non premium service
            this.getDefaultSlotsReady(false);
            this.getBaySlotMatrix(false);
            this.updateBaySlotMatrixWithBooking(false);
            this.setupSlotNumberAndTimeMapping(false);
            let sloteRequired = 3;
            for(let i=0;i<this.allSlots.length;i++){
                let availableBay = this.checkIfSlotAvailable(sloteRequired,this.allSlots[i]);
                if(availableBay){
                    console.log(`slot ${this.allSlots[i]} (${this.slotTimeMapping[this.allSlots[i]]}) available for ${sloteRequired} at ${availableBay}`);
                }else{
                    console.log(`slot ${this.allSlots[i]} (${this.slotTimeMapping[this.allSlots[i]]}) not available for ${sloteRequired}`);
                }
            }

            //for premium service
            this.getDefaultSlotsReady(false);
            this.getBaySlotMatrix(true);//isPremium
            this.updateBaySlotMatrixWithBooking(false);
            this.setupSlotNumberAndTimeMapping(false);
            let sloteRequiredPremium = 6;

            let temp_availableCount = 0;
            for(let i=0;i<this.allSlots.length;i++){
                let availableBay = this.checkIfSlotAvailable(sloteRequiredPremium,this.allSlots[i]);
                if(availableBay){
                    temp_availableCount++;
                    console.log(`slot ${this.allSlots[i]} (${this.slotTimeMapping[this.allSlots[i]]}) available for ${sloteRequiredPremium} at ${availableBay}`);
                }else{
                    console.log(`slot ${this.allSlots[i]} (${this.slotTimeMapping[this.allSlots[i]]}) not available for ${sloteRequiredPremium}`);
                }
            }

            if(temp_availableCount<=0){
                console.log("No Direct slots found today, so include tommorrow also");

                //for premium service
                this.getDefaultSlotsReady(true);
                this.getBaySlotMatrix(true);//isPremium
                this.updateBaySlotMatrixWithBooking(true);
                this.setupSlotNumberAndTimeMapping(true);
                let sloteRequiredPremium = 6;

                let temp_availableCount = 0;
                for(let i=0;i<this.allSlots.length;i++){
                    let availableBay = this.checkIfSlotAvailable(sloteRequiredPremium,this.allSlots[i]);
                    if(availableBay){
                        temp_availableCount++;
                        console.log(`slot ${this.allSlots[i]} (${this.slotTimeMapping[this.allSlots[i]]}) available for ${sloteRequiredPremium} at ${availableBay}`);
                    }else{
                        console.log(`slot ${this.allSlots[i]} (${this.slotTimeMapping[this.allSlots[i]]}) not available for ${sloteRequiredPremium}`);
                    }
                }

            }

            
        }catch(e){
            console.log("Error getting user from api",e);

        }
        */
    }

    getVendorById(id:string){
        return new Promise(async (resolve,reject)=>{
            try{
                let docRef:any =   await this.afs.collection('vendors').doc(id).get().toPromise();
                let vendor:DefaecoVendor = docRef.data() as DefaecoVendor;
                resolve(vendor);
            }catch(e){
                console.log("Error !!!",e);
                reject(e);
            }
        })
    }


    allSlots:any[] = [];
    baySlotsMatrix:any = {};
    vendor:any;
    slotDuration:number = 0.5;
    slotTimeMapping:any = {};

    checkSlotsToday(isPremium){
        //getDefaultSlotsReady()
        this.allSlots = [];
        let slotNumber = 0
        for(let i=this.vendor.shopOpenTime;i<=this.vendor.shopCloseTime;i=i+this.slotDuration){
            this.allSlots.push(`${slotNumber}`);
            slotNumber++;
        }
        //getBaySlotMatrix()
        this.baySlotsMatrix = {};
        //basic if only basic
        if(!isPremium){
            for(let i=0;i<this.vendor.basicBays.length;i++){
                let slotsWithBayname = this.allSlots.map((slotname)=>{
                    return {
                        "slotname":slotname,
                        "type":isPremium?"premium":"basic",
                        "booked":false
                    }
                });
                this.baySlotsMatrix[this.vendor.basicBays[i]] = slotsWithBayname;
            }
        }
        //since premium slot is available for basic also
        for(let i=0;i<this.vendor.premiumBays.length;i++){
            let slotsWithBayname = this.allSlots.map((slotname)=>{
                return {
                    "slotname":slotname,
                    "type":isPremium?"basic":"premium",
                    "booked":false
                }
            });
            this.baySlotsMatrix[this.vendor.premiumBays[i]] = slotsWithBayname;
        }

        this.updateBaySlotMatrixWithBooking(false);


    }

    setupSlotNumberAndTimeMapping(isTwoDays){

        this.slotTimeMapping = {};
        let slotNumber = 0
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
       
    }
    checkIfSlotAvailable(slotsRequired:number,slotname){
        let isSlotAvailable = false;
        let allBays = Object.keys(this.baySlotsMatrix);
        for(let i=0;i<allBays.length;i++){

            let currentBayname = allBays[i];
            let slots = this.baySlotsMatrix[currentBayname];
            let slotStartIndex = -1;
            for(let j=0;j<slots.length;j++){
                if(slots[j].slotname == slotname){
                    slotStartIndex = j;
                    break;
                }
            }

            if(slotStartIndex >=0){

                let endIndex = slotStartIndex + slotsRequired;
                
                isSlotAvailable = true;
                for(let k=slotStartIndex;k<endIndex;k++){

                    let currentSlot = slots[k];
                    if(!currentSlot){
                        isSlotAvailable = false;
                        break;
                    }
                    if(currentSlot && currentSlot.booked){
                        isSlotAvailable = false;
                        break;
                    }
                }
                if(isSlotAvailable){
                    return currentBayname;
                }
            }

        }
        //no slot availble
        return null;
    }
    getDefaultSlotsReady(isTwoDays){
        this.allSlots = [];
        let slotNumber = 0
        for(let i=this.vendor.shopOpenTime;i<=this.vendor.shopCloseTime;i=i+this.slotDuration){
            this.allSlots.push(`${slotNumber}`);
            slotNumber++;
        }
        if(isTwoDays){
            //if premium then add again
            for(let i=this.vendor.shopOpenTime;i<=this.vendor.shopCloseTime;i=i+this.slotDuration){
                this.allSlots.push(`${slotNumber}`);
                slotNumber++;
            }
        }
        

    }
    getBaySlotMatrix(isPremium){
        this.baySlotsMatrix = {};
        //basic if only basic
        if(!isPremium){
            for(let i=0;i<this.vendor.basicBays.length;i++){
                let slotsWithBayname = this.allSlots.map((slotname)=>{
                    return {
                        "slotname":slotname,
                        "type":isPremium?"premium":"basic",
                        "booked":false
                    }
                });
                this.baySlotsMatrix[this.vendor.basicBays[i]] = slotsWithBayname;
            }
        }
        //since premium slot is available for basic also
        for(let i=0;i<this.vendor.premiumBays.length;i++){
            let slotsWithBayname = this.allSlots.map((slotname)=>{
                return {
                    "slotname":slotname,
                    "type":isPremium?"basic":"premium",
                    "booked":false
                }
            });
            this.baySlotsMatrix[this.vendor.premiumBays[i]] = slotsWithBayname;
        }

    }
    updateBaySlotMatrixWithBooking(isTowDays){
        //if isPremium then fectch booking for today and tomorrow and bay in premium bay array.
        
        //booked slots for today
        let bookedSlots:any = [{
            "date":"12-11-2019",
            "slotname":"2",
            "bayname":"B1",
            "type":"basic" 
        },{
            "date":"12-11-2019",
            "slotname":"2",
            "bayname":"B2",
            "type":"basic" 
        },{
            "date":"12-11-2019",
            "slotname":"3",
            "bayname":"B2",
            "type":"basic" 
        },
        {
            "date":"12-11-2019",
            "slotname":"2",
            "bayname":"B4",
            "type":"basic" 
        },
        {
            "date":"12-11-2019",
            "slotname":"3",
            "bayname":"B5",
            "type":"basic" 
        }
        ];

        if(isTowDays){
            //if premium add tomorrows data also
            let tomorrowsBookings:any = [
                {
                    "date": "13-11-2019",
                    "slotname": "1",
                    "bayname": "B4",
                    "type": "premium"
                },
                {
                    "date": "13-11-2019",
                    "slotname": "8",
                    "bayname": "B5",
                    "type": "premium"
                }
            ];

            //update slots number with new numbers
            let totalOperationalHours = this.vendor.shopCloseTime - this.vendor.shopOpenTime;
            let totalNumberOfSlots = totalOperationalHours / this.slotDuration;
            tomorrowsBookings = tomorrowsBookings.map((d)=>{
                d['oldSlotname'] = `${d.slotname}`;
                d.slotname = `${Number.parseInt(d.slotname) + totalNumberOfSlots}`;
                return d;
            })

            //join both of them
            bookedSlots = bookedSlots.concat(tomorrowsBookings);
            console.log("all booked slots",bookedSlots);
        }

        for(let i=0;i<bookedSlots.length;i++){
            let matrixRef = this.baySlotsMatrix[bookedSlots[i].bayname];
            if(matrixRef){
                for(let j=0;j< matrixRef.length;j++){
                    if(matrixRef[j].slotname == bookedSlots[i].slotname){
                        matrixRef[j].booked = true;
                    }
                }
            }
           

        }

        console.log("updated",this.baySlotsMatrix);
    }

    //new methods
    async getVendorList(areaName){
        return  new Promise(async (res,rej)=>{
              try{
                  let vendorsCollection = this.afs.collection<DefaecoVendor>('vendors',ref => ref.where('areaNames', 'array-contains', areaName));
                  let vendorsList  = await vendorsCollection.get().toPromise();
                  let _tempList:DefaecoVendor[] = [];
                  vendorsList.forEach((doc) => {
                      let vendor:DefaecoVendor = doc.data() as DefaecoVendor;
                      _tempList.push(vendor); 
                  });
                  res(_tempList);
              }catch(e){
                  console.log("ERROR!!!",e);
                  rej(e);
              }
  
          })
    }
    setCurrentVendor(vendor:DefaecoVendor){
        this.selectedVendor = vendor;
    }
    getCurrentVendor(){
        return this.selectedVendor;
    }


  }