import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook/ngx';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { Storage } from '@ionic/storage';
import { DataService } from '../services/data.service';
import { LoginService } from '../services/login.service';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AuthenticationService } from '../services/authentication.service';
import { NavController } from '@ionic/angular';
import { NavigationOptions } from '@ionic/angular/dist/providers/nav-controller';
import { UiService } from '../services/ui.service';

@Component({
    selector: 'app-log-in-page',
    templateUrl: 'log-in-page.html',
    styleUrls: ['log-in-page.scss']
})
export class AppLogInPage implements OnInit{

    user: any;
    emailText:string='';
    passwordText:string='';

    constructor(private router: Router, private fb: Facebook, private fireAuth: AngularFireAuth,private gplus: GooglePlus,private dataService: DataService,private loginService:LoginService,private authService:AuthenticationService,private navCtrl: NavController,private uiService:UiService) { }
    ngOnInit(){}
    async ionViewWillEnter() {
        let busySpinner: any = await this.dataService.presentBusySpinner();
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
        //this.handleUserLogIn();
    }
    private navigateToMainPage(){
        this.navCtrl.navigateRoot("",{animated: true});
    }
    private navigateToLandingPage(){
        this.navCtrl.navigateRoot("welcome",{animated: true})
    }
    private navigateToSignUpPage() {
        this.navCtrl.navigateRoot('sign-up',{animated: true});
    }    

    //email
    async loginWithEmail(){
        let busySpinner:any;
        try{
            let emailValid = this.emailText && this.dataService.isValidateEmail(this.emailText);
            let passwordValid = this.passwordText && (this.passwordText.length >=0)
            if(!emailValid){
                this.dataService.presentToast("Please Enter Valid Email");
                return;
            }
            if(!passwordValid){
                this.dataService.presentToast("Please Enter Password.");
                return;
            }

            if(emailValid && passwordValid){
                busySpinner = await this.uiService.presentBusySpinner();
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL); //https://firebase.google.com/docs/auth/web/auth-state-persistence
                await this.fireAuth.auth.signInWithEmailAndPassword(this.emailText,this.passwordText);

                this.user = await this.authService.getVerifiedLoginUser();
                if (this.user) {
                    this.navigateToMainPage();
                }else{
                    this.uiService.presentToast("Email not verified, please verify your email, by clicking the verification link sent to your email");
                }
                await busySpinner.dismiss();

                //this.handleUserLogIn();
            }
            
        }catch(e){
            await busySpinner.dismiss();
            console.log("Error email log in",e);
            this.dataService.presentToast("Error Loging In : "+e.message);
        }
        
    }
    //Facebook
    loginWithFacebook() {

        //this.dataService.showLoadingPopup();

        this.fb.login(['email'])
            .then((res: FacebookLoginResponse) => {
                //this.dataService.hideLoadingPopup();
                console.log('Logged into Facebook!', res);
                this.onFBLoginSuccess(res);

            })
            .catch(e => {
                //this.dataService.hideLoadingPopup();
                console.log('Error logging into Facebook', e);
                alert("Error logining in : "+ JSON.stringify(e));

            });


        this.fb.logEvent(this.fb.EVENTS.EVENT_NAME_ADDED_TO_CART);
    }
    async onFBLoginSuccess(res: FacebookLoginResponse) {
        //this.dataService.showLoadingPopup();
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        await this.fireAuth.auth.signInWithCredential(firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken));
        //this.dataService.hideLoadingPopup();
        this.handleUserLogIn();

    }
    //google
    async loginWithGooglePlus(){

        try{

            const gplusUser = await this.gplus.login({
                'webClientId': '564809703285-srn2jodqk4iliccdg28ed9nv193je1p9.apps.googleusercontent.com',
                'offline': true,
                'scopes': 'profile email'
              })
            //this.dataService.showLoadingPopup();
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            await this.fireAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(gplusUser.idToken));
            //this.dataService.hideLoadingPopup();
            this.handleUserLogIn();

        }catch(e){
            alert("Error logining in : "+ JSON.stringify(e));
        }

       


    }
    //extra
    async handleUserLogIn(){
        let busySpinner:any = await this.uiService.presentBusySpinner();
        try{
            
            this.user = await this.authService.getLoginUser();
            await busySpinner.dismiss();
            if(this.user && this.user.accountVerified){
                this.navigateToMainPage();
            }
            else if(this.user && !this.user.accountVerified){
                await this.authService.logOutUser();
                this.uiService.presentToast("Email not verified, please verify your email, by clicking the verification link sent to your email");
            }
        }catch(e){
            this.uiService.presentToast("Some error occured");
            console.log("Error>>>>log-in-page.ts>>>>handleUserLogIn()",e);
            await busySpinner.dismiss();
        }

    }
}
