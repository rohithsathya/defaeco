import { Component } from '@angular/core';

import { Platform, NavController, MenuController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private navCtrl: NavController,
    private menuCtrl: MenuController
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      //this.statusBar.styleDefault();
      this.statusBar.backgroundColorByHexString("#03182c");
      this.splashScreen.hide();
    });
  }
  private navigateToMainPage() {
    this.menuCtrl.close("mainMenu");
    this.navCtrl.navigateRoot("main/vendors-list", { animated: true });
  }
  private navigateToAccountPage(){
    this.menuCtrl.close("mainMenu");
    this.navCtrl.navigateRoot("main/account", { animated: true });
  }
}
