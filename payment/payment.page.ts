import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.page.html',
  styleUrls: ['./payment.page.scss'],
})
export class PaymentPage implements OnInit {

  serviceName:string ="Car Wash";
  size:string ="Hatch Back";
  price:any=200;

  
  constructor(private router:Router) { }
  ngOnInit(){}
  ionViewWillEnter() {
  }
  navigateToSuccessPage(){
    this.router.navigate(['/','booking-confirmed']);
  }

}
