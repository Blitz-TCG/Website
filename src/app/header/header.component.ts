import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import {
  fromEvent,
  map,
  merge,
  Observable,
  of,
  Subscription,
  take,
} from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { isPlatformBrowser } from '@angular/common';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @ViewChild('stickyMenu', { static: false }) menuElement?: ElementRef;
  sticky: boolean = false;
  isAuthPage: boolean = false;
  elementPosition: any;
  items$: Observable<any>;
  networkStatus: boolean = false;
  networkStatus$: Subscription = Subscription.EMPTY;
  public activeIndex: any;
  public navbarCollapsed = false;

  constructor(
    public afs: AngularFirestore,
    public adb: AngularFireDatabase,
    public authService: AuthService,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.items$ = afs
      .collection('header-menu')
      .valueChanges()
      .pipe(
        map((results) =>
          results.sort((a: any, b: any) => a.position - b.position)
        )
      );
    router.events.subscribe((val) => {
      this.isAuthPage =
        this.router.url === '/register-user' || this.router.url === '/sign-in';
    });
  }
  ngOnInit(): void {
    // this.checkNetworkStatus();
  }

  ngAfterViewInit() {
    this.elementPosition = this.menuElement?.nativeElement.offsetTop;
  }
  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    if (isPlatformBrowser(this.platformId)) {
      const windowScroll = window.pageYOffset;
      if (!this.isAuthPage) {
        if (windowScroll > 0) {
          this.sticky = true;
        } else {
          this.sticky = false;
        }
      }
    }
  }
  clickOnMenu(
    itemIndex: number,
    disabled: boolean = false,
    parent: boolean = false
  ) {
    if (disabled) return;
    if (this.activeIndex === itemIndex) this.activeIndex = null;
    else this.activeIndex = itemIndex;
    if (!parent) this.navbarCollapsed = !this.navbarCollapsed;
  }
  ngOnDestroy() {
    this.networkStatus$.unsubscribe();
  }

  signout() {
    this.authService.SignOut().then(() => {
      if (isPlatformBrowser(this.platformId)) {
        window.location.reload();
      }
    });
  }
}
