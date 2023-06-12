import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-whitepaper',
  templateUrl: './whitepaper.component.html',
  styleUrls: ['./whitepaper.component.scss']
})
export class WhitepaperComponent implements OnInit {

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
