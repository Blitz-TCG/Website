import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { getAuth } from 'firebase/auth';
import { child, get, getDatabase, ref } from 'firebase/database';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
// import { getDownloadURL, ref as imgRef } from 'firebase/storage';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import SwiperCore, { Pagination, SwiperOptions } from 'swiper';
import { SwiperComponent } from 'swiper/angular';
import { AuthService } from '../shared/services/auth.service';

SwiperCore.use([Pagination]);


interface TokenData {
  tokens: Token[];
}

interface Token {
  tokenId: string;
  amount: number;
  decimals: number;
}

@Component({
  selector: 'app-collectibles',
  templateUrl: './collectibles.component.html',
  styleUrls: ['./collectibles.component.scss']
})
export class CollectiblesComponent implements OnInit {
  @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;
  @ViewChild('stickyElem', { static: false }) menuElement?: ElementRef;
  sticky: boolean = false;
  activeIndex: any;
  displayStyle = "none";
  blurStyle = "none";
  userCardsDetail = {
    total: 0,
    firstEdition: 0,
    unlEdition: 0,
    common: 0,
    uncommon: 0,
    rare: 0,
    legendary: 0
  }
  filter = {
    edition: {
      name: "All",
      value: "All"
    },
    set: {
      name: "All",
      value: "All"
    },
    clan: {
      name: "All",
      value: "All"
    },
    rarity: {
      name: "All",
      value: "All"
    },
    level: {
      name: "All",
      value: "All"
    },
    artist: {
      name: "All",
      value: "All"
    }
  }
  PAGE_SIZE = 10;
  cardsPages = 10;
  currentCardPage = 1;
  walletID = null;
  tokenIds: any = [];
  cards: any = [];
  filtedCards: any = [];
  selectedCard: any = null;

  constructor(private storage: AngularFireStorage, public adb: AngularFireDatabase, private httpClient: HttpClient, public afAuth: AngularFireAuth, public authService: AuthService, @Inject(PLATFORM_ID) private platformId: any) { }

  config: SwiperOptions = {
    spaceBetween: 6,
    navigation: false,
    scrollbar: { draggable: true },
    breakpoints: {
      500: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      992: {
        slidesPerView: 3
      },
      1200: {
        slidesPerView: 4
      },
      1400: {
        slidesPerView: 6
      }
    }
  };
  ngOnInit(): void {
    this.afAuth.authState
      .pipe(
        take(1),
        switchMap(() => this.getWalletAddress()),
        switchMap(() => {
          // Load Ergo tokens first
          return this.loadErgoTokens().pipe(
            switchMap(() => {
              // Once Ergo tokens are loaded, query the cards
              return this.queryCards();
            })
          );
        })
      )
      .subscribe(
        (cards) => { },
        (error) => {
          console.log('Error querying cards:', error);
        }
      );

    // this.duplicateFirstCard().pipe(take(1)).subscribe(
    //   () => {
    //     console.log('First card duplicated successfully.');
    //   },
    //   (error) => {
    //     console.log('Error duplicating first card:', error);
    //   }
    // );
  }

