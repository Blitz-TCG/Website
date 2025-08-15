import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { getDownloadURL, ref } from '@angular/fire/storage';
import { map, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-roadmap',
  templateUrl: './roadmap.component.html',
  styleUrls: ['./roadmap.component.scss'],
})
export class RoadmapComponent implements OnInit {
  @ViewChild('stickySlider', { static: false }) menuElement?: ElementRef;
  sticky: boolean = false;
  roadmap$: Observable<any>;
  general$: Observable<any>;
  constructor(
    public afs: AngularFirestore,
    private storage: AngularFireStorage,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.general$ = afs
      .collection('general')
      .valueChanges()
      .pipe(
        switchMap(async (results) => {
          //@ts-ignore
          const fileRef = this.storage.ref(results[0]['roadmap-image']);
          return {
            //@ts-ignore
            ...results[0],
            roadmapImage: await fileRef.getDownloadURL(),
          };
        })
      );
    this.roadmap$ = afs
      .collection('roadmap')
      .valueChanges()
      .pipe(
        switchMap(async (results) => {
          const imgesPromises = results
            .sort((a: any, b: any) => a.position - b.position)
            .map(async (item: any) => {
              const fileRef = this.storage.ref(item.image);
              return {
                ...item,
                image: await fileRef.getDownloadURL(),
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
}
