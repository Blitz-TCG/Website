import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-buy-packs',
    templateUrl: './buy-packs.component.html',
    styleUrls: ['./buy-packs.component.scss'],
    standalone: false
})
export class BuyPacksComponent implements OnInit {
  allowedOrigin: SafeUrl

  constructor(private sanitizer: DomSanitizer) {
    this.allowedOrigin = this.sanitizer.bypassSecurityTrustResourceUrl(environment.allowedOrigin);
  }

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    // window.addEventListener('message', this.handleMessage, false);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = 'auto';
    // window.removeEventListener('message', this.handleMessage, false);
  }

  // handleMessage = (event: MessageEvent) => {
  //   if (event.origin.startsWith(environment.allowedOrigin)) {
  //     const iframe = document.getElementById('buy-packs-iframe');
  //     if (iframe && event.data.height) {
  //       iframe.style.height = event.data.height + 'px';
  //     }
  //   }
  // }
}
