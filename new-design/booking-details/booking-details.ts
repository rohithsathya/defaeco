import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { DataService } from '../services/data.service';
import { LoginService } from '../services/login.service';
import { AlertController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/firestore';
import { OrderService, DefaecoOrder, DefaecoOrderStatus } from '../services/order.service';

@Component({
  selector: 'app-booking-details',
  templateUrl: './booking-details.html',
  styleUrls: ['./booking-details.scss'],
})
export class AppBookingDetailsPage implements OnInit {

  order: DefaecoOrder;
  orderStatusLable = '';
  orderStausColor='success';
  isOrderActive:boolean = false;
  user: any;
  bookedForDate: Date = new Date();
  bookedForNextDate: Date = new Date();
  bookedOnDate: Date = new Date();
  cutOffTime:number = 86400000; //24 hours in milliseconds
  constructor(private route: ActivatedRoute, private changeDetector: ChangeDetectorRef, private router: Router, private dataService: DataService, private loginService: LoginService, public alertController: AlertController, private afs: AngularFirestore,private orderService:OrderService) {

    // this.route.params.subscribe((data) => {
    //   this.ngOnInit();
    //   //this.changeDetector.detectChanges();
    // })
  }
  ngOnInit(){}
  async ionViewWillEnter() {
    let busySpinner: any;
    try {
      busySpinner = await this.dataService.presentBusySpinner();
      let accountVerified: any = await this.checkIfAccountIsVerified();
      await busySpinner.dismiss();
      if (accountVerified) {
        this.init();
      } else {
        this.dataService.navigateToLoginPage();
      }
    } catch (e) {
      console.error(e);
      await busySpinner.dismiss();
    }
  }
  init() {
    this.order = this.dataService.getSelectedOrder();
    if (this.order) {
      this.bookedForDate = new Date(this.order.date);
      this.bookedForNextDate = new Date(this.bookedForDate.getDate() + 1);
      this.bookedOnDate = new Date(this.order.bookedOn.seconds * 1000);
      this.setupUiElements();
      console.log("booking details", this.order);
    } else {
      this.navigateToBookingsPage();
    }
  }
  setupUiElements(){
    if(this.order.status == DefaecoOrderStatus.ACTIVE){
      this.orderStatusLable = 'Open';
      this.orderStausColor = 'success';
      this.isOrderActive = true;
    }else if(this.order.status == DefaecoOrderStatus.CANCELED){
      this.orderStatusLable = 'Cancelled';
      this.orderStausColor = 'danger';
      this.isOrderActive = false;
    }
    else if(this.order.status == DefaecoOrderStatus.COMPELETED){
      this.orderStatusLable = 'Done';
      this.orderStausColor = 'secondary';
      this.isOrderActive = false;
    }
  }
  async checkIfAccountIsVerified() {
    return new Promise(async (resolve, reject) => {
      try {
        this.user = await this.loginService.getLoggedInUser();
        let accountVerified = this.user && this.user.accountVerified ? true : false;
        resolve(accountVerified);

      } catch (e) {
        console.error(e);
        resolve(false);
      }
    })
  }
  async cantCancelForPastDate() {
    const alert = await this.alertController.create({
      header: 'Cant Cancel',
      message: `<p>Can not cancel this order as it is already been serviced.</p>`,
      buttons: [
        {
          text: 'ok',
          role: 'cancel',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }
      ]
    });
    await alert.present();
  }
  async cantRescheduleForLessThanCuttOffTime() {
    const alert = await this.alertController.create({
      header: 'Cant Cancel',
      message: `<p>Can not Reschedule this order as it is past cutoff time.</p>`,
      buttons: [
        {
          text: 'ok',
          role: 'cancel',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }
      ]
    });
    await alert.present();
  }
  async cancelOrder(orderId) {

    let today = new Date().getTime();
    let diff = this.bookedForDate.getTime() - today;
    //diff should be greater than 24*60*60*1000 = 86400000 (which is 24 hours)
    //if diff is -ve then it already serviced.
    if (diff < 0) {
      this.cantCancelForPastDate();
      return;
    }
    let isrefund = true;

    let alertMessage = `<p>Are you sure you want to cancel this service ?</p>`;
    if (diff < this.cutOffTime) {
      isrefund = false;
      alertMessage = `<p>You can not cancel as this order is less than 24hr from starting. If you still insist on canceling, you might not get refund. Please refer Defaeco order cancelation policy.</p>`;
    }
    console.log(diff);

    const alert = await this.alertController.create({
      header: 'Confirm Slot',
      subHeader: 'Subtitle',
      message: alertMessage,
      buttons: [
        {
          text: 'Dont Cancel Order',
          role: 'cancel',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Cancel Order',
          handler: () => {
            this.forceCancelOrder(isrefund);
          }
        }
      ]
    });

    await alert.present();


  }
  async reScheduleSlotForOrder(orderId){

    let today = new Date().getTime();
    let diff = this.bookedForDate.getTime() - today;
    //diff should be greater than 24*60*60*1000 = 86400000 (which is 24 hours)
    //if diff is -ve then it already serviced.
    if (diff < this.cutOffTime) {
      this.cantRescheduleForLessThanCuttOffTime();
      return;
    }
    else{

      //confirm for reschduling
      const alert = await this.alertController.create({
        header: 'Confirm Reschduling',
        subHeader: 'Subtitle',
        message: 'Are you sure you want to reschdule ?',
        buttons: [
          {
            text: 'Dont Reschdule',
            role: 'cancel',
            handler: () => {
              console.log('Confirm Cancel');
            }
          }, {
            text: 'Yes Reschdule',
            handler: () => {
              this.navigateToSlotReschdulePage();
            }
          }
        ]
      });
  
      await alert.present();


      console.log("order for reschduling",this.order);
    }

  }

  async forceCancelOrder(isrefund) {
    let busySpinner:any = await this.dataService.presentBusySpinner();
    try {

      await this.orderService.cancelOrder(this.order.id,isrefund);
      this.reopenTheSlots();
      busySpinner.dismiss();
      this.dataService.presentToast("Order Canceled successfully");
      this.navigateToBookingsPage();

    } catch (e) {
      console.log("ERROR!!!", e);
      this.dataService.presentToast("Error Cancelling Order");
      busySpinner.dismiss();
    }
  }
  async reopenTheSlots() {

    for (let i = 0; i < this.order.allSlots.length; i++) {
      let idToDelete = this.order.allSlots[i].id;
      console.log("slots deleting are",idToDelete);
      await this.afs.collection<any>('booked_slots').doc(idToDelete).delete();
    }
  }
  navigateToBookingsPage() {
    this.router.navigate(['/main', 'booking']);
  }
  navigateToSlotReschdulePage() {
    let navigationExtras: NavigationExtras = {
      queryParams: {
          "vendorId": this.order.vendorId,
          "selectedPackage":this.order.packageId,
          "addons":this.order.addonIds,
          "orderId":this.order.id
      }
    };
    this.router.navigate(['/', 'reschdule-slot'],navigationExtras);
  }

}
