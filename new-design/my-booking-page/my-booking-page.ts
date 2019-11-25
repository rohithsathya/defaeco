import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { LoginService } from '../services/login.service';
import { DataService } from '../services/data.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { OrderService, DefaecoOrderStatus, DefaecoOrder } from '../services/order.service';
import { IonicRouteStrategy } from '@ionic/angular';

@Component({
  selector: 'app-my-booking-page',
  templateUrl: 'my-booking-page.html',
  styleUrls: ['my-booking-page.scss']
})
export class AppMyBookingPage {
  user:any;
  segmentValue:string="upcoming";
  pendingBookings:DefaecoOrder[] = [];
  completedBookings:DefaecoOrder[] = [];

  constructor(private router: Router,private loginService: LoginService,private dataService: DataService,private afs: AngularFirestore,private orderService:OrderService) { }
  // ionViewWillEnter () {
  //   console.log("PHmG123DG1233...!!!");
  // }
  async ionViewWillEnter(){

    let busySpinner: any;
        try {

            busySpinner = await this.dataService.presentBusySpinner();
            this.user = await this.loginService.checkIfAccountIsVerified();
            await busySpinner.dismiss();
            if (this.user) {
                this.init();
            } else {
                this.dataService.navigateToLoginPage();
            }
        } catch (e) {
            console.error(e);
            await busySpinner.dismiss();
        }

  }
  async init(){
    let busySpinner:any = await this.dataService.presentBusySpinner();
    try{
      this.pendingBookings = await this.orderService.getAllMyActiveOrders() as DefaecoOrder[];
      this.completedBookings = await this.orderService.getAllMyNonActiveOrders() as DefaecoOrder[];
      await busySpinner.dismiss();
    }catch(e){
      console.log("Error!!!",e);
      await busySpinner.dismiss();
      this.dataService.presentToast("Some Error occurred");
    }
    
  }
  getStatusColor(status){
    let color='';
    if(status == DefaecoOrderStatus.ACTIVE){
      color = 'success';
    }else if(status == DefaecoOrderStatus.CANCELED){
      color = 'danger';
    }
    else if(status == DefaecoOrderStatus.COMPELETED){
      color = 'secondary';
    }
    return color;
  }
  getStatusLabel(status){
    let label='';
    if(status == DefaecoOrderStatus.ACTIVE){
      label = 'Open';
    }else if(status == DefaecoOrderStatus.CANCELED){
      label = 'Cancelled';
    }
    else if(status == DefaecoOrderStatus.COMPELETED){
      label = 'Done';
    }
    return label;
  }

  segmentChanged(ev){

    this.segmentValue = ev.target.value;
  }
  navigateToBookingDetails(selectedOrder){
    this.dataService.setSelectedOrder(selectedOrder);
    this.router.navigate(['/', 'booking-detail']);
  } 

}
