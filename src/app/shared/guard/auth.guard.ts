import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(public authService: AuthService, public router: Router, @Inject(PLATFORM_ID) private platformId: any) { }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    if (isPlatformBrowser(this.platformId)) {
      if (this.authService.isLoggedIn === true && localStorage.getItem('user')) {
        this.router.navigate(['/']);
      }
    }
    return true;
  }
}
