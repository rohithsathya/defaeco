import { Injectable } from "@angular/core";
import { DataService } from "./data.service";
import { HttpClient } from "@angular/common/http";
import { AngularFirestore } from "@angular/fire/firestore";
import { DefaecoVendor } from "./interfaces/DefaecoVendor";
import { VendorDataService } from "./vendors.data.service";
import { reject, async } from 'q';
import { LoginService } from "./login.service";
import * as firebase from 'firebase';

@Injectable({
    providedIn: 'root',
})
export class OrderService {

    private orderEntityName = 'orders';

    constructor(private afs: AngularFirestore,private loginService:LoginService) { }

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