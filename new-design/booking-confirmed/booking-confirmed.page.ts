import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-booking-confirmed',
  templateUrl: './booking-confirmed.page.html',
  styleUrls: ['./booking-confirmed.page.scss'],
})
export class BookingConfirmedPage implements OnInit {
  orderId:string = ''
  constructor(private router:Router,private route: ActivatedRoute) { }
  ngOnInit(){}
  ionViewWillEnter() {
    this.route.queryParams.subscribe(async (params) => {
      this.orderId = params["orderId"];
      
    });
  }
  navigateToMyBookings(){
    this.router.navigate(['main/','booking']) //['home/','tab3']
    //main/booking
  }

}
