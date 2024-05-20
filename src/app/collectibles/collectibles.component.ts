import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { getAuth } from 'firebase/auth';
import { child, get, getDatabase, ref } from 'firebase/database';
import { addDoc, collection, getDocs, getFirestore, query, where, writeBatch } from 'firebase/firestore';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, take, tap } from 'rxjs/operators';
import SwiperCore, { Pagination, SwiperOptions } from 'swiper';
import { SwiperComponent } from 'swiper/angular';
import { ModalService } from '../modal/modal.service';
import { AuthService } from '../shared/services/auth.service';
import { WalletService } from '../wallet.service';
import { Subscription } from 'rxjs';
import { saveAs } from 'file-saver';

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
  @ViewChild('unownedCardsOnlyCheckbox') unownedCardsOnlyCheckbox!: ElementRef<HTMLInputElement>;
  @ViewChild('uniqueCardsOnlyCheckbox') uniqueCardsOnlyCheckbox!: ElementRef<HTMLInputElement>;
  @ViewChild('nonUniqueCardsOnlyCheckbox') nonUniqueCardsOnlyCheckbox!: ElementRef<HTMLInputElement>;
  sticky: boolean = false;
  isCalculatingCards: boolean = false;
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
    sort: {
      name: "Alphabetical: A to Z",
      value: "1"
    },
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
  //isOwnedChecked = false;
  isUniqueChecked = false;
  isNonUniqueChecked = false;
  isUnownedChecked = false;
  cardsPages = 7;
  perPage = 24;
  currentCardPage = 1;
  walletID: string | null = null;
  tokenIds: any = [];
  cards: any = [];
  filteredCards: any = [];
  showCards: any = [];
  appliedFilter: boolean = false;
  selectedCard: any = null;

  readonly SUPPLY_ADDRESS = "3n7SxSJCvFGp9xfumeQY8925QQpZifkpwAgnxoF3Hc3NWi9oraoXwNV1xcZpVP8A9LcXLef1krdvjoEKtiEUHDQy6AQ4suJsQyJ8EY2L36hErdvuindtN2dxTU8rLWTwMY18PH6g6XXyvrVQ25w57YSiDR1xF8ZN2sdqgQ9V9";
  supplyIds: any = [];

  allowDcLoad = false;


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

      this.allowDcLoad = false;

      this.walletService.walletUpdated$.subscribe(walletID => {
        this.walletID = walletID; // Update local walletID state
        this.resetTokenState(); // Reset token state
        this.clearFiltersWallet();
        if (walletID) {
          console.log(this.allowDcLoad);
          this.loadErgoTokens().pipe(
            switchMap(() => this.loadStakedTokens()),
            switchMap(() => this.queryCards())
          ).subscribe(
            () => console.log('Wallet Service loaded.'),
            error => console.error('Failed to load tokens and cards:', error)
          );
        }
        else if (this.allowDcLoad == true) {
          console.log('Walled DC loaded.');
          console.log(this.allowDcLoad);
          this.queryCards().subscribe({
            next: (cards) => {},
            error: (error) => {},
            complete: () => {}
          });
        }
    });

this.afAuth.authState.pipe(
  take(1),
  switchMap(() => this.getWalletAddress()),
  switchMap(() => this.loadErgoTokens()),
  switchMap(() => this.loadStakedTokens()),
  tap(() => console.log('Auth state loaded')), // Log the loaded Ergo tokens
  switchMap(() => this.queryCards())
).subscribe({
  next: (cards) => {},
  error: (error) => {}
});

