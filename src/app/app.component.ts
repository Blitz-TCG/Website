import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(public router: Router, public authService: AuthService) {
    router.events.subscribe((val) => {
      this.isAuthPage =
        this.router.url === '/register-user' || this.router.url === '/sign-in';
    });
  }
  title = 'blitz-tcg';
  isAuthPage = false;
  isLoading: boolean =
    window.location.pathname === '/home' || window.location.pathname === '/';
  ngOnInit() {
    this.checkIfLoaded();
  }
  checkIfLoaded() {
    if (window.history.length <= 2) {
      this.authService.SignOut();
    }
    setTimeout(() => {
      this.isLoading = false;
    }, 2500);
  }
}
