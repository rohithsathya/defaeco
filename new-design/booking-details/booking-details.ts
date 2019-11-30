import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { AlertController, NavController } from '@ionic/angular';
import { AngularFirestore } from '@angular/fire/firestore';
import { OrderService, DefaecoOrder, DefaecoOrderStatus } from '../services/order.service';
import { AuthenticationService, User } from '../services/authentication.service';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-booking-details',
  templateUrl: './booking-details.html',
  styleUrls: ['./booking-details.scss'],
})
export class AppBookingDetailsPage implements OnInit {

  order: DefaecoOrder;
  orderStatusLable = '';
  orderStausColor = 'success';
  isOrderActive: boolean = false;
  user: User;
  bookedForDate: Date = new Date();
  bookedForNextDate: Date = new Date();
  bookedOnDate: Date = new Date();
  cutOffTime: number = 86400000; //24 hours in milliseconds
  constructor(private dataService: DataService,
    public alertController: AlertController,
    private afs: AngularFirestore,
    private orderService: OrderService,
    private authService: AuthenticationService,
    private navCtrl: NavController,
    private uiService: UiService) {

  }
  ngOnInit() { }
  async ionViewWillEnter() {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.init();
    } else {
      this.navigateToWelcomePage();
    }
  }
  navigateToLoginPage() {
    this.navCtrl.navigateRoot('login', { animated: true });
  }
  init() {
    try {
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

    } catch (e) {
      console.log("Error", e);
      this.navigateToErrorPage()
    }
  }
  setupUiElements() {
    if (this.order.status == DefaecoOrderStatus.ACTIVE) {
      this.orderStatusLable = 'Open';
      this.orderStausColor = 'success';
      this.isOrderActive = true;
    } else if (this.order.status == DefaecoOrderStatus.CANCELED) {
      this.orderStatusLable = 'Cancelled';
      this.orderStausColor = 'danger';
      this.isOrderActive = false;
    }
    else if (this.order.status == DefaecoOrderStatus.COMPELETED) {
      this.orderStatusLable = 'Done';
      this.orderStausColor = 'secondary';
      this.isOrderActive = false;
    }
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
  async reScheduleSlotForOrder(orderId) {

    let today = new Date().getTime();
    let diff = this.bookedForDate.getTime() - today;
    //diff should be greater than 24*60*60*1000 = 86400000 (which is 24 hours)
    //if diff is -ve then it already serviced.
    if (diff < this.cutOffTime) {
      this.cantRescheduleForLessThanCuttOffTime();
      return;
    }
    else {

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


      console.log("order for reschduling", this.order);
    }

  }

  async forceCancelOrder(isrefund) {
    let busySpinner: any = await this.uiService.presentBusySpinner();
    try {

      await this.orderService.cancelOrder(this.order.id, isrefund);
      this.reopenTheSlots();
      busySpinner.dismiss();
      this.uiService.presentToast("Order Canceled successfully");
      this.navigateToBookingsPage();

    } catch (e) {
      console.log("ERROR!!!", e);
      this.uiService.presentToast("Error Cancelling Order");
      busySpinner.dismiss();
    }
  }
  async reopenTheSlots() {

    for (let i = 0; i < this.order.allSlots.length; i++) {
      let idToDelete = this.order.allSlots[i].id;
      console.log("slots deleting are", idToDelete);
      await this.afs.collection<any>('booked_slots').doc(idToDelete).delete();
    }
  }
  navigateToBookingsPage() {
    this.navCtrl.navigateRoot('bookings', { animated: true });
  }
  navigateToSlotReschdulePage() {
    this.navCtrl.navigateForward(`reschdule-slot?vendorId=${encodeURI(this.order.vendorId)}&selectedPackage=${encodeURI(this.order.packageId)}&addons=${encodeURI(this.order.addonIds.toString())}&orderId=${encodeURI(this.order.id)}`, { animated: true });
  }
  navigateToWelcomePage() {
    this.navCtrl.navigateRoot('welcome', { animated: true });
  }
  navigateToErrorPage() {
    this.navCtrl.navigateForward("error", { animated: true });
  }

}