this.loadSupplyTokens().pipe(
  switchMap(() => this.querySupplyCards()), // Load supply tokens and then query supply cards
  catchError(error => {
    console.error('Failed to load supply tokens:', error);
    return throwError(() => new Error('Failed to load supply tokens'));
  })
).subscribe(
  () => console.log('Supply tokens loaded successfully.'),
  error => console.error(error)
);

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
    console.log('This walletID:' + this.walletID)
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
              console.log("Ergo tokens loaded successfully");
              for (const token of dataObjects.tokens) {
                const tokenDecimals = Math.pow(10, token.decimals);
                  if (token.tokenId === "18c938e1924fc3eadc266e75ec02d81fe73b56e4e9f4e268dffffcb30387c42d") {
                    continue;} // for Staked Tokens, skip them here
                  if (token.tokenId === "6ad70cdbf928a2bdd397041a36a5c2490a35beb4d20eabb5666f004b103c7189" && (token.amount / tokenDecimals) > 1) {
                    this.tokenIds.push({ tokenId: token.tokenId, amount: 1 });
                    console.log(token.tokenId)
                    continue;} // only include hosky if amount is greater than 1
                this.tokenIds.push({ tokenId: token.tokenId, amount: token.amount / tokenDecimals });
              }
            }
          })
        );
    } else {
      console.log('No wallet ID');
      return this.httpClient.get('https://ergo-explorer.anetabtc.io/api/v1/addresses/' + "9gZzo1X96Nv7ggNkTX5giCXrcQZ6YZwJzGHzfBrzn9Wi5Zz2K5G" + '/balance/confirmed')
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
    }
  }


  loadStakedTokens(): Observable<void> {
    if (this.walletID) {
      //for Auction House staked tokens
      return this.httpClient.get('https://ergoauctions.org/api/stake/stakeByAddress?address=' + this.walletID)
        .pipe(
          catchError(error => {
            console.log('Error loading Staked tokens:', error);
            return of(); // Return an empty observable
          }),
          tap((response: any) => {
            if (response) {
              console.log(response);
              const dataObjects: any = response;
              for (const token of dataObjects.tokens) {
                const tokenDecimals = Math.pow(10, token.decimals);
                if (token.amount / tokenDecimals  >= 15000){
                  //only include auction house if amount is greater than 15000
                  this.tokenIds.push({tokenId: token.tokenId, amount: 1});// / tokenDecimals});
                }
                console.log (token.tokenId, token.amount / tokenDecimals)
              }
            }
          })
        );
    } else {
      console.log('No wallet ID');
      return this.httpClient.get('https://ergo-explorer.anetabtc.io/api/v1/addresses/' + "9gZzo1X96Nv7ggNkTX5giCXrcQZ6YZwJzGHzfBrzn9Wi5Zz2K5G" + '/balance/confirmed')
      .pipe(
        catchError(error => {
          console.log('Error loading Ergo tokens:', error);
          return of(); // Return an empty observable
        }),
        tap((response: any) => {
          if (response) {
            const dataObjects: any = response;
            for (const token of dataObjects.tokens) {
              //const tokenDecimals = Math.pow(10, token.decimals);
              this.tokenIds.push({ tokenId: token.tokenId, amount: token.amount});// / tokenDecimals });
            }
          }
        })
      );
    }
  }


  loadSupplyTokens(): Observable<void> {
    return this.httpClient.get(`https://ergo-explorer.anetabtc.io/api/v1/addresses/${this.SUPPLY_ADDRESS}/balance/confirmed`)
      .pipe(
        catchError(error => {
          console.error('Error loading supply tokens:', error);
          return of(); // Return an empty observable in case of error
        }),
        tap((response: any) => {
          if (response) {
            const dataObjects: any = response;
            for (const token of dataObjects.tokens) {
              const tokenDecimals = Math.pow(10, token.decimals);
              const normalizedAmount = token.amount / tokenDecimals;
              const remainingSupply = 100000 - normalizedAmount;
              this.supplyIds.push({ tokenId: token.tokenId, amount:  remainingSupply});
            }
          }
          else {
            // Log to console if the response is invalid or empty
            console.log('No data returned for supply tokens. Check the API or the address.');
          }
        })
      );
  }


  queryCards(): Observable<any[]> {
    const db = getFirestore();
    const cardsCollection = collection(db, 'cards');

    return new Observable<any[]>((observer) => {
      getDocs(cardsCollection)
        .then((querySnapshot) => {
            const allCards = querySnapshot.docs.map((doc) => {
            const card: any = doc.data();
            const getAmount = this.tokenIds.find((token: any) => token.tokenId === card.tokenId);
            const supplyToken = this.supplyIds.find((token: any) => token.tokenId === card.tokenId);

            if (getAmount) {
                 //hosky and auction house - amounts will be = 1 if they passed their amount checks previously
                  if ((getAmount.tokenId === "6ad70cdbf928a2bdd397041a36a5c2490a35beb4d20eabb5666f004b103c7189" && getAmount.amount == 1) ||
                  (getAmount.tokenId === "18c938e1924fc3eadc266e75ec02d81fe73b56e4e9f4e268dffffcb30387c42d" && getAmount.amount == 1)){
                  console.log(getAmount.tokenId, getAmount.amount);
                  return { ...card, amount: 1, totalSupply: supplyToken ? supplyToken.amount : 'N/A' };
                }
                //for regular cards that a user owns that are not partner cards
                else {
                  return { ...card, amount: getAmount.amount, totalSupply: supplyToken ? supplyToken.amount : 'N/A' };
                }
              //for anything where we don't have an amount
            } else {
              return { ...card, amount: 0, totalSupply: supplyToken ? supplyToken.amount : 'N/A' };
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
          if (!this.isCalculatingCards) {
            this.isCalculatingCards = true;
            this.calcUserCards(allCards.filter((c: any) => c.amount));
            this.isCalculatingCards = false;
          }
          observer.next(sortedCards);
          observer.complete();
          this.allowDcLoad = true;
        })
        .catch((error) => {
          observer.error(error);
          this.allowDcLoad = true;
        });
    });
  }

  querySupplyCards(): Observable<any[]> {
    const db = getFirestore();
    const cardsCollection = collection(db, 'cards');

    return new Observable<any[]>((observer) => {
      getDocs(cardsCollection).then((querySnapshot) => {
        const supplyCards = querySnapshot.docs.map((doc) => {
          const card: any = doc.data();
          const supplyToken = this.supplyIds.find((token: any) => token.tokenId === card.tokenId);
          const cardDetail = {
            ...card,
            totalSupply: supplyToken ? supplyToken.amount : 'Not available' // Total supply from the supply address
          };

          // Debug log for each card
       // console.log(`Card Name: ${card.name}, Total Supply: ${cardDetail.totalSupply}, Rarity: ${cardDetail.rarity}, Bracket: ${cardDetail.bracket}`);

          return cardDetail;
        });

        this.cards = supplyCards; // You might want to handle this differently if this.cards should not be overwritten
        observer.next(supplyCards);
        observer.complete();
      }).catch((error) => {
        observer.error(error);
      });
    });
  }


  calcUserCards(cards: any) {
    this.userCardsDetail.cardsCollected = 0;
    this.userCardsDetail.total = 0;
    this.userCardsDetail.firstEdition = 0;
    this.userCardsDetail.unlEdition = 0;
    this.userCardsDetail.common = 0;
    this.userCardsDetail.uncommon = 0;
    this.userCardsDetail.rare = 0;
    this.userCardsDetail.legendary = 0;

    for (let index = 0; index < cards.length; index++) {
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
    console.log("Calculating Total Cards Triggered");
  }

  applyFilter(event: any = null) {
    this.appliedFilter = true;
    const searchText = event ? event.target.value : null;
    this.currentCardPage = 1;

    // When neither is checked, we want to show all cards.
    const showAll = !this.isUniqueChecked && !this.isNonUniqueChecked && !this.isUnownedChecked;// && !this.isOwnedChecked;

    this.filteredCards = this.cards.filter((card: any) => {
      // If showing all, skip checking isUnique, isNonUnique, and isUnknown conditions.
      if (showAll) {
        return this.filterCard(card, searchText);
      }

      // Check the unique, non-unique, and unknown conditions only if showAll is false.
      const isUnique = this.isUniqueChecked && card.amount === 1;
      const isNonUnique = this.isNonUniqueChecked && card.amount > 1;
      const isUnowned = this.isUnownedChecked && card.amount === 0;

      return this.filterCard(card, searchText) && (isUnique || isNonUnique || isUnowned)// || isOwned);
    });

    this.showCards = this.filteredCards.slice(0, this.perPage);
    this.cardsPages = Math.ceil(this.filteredCards.length / this.perPage) || 1;
  }


  filterCard(card: any, searchText: string) {
    return (
      (this.filter.edition.value === 'All' || card.edition == this.filter.edition.value) &&
      (this.filter.set.value === 'All' || card.set === this.filter.set.value) &&
      (this.filter.faction.value === 'All' || card.faction === this.filter.faction.value) &&
      (this.filter.rarity.value === 'All' || card.rarity === this.filter.rarity.value) &&
      (this.filter.bracket.value === 'All' || this.filterBracket(card.bracket, this.filter.bracket.value)) &&
      (this.filter.artist.value === 'All' || card.artist === this.filter.artist.value) &&
      (!searchText || card.name.toLowerCase().includes(searchText.toLowerCase()))
    );
  }

  selectSort(value: string, name: string): void {
    this.filter.sort.value = value;
    this.filter.sort.name = name;
    this.sortCardsByTab();
    this.applyFilter();
    this.toggleMenu(6);
  }

  sortCardsByTab(): void {
    this.cards.sort((a: any, b: any) => {
      // First sort by ownership (assuming owned cards have amount > 0)
      if ((a.amount > 0 && b.amount === 0) || (a.amount === 0 && b.amount > 0)) {
          return b.amount - a.amount; // Owned cards come before unowned
      }

      // Proceed with other sorting conditions based on the updated options
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      switch (this.filter.sort.value) {
          case '1':
              return nameA.localeCompare(nameB); // Alphabetical A to Z
          case '2':
              return nameB.localeCompare(nameA); // Alphabetical Z to A
          case '3':
              return b.amount - a.amount; // Count: Most to Least
          case '4':
              return a.amount - b.amount; // Count: Least to Most
          default:
              return 0;
      }
    });
  }



  exportCurrentView(): void {
    let dataToExport = [];

    const rarityOrder: { [key: string]: number } = {
      'Common': 1,
      'Uncommon': 2,
      'Rare': 3,
      'Legendary': 4
    };

    const bracketToLetter = (bracket: number): string => {
      switch (bracket) {
          case 1:
              return "S";
          case 3:
              return "L";
          case 6:
              return "M";
          case 10:
              return "U";
          default:
              return "";
      }
  };

    if (this.appliedFilter && this.filteredCards.length) {
      dataToExport = this.filteredCards;
    } else {
      dataToExport = this.cards;
    }

    // Function to format cards into a string
    const formatCards = (cards: any[]) =>
      cards.map(card => `:${card.rarity}:(${bracketToLetter(card.bracket)}): ${card.name} - ${card.amount}`).join('\n');
    // Split the cards into owned and unowned arrays
    const ownedCards = dataToExport.filter((card: { amount: number; }) => card.amount > 0);
    const unownedCards = dataToExport.filter((card: { amount: number; }) => card.amount === 0);

    // Sort each array by rarity order
    ownedCards.sort((a: { rarity: string | number; }, b: { rarity: string | number; }) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    unownedCards.sort((a: { rarity: string | number; }, b: { rarity: string | number; }) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

    // Sections with headers
    const ownedSection = ownedCards.length > 0 ? `Have these:\n${formatCards(ownedCards)}\n` : '';
    const unownedSection = unownedCards.length > 0 ? `\nMissing these:\n${formatCards(unownedCards)}` : '';

    // Rarity summary from userCardsDetail
    const raritySummary = `Total Cards: ${this.userCardsDetail.total}
    :Common: Total ${this.userCardsDetail.common}
    :Uncommon: Total ${this.userCardsDetail.uncommon}
    :Rare: Total ${this.userCardsDetail.rare}
    :Legendary: Total ${this.userCardsDetail.legendary}\n`;


    // Combine the sections
    const data = `${raritySummary}\n${ownedSection}${unownedSection}`;

    const blob = new Blob([data.trim()], { type: 'text/plain;charset=utf-8' }); // Trim to remove any leading/trailing newlines
    saveAs(blob, 'exported-cards-view.txt');
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
    const cardsToSend = this.showCards.length > 0 ? this.showCards : this.cards;

    this.modalService.openModal({
      card: card,
      cards: cardsToSend,
      modalType: "Collectibles",
      showDetails: true
    });
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
      this.showCards = (this.appliedFilter ? this.filteredCards : this.cards).slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);
    }
  }

  prevPage() {
    if (this.currentCardPage > 1)
      this.currentCardPage--;
    this.showCards = (this.appliedFilter ? this.filteredCards : this.cards).slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);

  }
  firstPage() {
    this.currentCardPage = 1;
    this.showCards = (this.appliedFilter ? this.filteredCards : this.cards).slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);
  }

  lastPage() {
    this.currentCardPage = this.cardsPages;
    this.showCards = (this.appliedFilter ? this.filteredCards : this.cards).slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);
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

  unownedCardsOnly(event: any) {
    const target = event.target as HTMLInputElement;
    this.isUnownedChecked = target.checked;
    this.applyFilter();
  }
  uniqueCardsOnly(event: any) {
    const target = event.target as HTMLInputElement;
    this.isUniqueChecked = target.checked;
    this.applyFilter();
  }
  nonUniqueCardsOnly(event: any) {
    const target = event.target as HTMLInputElement;
    this.isNonUniqueChecked = target.checked;
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
  // Reset all filter object values to their defaults
  this.filter = {
    sort: {
      name: "Alphabetical: A to Z",
      value: "1"
    },
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
  };

    this.isUnownedChecked = false;
    this.isUniqueChecked = false;
    this.isNonUniqueChecked = false;

    if (this.unownedCardsOnlyCheckbox) {
      this.unownedCardsOnlyCheckbox.nativeElement.checked = false;
  }
    if (this.uniqueCardsOnlyCheckbox) {
        this.uniqueCardsOnlyCheckbox.nativeElement.checked = false;
    }
    if (this.nonUniqueCardsOnlyCheckbox) {
        this.nonUniqueCardsOnlyCheckbox.nativeElement.checked = false;
    }

    // Clear search input
    if (this.cardNameInput) {
        this.cardNameInput.nativeElement.value = '';
    }

    // Reapply filters to update the display
    this.sortCardsByTab();
    this.applyFilter();
}

clearFiltersWallet(){
    // Reset all filter object values to their defaults
    this.filter = {
      sort: {
        name: "Alphabetical: A to Z",
        value: "1"
      },
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
    };

      this.isUnownedChecked = false;
      this.isUniqueChecked = false;
      this.isNonUniqueChecked = false;

      if (this.unownedCardsOnlyCheckbox) {
        this.unownedCardsOnlyCheckbox.nativeElement.checked = false;
    }
      if (this.uniqueCardsOnlyCheckbox) {
          this.uniqueCardsOnlyCheckbox.nativeElement.checked = false;
      }
      if (this.nonUniqueCardsOnlyCheckbox) {
          this.nonUniqueCardsOnlyCheckbox.nativeElement.checked = false;
      }

      // Clear search input
      if (this.cardNameInput) {
          this.cardNameInput.nativeElement.value = '';
      }

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
