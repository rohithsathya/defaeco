import { Component, OnInit } from '@angular/core';
import {  ModalController } from '@ionic/angular';
import { DataService } from '../services/data.service';
import { AreaDataService } from '../services/area.data.service';
import { DefaecoUserProfile } from '../services/login.service';
import { UiService } from '../services/ui.service';

@Component({
    selector: 'app-location-selection-page',
    templateUrl: 'location-selection-page.html',
    styleUrls: ['location-selection-page.scss']
})
export class AppLocationSelectionPage implements OnInit {

    cities:any;
    allAreaList:any;
    filteredAreaList:any;
    recentLocationList:any = [];
    showResultsPane:boolean;
    selArea;
    userSelectedArea:string ='';
    userProfile: DefaecoUserProfile = new DefaecoUserProfile();
    user:any;
    isLoading:boolean = false;
    skeletonElements:any[] = Array(3);

    constructor(public dataService:DataService,public modalController: ModalController,public areaService:AreaDataService,private uiService:UiService) { }
    ngOnInit(){}
    async ionViewWillEnter(){
        try{
            this.isLoading = true;
            this.selArea = '';
            this.userSelectedArea = '';
            this.allAreaList = await this.areaService.getAreaList();
            this.recentLocationList = this.allAreaList.slice(0, 3);
            this.isLoading = false;
        }catch(e){
            console.log("Error",e);
            this.isLoading = false;
        }
        
    }
    filterAreas(event){
        
        let searchStr = '';
        if(event){
            searchStr = event.target.value;
            this.selArea = event.target.value;
            //if area is empty string show recent location
            this.userSelectedArea = null;
            if(this.selArea <=0){
                this.showResultsPane = false;
            }else{
                this.showResultsPane = true;
            }
            
        }
       
            this.filteredAreaList = [];
        for(let i=0;i<this.allAreaList.length;i++){
            let areaText = this.allAreaList[i].name + ' '+this.allAreaList[i].city;

            if(areaText.search(new RegExp(searchStr, 'i')) > -1){
                this.filteredAreaList.push(this.allAreaList[i]);
            }
            if(this.filteredAreaList.length > 2){
                break;
            }
            

        }
    }
    areaSelected(ev){
        this.userSelectedArea = ev.target.value;
    }
    async confirmClick(){
        let busySpinner: any = await this.uiService.presentBusySpinner();
        try{
            this.dataService.setLocation(this.userSelectedArea);
            await busySpinner.dismiss();
            this.closeClick();
        }catch(e){
            console.log("ERROR!!!",e);
            await busySpinner.dismiss();
        }   
    }
    closeClick(){
        if(this.modalController){
            this.modalController.dismiss();
        }
    }

}
