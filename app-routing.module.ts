import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LandingPage } from './new-design/landing-page/landing-page';
import { AppLogInPage } from './new-design/log-in-page/log-in-page';
import { SignUpPage } from './new-design/sign-up-page/sign-up-page';
import { AppMainPage } from './new-design/main-page/main-page';
import { AppLocationSelectionPage } from './new-design/location-selection-page/location-selection-page';
import { AppVendorDetailsPage } from './new-design/vendor-details-page/vendor-details-page';
import { AppPersonalDetailConfirmPage } from './new-design/personal-details-confirm-page/personal-details-confirm-page';
import { AppPackSelectionPage } from './new-design/pack-selection-page/pack-selection-page';
import { AppOptionSelectionPage } from './new-design/option-selection-page/option-selection-page';
import { AppSlotSelectionPage } from './new-design/slot-selection-page/slot-selection-page';
import { AppOrderSummaryPage } from './new-design/order-summary-page/order-summary-page';
import { AppBookingDetailsPage } from './new-design/booking-details/booking-details';
import { AppMyBookingPage } from './new-design/my-booking-page/my-booking-page';
import { AppVendorsListPagePage } from './new-design/vendors-list-page/vendors-list-page';
import { AppAccountPage } from './new-design/account-page/account-page';
import { BookingConfirmedPage } from './new-design/booking-confirmed/booking-confirmed.page';
import { EditPersonalDetailsPage } from './new-design/edit-personal-information/edit-personal-information';
import { AppSlotReshudlePage } from './new-design/slot-reschudle-page/slot-reschudle-page';
import { DefaecoWelcomePageComponent } from './production/components/welcome-page/welcome-page';

const routes: Routes = [

  { path: 'main', component: AppMainPage,
    children: [
      {
        path: 'booking',
        component: AppMyBookingPage
      },
      {
        path: 'vendors-list',
        component: AppVendorsListPagePage
      },
      {
        path: 'account',
        component: AppAccountPage
      }
    ]
  },
  { path: 'booking-confirmed', component: BookingConfirmedPage },
  { path: '', component: LandingPage },
  { path: 'login', component: AppLogInPage },
  { path: 'sign-up', component: SignUpPage },
  { path: 'loc-sel', component: AppLocationSelectionPage },
  { path: 'vendor-detail', component: AppVendorDetailsPage },
  { path: 'confirm-personal-details', component: AppPersonalDetailConfirmPage },
  { path: 'pack-sel', component: AppPackSelectionPage },
  { path: 'add-options', component: AppOptionSelectionPage },
  { path: 'pick-slot', component: AppSlotSelectionPage },
  { path: 'reschdule-slot', component:AppSlotReshudlePage},
  { path: 'order-summary', component: AppOrderSummaryPage },
  { path: 'booking-detail', component: AppBookingDetailsPage },
  { path: 'booking', component: AppMyBookingPage },
  { path: 'edit-profile', component:EditPersonalDetailsPage},
  { path: 'payment', loadChildren: './payment/payment.module#PaymentPageModule' },

  //production
  {path: 'd-welcome',component:DefaecoWelcomePageComponent}


];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
