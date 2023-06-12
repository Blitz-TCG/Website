import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent implements OnInit {
  homeBoxes$: Observable<any>;
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
  ngOnInit(): void {}
}
