import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable } from 'rxjs';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent implements OnInit {
  footerMenu$: Observable<any>;
  general$: Observable<any>;
  constructor(public afs: AngularFirestore) {
    this.general$ = afs
      .collection('general')
      .valueChanges()
      .pipe(map((results) => results[0]));
    this.footerMenu$ = afs
      .collection('footer-menu')
      .valueChanges()
      .pipe(
        map((results) =>
          results.sort((a: any, b: any) => a.position - b.position)
        )
      );
  }
  ngOnInit(): void {}
  clickOnFooter(disabled: boolean) {
    return !disabled;
  }
}
