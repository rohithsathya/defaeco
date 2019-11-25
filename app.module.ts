import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';



import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule, StorageBucket } from '@angular/fire/storage';

import { GooglePlus } from '@ionic-native/google-plus/ngx';// We'll install this in the next section

const firebaseConfig = {
  apiKey: "AIzaSyBjIEt7a77_cwHuls-xSpGbiEPmhKVezf0",
  authDomain: "defaeco3.firebaseapp.com",
  databaseURL: "https://defaeco3.firebaseio.com",
  projectId: "defaeco3",
  storageBucket: "gs://defaeco3.appspot.com", //defaeco3.appspot.com
  messagingSenderId: "564809703285",
  appId: "1:564809703285:web:7bd8de11f26b7fb5cffd3c",
  measurementId: "G-CBY0TYZX21"
};



import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingPage } from './new-design/landing-page/landing-page';
import { AppLogInPage } from './new-design/log-in-page/log-in-page';
import { SignUpPage } from './new-design/sign-up-page/sign-up-page';
import { AppMainPage } from './new-design/main-page/main-page';
import { AppLocationSelectionComponent } from './new-design/location-selection-component/location-selection-component';
import { AppLocationSelectionPage } from './new-design/location-selection-page/location-selection-page';
import { DataService } from './new-design/services/data.service';
import { AppVendorDetailsPage } from './new-design/vendor-details-page/vendor-details-page';
import { AppPersonalDetailConfirmPage } from './new-design/personal-details-confirm-page/personal-details-confirm-page';
import { AppPackSelectionPage } from './new-design/pack-selection-page/pack-selection-page';
import { AppOptionSelectionPage } from './new-design/option-selection-page/option-selection-page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppSlotSelectionPage } from './new-design/slot-selection-page/slot-selection-page';
import { AppOrderSummaryPage } from './new-design/order-summary-page/order-summary-page';
import { AppBookingDetailsPage } from './new-design/booking-details/booking-details';
//import { AppAccountPage } from './new-design/account-page/account-page';
import { Facebook } from '@ionic-native/facebook/ngx';
import { IonicStorageModule } from '@ionic/storage';
import { AngularFirestoreModule} from '@angular/fire/firestore';
import { VendorDataService } from './new-design/services/vendors.data.service';
import { AreaDataService } from './new-design/services/area.data.service';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { SlotService } from './new-design/services/slot.service';
import { LoginService } from './new-design/services/login.service';
import { AppVendorsListPagePage } from './new-design/vendors-list-page/vendors-list-page';
import { AppAccountPage } from './new-design/account-page/account-page';
import { AppMyBookingPage } from './new-design/my-booking-page/my-booking-page';
import { BookingConfirmedPage } from './new-design/booking-confirmed/booking-confirmed.page';
import { EditPersonalDetailsPage } from './new-design/edit-personal-information/edit-personal-information';
import { OrderService } from './new-design/services/order.service';
import { AppSlotReshudlePage } from './new-design/slot-reschudle-page/slot-reschudle-page';

@NgModule({
  declarations: [
    AppComponent,
    LandingPage,
    AppLogInPage,
    SignUpPage,
    AppMainPage,
    AppLocationSelectionComponent,
    AppLocationSelectionPage,
    AppVendorDetailsPage,
    AppPersonalDetailConfirmPage,
    AppPackSelectionPage,
    AppOptionSelectionPage,
    AppSlotSelectionPage,
    AppOrderSummaryPage,
    AppBookingDetailsPage,
    AppVendorsListPagePage,
    AppAccountPage,
    AppMyBookingPage,
    BookingConfirmedPage,
    EditPersonalDetailsPage,
    AppSlotReshudlePage
  ],
  entryComponents: [
    AppLocationSelectionComponent
  ],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule,
    AngularFireModule.initializeApp(firebaseConfig), // <-- firebase here
    AngularFireAuthModule,
    FormsModule,
    ReactiveFormsModule,
    IonicStorageModule.forRoot(),
    AngularFirestoreModule,
    AngularFireStorageModule,
    HttpClientModule
  
  ],
  providers: [
    GooglePlus,
    Facebook,
    StatusBar,
    DataService,
    VendorDataService,
    AreaDataService,
    SlotService,
    LoginService,
    OrderService,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: StorageBucket, useValue: 'uploads' }
    // {
    //   provide : HTTP_INTERCEPTORS,
    //   useClass: AuthInterceptor,
    //   multi   : true,
    // }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
