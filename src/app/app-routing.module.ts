import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BuyPacksComponent } from './buy-packs/buy-packs.component';
import { CollectiblesComponent } from './collectibles/collectibles.component';
import { CookiepolicyComponent } from './cookiepolicy/cookiepolicy.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { EulaComponent } from './eula/eula.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { HomeComponent } from './home/home.component';
import { LoreComponent } from './lore/lore.component';
//import { MarketComponent } from './market/market.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { OpenPacksComponent } from './open-packs/open-packs.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { RoadmapComponent } from './roadmap/roadmap.component';
import { AuthGuard } from './shared/guard/auth.guard';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { TermsComponent } from './terms/terms.component';
import { UseComponent } from './use/use.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { WhitepaperComponent } from './whitepaper/whitepaper.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'sign-in',
    component: SignInComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'register-user',
    component: SignUpComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'verify-email-address',
    component: VerifyEmailComponent,
    canActivate: [AuthGuard],
  },
  { path: 'home', component: HomeComponent },
  { path: 'roadmap', component: RoadmapComponent },
  { path: 'lore', component: LoreComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'cookiepolicy', component: CookiepolicyComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'eula', component: EulaComponent },
  { path: 'disclaimer', component: DisclaimerComponent },
  { path: 'use', component: UseComponent },
  { path: 'whitepaper', component: WhitepaperComponent },
  { path: 'collectibles', component: CollectiblesComponent },
  { path: 'buy-packs', component: BuyPacksComponent },
  { path: 'open-packs', component: OpenPacksComponent },
  //{ path: 'market', component: MarketComponent },
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabledBlocking'
  })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
