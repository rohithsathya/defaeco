import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook/ngx';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { Storage } from '@ionic/storage';
import { DataService } from '../services/data.service';
import { LoginService } from '../services/login.service';

@Component({
    selector: 'app-log-in-page',
    templateUrl: 'log-in-page.html',
    styleUrls: ['log-in-page.scss']
})
export class AppLogInPage implements OnInit{

    user: any;
    emailText:string='';
    passwordText:string='';

    constructor(private router: Router, private fb: Facebook, private fireAuth: AngularFireAuth,private gplus: GooglePlus,private dataService: DataService,private loginService:LoginService) { }
    ngOnInit(){}
    async ionViewWillEnter(){
        this.handleUserLogIn();
    }
    //NOTES : Busy spinner
    //show busySpiner
    //let busySpinner:any = await this.dataService.presentBusySpinner();
    //await busySpinner.dismiss(); //hide busy spinner

    async handleUserLogIn(){
        let busySpinner:any = await this.dataService.presentBusySpinner();
        try{
            
            this.user = await this.loginService.getLoggedInUser();
            await busySpinner.dismiss();
            if(this.user && this.user.accountVerified){
                this.dataService.navigateToMainPage();
            }
            else if(this.user && !this.user.accountVerified){
                await this.dataService.logOutUser();
                this.dataService.presentToast("Email not verified, please verify your email, by clicking the verification link sent to your email");
            }
        }catch(e){
            this.dataService.hideLoadingPopup();
            alert(`Error occured ${JSON.stringify(e)}`);
            await busySpinner.dismiss();
        }


    }
    navigateToSignUpPage() {
        this.router.navigate(['/', 'sign-up']);
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
                //this.dataService.showLoadingPopup();
                busySpinner = await this.dataService.presentBusySpinner();
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
                await this.fireAuth.auth.signInWithEmailAndPassword(this.emailText,this.passwordText);
                await busySpinner.dismiss();
                //this.dataService.hideLoadingPopup();
                this.handleUserLogIn();
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
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
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
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
            await this.fireAuth.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(gplusUser.idToken));
            //this.dataService.hideLoadingPopup();
            this.handleUserLogIn();

        }catch(e){
            alert("Error logining in : "+ JSON.stringify(e));
        }

       


    }
}
