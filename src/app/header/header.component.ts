import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
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
    public router: Router
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
    this.checkNetworkStatus();
  }
  ngAfterViewInit() {
    this.elementPosition = this.menuElement?.nativeElement.offsetTop;
  }
  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    const windowScroll = window.pageYOffset;
    if (!this.isAuthPage) {
      if (windowScroll > 0) {
        this.sticky = true;
      } else {
        this.sticky = false;
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
  // To check internet connection stability
  checkNetworkStatus() {
    this.networkStatus = navigator.onLine;
    this.networkStatus$ = merge(
      of(null),
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    )
      .pipe(map(() => navigator.onLine))
      .subscribe((status) => {
        this.networkStatus = status;
        const user = localStorage.getItem('user');
        if (!status && user) {
          this.signout();
        }
      });
  }
  signout() {
    this.authService.SignOut().then(() => {
      window.location.reload();
    });
  }
}
