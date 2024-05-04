import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { SwiperModule } from 'swiper/angular';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterComponent } from './footer/footer.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { HeaderComponent } from './header/header.component';
import { HeaderCarouselComponent } from './hero-carousel/hero-carousel.component';
import { HomeComponent } from './home/home.component';
import { NewsComponent } from './news/news.component';
import { RoadmapComponent } from './roadmap/roadmap.component';
import { AuthService } from './shared/services/auth.service';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { BuyPacksComponent } from './buy-packs/buy-packs.component';
import { CollectiblesComponent } from './collectibles/collectibles.component';
import { ConnectorComponent } from './connector/connector.component';
import { CookiepolicyComponent } from './cookiepolicy/cookiepolicy.component';
import { DisclaimerComponent } from './disclaimer/disclaimer.component';
import { EulaComponent } from './eula/eula.component';
import { LoreComponent } from './lore/lore.component';
import { ModalComponent } from './modal/modal.component';
import { OpenPacksComponent } from './open-packs/open-packs.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { TermsComponent } from './terms/terms.component';
import { UseComponent } from './use/use.component';
import { WhitepaperComponent } from './whitepaper/whitepaper.component';
import { MarketComponent } from './market/market.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    HeaderCarouselComponent,
    NewsComponent,
    RoadmapComponent,
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
    VerifyEmailComponent,
    ConnectorComponent,
    LoreComponent,
    PrivacyComponent,
    CookiepolicyComponent,
    TermsComponent,
    EulaComponent,
    DisclaimerComponent,
    UseComponent,
    WhitepaperComponent,
    CollectiblesComponent,
    BuyPacksComponent,
    OpenPacksComponent,
    MarketComponent,
    ModalComponent
  ],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SwiperModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    AppRoutingModule,
    HttpClientModule,
    AngularSvgIconModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
  ],
  providers: [AuthService],
  bootstrap: [AppComponent],
  exports: [
    PrivacyComponent,
    CookiepolicyComponent,
    TermsComponent,
    EulaComponent,
    DisclaimerComponent,
    UseComponent,
    WhitepaperComponent
  ],
})
export class AppModule { }
