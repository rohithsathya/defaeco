import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { DataService } from '../services/data.service';
import { LoginService } from '../services/login.service';

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

    constructor(private router: Router,private fireAuth: AngularFireAuth,private dataService:DataService,private loginService:LoginService) { }
    ngOnInit(){}
    async ionViewWillEnter(){

        let busySpinner:any = await this.dataService.presentBusySpinner();
        this.user = await this.loginService.getLoggedInUser();
        await busySpinner.dismiss(); //hide busy spinner

        if(this.user && this.user.emailVerified){
            this.dataService.navigateToMainPage();
        }
    }

    async signUpWithEmail(){
        let busySpinner:any;
        try{

            let emailValid = this.emailText && this.dataService.isValidateEmail(this.emailText);
            let passwordValid = this.passwordText && (this.passwordText.length >=6)
            if(!emailValid){
                this.dataService.presentToast("Please Enter Valid Email");
                return;
            }
            if(!passwordValid){
                this.dataService.presentToast("Password should be 6 characters long");
                return;
            }
            if(this.passwordText != this.passwordConfrimText){
                this.dataService.presentToast("Password and Confirm password should match");
                return;
            }

            busySpinner= await this.dataService.presentBusySpinner();
            let res = await this.fireAuth.auth.createUserWithEmailAndPassword(this.emailText,this.passwordText);
            await busySpinner.dismiss();



            //send email verifiaction for signed up user.
            //as soon as signs up user will be looged in also.
            if(res && res.user){
                res.user.sendEmailVerification(); 
                this.dataService.logOutUser();
            }
            this.dataService.presentToastWithOptions('success','Sign up successful,Please verify your email before you login.Check your Email inbox for more details');
            this.navigateLogInPage();


        }catch(e){
            await busySpinner.dismiss();
            this.dataService.presentToastWithOptions('ERROR!!!',e.message);
            console.log("Error signing up",e);
        }
       
    }
    navigateLogInPage() {
        this.router.navigate(['/', 'login']);
    }

}
