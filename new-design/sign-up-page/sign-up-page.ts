import { Component, OnInit } from '@angular/core';
import { DataService } from '../services/data.service';
import { NavController } from '@ionic/angular';
import { UiService } from '../services/ui.service';
import { AuthenticationService } from '../services/authentication.service';

@Component({
    selector: 'app-sign-up-page',
    templateUrl: 'sign-up-page.html',
    styleUrls: ['sign-up-page.scss']
})
export class SignUpPage implements OnInit {

    emailText:string='';
    passwordText:string='';
    passwordConfrimText:String='';
    user:any;

    constructor(private dataService:DataService,
        private navCtrl: NavController,
        private uiService:UiService,
        private authService:AuthenticationService) { }
    ngOnInit(){}
    async ionViewWillEnter(){
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.navigateToMainPage();
        }
    }

    private async signUpWithEmail(){
        let busySpinner:any;
        try{
            let areFieldsValid = this.canSignup();
            if(areFieldsValid){
                busySpinner= await this.uiService.presentBusySpinner();
                let res = await this.authService.signUpWithEmail(this.emailText,this.passwordText);
                await busySpinner.dismiss();
                if(res && res.user){
                    res.user.sendEmailVerification(); 
                    this.authService.logoutUser();
                }
                this.uiService.presentToastWithOptions('success','Sign up successful,Please verify your email before you login.Check your Email inbox for more details');
                this.navigateLogInPage();
            }
        }catch(e){
            await busySpinner.dismiss();
            this.uiService.presentToastWithOptions('Error occured',e.message);
            console.log("Error>>>>sign-up-page>>>>signUpWithEmail",e);
        }
       
    }
    private canSignup():boolean{
        let emailValid = this.emailText && this.dataService.isValidateEmail(this.emailText);
            let passwordValid = this.passwordText && (this.passwordText.length >=6)
            if(!emailValid){
                this.uiService.presentToast("Please Enter Valid Email");
                return false;
            }
            if(!passwordValid){
                this.uiService.presentToast("Password should be 6 characters long");
                return false;
            }
            if(this.passwordText != this.passwordConfrimText){
                this.uiService.presentToast("Password and Confirm password should match");
                return false;
            }
        return true;
    }
    private navigateLogInPage() {
        this.navCtrl.navigateBack("login",{animated: true})
    }
    private navigateToMainPage(){
        this.navCtrl.navigateRoot("",{animated: true});
    }
    private navigateToLandingPage(){
        this.navCtrl.navigateRoot("welcome",{animated: true})
    }

}
