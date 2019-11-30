import { Component } from '@angular/core';

import { Platform, NavController, MenuController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthenticationService } from './new-design/services/authentication.service';
import { Router } from '@angular/router';
import { UiService } from './new-design/services/ui.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  setupDone:boolean = false;
  appExitBackPressed:boolean = false;
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private navCtrl: NavController,
    private menuCtrl: MenuController,
    private authService: AuthenticationService,
    private router: Router,
    private uiService:UiService
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    await this.authService.setupUser();
    this.setupDone = true;
    this.platform.ready().then(() => {
      //this.statusBar.styleDefault();
      this.statusBar.backgroundColorByHexString("#03182c");
      this.splashScreen.hide();
      this.backBtnLogic();
    });

   
  }
  private backBtnLogic(){
    let ToplevelLinks = ["/profile","/bookings"];
    this.platform.backButton.subscribe(() => {
      let routeName = this.router.url.split("?")[0];
      if(routeName == "/"){
        if(this.appExitBackPressed){
          navigator['app'].exitApp();
        }else{
          this.uiService.presentToast("Press again to exit");
          this.appExitBackPressed = true;
        }
      }else{
        this.appExitBackPressed = false;
      }
      if(ToplevelLinks.indexOf(routeName)>=0){
        this.navigateToMainPage();
      }
    });
  }
  private navigateToMainPage() {
    this.menuCtrl.close("mainMenu");
    this.navCtrl.navigateRoot("", { animated: true });
  }
  private navigateToAccountPage(){
    this.menuCtrl.close("mainMenu");
    this.navCtrl.navigateRoot("profile", { animated: true });
  }
  private navigateToBookingPage(){
    this.menuCtrl.close("mainMenu");
    this.navCtrl.navigateRoot("bookings", { animated: true });
  }
}
