import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-use',
  templateUrl: './use.component.html',
  styleUrls: ['./use.component.scss']
})
export class UseComponent implements OnInit {

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
