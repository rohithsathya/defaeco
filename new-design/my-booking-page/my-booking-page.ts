import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { LoginService } from '../services/login.service';
import { DataService } from '../services/data.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { OrderService, DefaecoOrderStatus, DefaecoOrder } from '../services/order.service';
import { IonicRouteStrategy, NavController } from '@ionic/angular';
import { AuthenticationService, User } from '../services/authentication.service';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-my-booking-page',
  templateUrl: 'my-booking-page.html',
  styleUrls: ['my-booking-page.scss']
})
export class AppMyBookingPage {
  user: User;
  segmentValue: string = "upcoming";
  pendingBookings: DefaecoOrder[] = [];
  completedBookings: DefaecoOrder[] = [];
  isLoading: boolean = false;
  skeletonElements: any[] = Array(10);

  constructor(
    private dataService: DataService,
    private orderService: OrderService,
    private authService: AuthenticationService,
    private uiService: UiService,
    private navCtrl: NavController) { }

  async ionViewWillEnter() {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.init();
    } else {
      this.navigateToWelcomePage();
    }
  }
  async init() {

    try {
      this.isLoading = true;
      this.pendingBookings = await this.orderService.getAllMyActiveOrders() as DefaecoOrder[];
      this.completedBookings = await this.orderService.getAllMyNonActiveOrders() as DefaecoOrder[];
      this.isLoading = false;
    } catch (e) {
      console.log("Error!!!", e);
      this.isLoading = false;
      this.navigateToErrorPage();
    }

  }
  getStatusColor(status) {
    let color = '';
    if (status == DefaecoOrderStatus.ACTIVE) {
      color = 'success';
    } else if (status == DefaecoOrderStatus.CANCELED) {
      color = 'danger';
    }
    else if (status == DefaecoOrderStatus.COMPELETED) {
      color = 'secondary';
    }
    return color;
  }
  getStatusLabel(status) {
    let label = '';
    if (status == DefaecoOrderStatus.ACTIVE) {
      label = 'Open';
    } else if (status == DefaecoOrderStatus.CANCELED) {
      label = 'Cancelled';
    }
    else if (status == DefaecoOrderStatus.COMPELETED) {
      label = 'Done';
    }
    return label;
  }

  segmentChanged(ev) {

    this.segmentValue = ev.target.value;
  }
  navigateToBookingDetails(selectedOrder) {
    this.dataService.setSelectedOrder(selectedOrder);
    this.navCtrl.navigateForward('booking-detail', { animated: true });
  }
  async doRefresh(event) {
    this.init();
    event.target.complete();
  }
  navigateToWelcomePage() {
    this.navCtrl.navigateRoot('welcome', { animated: true });
  }
  navigateToErrorPage() {
    this.navCtrl.navigateForward("error", { animated: true });
  }

}