  getWalletAddress(): Observable<any> {
    return new Observable((observer) => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        const database = getDatabase();
        const dbRef = ref(database);
        if (user) {
          get(child(dbRef, `users/${user?.uid}/wallet`))
            .then((snapshot) => {
              if (snapshot.exists()) {
                if (snapshot.val() === 'none') {
                  if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('userIsConnected', 'false');
                    this.walletID = null;
                  }
                } else {
                  this.walletID = snapshot.val();
                }
              }
              observer.next(); // Emit a value to indicate completion
              observer.complete(); // Complete the observable
            })
            .catch((error) => {
              observer.error(error); // Emit an error if there's an exception
            });
        } else {
          observer.next(); // Emit a value to indicate completion
          observer.complete(); // Complete the observable
        }
      } catch (error) {
        observer.error(error); // Emit an error if there's an exception
      }
    });
  }

  loadErgoTokens(): Observable<void> {
    if (this.walletID) {
      return this.httpClient.get('https://ergo-explorer.anetabtc.io/api/v1/addresses/' + this.walletID + '/balance/confirmed')
        .pipe(
          catchError(error => {
            console.log('Error loading Ergo tokens:', error);
            return of(); // Return an empty observable
          }),
          tap((response: any) => {
            if (response) {
              const dataObjects: any = response;
              for (const token of dataObjects.tokens) {
                const tokenDecimals = Math.pow(10, token.decimals);
                this.tokenIds.push({ tokenId: token.tokenId, amount: token.amount / tokenDecimals });
              }
            }
          })
        );
    } else {
      console.log('No wallet ID');
      return of(); // Return an empty observable
    }
  }

  queryCards(): Observable<any[]> {
    const db = getFirestore();
    const cardsCollection = collection(db, 'cards');

    const chunkedTokenIds = [];
    const chunkSize = 5;
    for (let i = 0; i < this.tokenIds.length; i += chunkSize) {
      const chunk = this.tokenIds.slice(i, i + chunkSize).map((t: any) => t.tokenId);
      chunkedTokenIds.push(chunk);
    }

    const queries = chunkedTokenIds.map((chunk) => {
      return query(cardsCollection, where('tokenId', 'in', chunk));
    });

    return new Observable<any[]>((observer) => {
      const mergedCards: any = [];
      Promise.all(queries.map((queryRef) => getDocs(queryRef)))
        .then((querySnapshots) => {
          querySnapshots.forEach((querySnapshot) => {
            const cards = querySnapshot.docs.map((doc) => doc.data());
            mergedCards.push(...cards);
          });

          const finalCards = this.tokenIds.map((token: any) => {
            const matchingCard = mergedCards.find((c: any) => c.tokenId === token.tokenId);
            return { ...token, ...matchingCard };
          });
          this.calcUserCards(finalCards);
          this.cards = finalCards;
          this.filtedCards = finalCards;
          observer.next(finalCards);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }


  calcUserCards(cards: any) {
    this.userCardsDetail.total = cards.length;
    for (let index = 0; index < cards.length; index++) {
      const c = cards[index];
      if (c.edition === 1) this.userCardsDetail.firstEdition++;
      if (c.edition !== 1) this.userCardsDetail.unlEdition++;
      if (c.rarity === 'common') this.userCardsDetail.common++;
      if (c.rarity === 'uncommon') this.userCardsDetail.uncommon++;
      if (c.rarity === 'rare') this.userCardsDetail.rare++;
      if (c.rarity === 'legendary') this.userCardsDetail.legendary++;
    }
  }


  applyFilter() {
    this.filtedCards = this.cards.filter((card: any) => {
      if (
        (this.filter.edition.value === 'All' || card.edition == this.filter.edition.value) &&
        (this.filter.set.value === 'All' || card.set === this.filter.set.value) &&
        (this.filter.clan.value === 'All' || card.clan === this.filter.clan.value) &&
        (this.filter.rarity.value === 'All' || card.rarity === this.filter.rarity.value) &&
        (this.filter.level.value === 'All' || card.level === this.filter.level.value) &&
        (this.filter.artist.value === 'All' || card.artist === this.filter.artist.value)
      ) {
        return true;
      }
      return false;
    });
    console.log(this.filtedCards, this.filter);
  }


  clickOnMenu(
    itemIndex: number,
  ) {
    if (this.activeIndex === itemIndex) this.activeIndex = null;
    else this.activeIndex = itemIndex;
  }

  openPopup(card: any) {
    this.selectedCard = card;
    this.displayStyle = "block";
    this.blurStyle = "blur(4px); ";
  }

  closePopup() {
    this.selectedCard = null;
    this.displayStyle = "none";
    this.blurStyle = "none";
  }

  slideNext() {
    this.swiper?.swiperRef.slideNext(1000);
  }

  slidePrev() {
    this.swiper?.swiperRef.slidePrev(1000);
  }

  nextPage() {
    if (this.currentCardPage < this.cardsPages)
      this.currentCardPage++;
  }

  prevPage() {
    if (this.currentCardPage > 1)
      this.currentCardPage--;
  }

  walletConnected(): any {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userIsConnected') != 'false';
    }
  }

  toggleMenu(index: number): void {
    this.activeIndex = this.activeIndex === index ? -1 : index;
  }

  selectEdition(value: string, name: string): void {
    this.filter.edition.value = value;
    this.filter.edition.name = name;
    this.applyFilter();
    this.toggleMenu(0);
  }
  selectSet(value: string, name: string): void {
    this.filter.set.value = value;
    this.filter.edition.name = name;
    this.applyFilter();
    this.toggleMenu(1);
  }
  selectClan(value: string, name: string): void {
    this.filter.clan.value = value;
    this.filter.edition.name = name;
    this.applyFilter();
    this.toggleMenu(2);
  }
  selectRarity(value: string, name: string): void {
    this.filter.rarity.value = value;
    this.filter.edition.name = name;
    this.applyFilter();
    this.toggleMenu(3);
  }
  selectLevel(value: string, name: string): void {
    this.filter.level.value = value;
    this.filter.edition.name = name;
    this.applyFilter();
    this.toggleMenu(4);
  }
  selectArtist(value: string, name: string): void {
    this.filter.artist.value = value;
    this.filter.edition.name = name;
    this.applyFilter();
    this.toggleMenu(5);
  }
}
