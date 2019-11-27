import { Injectable } from '@angular/core';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { ToastController, LoadingController } from '@ionic/angular';

@Injectable({
    providedIn: 'root',
})
export class UiService {

    constructor(private statusBar: StatusBar, public toastController: ToastController,public loadingController: LoadingController) { }

    setStatusBarColor() {
        // let status bar overlay webview
        this.statusBar.overlaysWebView(true);
        // set status bar to white
        this.statusBar.backgroundColorByHexString('#3880ff');
    }
    async presentToast(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 3000
        });
        toast.present();
    }
    async presentToastWithOptions(title, msg) {
        const toast = await this.toastController.create({
            header: title,
            message: msg,
            translucent: true,
            //color:'success', //primary", "secondary", "tertiary", "success", "warning", "danger", "light", "medium", and "dark"
            position: 'middle', //"bottom" | "middle" | "top"
            buttons: [
                {
                    text: 'Done',
                    role: 'cancel',
                    handler: () => {
                        console.log('Cancel clicked');
                    }
                }
            ]
        });
        toast.present();
    }
    presentBusySpinner(){
        return new Promise(async (resolve,reject)=>{
          try{
            let loadingPopup = await this.loadingController.create({message: 'Please Wait...'});
            await loadingPopup.present();
            resolve(loadingPopup);
          }catch(e){
            console.error(e);
            reject();
          }
        })
      }

}