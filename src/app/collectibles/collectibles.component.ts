import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { getAuth } from 'firebase/auth';
import { child, get, getDatabase, ref } from 'firebase/database';
import { addDoc, collection, getDocs, getFirestore, query, where, writeBatch } from 'firebase/firestore';
// import { getDownloadURL, ref as imgRef } from 'firebase/storage';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import SwiperCore, { Pagination, SwiperOptions } from 'swiper';
import { SwiperComponent } from 'swiper/angular';
import { ModalService } from '../modal/modal.service';
import { AuthService } from '../shared/services/auth.service';
import { WalletService } from '../wallet.service';
import { Subscription } from 'rxjs';

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
export class CollectiblesComponent implements OnInit, OnDestroy {
  @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;
  @ViewChild('stickyElem', { static: false }) menuElement?: ElementRef;
  @ViewChild('cardNameInput', { static: false }) cardNameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('ownedCardsOnlyCheckbox') ownedCardsOnlyCheckbox!: ElementRef<HTMLInputElement>;
  sticky: boolean = false;
  activeIndex: any;
  userCardsDetail = {
    total: 0,
    cardsCollected: 0,
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
    faction: {
      name: "All",
      value: "All"
    },
    rarity: {
      name: "All",
      value: "All"
    },
    bracket: {
      name: "All",
      value: "All"
    },
    artist: {
      name: "All",
      value: "All"
    }
  }
  isChecked = false;
  cardsPages = 7;
  perPage = 24;
  currentCardPage = 1;
  walletID: string | null = null;
  tokenIds: any = [];
  cards: any = [];
  filtedCards: any = [];
  showCards: any = [];
  applyedFilter: boolean = false;
  selectedCard: any = null;

  constructor(private walletService: WalletService, private modalService: ModalService, public adb: AngularFireDatabase, private httpClient: HttpClient, public afAuth: AngularFireAuth, public authService: AuthService, @Inject(PLATFORM_ID) private platformId: any) { }

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

  private subscriptions: Subscription[] = [];

