import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { child, get, getDatabase, ref } from 'firebase/database';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { forkJoin, from, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map, switchMap, take, tap, timeout } from 'rxjs/operators';
import SwiperCore, { Pagination, SwiperOptions } from 'swiper';
import { SwiperComponent } from 'swiper/angular';
import { ModalService } from '../modal/modal.service';
import { AuthService } from '../shared/services/auth.service';
import { WalletService } from '../wallet.service';
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
  };

  filter = {
    sort: {
      name: 'Alphabetical: A to Z',
      value: '1'
    },
    edition: {
      name: 'All',
      value: 'All'
    },
    set: {
      name: 'All',
      value: 'All'
    },
    faction: {
      name: 'All',
      value: 'All'
    },
    rarity: {
      name: 'All',
      value: 'All'
    },
    bracket: {
      name: 'All',
      value: 'All'
    },
    artist: {
      name: 'All',
      value: 'All'
    }
  };

  isUniqueChecked = false;
  isNonUniqueChecked = false;
  isUnownedChecked = false;

  cardsPages = 7;
  perPage = 24;
  currentCardPage = 1;

  walletID: string | null = null;
  tokenIds: any[] = [];
  cards: any[] = [];
  filteredCards: any[] = [];
  showCards: any[] = [];
  appliedFilter: boolean = false;
  selectedCard: any = null;

  readonly SUPPLY_ADDRESS = '3n7SxSJCvFGp9xfumeQY8925QQpZifkpwAgnxoF3Hc3NWi9oraoXwNV1xcZpVP8A9LcXLef1krdvjoEKtiEUHDQy6AQ4suJsQyJ8EY2L36hErdvuindtN2dxTU8rLWTwMY18PH6g6XXyvrVQ25w57YSiDR1xF8ZN2sdqgQ9V9';
  supplyIds: any[] = [];

  allowDcLoad = false;

  config: SwiperOptions = {
    spaceBetween: 6,
    navigation: false,
    scrollbar: { draggable: true },
    breakpoints: {
      500: {
        slidesPerView: 1
      },
      768: {
        slidesPerView: 2
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
  private collectionLoadSub?: Subscription;
  private stakedLoadSub?: Subscription;
  private initialPageLoadComplete = false;

  constructor(
    private walletService: WalletService,
    private modalService: ModalService,
    public adb: AngularFireDatabase,
    private httpClient: HttpClient,
    public afAuth: AngularFireAuth,
    public authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit(): void {
    this.allowDcLoad = false;

    this.loadCollectionForCurrentUser();

    const walletSub = this.walletService.walletUpdated$.subscribe(walletID => {
      console.log('Wallet service update:', walletID);

      if (!this.initialPageLoadComplete && !walletID) {
        console.log('Ignoring initial empty wallet update during page-load wallet resolution.');
        return;
      }

      this.clearFiltersWallet();
      this.loadCollectionForCurrentUser(walletID);
    });

    this.subscriptions.push(walletSub);
  }

  ngOnDestroy(): void {
    this.collectionLoadSub?.unsubscribe();
    this.stakedLoadSub?.unsubscribe();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private loadCollectionForCurrentUser(walletOverride?: string | null): void {
    this.collectionLoadSub?.unsubscribe();
    this.stakedLoadSub?.unsubscribe();

    this.resetTokenState();

    const walletLoad$ = walletOverride !== undefined
      ? this.resolveWalletOverride(walletOverride)
      : this.resolveWalletForPageLoad();

    this.collectionLoadSub = walletLoad$.pipe(
      tap(() => console.log('Starting card load for wallet:', this.walletID)),

      switchMap(() => forkJoin([
        this.loadSupplyTokens(),
        this.loadErgoTokens()
      ])),

      tap(() => {
        console.log('Supply tokens loaded:', this.supplyIds.length);
        console.log('User token IDs before queryCards:', this.tokenIds);
      }),

      switchMap(() => this.queryCards()),
      tap(cards => console.log('After queryCards:', cards.length, 'cards,', this.showCards.length, 'shown')),

      finalize(() => {
        this.initialPageLoadComplete = true;
        console.log('Main card load finished or cancelled.');
      })
    ).subscribe({
      next: () => {
        console.log('Collection loaded successfully.');
        this.loadStakedTokensInBackground();
      },
      error: error => {
        this.initialPageLoadComplete = true;
        console.error('Collection load failed:', error);
      }
    });
  }

  private resolveWalletOverride(walletOverride: string | null): Observable<void> {
    return this.afAuth.authState.pipe(
      take(1),
      tap(user => {
        if (!user) {
          this.walletID = null;
          this.clearSavedWalletState();

          console.log('Ignoring wallet override because no user is signed in.');
          return;
        }

        if (walletOverride) {
          this.walletID = walletOverride;
          this.saveWalletState(walletOverride);

          console.log('Using wallet override:', this.walletID);
        } else {
          this.walletID = null;
          this.clearSavedWalletState();

          console.log('Wallet override was empty. Loading all cards as unowned.');
        }
      }),
      map(() => void 0)
    );
  }

  private resolveWalletForPageLoad(): Observable<void> {
    return this.afAuth.authState.pipe(
      take(1),

      switchMap(user => {
        if (!user) {
          this.walletID = null;
          this.clearSavedWalletState();

          console.log('No signed-in user on page load. Loading all cards as unowned.');

          return of(void 0);
        }

        return this.getWalletAddress(user).pipe(
          switchMap(() => {
            if (this.walletID) {
              this.saveWalletState(this.walletID);
              console.log('Wallet resolved from Firebase:', this.walletID);
              return of(void 0);
            }

            return from(this.getWalletFromBrowserOrNautilus()).pipe(
              tap(walletAddress => {
                if (walletAddress) {
                  this.walletID = walletAddress;
                  this.saveWalletState(walletAddress);

                  console.log('Wallet resolved from browser/Nautilus:', this.walletID);
                } else {
                  this.walletID = null;
                  this.clearSavedWalletState();

                  console.log('No connected wallet found on page load.');
                }
              }),
              map(() => void 0)
            );
          })
        );
      })
    );
  }

  private saveWalletState(walletAddress: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem('walletAddress', walletAddress);
    localStorage.setItem('userIsConnected', 'true');
  }

  private clearSavedWalletState(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletID');
    localStorage.removeItem('wallet');
    localStorage.setItem('userIsConnected', 'false');
  }

  private async getWalletFromBrowserOrNautilus(): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const savedWallet =
      localStorage.getItem('walletAddress') ||
      localStorage.getItem('walletID') ||
      localStorage.getItem('wallet');

    const userIsConnected = localStorage.getItem('userIsConnected');

    if (
      savedWallet &&
      savedWallet !== 'none' &&
      savedWallet !== 'null' &&
      savedWallet !== 'undefined' &&
      userIsConnected !== 'false'
    ) {
      console.log('Using saved wallet from localStorage:', savedWallet);
      return savedWallet;
    }

    return await this.getConnectedNautilusAddress();
  }

  private async getConnectedNautilusAddress(): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const nautilus = await this.waitForNautilus(3000);

    if (!nautilus) {
      console.log('Nautilus connector not found on page load.');
      return null;
    }

    try {
      const isConnected =
        typeof nautilus.isConnected === 'function'
          ? await nautilus.isConnected()
          : false;

      if (!isConnected) {
        console.log('Nautilus is installed but not connected.');
        return null;
      }

      if (!(window as any).ergo && typeof nautilus.connect === 'function') {
        await nautilus.connect();
      }

      const ergo = (window as any).ergo;

      if (ergo?.get_change_address) {
        return await ergo.get_change_address();
      }

      if (ergo?.get_unused_addresses) {
        const addresses = await ergo.get_unused_addresses();
        return addresses?.[0] || null;
      }

      console.log('Nautilus is connected, but no address method was available.');
      return null;
    } catch (error) {
      console.warn('Could not read connected Nautilus address:', error);
      return null;
    }
  }

  private waitForNautilus(timeoutMs = 3000): Promise<any | null> {
    return new Promise(resolve => {
      const started = Date.now();

      const check = () => {
        const nautilus = (window as any).ergoConnector?.nautilus;

        if (nautilus) {
          resolve(nautilus);
          return;
        }

        if (Date.now() - started >= timeoutMs) {
          resolve(null);
          return;
        }

        setTimeout(check, 100);
      };

      check();
    });
  }

  private loadStakedTokensInBackground(): void {
    if (!this.walletID) {
      console.log('No wallet ID. Skipping background staked token load.');
      return;
    }

    const tokenCountBeforeStakedLoad = this.tokenIds.length;

    this.stakedLoadSub = this.loadStakedTokens().subscribe({
      next: () => {
        console.log('After background loadStakedTokens:', this.tokenIds);

        if (this.tokenIds.length !== tokenCountBeforeStakedLoad) {
          console.log('Staked tokens changed ownership list. Refreshing cards.');

          this.queryCards().subscribe({
            next: cards => console.log('Cards refreshed after staked token load:', cards.length, 'cards,', this.showCards.length, 'shown'),
            error: error => console.error('Failed to refresh cards after staked token load:', error)
          });
        } else {
          console.log('No staked token changes found. No card refresh needed.');
        }
      },
      error: error => console.error('Background staked token load failed:', error)
    });
  }

  resetTokenState(): void {
    this.tokenIds = [];
    this.supplyIds = [];
    this.cards = [];
    this.filteredCards = [];
    this.showCards = [];
    this.appliedFilter = false;
    this.currentCardPage = 1;
    this.cardsPages = 1;

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

  getWalletAddress(user: any): Observable<void> {
    return new Observable<void>((observer) => {
      try {
        const database = getDatabase();
        const dbRef = ref(database);

        if (user) {
          get(child(dbRef, `users/${user.uid}/wallet`))
            .then(snapshot => {
              if (snapshot.exists()) {
                if (snapshot.val() === 'none') {
                  this.walletID = null;
                  this.clearSavedWalletState();
                } else {
                  const walletAddress = snapshot.val();

                  if (walletAddress) {
                    this.walletID = walletAddress;
                    this.saveWalletState(walletAddress);
                  } else {
                    this.walletID = null;
                    this.clearSavedWalletState();
                  }
                }
              } else {
                this.walletID = null;
                this.clearSavedWalletState();
              }

              console.log('Wallet ID:', this.walletID);

              observer.next();
              observer.complete();
            })
            .catch(error => {
              observer.error(error);
            });
        } else {
          this.walletID = null;
          this.clearSavedWalletState();

          observer.next();
          observer.complete();
        }
      } catch (error) {
        observer.error(error);
      }
    });
  }

  loadErgoTokens(): Observable<void> {
    if (!this.walletID) {
      console.log('No wallet ID. Skipping Ergo token load.');
      return of(void 0);
    }

    console.log('Loading Ergo tokens for walletID:', this.walletID);

    return this.httpClient
      .get(`https://api.ergoplatform.com/api/v1/addresses/${this.walletID}/balance/confirmed`)
      .pipe(
        timeout(8000),

        catchError(error => {
          console.error('Error or timeout loading Ergo tokens:', error);
          return of(null);
        }),

        tap((response: any) => {
          const tokens = Array.isArray(response?.tokens) ? response.tokens : [];

          console.log('Ergo tokens loaded successfully');
          console.log('Ergo token count:', tokens.length);

          for (const token of tokens) {
            const tokenDecimals = Math.pow(10, token.decimals || 0);
            const normalizedAmount = token.amount / tokenDecimals;

            if (token.tokenId === '18c938e1924fc3eadc266e75ec02d81fe73b56e4e9f4e268dffffcb30387c42d') {
              continue;
            }

            if (
              token.tokenId === '6ad70cdbf928a2bdd397041a36a5c2490a35beb4d20eabb5666f004b103c7189' &&
              normalizedAmount > 1
            ) {
              this.tokenIds.push({
                tokenId: token.tokenId,
                amount: 1
              });

              console.log('Added Hosky partner token:', token.tokenId);
              continue;
            }

            this.tokenIds.push({
              tokenId: token.tokenId,
              amount: normalizedAmount
            });
          }
        }),

        map(() => void 0)
      );
  }

  loadStakedTokens(): Observable<void> {
    if (!this.walletID) {
      console.log('No wallet ID. Skipping staked token load.');
      return of(void 0);
    }

    console.log('Loading staked tokens for walletID:', this.walletID);

    return this.httpClient
      .get(`https://ergoauctions.org/api/stake/stakeByAddress?address=${this.walletID}`)
      .pipe(
        timeout(2000),

        catchError(error => {
          console.warn('Skipping staked tokens because they were slow or failed:', error);
          return of(null);
        }),

        tap((response: any) => {
          const tokens = Array.isArray(response?.tokens) ? response.tokens : [];

          console.log('Staked token count:', tokens.length);

          for (const token of tokens) {
            const tokenDecimals = Math.pow(10, token.decimals || 0);
            const normalizedAmount = token.amount / tokenDecimals;

            if (normalizedAmount >= 15000) {
              this.tokenIds.push({
                tokenId: token.tokenId,
                amount: 1
              });
            }

            console.log(token.tokenId, normalizedAmount);
          }
        }),

        map(() => void 0)
      );
  }

  loadSupplyTokens(): Observable<void> {
    return this.httpClient
      .get(`https://api.ergoplatform.com/api/v1/addresses/${this.SUPPLY_ADDRESS}/balance/confirmed`)
      .pipe(
        timeout(8000),

        catchError(error => {
          console.error('Error or timeout loading supply tokens:', error);
          return of(null);
        }),

        tap((response: any) => {
          const tokens = Array.isArray(response?.tokens) ? response.tokens : [];

          if (!tokens.length) {
            console.log('No supply token data returned. Check the API or supply address.');
          }

          for (const token of tokens) {
            const tokenDecimals = Math.pow(10, token.decimals || 0);
            const normalizedAmount = token.amount / tokenDecimals;
            const remainingSupply = 100000 - normalizedAmount;

            this.supplyIds.push({
              tokenId: token.tokenId,
              amount: remainingSupply
            });
          }
        }),

        map(() => void 0)
      );
  }

  queryCards(): Observable<any[]> {
    const db = getFirestore();
    const cardsCollection = collection(db, 'cards');

    return new Observable<any[]>((observer) => {
      getDocs(cardsCollection)
        .then(querySnapshot => {
          const allCards = querySnapshot.docs.map(doc => {
            const card: any = doc.data();
            const getAmount = this.tokenIds.find((token: any) => token.tokenId === card.tokenId);
            const supplyToken = this.supplyIds.find((token: any) => token.tokenId === card.tokenId);

            if (getAmount) {
              if (
                (
                  getAmount.tokenId === '6ad70cdbf928a2bdd397041a36a5c2490a35beb4d20eabb5666f004b103c7189' &&
                  getAmount.amount === 1
                ) ||
                (
                  getAmount.tokenId === '18c938e1924fc3eadc266e75ec02d81fe73b56e4e9f4e268dffffcb30387c42d' &&
                  getAmount.amount === 1
                )
              ) {
                console.log(getAmount.tokenId, getAmount.amount);

                return {
                  ...card,
                  amount: 1,
                  totalSupply: supplyToken ? supplyToken.amount : 'N/A'
                };
              }

              return {
                ...card,
                amount: getAmount.amount,
                totalSupply: supplyToken ? supplyToken.amount : 'N/A'
              };
            }

            return {
              ...card,
              amount: 0,
              totalSupply: supplyToken ? supplyToken.amount : 'N/A'
            };
          });

          const sortedCards = allCards.sort((a: any, b: any) => {
            const aOwned = this.tokenIds.some((token: any) => token.tokenId === a.tokenId);
            const bOwned = this.tokenIds.some((token: any) => token.tokenId === b.tokenId);

            if (aOwned && !bOwned) return -1;
            if (!aOwned && bOwned) return 1;

            return a.name.localeCompare(b.name);
          });

          this.cards = sortedCards;
          this.filteredCards = sortedCards;
          this.showCards = sortedCards.slice(0, this.perPage);
          this.cardsPages = Math.ceil(sortedCards.length / this.perPage) || 1;
          this.appliedFilter = false;

          if (!this.isCalculatingCards) {
            this.isCalculatingCards = true;
            this.calcUserCards(allCards.filter((c: any) => c.amount));
            this.isCalculatingCards = false;
          }

          this.allowDcLoad = true;

          observer.next(sortedCards);
          observer.complete();
        })
        .catch(error => {
          this.allowDcLoad = true;
          observer.error(error);
        });
    });
  }

  querySupplyCards(): Observable<any[]> {
    const db = getFirestore();
    const cardsCollection = collection(db, 'cards');

    return new Observable<any[]>((observer) => {
      getDocs(cardsCollection)
        .then(querySnapshot => {
          const supplyCards = querySnapshot.docs.map(doc => {
            const card: any = doc.data();
            const supplyToken = this.supplyIds.find((token: any) => token.tokenId === card.tokenId);

            return {
              ...card,
              amount: 0,
              totalSupply: supplyToken ? supplyToken.amount : 'Not available'
            };
          });

          this.cards = supplyCards;
          this.filteredCards = supplyCards;
          this.showCards = supplyCards.slice(0, this.perPage);
          this.cardsPages = Math.ceil(supplyCards.length / this.perPage) || 1;
          this.appliedFilter = false;

          observer.next(supplyCards);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  calcUserCards(cards: any): void {
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

      if (c.rarity === 'Common') this.userCardsDetail.common += c.amount;
      if (c.rarity === 'Uncommon') this.userCardsDetail.uncommon += c.amount;
      if (c.rarity === 'Rare') this.userCardsDetail.rare += c.amount;
      if (c.rarity === 'Legendary') this.userCardsDetail.legendary += c.amount;
    }

    console.log('Calculating Total Cards Triggered');
  }

  applyFilter(event: any = null): void {
    this.appliedFilter = true;

    const searchText = event ? event.target.value : null;
    this.currentCardPage = 1;

    const showAll = !this.isUniqueChecked && !this.isNonUniqueChecked && !this.isUnownedChecked;

    this.filteredCards = this.cards.filter((card: any) => {
      if (showAll) {
        return this.filterCard(card, searchText);
      }

      const isUnique = this.isUniqueChecked && card.amount === 1;
      const isNonUnique = this.isNonUniqueChecked && card.amount > 1;
      const isUnowned = this.isUnownedChecked && card.amount === 0;

      return this.filterCard(card, searchText) && (isUnique || isNonUnique || isUnowned);
    });

    this.showCards = this.filteredCards.slice(0, this.perPage);
    this.cardsPages = Math.ceil(this.filteredCards.length / this.perPage) || 1;
  }

  filterCard(card: any, searchText: string): boolean {
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
      if ((a.amount > 0 && b.amount === 0) || (a.amount === 0 && b.amount > 0)) {
        return b.amount - a.amount;
      }

      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      switch (this.filter.sort.value) {
        case '1':
          return nameA.localeCompare(nameB);
        case '2':
          return nameB.localeCompare(nameA);
        case '3':
          return b.amount - a.amount;
        case '4':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
  }

  exportCurrentView(): void {
    let dataToExport: any[] = [];

    const rarityOrder: { [key: string]: number } = {
      Common: 1,
      Uncommon: 2,
      Rare: 3,
      Legendary: 4
    };

    const bracketToLetter = (bracket: number): string => {
      switch (bracket) {
        case 1:
          return 'S';
        case 3:
          return 'L';
        case 6:
          return 'M';
        case 10:
          return 'U';
        default:
          return '';
      }
    };

    if (this.appliedFilter && this.filteredCards.length) {
      dataToExport = this.filteredCards;
    } else {
      dataToExport = this.cards;
    }

    const formatCards = (cards: any[]) =>
      cards.map(card => `:${card.rarity}:(${bracketToLetter(card.bracket)}): ${card.name} - ${card.amount}`).join('\n');

    const ownedCards = dataToExport.filter((card: { amount: number }) => card.amount > 0);
    const unownedCards = dataToExport.filter((card: { amount: number }) => card.amount === 0);

    ownedCards.sort((a: any, b: any) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    unownedCards.sort((a: any, b: any) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

    const ownedSection = ownedCards.length > 0 ? `Have these:\n${formatCards(ownedCards)}\n` : '';
    const unownedSection = unownedCards.length > 0 ? `\nMissing these:\n${formatCards(unownedCards)}` : '';

    const raritySummary = `Total Cards: ${this.userCardsDetail.total}
    :Common: Total ${this.userCardsDetail.common}
    :Uncommon: Total ${this.userCardsDetail.uncommon}
    :Rare: Total ${this.userCardsDetail.rare}
    :Legendary: Total ${this.userCardsDetail.legendary}\n`;

    const data = `${raritySummary}\n${ownedSection}${unownedSection}`;

    const blob = new Blob([data.trim()], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'exported-cards-view.txt');
  }

  filterBracket(value: number, bracketName: string): boolean {
    switch (bracketName) {
      case 'Lower':
        return value >= 2 && value <= 4;
      case 'Middle':
        return value >= 5 && value <= 8;
      case 'Upper':
        return value >= 9 && value <= 10;
      default:
        return value === 1;
    }
  }

  clickOnMenu(itemIndex: number): void {
    if (this.activeIndex === itemIndex) {
      this.activeIndex = null;
    } else {
      this.activeIndex = itemIndex;
    }
  }

  openPopup(card: any): void {
    const cardsToSend = this.showCards.length > 0 ? this.showCards : this.cards;

    this.modalService.openModal({
      card: card,
      cards: cardsToSend,
      modalType: 'Collectibles',
      showDetails: true
    });
  }

  closeModal(): void {
    this.modalService.close();
  }

  slideNext(): void {
    this.swiper?.swiperRef.slideNext(1000);
  }

  slidePrev(): void {
    this.swiper?.swiperRef.slidePrev(1000);
  }

  nextPage(): void {
    if (this.currentCardPage < this.cardsPages) {
      this.currentCardPage++;
      this.showCards = (this.appliedFilter ? this.filteredCards : this.cards).slice(
        this.perPage * (this.currentCardPage - 1),
        this.perPage * this.currentCardPage
      );
    }
  }

  prevPage(): void {
    if (this.currentCardPage > 1) {
      this.currentCardPage--;
    }

    this.showCards = (this.appliedFilter ? this.filteredCards : this.cards).slice(
      this.perPage * (this.currentCardPage - 1),
      this.perPage * this.currentCardPage
    );
  }

  firstPage(): void {
    this.currentCardPage = 1;

    this.showCards = (this.appliedFilter ? this.filteredCards : this.cards).slice(
      this.perPage * (this.currentCardPage - 1),
      this.perPage * this.currentCardPage
    );
  }

  lastPage(): void {
    this.currentCardPage = this.cardsPages;

    this.showCards = (this.appliedFilter ? this.filteredCards : this.cards).slice(
      this.perPage * (this.currentCardPage - 1),
      this.perPage * this.currentCardPage
    );
  }

  walletConnected(): any {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userIsConnected') != 'false';
    }

    return false;
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

  unownedCardsOnly(event: any): void {
    const target = event.target as HTMLInputElement;
    this.isUnownedChecked = target.checked;
    this.applyFilter();
  }

  uniqueCardsOnly(event: any): void {
    const target = event.target as HTMLInputElement;
    this.isUniqueChecked = target.checked;
    this.applyFilter();
  }

  nonUniqueCardsOnly(event: any): void {
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

  clearFilters(): void {
    this.filter = {
      sort: {
        name: 'Alphabetical: A to Z',
        value: '1'
      },
      edition: {
        name: 'All',
        value: 'All'
      },
      set: {
        name: 'All',
        value: 'All'
      },
      faction: {
        name: 'All',
        value: 'All'
      },
      rarity: {
        name: 'All',
        value: 'All'
      },
      bracket: {
        name: 'All',
        value: 'All'
      },
      artist: {
        name: 'All',
        value: 'All'
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

    if (this.cardNameInput) {
      this.cardNameInput.nativeElement.value = '';
    }

    this.sortCardsByTab();
    this.applyFilter();
  }

  clearFiltersWallet(): void {
    this.filter = {
      sort: {
        name: 'Alphabetical: A to Z',
        value: '1'
      },
      edition: {
        name: 'All',
        value: 'All'
      },
      set: {
        name: 'All',
        value: 'All'
      },
      faction: {
        name: 'All',
        value: 'All'
      },
      rarity: {
        name: 'All',
        value: 'All'
      },
      bracket: {
        name: 'All',
        value: 'All'
      },
      artist: {
        name: 'All',
        value: 'All'
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

    if (this.cardNameInput) {
      this.cardNameInput.nativeElement.value = '';
    }
  }

  @HostListener('window:scroll')
  handleScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      const windowScroll = window.pageYOffset;
      this.sticky = windowScroll > 0;
    }
  }
}
