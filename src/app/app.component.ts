import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(public router: Router, public authService: AuthService, @Inject(PLATFORM_ID) private platformId: any) {
    router.events.subscribe((val) => {
      this.isAuthPage =
        this.router.url === '/register-user' || this.router.url === '/sign-in' || this.router.url === '/collectibles';
    });
  }
  title = 'blitz-tcg';
  isAuthPage = false;
  isLoading: boolean = true;
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.isLoading = window.location.pathname === '/home' || window.location.pathname === '/';
      this.checkIfLoaded();
    }
  }
  checkIfLoaded() {
    if (isPlatformBrowser(this.platformId)) {
      if (window.history.length <= 2) {
        this.authService.SignOut();
      }
      setTimeout(() => {
        this.isLoading = false;
      }, 2500);
    }
  }
}
