import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-cookiepolicy',
  templateUrl: './cookiepolicy.component.html',
  styleUrls: ['./cookiepolicy.component.scss']
})
export class CookiepolicyComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  @ViewChild('stickySlider', { static: false }) menuElement?: ElementRef;
  sticky: boolean = false;
  @HostListener('window:scroll', ['$event'])
  handleScroll() {
    const windowScroll = window.pageYOffset;
    if (windowScroll > 0) {
      this.sticky = true;
    } else {
      this.sticky = false;
    }
  }
}
