import { Injectable } from "@angular/core";
import { AngularFirestoreCollection, AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { DefaecoArea } from "./interfaces/DefaecoArea";
import { DefaecoVendor } from "./interfaces/DefaecoVendor";

@Injectable({
    providedIn: 'root',
  })
  export class AreaDataService {

    private AreasCollection: AngularFirestoreCollection<DefaecoVendor>;
    constructor(private readonly afs: AngularFirestore) {
        this.AreasCollection = afs.collection<DefaecoVendor>('service_locations'); 
       
    }
    async getAreaList(){
      return  new Promise(async (res,rej)=>{
            try{
                let areasList  = await this.AreasCollection.get().toPromise();
                let _tempList = [];
                areasList.forEach((doc) => {
                    let area:DefaecoArea = doc.data() as DefaecoArea;
                    _tempList.push(area); 
                });
                res(_tempList);
            }catch(e){
                console.log("ERROR!!!",e);
                rej(e);
            }

        })

    }
    async addArea(area: DefaecoArea) {
        const id = this.afs.createId();
        area.id = id;
        await this.AreasCollection.doc(id).set(area);
    }


  }