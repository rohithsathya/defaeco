import { Injectable } from "@angular/core";
import { DataService } from "./data.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AngularFirestore } from "@angular/fire/firestore";
import { DefaecoVendor } from "./interfaces/DefaecoVendor";
import { VendorDataService } from "./vendors.data.service";
import { reject, async } from 'q';
import { LoginService } from "./login.service";
import * as firebase from 'firebase';
import { AuthenticationService } from "./authentication.service";

@Injectable({
    providedIn: 'root',
})
export class OrderService {

    private orderEntityName = 'orders';

    constructor(private afs: AngularFirestore,
        private loginService:LoginService,
        private authService:AuthenticationService,
        private http: HttpClient) { }

    getAllMyOrders(user) {
        return new Promise(async (resolve, reject) => {
            try {
                let collectionRef = this.afs.collection<any>(this.orderEntityName, ref => ref.where('bookedBy', '==', user.uid).orderBy("bookedOn", "desc").limit(10));
                let dataList = await collectionRef.get().toPromise();
                let _tempList = dataList.docs.map((doc) => {
                    return doc.data() as DefaecoOrder;
                });
                resolve(_tempList);
            } catch (e) {
                console.log("ERROR!!!", e);
                resolve([]);
            }
        })
    }
    getAllMyActiveOrders() {
        return new Promise(async (resolve, reject) => {
            try {
                let user:any = await this.loginService.checkIfAccountIsVerified();
                let collectionRef = this.afs.collection<any>(this.orderEntityName, ref => ref.where('bookedBy', '==', user.uid).where('status','==',DefaecoOrderStatus.ACTIVE).orderBy("bookedOn", "desc").limit(10));
                let dataList = await collectionRef.get().toPromise();
                let _tempList = dataList.docs.map((doc) => {
                    return doc.data() as DefaecoOrder;
                });
                resolve(_tempList);
            } catch (e) {
                console.log("ERROR!!!", e);
                reject([]);
            }
        })
    }
    getAllMyNonActiveOrders() {
        return new Promise(async (resolve, reject) => {
            try {
                let user:any = await this.loginService.checkIfAccountIsVerified();
                let inQuery:any = 'in';
                let collectionRef = this.afs.collection<any>(this.orderEntityName, ref => ref.where('bookedBy', '==', user.uid).where('status',inQuery, [DefaecoOrderStatus.COMPELETED, DefaecoOrderStatus.CANCELED]).orderBy("bookedOn", "desc").limit(10));
                let dataList = await collectionRef.get().toPromise();
                let _tempList = dataList.docs.map((doc) => {
                    return doc.data() as DefaecoOrder;
                });
                resolve(_tempList);
            } catch (e) {
                console.log("ERROR!!!", e);
                reject();
            }
        })
    }
    getMyOrderById(orderId){
        return new Promise(async (resolve,reject)=>{
            try{

                let user: any = await this.loginService.checkIfAccountIsVerified();
                let orderToCancel: any = await this.afs.collection<any>(this.orderEntityName).doc(orderId).get().toPromise();
                let order: DefaecoOrder = orderToCancel.data() as DefaecoOrder;
                if (user && order && (user.uid == order.bookedBy)) {    
                    resolve(order);
                }else{
                    resolve(null);
                }
            }catch(e){
                console.log("ERROR!!!",e);
                reject(e);
            }
        })
    }
    placeOrder(order:DefaecoOrder) {
        return new Promise(async (resolve, reject) => {
            try {
                let user:any = await this.loginService.checkIfAccountIsVerified();
                const id = this.afs.createId();
                order.id = id;
                order.status = DefaecoOrderStatus.ACTIVE;
                order.bookedBy = user.uid;
                order.bookedOn= firebase.firestore.FieldValue.serverTimestamp();
                order.slot = Object.assign({},order.slot);
                let order_pure = Object.assign({},order);
                await this.afs.collection('orders').doc(id).set(order_pure);
                resolve(id);
            }
            catch (e) {
                console.log('Error!!!', e);
                reject()
            }
        })
    }
    updateOrder(order:DefaecoOrder) {
        return new Promise(async (resolve, reject) => {
            try {
                let user:any = await this.loginService.checkIfAccountIsVerified();
                // const id = this.afs.createId();
                // order.id = id;
                //order.status = DefaecoOrderStatus.ACTIVE;
                //order.bookedBy = user.uid;
                //order.bookedOn= firebase.firestore.FieldValue.serverTimestamp();
                order.slot = Object.assign({},order.slot);
                let order_pure = Object.assign({},order);
                await this.afs.collection('orders').doc(order.id).set(order_pure);
                resolve(order.id);
            }
            catch (e) {
                console.log('Error!!!', e);
                reject()
            }
        })
    }
    cancelOrder(orderId:string,isrefund:boolean){
        return new Promise(async(resolve,reject)=>{
            try {
                let user: any = await this.loginService.checkIfAccountIsVerified();
                let orderToCancel: any = await this.afs.collection<any>(this.orderEntityName).doc(orderId).get().toPromise();
                let order: DefaecoOrder = orderToCancel.data() as DefaecoOrder;
                if (user && order && (user.uid == order.bookedBy)) {
                    order.status = DefaecoOrderStatus.CANCELED;
                    order.isRefund = isrefund;
                    let order_pure = Object.assign({}, order);
                    await this.afs.collection<any>(this.orderEntityName).doc(orderId).set(order_pure);
                    resolve();
                } else {
                    reject('validation error');
                }

            } catch (e) {
                console.log("ERROR!!!", e);
                reject();
            }



        })
        

    }
    placeOrderApi(date: number, vendorId: string, packageId: number, addonIds: string[], startingSlot: number, bayName: string):Promise<DefaecoOrder> {
        return new Promise(async (resolve, reject) => {
            try {
                debugger;
                let reqBody = {
                    "date": date,
                    "vendorId": vendorId,
                    "packageId": packageId,
                    "addonIds": addonIds ? addonIds : [],
                    "startingSlot": startingSlot,
                    "bayName": bayName
                };

                let token: any = await this.authService.getUserToken();
                const httpOptions = {
                    headers: new HttpHeaders({
                        'Content-Type': 'application/json',
                        'Authorization': token
                    })
                };
                let placedOrder: DefaecoOrder = await this.http.post<DefaecoOrder>('https://us-central1-defaeco3.cloudfunctions.net/webApi/createOrder', reqBody, httpOptions).toPromise();
                resolve(placedOrder);

            } catch (e) {
                reject(e);
            }
        });

    }
}

export class DefaecoOrder {
    addonIds: string[] = [];
    bookedBy: string;
    bookedOn: any;
    date: any;
    id: string;
    packageId: string;
    allSlots: any[] = [];
    slot: any;
    status: string;
    totalPrice: number;
    ui: any;
    vendorId: string;
    isRefund:boolean = false;
}
export const enum DefaecoOrderStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    INPROGRESS = 'INPROGRESS',
    CANCELED = 'CANCELED',
    COMPELETED = 'COMPELETED'
}