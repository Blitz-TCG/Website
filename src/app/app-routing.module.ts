import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CookiepolicyComponent } from './cookiepolicy/cookiepolicy.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { EulaComponent } from './eula/eula.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { HomeComponent } from './home/home.component';
import { LoreComponent } from './lore/lore.component';
import { NotFoundComponent } from './not-found/not-found.component';
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
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
