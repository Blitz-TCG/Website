import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent implements OnInit {
  homeBoxes$: Observable<any>;
  // countdown: any;
  // private countdownSubscription!: Subscription;

  private apiSubscription: Subscription;
  public totalPacksSold: number = 0;

  constructor(
    private sanitizer: DomSanitizer,
    public afs: AngularFirestore,
    private storage: AngularFireStorage,
    private http: HttpClient
  ) {
    this.homeBoxes$ = afs
      .collection('home-boxes')
      .valueChanges()
      .pipe(
        switchMap(async (results) => {
          const imgesPromises = results
            .sort((a: any, b: any) => a.position - b.position)
            .map(async (item: any) => {
              const fileRef = this.storage.ref(item.image);
              return {
                ...item,
                url: item.youtube
                  ? this.sanitizer.bypassSecurityTrustResourceUrl(item.url)
                  : item.url,
                image: await fileRef.getDownloadURL(),
              };
            });
          const data = await Promise.all(imgesPromises);
          return data;
        })
      );

      this.fetchPackStats(); // Call to fetch pack stats
      // Set up an interval to regularly update the stats
      this.apiSubscription = interval(10000).subscribe(() => {
        this.fetchPackStats();
      });
  }

  ngOnInit(): void {
    // this.setUpCountdown(new Date('2024-04-27T04:00:00Z')); // Replace with your event end date
  }

  private fetchPackStats() {
    this.http.get<any>('https://api.ergopad.io/pratir/sale/92be4d0d-3e17-4273-9082-5626d3b5c1ea/packsStats')
      .subscribe(data => {
        // Make sure to specify the type of the accumulator and the current value
        this.totalPacksSold = data.tokenStats.reduce((acc: number, tokenStat: { sold: number }) => acc + tokenStat.sold, 0);
        // Optionally, handle "remaining" as well
      }, error => {
        console.error('Error fetching pack stats:', error);
      });
  }

  // private setUpCountdown(endDate: Date) {
  //   this.countdownSubscription = interval(1000).subscribe(() => {
  //     this.countdown = this.getRemainingTime(endDate);
  //   });
  // }

  // private getRemainingTime(endDate: Date) {
  //   const now = new Date();
  //   const timeLeft = endDate.getTime() - now.getTime();

  //   if (timeLeft < 0) {
  //     this.countdownSubscription.unsubscribe();
  //     return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  //   }

  //   const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  //   const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  //   const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  //   const seconds = Math.floor((timeLeft / 1000) % 60);

  //   return { days, hours, minutes, seconds };
  // }

  ngOnDestroy(): void {
    //this.countdownSubscription?.unsubscribe();
    this.apiSubscription?.unsubscribe();
  }
}
