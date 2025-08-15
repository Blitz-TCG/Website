import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';

@Component({
  selector: 'app-disclaimer',
  templateUrl: './disclaimer.component.html',
  styleUrls: ['./disclaimer.component.scss']
})
export class DisclaimerComponent implements OnInit {

  constructor(@Inject(PLATFORM_ID) private platformId: any) { }

  ngOnInit(): void {
  }
  @ViewChild('stickySlider', { static: false }) menuElement?: ElementRef;
  sticky: boolean = false;
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
}