  resetTokenState() {
    this.tokenIds = []; // Clear the tokenIds array
    this.cards = []; // Clear the cards array
    // Reset other related states if necessary
    this.userCardsDetail = {
      total: 0,
      cardsCollected: 0,
      firstEdition: 0,
      unlEdition: 0,
      common: 0,
      uncommon: 0,
      rare: 0,
      legendary: 0
    };
  }
    // Unsubscribe when the component is destroyed
    ngOnDestroy(): void {
      this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

  ngOnInit(): void {
    console.log('ngOnInit triggered');
 // Check if the wallet is already connected and load tokens
 if (this.walletService.walletConnected()) {
  this.loadErgoTokens().pipe(
    switchMap(() => this.queryCards())
  ).subscribe(
    () => console.log('Tokens and cards loaded successfully.'),
    error => console.error('Failed to load tokens and cards:', error)
  );
}

this.walletService.walletUpdated$.subscribe(walletID => {
    console.log('Tracker: walletID trigger.');
    if (walletID) {
      this.resetTokenState(); // Reset the state before loading new tokens
      console.log('Tokens reset successfully.'),
      this.walletID = walletID;
      this.loadErgoTokens().pipe(
        switchMap(() => this.queryCards())
      ).subscribe(
        () => console.log('Tokens and cards loaded successfully.'),
        error => console.error('Failed to load tokens and cards:', error)
      );
    }
});

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
  }



  generateRandomString(length: number) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  duplicateFirstCard(): Observable<void> {
    const db = getFirestore();
    const cardsCollection = collection(db, 'cards');

    // Define the query to retrieve the first card
    const queryRef = query(cardsCollection);

    return new Observable<void>((observer) => {
      getDocs(queryRef)
        .then((querySnapshot) => {
          const firstCard = querySnapshot.docs[0];
          const cardData = firstCard.data();

          // Duplicate the first card six times
          for (let i = 0; i < 139; i++) {
            addDoc(collection(db, 'cards'), { ...cardData, tokenId: this.generateRandomString(10) })
              .then(() => {
                console.log('Card duplicated successfully');
              })
              .catch((error) => {
                console.log('Error duplicating card:', error);
              });
          }
        })
        .catch((error) => {
          console.log('Error retrieving first card:', error);
        });
    });
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
    console.log(this.walletID)
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
    const tIds = this.tokenIds.map((token: any) => token.tokenId);

    return new Observable<any[]>((observer) => {
      getDocs(cardsCollection)
        .then((querySnapshot) => {
          const allCards = querySnapshot.docs.map((doc) => {
            const card: any = doc.data();
            const getAmount = this.tokenIds.find((token: any) => token.tokenId === card.tokenId);
            if (getAmount) {
              // Check for the specific token ID and set the amount to 1
              if (getAmount.tokenId === "6ad70cdbf928a2bdd397041a36a5c2490a35beb4d20eabb5666f004b103c7189") {
                return { ...card, amount: 1 };
              } else {
                return { ...card, amount: getAmount.amount };
              }
            } else {
              return { ...card, amount: 0 };
            }
          });
          const sortedCards = allCards.sort((a: any, b: any) => a.name.localeCompare(b.name))
            .sort((a: any, b: any) => {
              const aHasTokenId = this.tokenIds.map((token: any) => token.tokenId).includes(a.tokenId);
              const bHasTokenId = this.tokenIds.map((token: any) => token.tokenId).includes(b.tokenId);

              if (aHasTokenId && !bHasTokenId) {
                return -1;
              }
              return 1;
            });

          this.cards = sortedCards;
          this.showCards = sortedCards.slice(0, this.perPage);
          this.cardsPages = Math.ceil(sortedCards.length / this.perPage) || 1;
          this.calcUserCards(sortedCards.filter((c: any) => c.amount))
          observer.next(sortedCards);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  calcUserCards(cards: any) {
    for (let index = 0; index < cards.length; index++) {
      console.log(cards.length);
      this.userCardsDetail.cardsCollected = cards.length;
      const c = cards[index];
      this.userCardsDetail.total += c.amount;
      if (c.edition == 1) {
        this.userCardsDetail.firstEdition += c.amount;
      } else {
        this.userCardsDetail.unlEdition += c.amount;
      }

      if (c.rarity === 'Common') this.userCardsDetail.common += (c.amount);
      if (c.rarity === 'Uncommon') this.userCardsDetail.uncommon += (c.amount);
      if (c.rarity === 'Rare') this.userCardsDetail.rare += (c.amount);
      if (c.rarity === 'Legendary') this.userCardsDetail.legendary += (c.amount);
    }
  }

  applyFilter(event: any = null) {
    this.applyedFilter = true;
    const searchText = event ? event.target.value : null;
    this.currentCardPage = 1;
    this.filtedCards = this.cards.filter((card: any) => {
      if (
        (!this.isChecked || (this.isChecked && card.amount && card.amount > 0)) &&
        (this.filter.edition.value === 'All' || card.edition == this.filter.edition.value) &&
        (this.filter.set.value === 'All' || card.set === this.filter.set.value) &&
        (this.filter.faction.value === 'All' || card.faction === this.filter.faction.value) &&
        (this.filter.rarity.value === 'All' || card.rarity === this.filter.rarity.value) &&
        (this.filter.bracket.value === 'All' || this.filterBracket(card.bracket, this.filter.bracket.value)) &&
        (this.filter.artist.value === 'All' || card.artist === this.filter.artist.value) &&
        (!searchText || card.name.toLowerCase().includes(searchText.toLowerCase()))
      ) {
        return true;
      }
      return false;
    });
    this.showCards = this.filtedCards.slice(0, this.perPage);
    this.cardsPages = Math.ceil(this.filtedCards.length / this.perPage) || 1;
  }

  filterBracket(value: number, bracketName: string) {
    switch (bracketName) {
      case "Lower":
        return value >= 2 && value <= 4;
      case "Middle":
        return value >= 5 && value <= 8;
      case "Upper":
        return value >= 9 && value <= 10;
      default:
        return value === 1;
    }
  }
  clickOnMenu(
    itemIndex: number,
  ) {
    if (this.activeIndex === itemIndex) this.activeIndex = null;
    else this.activeIndex = itemIndex;
  }

  openPopup(card: any) {
    if (this.authService.isLoggedIn && this.walletConnected()) {
      this.modalService.openModal({ ...card, modalType: "Market", showDetails: true });
    }
  }

  closeModal() {
    this.modalService.close();
  }

  slideNext() {
    this.swiper?.swiperRef.slideNext(1000);
  }

  slidePrev() {
    this.swiper?.swiperRef.slidePrev(1000);
  }

  nextPage() {
    if (this.currentCardPage < this.cardsPages) {
      this.currentCardPage++;
      this.showCards = (this.applyedFilter ? this.filtedCards : this.cards).slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);
    }
  }

  prevPage() {
    if (this.currentCardPage > 1)
      this.currentCardPage--;
    this.showCards = (this.applyedFilter ? this.filtedCards : this.cards).slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);

  }
  firstPage() {
    this.currentCardPage = 1;
    this.showCards = (this.applyedFilter ? this.filtedCards : this.cards).slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);
  }

  lastPage() {
    this.currentCardPage = this.cardsPages;
    this.showCards = (this.applyedFilter ? this.filtedCards : this.cards).slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);
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
  ownedCardsOnly(event: any) {
    const target = event.target as HTMLInputElement;
    this.isChecked = target.checked;
    this.applyFilter();
  }
  selectSet(value: string, name: string): void {
    this.filter.set.value = value;
    this.filter.set.name = name;
    this.applyFilter();
    this.toggleMenu(1);
  }

  selectfaction(value: string, name: string): void {
    this.filter.faction.value = value;
    this.filter.faction.name = name;
    this.applyFilter();
    this.toggleMenu(2);
  }

  selectRarity(value: string, name: string): void {
    this.filter.rarity.value = value;
    this.filter.rarity.name = name;
    this.applyFilter();
    this.toggleMenu(3);
  }

  selectBracket(value: string, name: string): void {
    this.filter.bracket.value = value;
    this.filter.bracket.name = name;
    this.applyFilter();
    this.toggleMenu(4);
  }

  selectArtist(value: string, name: string): void {
    this.filter.artist.value = value;
    this.filter.artist.name = name;
    this.applyFilter();
    this.toggleMenu(5);
  }

  clearFilters() {
    Object.keys(this.filter).forEach((k: string) => {
      this.filter[k as keyof typeof this.filter] = { value: "All", name: "All" };
    });
    if (this.ownedCardsOnlyCheckbox) {
      this.ownedCardsOnlyCheckbox.nativeElement.checked = false;
      this.isChecked = false;
    }
    this.cardNameInput.nativeElement.value = '';
    this.applyFilter();
  }

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
