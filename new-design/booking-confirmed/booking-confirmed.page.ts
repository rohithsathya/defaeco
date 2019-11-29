import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-booking-confirmed',
  templateUrl: './booking-confirmed.page.html',
  styleUrls: ['./booking-confirmed.page.scss'],
})
export class BookingConfirmedPage implements OnInit {
  orderId:string = ''
  constructor(private router:Router,
    private route: ActivatedRoute,
    private navCtrl: NavController) { }
  ngOnInit(){}
  ionViewWillEnter() {
    this.route.queryParams.subscribe(async (params) => {
      this.orderId = params["orderId"];
      
    });
  }
  navigateToMyBookings(){
    this.navCtrl.navigateRoot('bookings', { animated: true });

  }

}
