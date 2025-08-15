import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Component({
    selector: 'app-whitepaper',
    templateUrl: './whitepaper.component.html',
    styleUrls: ['./whitepaper.component.scss'],
    standalone: false
})
export class WhitepaperComponent implements OnInit {

  constructor(private meta: Meta, private titleService: Title, @Inject(PLATFORM_ID) private platformId: any) {
    this.titleService.setTitle('Whitepaper | Blitz TCG');
    this.addTag();
  }

  addTag() {
    this.meta.updateTag({ name: 'description', content: 'The basic premise of competitive Trading Card Games (TCGs) has remained unchanged since the early 90s when Magic:  The Gathering stormed onto the scene paving the way for the many physical and digital card game variants to follow' });
    this.meta.updateTag({ name: 'robots', content: 'index,follow' });
    this.meta.updateTag({ name: 'title', content: 'Whitepaper | Blitz TCG' });
    this.meta.updateTag({ name: 'og:title', content: 'Whitepaper | Blitz TCG' });
  }
  ngOnInit(): void { }
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
