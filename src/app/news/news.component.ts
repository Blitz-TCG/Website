import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, switchMap, interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent implements OnInit {
  homeBoxes$: Observable<any>;
  countdown: any;
  private countdownSubscription!: Subscription;
  constructor(
    private sanitizer: DomSanitizer,
    public afs: AngularFirestore,
    private storage: AngularFireStorage
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
  }
  ngOnInit(): void {
    this.setUpCountdown(new Date('2024-04-27T04:00:00Z')); // Replace with your event end date
  }

  private setUpCountdown(endDate: Date) {
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.countdown = this.getRemainingTime(endDate);
    });
  }

  private getRemainingTime(endDate: Date) {
    const now = new Date();
    const timeLeft = endDate.getTime() - now.getTime();

    if (timeLeft < 0) {
      this.countdownSubscription.unsubscribe();
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return { days, hours, minutes, seconds };
  }

  ngOnDestroy(): void {
    this.countdownSubscription?.unsubscribe();
  }
}
