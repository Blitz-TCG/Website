import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
// import Swiper core and required modules
import { Observable, switchMap } from 'rxjs';
import SwiperCore, { Autoplay, Pagination } from 'swiper';
import { SwiperComponent } from 'swiper/angular';

// install Swiper modules
SwiperCore.use([Autoplay, Pagination]);

@Component({
  selector: 'app-hero-carousel',
  templateUrl: './hero-carousel.component.html',
  styleUrls: ['./hero-carousel.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderCarouselComponent implements OnInit {
  @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;
  homeSlider$: Observable<any>;
  @ViewChild('stickySlider', { static: false }) menuElement?: ElementRef;
  sticky: boolean = false;

  constructor(
    public afs: AngularFirestore,
    private storage: AngularFireStorage,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.homeSlider$ = afs
      .collection('home-slider')
      .valueChanges()
      .pipe(
        switchMap(async (results) => {
          const imgesPromises = results
            .sort((a: any, b: any) => a.position - b.position)
            .map(async (item: any) => {
              const imageRef = this.storage.ref(item.image);
              const imageMobileRef = this.storage.ref(item['mobile-image']);
              return {
                image: await imageRef.getDownloadURL(),
                imageMobile: await imageMobileRef.getDownloadURL(),
              };
            });
          const data = await Promise.all(imgesPromises);
          return data;
        })
      );
  }
  ngOnInit(): void { }
  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    if (isPlatformBrowser(this.platformId)) {
      const windowScroll = window.pageYOffset;
      if (windowScroll > 0) {
        this.sticky = true;
      } else {
        this.sticky = false;
      }
    }
  }
  slideNext() {
    this.swiper?.swiperRef.slideNext(1000);
  }
  slidePrev() {
    this.swiper?.swiperRef.slidePrev(1000);
  }
}
