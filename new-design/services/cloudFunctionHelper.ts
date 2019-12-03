import * as firebase from 'firebase';
export class CloudFunctionHelper{
    db:any;
    constructor(){
        this.db = firebase.firestore();
    }

    public async placeOrder(req:any, user: any):Promise<DefaecoOrder> {

        return new Promise(async (resolve, reject) => {
            try {
                debugger;
                const date: number = req.body.date;
                const vendorId: string = req.body.vendorId as string;
                const packageId: string = req.body.packageId as string;
                const addonIds: string[] = req.body.addonIds as string[];
                const startingSlot: number = req.body.startingSlot as number;
                const bayName:string = req.body.bayName as string;
                
                //let orderObj: any = req.body.orderObj;
                let totalPrice: number = 0;
                const vendor: DefaecoVendor = await this.getVendor(vendorId);
               
                let vendorPackage: DefaecoVendorPackage = new DefaecoVendorPackage();
                const addOns: DefaecoVendorPackageAddons[] = [];
                const verifiedAddonIds: string[] = [];
                //check if pacakge id and add on ids are present and calculate the price
                for (let i = 0; i < vendor.packageMatrix.length; i++) {
                    if (vendor.packageMatrix[i].code === packageId) {
                        vendorPackage = vendor.packageMatrix[i];
                        totalPrice = totalPrice + vendorPackage.price;
                        break;
                    }
                }
                if (!vendorPackage.code) {
                    //Return error
                    reject("Invalid package Id");
                    return;
                }

                for (let i = 0; i < addonIds.length; i++) {
                    const currentAddonId = addonIds[i];
                    for (let j = 0; j < vendorPackage.addOns.length; j++) {
                        if (currentAddonId === vendorPackage.addOns[j].code) {
                            addOns.push(vendorPackage.addOns[j]);
                            verifiedAddonIds.push(currentAddonId);
                            totalPrice = totalPrice + vendorPackage.addOns[j].price;
                        }
                    }
                }
                //let vendorId = orderObj.vendorId;
                const isPremium = vendorPackage.type === 'Premium'?true:false;
                const slotsToSave: DefaecoSlot[] = this.getRequiredSlots(vendor,startingSlot,vendorPackage.noOfSlotsNeeded,bayName,date,isPremium);//req.body.slotsToSave;
                debugger;

                //conditions
                //all the slots needed should be available
                const slotsNeededIds: string[] = [];
                for (let i = 0; i < slotsToSave.length; i++) {
                    const slotId = `${slotsToSave[i].date}_${vendorId}_${slotsToSave[i].bay}_${slotsToSave[i].slot}`;
                    slotsNeededIds.push(slotId);
                }

                //check if the all the required slots are available or not
                const slotsAvailable: boolean = await this.areSlotsAvailable(slotsNeededIds);
                if (slotsAvailable) {
                    //save slots
                    await this.saveSlots(slotsToSave,vendor.id);
                    const savedOrder:DefaecoOrder = await this.saveOrder(user, vendor, slotsToSave, vendorPackage, verifiedAddonIds, date, totalPrice);
                    resolve(savedOrder);
                } else {
                    //error slots not available
                    reject("Invalid Slots");
                    return;
                }

            } catch (e) {
                reject(e);
            }
        })
    }
    getVendor(vendorId: string):Promise<DefaecoVendor> {
        return new Promise((resolve, reject) => {
            const vendorDocRef = this.db.collection("vendors").doc(vendorId);
            vendorDocRef.get().then((doc:any) => {
                if (doc.exists) {
                    const data = doc.data();
                    resolve(data);
                } else {
                    // doc.data() will be undefined in this case
                    reject();
                }
            }).catch(function (error:any) {
                console.log("Error getting document:", error);
                reject(error);
            });

        })
    }
    getRequiredSlots(vendor:DefaecoVendor,startingSlot:number,requiredSlots:number,bayName:string,date:number,isPremium:boolean){

        let slotsToSave:DefaecoSlot[] = [];
        const totalNoOfSlots =Math.floor((vendor.shopCloseTime - vendor.shopOpenTime) / vendor.slotDuration);
        const endSlots = startingSlot + requiredSlots;
        const today = new Date(date);
        const tomorrow = new Date(date);
        tomorrow.setDate(tomorrow.getDate() + 1);

        for(let i=startingSlot;i<endSlots;i++){

            const slotTosave:DefaecoSlot = new DefaecoSlot();
            slotTosave.bay = bayName;
            slotTosave.date = this.formatDate(today.getTime());
            slotTosave.slot = i;
            slotTosave.time = this.getTimeFromSlot(i,vendor);
            slotTosave.isExtended = false;
            if(i>=totalNoOfSlots && isPremium){
                slotTosave.date = this.formatDate(tomorrow.getTime());
                slotTosave.slot = i-totalNoOfSlots;
                slotTosave.time = this.getTimeFromSlot(slotTosave.slot,vendor);
                slotTosave.isExtended = true;
            }
            slotsToSave.push(slotTosave);
        }

        if(slotsToSave.length === requiredSlots){
            //update delivery date and time for all the slots
            const lastslot = slotsToSave[slotsToSave.length - 1];
            const deliveryTime = this.getTimeFromSlot(lastslot.slot+1,vendor);
            slotsToSave = slotsToSave.map((d)=>{
                d.deliveryDate = lastslot.date;
                d.deliveryTime = deliveryTime;
                return d;
            });
        }else{
            //error invalid slot
            
        }
        return slotsToSave





    }
    getTimeFromSlot(slotNumber:number,vendor:DefaecoVendor):string{
        const defaecoTime = vendor.shopOpenTime + (slotNumber*vendor.slotDuration);
        return this.parseDefaecTimeToTime(defaecoTime);
    }
    formatDate(milliseconds:number):string{
        const givenDate = new Date(milliseconds)
        let dd:any = givenDate.getDate();
        let mm:any = givenDate.getMonth()+1; 
        const yyyy:any = givenDate.getFullYear();
        const hr:any = givenDate.getHours();
        const min:any = givenDate.getMinutes();
        if(dd<10) 
        {
            dd=`0${dd}`;
        } 
        if(mm<10) 
        {
            mm=`0${mm}`;
        } 
    
        const time = hr + (min / 60);
        console.log("time",time);
    
        //return {"date" : `${dd}-${mm}-${yyyy}`, "time":time};
        return `${dd}-${mm}-${yyyy}`;
    }
    parseDefaecTimeToTime(time:number) {
        let timeStr = '';
        if (time === 12.5) {
            timeStr = (time) + " PM";
        }
        else if (time > 12.5) {
            timeStr = (time - 12) + " PM";
        } else {
            timeStr = (time) + " AM";
        }
        return timeStr;
    }

