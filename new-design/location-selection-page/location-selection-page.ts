import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController, ModalController, NavController } from '@ionic/angular';
import { DataService } from '../services/data.service';
import { AreaDataService } from '../services/area.data.service';
import { DefaecoUserProfile, LoginService } from '../services/login.service';
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

    constructor(public dataService:DataService,public modalController: ModalController,public areaService:AreaDataService,private uiService:UiService) { }
    ngOnInit(){}
    async ionViewWillEnter(){
        let busySpinner: any = await this.uiService.presentBusySpinner();
        //this.user = await this.loginService.getLoggedInUser();
        this.selArea = '';
        this.userSelectedArea = '';
        this.allAreaList = await this.areaService.getAreaList();
        this.recentLocationList = this.allAreaList.slice(0, 3);
        //await this.getUsersPublicProfile();
        await busySpinner.dismiss();
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
            //await this.loginService.savePublicProfile(this.user.uid,this.userProfile);
            this.dataService.setLocation(this.userSelectedArea);
            this.closeClick();
            await busySpinner.dismiss();
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
   
   
    // async getUsersPublicProfile() {
    //     return new Promise(async (resolve, reject) => {

    //         try {
    //             let busySpinner: any = await this.dataService.presentBusySpinner();
    //             let userProfile: DefaecoUserProfile = await this.loginService.getPublicProfile(this.user.uid) as DefaecoUserProfile;
    //             if (userProfile) {
    //                 this.userProfile = userProfile;
    //             }
    //             await busySpinner.dismiss();
    //             resolve()
    //         } catch (e) {
    //             console.log("ERROR!!!", e);
    //             reject()
    //         }

    //     })



    // }



}
