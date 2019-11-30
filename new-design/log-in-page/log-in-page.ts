import { Component, OnInit } from '@angular/core';
import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook/ngx';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import { GooglePlus } from '@ionic-native/google-plus/ngx';
import { DataService } from '../services/data.service';
import { AuthenticationService, User } from '../services/authentication.service';
import { NavController } from '@ionic/angular';
import { UiService } from '../services/ui.service';

@Component({
    selector: 'app-log-in-page',
    templateUrl: 'log-in-page.html',
    styleUrls: ['log-in-page.scss']
})
export class AppLogInPage implements OnInit {

    user: User;
    emailText: string = '';
    passwordText: string = '';

    constructor(private fb: Facebook, 
        private fireAuth: AngularFireAuth, 
        private gplus: GooglePlus, 
        private dataService: DataService,
        private authService: AuthenticationService, 
        private navCtrl: NavController, 
        private uiService: UiService) { }
    ngOnInit() { }
    async ionViewWillEnter() {
        this.user = this.authService.getCurrentUser();
        if (this.user) {
            this.navigateToMainPage();
        }
    }
    private navigateToMainPage() {
        this.navCtrl.navigateRoot("", { animated: true });
    }
    private navigateToLandingPage() {
        this.navCtrl.navigateRoot("welcome", { animated: true })
    }
    private navigateToSignUpPage() {
        this.navCtrl.navigateForward('sign-up', { animated: true });
    }
    //email
    async loginWithEmail() {
        let busySpinner: any;
        try {
            let fieldsValid = this.canLogin();
            if (fieldsValid) {
                busySpinner = await this.uiService.presentBusySpinner();
                await this.authService.loginWithEmail(this.emailText, this.passwordText);
                this.user = this.authService.getCurrentUser();
                await busySpinner.dismiss();
                if (this.user) {
                    this.navigateToMainPage();
                } else {
                    this.uiService.presentToast("Email not verified, please verify your email, by clicking the verification link sent to your email");
                }
            }

        } catch (e) {
            await busySpinner.dismiss();
            console.log("Error>>>>login-in-page.ts>>>loginWithEmail", e);
            this.uiService.presentToast("Error Loging In : " + e.message);
        }

    }
    private canLogin(): boolean {
        let emailValid = this.emailText && this.dataService.isValidateEmail(this.emailText);
        let passwordValid = this.passwordText && (this.passwordText.length >= 0)
        if (!emailValid) {
            this.uiService.presentToast("Please Enter Valid Email");
            return false;
        }
        if (!passwordValid) {
            this.uiService.presentToast("Please Enter Password.");
            return false;
        }
        return true;
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
                alert("Error logining in : " + JSON.stringify(e));

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
    async loginWithGooglePlus() {

        try {

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

        } catch (e) {
            alert("Error logining in : " + JSON.stringify(e));
        }




    }
    //extra
    async handleUserLogIn() {
        let busySpinner: any = await this.uiService.presentBusySpinner();
        try {

            this.user = await this.authService.getLoginUser();
            await busySpinner.dismiss();
            if (this.user && this.user.accountVerified) {
                this.navigateToMainPage();
            }
            else if (this.user && !this.user.accountVerified) {
                await this.authService.logoutUser();
                this.uiService.presentToast("Email not verified, please verify your email, by clicking the verification link sent to your email");
            }
        } catch (e) {
            this.uiService.presentToast("Some error occured");
            console.log("Error>>>>log-in-page.ts>>>>handleUserLogIn()", e);
            await busySpinner.dismiss();
        }

    }
}
