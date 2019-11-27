import { Component } from '@angular/core';

@Component({
  selector: 'defaeco-welcome-page',
  templateUrl: 'welcome-page.html',
  styleUrls: ['welcome-page.scss']
})
export class DefaecoWelcomePageComponent {
  slideOpts = {
    initialSlide: 0,
    speed: 300
  };
  constructor() {}
  ionViewWillEnter(){
      console.log("init Welcome page");
  }
}
