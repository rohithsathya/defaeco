import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { DataService } from '../services/data.service';
import { LoginService } from '../services/login.service';
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

    constructor(private fireAuth: AngularFireAuth,private dataService:DataService,private navCtrl: NavController,private uiService:UiService,private authService:AuthenticationService) { }
    ngOnInit(){}
    async ionViewWillEnter(){
        let busySpinner: any = await this.uiService.presentBusySpinner();
        try {
            this.user = await this.authService.getVerifiedLoginUser();
            if (this.user) {
                this.navigateToMainPage();
            }
            await busySpinner.dismiss();

        } catch (e) {
            console.log("ERROR!!!>>>>>AppLogInPage.ts>>>>>ionViewWillEnter()", e);
            await busySpinner.dismiss();
        }
    }

    async signUpWithEmail(){
        let busySpinner:any;
        try{

            let emailValid = this.emailText && this.dataService.isValidateEmail(this.emailText);
            let passwordValid = this.passwordText && (this.passwordText.length >=6)
            if(!emailValid){
                this.uiService.presentToast("Please Enter Valid Email");
                return;
            }
            if(!passwordValid){
                this.uiService.presentToast("Password should be 6 characters long");
                return;
            }
            if(this.passwordText != this.passwordConfrimText){
                this.uiService.presentToast("Password and Confirm password should match");
                return;
            }

            busySpinner= await this.uiService.presentBusySpinner();
            let res = await this.fireAuth.auth.createUserWithEmailAndPassword(this.emailText,this.passwordText);
            await busySpinner.dismiss();
            if(res && res.user){
                res.user.sendEmailVerification(); 
                this.authService.logOutUser();
            }
            this.uiService.presentToastWithOptions('success','Sign up successful,Please verify your email before you login.Check your Email inbox for more details');
            this.navigateLogInPage();


        }catch(e){
            await busySpinner.dismiss();
            this.uiService.presentToastWithOptions('Error occured',e.message);
            console.log("Error>>>>sign-up-page>>>>signUpWithEmail",e);
        }
       
    }
    navigateLogInPage() {
        this.navCtrl.navigateRoot("login",{animated: true})
    }
    private navigateToMainPage(){
        this.navCtrl.navigateRoot("main/vendors-list",{animated: true});
    }
    private navigateToLandingPage(){
        this.navCtrl.navigateRoot("",{animated: true})
    }

}