    areSlotsAvailable(slotsNeededIds: string[]):Promise<boolean> {
        //TODO::check for them to be in sequence
        return new Promise((resolve, reject) => {
            try {
                const soltsRef = this.db.collection('booked_slots').where('id', 'in', slotsNeededIds);
                soltsRef.get().then((querySnapshot:any) => {
                    console.log(querySnapshot.size)
                    //LENGTH SHOULD BE 0 to procced
                    if (querySnapshot.size === 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                })

            } catch (e) {
                console.log("Error", e);
                reject(e);
            }
        })
    }
    async saveSlots(slotsToSave: DefaecoSlot[],vendorId:string) {
        return new Promise(async (resolve, reject) => {

            try {
                for (let i = 0; i < slotsToSave.length; i++) {
                    //const id = this.slotsCollectionToSave[i].date + "_" + this.vendor.id + "_" + this.slotsCollectionToSave[i].bayname + "_" + this.slotsCollectionToSave[i].slotname;       //this.afs.createId();
                    
                    const slotId = `${slotsToSave[i].date}_${vendorId}_${slotsToSave[i].bay}_${slotsToSave[i].slot}`;
                    
                    slotsToSave[i].id = slotId;
                    slotsToSave[i].vendorId= vendorId;

                    await this.db.collection('booked_slots').doc(slotId).set(slotsToSave[i]);

                    if (i == slotsToSave.length - 1) {
                        resolve();
                    }
                }
            } catch (e) {
                console.log("ERROR!!!", e);
                reject();
            }


        })
    }
    saveOrder(user:any,vendor:DefaecoVendor,slotsToSave:DefaecoSlot[],vendorPackage:DefaecoVendorPackage,addonIds:string[],date:number,totalPrice:number):Promise<DefaecoOrder> {
        return new Promise(async (resolve, reject) => {
            try {

                const order = new DefaecoOrder();
                debugger;
                const id = this.db.collection("orders").doc().id;//this.db.createId();
                order.id = id;
                order.vendorId = vendor.id;
                order.date = date;
                order.slot = slotsToSave[0];
                order.packageId = vendorPackage.code;
                order.addonIds = addonIds ? addonIds : [];
                order.totalPrice = totalPrice;
                order.status = DefaecoOrderStatus.ACTIVE;
                order.bookedBy = user.uid;
                order.bookedOn= firebase.firestore.FieldValue.serverTimestamp();
                order.allSlots = slotsToSave;
                order.ui = {
                    "packageName": vendorPackage.packageName,
                    "vendorName": vendor.name,
                    "userName": user.displayName,
                    "package": vendorPackage,
                    "addonIds": addonIds ? addonIds : []
                }

                let order_pure = Object.assign({},order);
                order_pure = JSON.parse(JSON.stringify(order_pure));
                debugger;
                this.db.collection('orders').doc(id).set(order_pure).then(()=> {
                    console.log("Document successfully written!");
                    resolve(order_pure)
                })
                .catch((e:any)=> {
                    console.error("Error writing document: ", e);
                    reject(e)
                });
                
            }
            catch (e) {
                console.log('Error!!!', e);
                reject(e);
            }
        })
    }

}

export class DefaecoOrder {
    addonIds: string[] = [];
    bookedBy: string="";
    bookedOn: any;
    date: any;
    id: string="";
    packageId: string="";
    allSlots: any[] = [];
    slot: any;
    status: string="";
    totalPrice: number=0;
    ui: any;
    vendorId: string="";
    isRefund:boolean = false;
}
export const enum DefaecoOrderStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    INPROGRESS = 'INPROGRESS',
    CANCELED = 'CANCELED',
    COMPELETED = 'COMPELETED'
}
export class DefaecoVendor{
    id:string ="";
    name:string ="";
    address:string = "Flat No. 100 , Triveni Apartments, J P Nagara.";
    rating:number = 3;
    areaNames:string[] = ['Vijayanagara'];
    city:string = 'Bangalore';
    services:string = 'Carwash and car detailing';
    noOfBays:number = 3;
    basicBays:string[] = ["B1","B2"];
    premiumBays:string[] = ["B3"];
    packageMatrix:DefaecoVendorPackage[] = [];
    shopCloseTime:number = 20; //1 = 1hr *** 0.5 = 30 min
    shopOpenTime:number=9;
    slotDuration:number=0.5;
    meta:any;

}

export class DefaecoVendorPackage{
    code:string = "";
    packageName:string ="";
    noOfSlotsNeeded:number = -1;
    type:string = "";
    price:number =0;
    description:string="";
    addOns:DefaecoVendorPackageAddons[] = [];
    meta:any;
}

export class DefaecoVendorPackageAddons{
    code:string = "";
    packageCode:string = "";
    name:string ="";
    noOfSlotsNeeded:number = -1;
    type:string = "";
    price:number = 0;
    description:string = "";
    meta:any = {};
}

export class DefaecoSlot {
    id:string="";
    bay: string = "";
    date: string = "";
    deliveryDate:string ="";
    deliveryTime: string ="";
    isExtended: boolean = false;
    isSelected: boolean = false;
    slot: number = -1;
    time: string = "";
    vendorId:string="";
}