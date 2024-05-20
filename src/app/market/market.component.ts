// Angular imports
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, HostListener, Inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';

// Firebase imports
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';

// RxJS imports
import { Observable, Subscription, of, throwError } from 'rxjs';
import { catchError, map, mapTo, switchMap, take, tap } from 'rxjs/operators';

// Swiper imports
import SwiperCore, { Pagination } from 'swiper';
import { SwiperComponent } from 'swiper/angular';
SwiperCore.use([Pagination]);

// Service and other imports
import { ModalService } from '../modal/modal.service';
import { AuthService } from '../shared/services/auth.service';
import { WalletService } from '../wallet.service';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { child, get, getDatabase, ref } from 'firebase/database';

const skyHarborApi = "https://testapi.skyharbor.io"

interface TransactionResponse {
  error: boolean; transaction_to_sign: any
}

@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.scss']
})

export class MarketComponent implements OnInit {
  @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;
  @ViewChild('stickyElem', { static: false }) menuElement?: ElementRef;
  @ViewChild('cardNameInput', { static: false }) cardNameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('ownedCardsOnlyCheckbox') ownedCardsOnlyCheckbox!: ElementRef<HTMLInputElement>;
  sticky: boolean = false;
  activeIndex: any;
  activeTab = "Buy";
  sellActiveTab = "Owned";
  filter = {
    sort: {
      name: "Recently Listed",
      value: "0"
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
  isChecked = false;
  cardsPages = 7;
  perPage = 24;
  currentCardPage = 1;
  walletID: any = null;

  myTokenIds: any = [];
  storeTokenIds: any = [];

  cards: any = [];
  cardsByTab: any = [];

  filteredCards: any = [];
  showCards: any = [];
  appliedFilter: boolean = false;
  selectedCard: any = null;
  isLoading = '';
  message: string | null = null;
  isSuccessful = false;

  allowDcLoad = false;

  supplyIds: any = [];
  readonly SUPPLY_ADDRESS = "3n7SxSJCvFGp9xfumeQY8925QQpZifkpwAgnxoF3Hc3NWi9oraoXwNV1xcZpVP8A9LcXLef1krdvjoEKtiEUHDQy6AQ4suJsQyJ8EY2L36hErdvuindtN2dxTU8rLWTwMY18PH6g6XXyvrVQ25w57YSiDR1xF8ZN2sdqgQ9V9";

  constructor(private walletService: WalletService, private http: HttpClient, private modalService: ModalService, public adb: AngularFireDatabase, private httpClient: HttpClient, public afAuth: AngularFireAuth, public authService: AuthService, @Inject(PLATFORM_ID) private platformId: any) { }
  private baseUrl = 'https://api.skyharbor.io/api/sales'


  ngOnInit(): void {

    this.allowDcLoad = false;

    this.walletService.walletUpdated$.subscribe(walletID => {
      this.walletID = walletID; // Update local walletID state
      this.resetTokenState(); // Reset token state
      this.clearFilters();
      if (walletID) {
        console.log('Wallet loaded')
        if (this.activeTab == "Buy"){
          this.filterBuy();
          }
        if (this.activeTab == "Sell"){
        this.filterSell(this.sellActiveTab);
        }
        if (this.activeTab == "Burn"){
          this.filterBurn();
      }
    }
      else if (this.allowDcLoad == true) {
        console.log('DC wallet loaded')
        if (this.activeTab == "Buy"){
          this.filterBuy();
          }
        if (this.activeTab == "Sell"){
        this.filterSell(this.sellActiveTab);
        }
        if (this.activeTab == "Burn"){
          this.filterBurn();
          }
      }
  });

  this.afAuth.authState.pipe(
    take(1),
    switchMap(() => this.getWalletAddress()),
    switchMap(() => this.loadErgoTokens()),
    tap(() => console.log('Auth state loaded')),
    switchMap(() => this.getNFTs())
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
    () => console.log('Supply tokens and supply cards loaded successfully.'),
    error => console.error(error)
  );

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
                this.myTokenIds.push({ tokenId: token.tokenId, amount: token.amount / tokenDecimals });
              }
            }
            //console.log("Loaded Ergo Tokens:", this.myTokenIds);
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
              this.myTokenIds.push({ tokenId: token.tokenId, amount: token.amount / tokenDecimals });
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
              // Assuming you have a separate state variable to store supply tokens
              this.supplyIds.push({ tokenId: token.tokenId, amount:  remainingSupply});
              //console.log(`Token ID: ${token.tokenId}, Remaining Supply: ${remainingSupply.toLocaleString()}`);
            }
          }
          else {
            // Log to console if the response is invalid or empty
            console.log('No data returned for supply tokens. Check the API or the address.');
          }
        })
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

  private subscriptions: Subscription[] = [];

  resetTokenState() {
    this.myTokenIds = []; // Clear the tokenIds array
    this.storeTokenIds = []; // Clear the tokenIds array
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

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  queryCards(): Observable<any[]> {
    const db = getFirestore();
    const cardsCollection = collection(db, 'cards');

    return new Observable<any[]>((observer) => {
      getDocs(cardsCollection)
        .then((querySnapshot) => {
          const allCards = querySnapshot.docs.map((doc) => {
            const card: any = doc.data();
            const getAmount = this.myTokenIds.find((token: any) => token.tokenId === card.tokenId);
            const supplyToken = this.supplyIds.find((token: any) => token.tokenId === card.tokenId);

            // Check and return only if getAmount is defined and amount is greater than zero, exclude partner cards
            if (getAmount && getAmount.amount > 0 && getAmount.tokenId !== "6ad70cdbf928a2bdd397041a36a5c2490a35beb4d20eabb5666f004b103c7189" &&
            getAmount.tokenId !== "18c938e1924fc3eadc266e75ec02d81fe73b56e4e9f4e268dffffcb30387c42d"
            ) {
              return {
                ...card,
                amount: getAmount.amount,
                totalSupply: supplyToken ? supplyToken.amount : 'Not available'
              };
            }
            return null;  // Return null for cards that do not meet the criteria
          }).filter(card => card !== null);  // Remove all null entries from the array

          const sortedCards = allCards.sort((a: any, b: any) => a.name.localeCompare(b.name))
            .sort((a: any, b: any) => {
              const aHasTokenId = this.myTokenIds.map((token: any) => token.tokenId).includes(a.tokenId);
              const bHasTokenId = this.myTokenIds.map((token: any) => token.tokenId).includes(b.tokenId);

              if (aHasTokenId && !bHasTokenId) {
                return -1;
              }
              return 1;
            });

          // Update the data structure used to store processed cards
          this.myTokenIds = sortedCards;
          this.showCards = sortedCards.slice(0, this.perPage);
          this.cardsPages = Math.ceil(sortedCards.length / this.perPage) || 1;
          observer.next(sortedCards);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  queryNFTCards(): Observable<any[]> {
    const db = getFirestore();
    const cardsCollection = collection(db, 'cards');

    return new Observable<any[]>((observer) => {
      getDocs(cardsCollection)
        .then((querySnapshot) => {
            const allCards = querySnapshot.docs.map((doc) => {
            const card: any = doc.data();

            const getAmount = this.cardsByTab.find((tabCard: any) => tabCard.token_Id === card.tokenId);
            const supplyToken = this.supplyIds.find((token: any) => token.tokenId === card.tokenId);
            //console.log(supplyToken);
            //console.log(getAmount);

            if (getAmount) {
                return { ...card, amount: getAmount.amount, totalSupply: supplyToken ? supplyToken.amount : 'Not available' };
            }
            else {
                return { ...card, amount: 0, totalSupply: supplyToken ? supplyToken.amount : 'Not available' };
          }
          });

          observer.next(allCards.filter(card => card));
          observer.complete();
        })
        .catch((error) => {
          console.error("Error fetching cards from Firestore:", error);
          observer.error(error);
        });
    });
  }

  getNFTs(): Observable<void> {
    return this.fetchNFTs().pipe(
      catchError(error => {
        console.log('Error loading Ergo tokens:', error);
        this.allowDcLoad = true;
        return of();
      }),
      tap(response => {
        this.processResponse(response);
      }),
      mapTo(void 0)  // ensures the return type is Observable<void>
    );
  }

  // Fetch and processind response
  fetchNFTs(): Observable<any[]> {
        //eventually refine this
    const url = `${this.baseUrl}?collection=blitztcg&orderCol=list_time&order=desc`;
    return this.http.get<any[]>(url);
  }

  private processResponse(response: any[]): void {
    if (!response) return;
    this.cards = response.sort(this.sortByListTime).map(this.mapNftToCard);
    this.cardsByTab = this.cards.filter((nft: any) => (nft.status === "active"));// || nft.status === "inactive");

    this.queryNFTCards().subscribe(
      firebaseCards => {
        // Merge Firebase data with active NFT cards and update UI elements after the merge.
        this.cardsByTab = this.cardsByTab.map((nftCard: { token_Id: any; }) => {
          const firebaseCard = firebaseCards.find(fc => fc.tokenId === nftCard.token_Id);
          const tokenDetail = this.myTokenIds.find((t: { tokenId: any; }) => t.tokenId === nftCard.token_Id);
          if (firebaseCard && tokenDetail) {
           //console.log(`Token ID: ${tokenDetail.tokenId} - Amount: ${tokenDetail.amount}`); // Logging the token details
            return { ...nftCard, ...firebaseCard, amount: tokenDetail.amount };  // Merge with additional amount info
          }
          else {
            //console.log(`Token ID: ${tokenDetail.tokenId} - Amount: ${tokenDetail.amount}`); // Logging the token details
             return { ...nftCard, ...firebaseCard, amount: 0 };  // Merge with additional amount info
           }
        });

        // Only update display-related properties after the data merge is complete.
        this.showCards = this.cardsByTab.slice(0, this.perPage);
        this.cardsPages = Math.ceil(this.cardsByTab.length / this.perPage) || 1;
        this.allowDcLoad = true;

      },
      error => console.error('Failed to load Firebase cards:', error)
    );
  }


  private sortByListTime(a: any, b: any): number {
    return new Date(b.list_time).getTime() - new Date(a.list_time).getTime();
  }
  mapNftToCard = (nft: any) => {
    return {
      ...nft,
      token_Id: nft.token_id,
      image: `https://gateway.ipfs.io/ipfs/${nft.ipfs_art_hash}`,
      name: nft.nft_name,
      description: this.extractDescription(nft.nft_desc),
      date: nft.list_time.substring(0, 10),
      time_ago: this.timeAgo(nft.list_time),
      price_erg: this.formatNumberWithDecimals(nft.nerg_sale_value, nft.decimals),
      price_usd: this.formatNumberWithDecimals(nft.nerg_service_value, 7),
    };
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

  walletConnected(): any {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userIsConnected') != 'false';
    }
  }


  // Tabs actions
  selectTab(tab: string, tab2: string = 'Owned'): void {
    this.activeTab = tab;
    this.sellActiveTab = tab2;
    this.clearFilters(tab, tab2)
    if (tab === 'Sell' && (tab2 === 'Owned') || tab === 'Burn') {
      this.filter.sort = {
        name: 'Alphabetical: A to Z',
        value: '1'
      }
    }
    else {
      this.filter.sort = {
        name: 'Recently Listed',
        value: '0'
      }
    }
    switch (tab) {
      case 'Buy':
        this.filterBuy();
        break;
      case 'Sell':
        this.filterSell(tab2);
        break;
        case 'Burn':
        this.filterBurn();
        break;
    }

    this.currentCardPage = 1;
    this.showCards = this.cardsByTab.slice(0, this.perPage);
    this.cardsPages = Math.ceil(this.cardsByTab.length / this.perPage) || 1;
  }
  private filterBuy(): void {
    // Trigger fetching and processing NFTs again.
    this.loadErgoTokens().pipe(
      switchMap(() => this.getNFTs()),
      catchError(error => {
        console.error('Failed to reload user tokens and cards:', error);
        return throwError(() => new Error('Failed to reload user tokens and cards'));
      })
    ).subscribe(
      () => console.log('User tokens and NFT cards reloaded and processed successfully.'),
      error => console.error(error)
    );
  }

  private filterSell(tab2: string): void {
    if (tab2 === 'Owned') {
      // Start by loading tokens, then query the cards, and finally set up the 'Owned' cards view.
      this.loadErgoTokens().pipe(
        switchMap(() => this.queryCards()), // After loading tokens, immediately query cards
        catchError(error => {
          console.error('Failed to load tokens or cards for Owned cards:', error);
          return throwError(() => new Error('Failed to set up Owned cards'));
        })
      ).subscribe(
        () => {
          // After tokens and cards are loaded and processed, setup the view for owned cards.
         this.cardsByTab = this.myTokenIds;  // Ensure these are the processed tokens/cards.
          console.log('Owned cards setup complete.');
        },
        error => console.error('Error during the Owned tab setup:', error)
      );

    } else if (tab2 === 'For Sale' || tab2 === 'Sold') {
        // Trigger fetching and processing NFTs before applying specific filters.
        this.loadErgoTokens().pipe(
            switchMap(() => this.getNFTs()),  // Fetch the latest NFT data.
            switchMap(() => this.queryNFTCards()),  // Fetch corresponding Firebase data.
            catchError(error => {
                console.error('Failed to reload data for For Sale or Sold tabs:', error);
                return throwError(() => new Error('Failed to reload data'));
            })
        ).subscribe(
            firebaseCards => {
                const filterCondition = tab2 === 'For Sale' ?
                    (nft: any) => nft.status === "active" && nft.seller_address === this.walletID :
                    (nft: any) => nft.status === "complete" && nft.seller_address === this.walletID;

                // First filter the cards based on the tab's condition.
                let filteredCards = this.cards.filter(filterCondition);

                // Then merge Firebase data with filtered NFT cards.
                filteredCards = filteredCards.map((nftCard: any) => {
                    const firebaseCard = firebaseCards.find(fc => fc.tokenId === nftCard.token_Id);
                    return firebaseCard ? { ...nftCard, ...firebaseCard } : nftCard;
                });

                // Update the cardsByTab to reflect merged results.
                this.cardsByTab = filteredCards;

                // Update UI elements.
                this.showCards = this.cardsByTab.slice(0, this.perPage);
                this.cardsPages = Math.ceil(this.cardsByTab.length / this.perPage) || 1;

                // Log for debugging.
                console.log(`Filtered and merged cards for ${tab2} tab loaded:`, this.cardsByTab);
            },
            error => console.error('Failed to load and merge cards:', error)
        );
    }
}


  private filterBurn(): void {
      // Start by loading tokens, then query the cards, and finally set up the 'Owned' cards view.
      this.loadErgoTokens().pipe(
        switchMap(() => this.queryCards()), // After loading tokens, immediately query cards
        catchError(error => {
          console.error('Failed to load tokens or cards for Sold cards:', error);
          return throwError(() => new Error('Failed to set up Sold cards'));
        })
      ).subscribe(
        () => {
          // After tokens and cards are loaded and processed, setup the view for owned cards.
         this.cardsByTab = this.myTokenIds;  // Ensure these are the processed tokens/cards.
          console.log('Owned cards setup complete.');
        },
        error => console.error('Error during the Sold tab setup:', error)
      );
  }

 // Modal actions
  openPopup(card: any, showDetails = true, modalType = this.activeTab, sellActiveTab = this.sellActiveTab) {
    // Determine which cards array to send based on the contents of filteredCards
    this.filterCardsCheck();

    // Open the modal with the appropriate data
    this.modalService.openModal({
        card: card,
        cards: this.showCards, // Pass the appropriate array of cards
        showDetails: showDetails,
        modalType: modalType,
        sellActiveTab: sellActiveTab
    });
}

  closeModal() {
    this.modalService.close();
  }


  // Pagination functions
  updateDisplayedCards() {
    this.showCards = (this.appliedFilter ? this.filteredCards : this.cardsByTab)
    .slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);
  }

  filterCardsCheck(){
    if (this.filteredCards != this.cardsByTab){
      this.filteredCards = this.cardsByTab;
    }
  }

  nextPage() {
    this.filterCardsCheck();
    if (this.currentCardPage < this.cardsPages) {
      this.currentCardPage++;
      this.showCards = (this.appliedFilter ? this.filteredCards : this.cardsByTab).slice(this.perPage * (this.currentCardPage - 1), this.perPage * this.currentCardPage);
    }
    this.updateDisplayedCards();
  }
  prevPage() {
    this.filterCardsCheck();
    if (this.currentCardPage > 1) {
      this.currentCardPage--;
      this.updateDisplayedCards();
    }
  }
  firstPage() {
    this.filterCardsCheck();
    this.currentCardPage = 1;
    this.updateDisplayedCards();
  }
  lastPage() {
    this.filterCardsCheck();
    this.currentCardPage = this.cardsPages;
    this.updateDisplayedCards();
  }

  // Filters and sort actions
  toggleMenu(index: number): void {
    this.activeIndex = this.activeIndex === index ? -1 : index;
  }
  clickOnMenu(
    itemIndex: number,
  ) {
    if (this.activeIndex === itemIndex) this.activeIndex = null;
    else this.activeIndex = itemIndex;
  }

  applyFilter(event: any = null): void {
    this.appliedFilter = true;
    const searchText = event ? event.target.value : null;
    this.filteredCards = this.cardsByTab.filter((card: any) => this.isValidCard(card, searchText));
    this.showCards = this.filteredCards.slice(0, this.perPage);
    this.currentCardPage = 1;
    this.cardsPages = Math.ceil(this.filteredCards.length / this.perPage) || 1;
  }

  private isValidCard(card: any, searchText: string): boolean {
    return (!this.isChecked || (this.isChecked && card.amount && card.amount > 0)) &&
      (this.filter.edition.value === 'All' || card.edition == this.filter.edition.value) &&
      (this.filter.set.value === 'All' || card.set === this.filter.set.value) &&
      (this.filter.faction.value === 'All' || card.faction === this.filter.faction.value) && // Ensure faction is properly compared
      (this.filter.rarity.value === 'All' || card.rarity === this.filter.rarity.value) &&
      (this.filter.bracket.value === 'All' || this.filterBracket(card.bracket, this.filter.bracket.value)) &&
      (this.filter.artist.value === 'All' || card.artist === this.filter.artist.value) &&
      (!searchText || card.name.toLowerCase().includes(searchText.toLowerCase()));
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
  selectSort(value: string, name: string): void {
    this.filter.sort.value = value;
    this.filter.sort.name = name;
    this.cardsByTab.sort((a: any, b: any) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const priceA = parseInt(a.nerg_sale_value);
      const priceB = parseInt(b.nerg_sale_value);
      const dateA: Date = new Date(a.list_time);
      const dateB: Date = new Date(b.list_time);

      switch (value) {
        case '0':
          return dateB.getTime() - dateA.getTime();
        case '1':
          return nameA.localeCompare(nameB);
        case '2':
          return nameB.localeCompare(nameA);
        case '3':
          return priceA - priceB;
        case '4':
          return priceB - priceA;
        case '5':
           return b.amount - a.amount;  // Count: Most to Least
        case '6':
          return a.amount - b.amount;  // Count: Least to Most
        default:
          return 0;
      }
    });

    this.applyFilter();
    this.toggleMenu(6);
  }

  setFilterAndToggleMenu(filterKey: keyof typeof this.filter, value: string, name: string, menuIndex: number): void {
    this.filter[filterKey].value = value;
    this.filter[filterKey].name = name;
    this.applyFilter();
    this.toggleMenu(menuIndex);
  }
  selectEdition(value: string, name: string): void {
    this.setFilterAndToggleMenu('edition', value, name, 0);
  }
  selectSet(value: string, name: string): void {
    this.setFilterAndToggleMenu('set', value, name, 1);
  }
  selectfaction(value: string, name: string): void {
    this.setFilterAndToggleMenu('faction', value, name, 2);
  }
  selectRarity(value: string, name: string): void {
    this.setFilterAndToggleMenu('rarity', value, name, 3);
  }
  selectBracket(value: string, name: string): void {
    this.setFilterAndToggleMenu('bracket', value, name, 4);
  }
  selectArtist(value: string, name: string): void {
    this.setFilterAndToggleMenu('artist', value, name, 5);
  }

  clearFilters(tab: string | null = null, tab2: string | null = null) {
    this.filter = {
      sort: {
        ... ((tab === 'Sell' && tab2 === 'Owned') || (tab2 === 'Burn')) ? {
          name: 'Alphabetical: A to Z',
          value: '1'
        } : {
          name: 'Recently Listed',
          value: '0'
        }
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

    this.cardNameInput.nativeElement.value = '';
    this.appliedFilter = false;

    if((tab === 'Sell' && tab2 === 'Owned') || (tab === 'Burn')){
      this.selectSort('1','Alphabetical: A to Z');
    }
    else{
      this.selectSort('0', 'Recently Listed');
    }
    this.activeIndex = -1; //closes dropdowns
  }
  // Formating functions
  formatNumberWithDecimals(numberStr: string, decimals: number) {

    // Extract parts
    const integerPart = decimals < numberStr.length ? numberStr.substring(0, numberStr.length - decimals) : '0';
    const rawDecimalPart = numberStr.substring(numberStr.length - decimals);
    const decimalPart = rawDecimalPart.substring(0, 2); // Take only first 2 characters

    // Format the integer part with commas
    const formattedInteger = parseFloat(integerPart).toLocaleString('en-US');

    // If the decimal part is '00', return only the integer part
    if (decimalPart === '00') {
      return formattedInteger;
    }

    // Otherwise, concatenate the formatted integer part with the decimal part
    return formattedInteger + "." + decimalPart;
  }
  buyNFT(boxId: string) {
    this.isLoading = boxId;
    const testURL = `${skyHarborApi}/api/transactions/buy`;
    const data = {
      // DO NOT USE this.walletID - USE NAUTILUS CHANGE ADDRESS INSTEAD
      "userAddresses": [this.walletID],
      "buyBox": {
        box_id: boxId
      }
    };
    this.http.post(testURL, data).subscribe(
      (response: Partial<TransactionResponse>) => {
        this.isLoading = '';
        this.isSuccessful = true;
        if(!response?.transaction_to_sign) {
          throw Error
        }

        // Sign the returned tx
        ergo.sign_tx(response?.transaction_to_sign).then((txResponse: any) => {
            // Submit the tx
            ergo.submit_tx(txResponse).then((submitRes) => {
              this.isSuccessful = true;
              this.message = `Transaction successful with Box ID: ${boxId}`;  
            })
        }).catch((error: { toString: () => string | null; }) => {
            console.error('Transaction error:', error);
            this.isSuccessful = false;
            this.message = error.toString();
        });
        

        console.log(response);
        this.message = 'Purchase successful!';
      },
      error => {
        const { error: { message } } = error
        console.log(error);
        this.isLoading = '';
        this.message = message;
        this.isSuccessful = true;
        console.error('Error purchasing NFT:', error);
      }
    );
  }


//   buyNFT(boxId: string, tokenId: string, recipientAddress: string, amountToSend: number, ergAmount: number) {
//     // First, check if the ergoConnector and its Nautilus instance are available
//     if (typeof ergoConnector !== 'undefined' && ergoConnector.nautilus) {
//         ergoConnector.nautilus.connect().then(access_granted => {
//             if (!access_granted) {
//                 console.error("Wallet connection not granted.");
//                 this.message = "Wallet connection was not granted. Please ensure your wallet is connected.";
//                 this.isSuccessful = false;
//                 return;
//             }

//             // Define the transaction object
//             const transactionObject = {
//                 requests: [
//                     {
//                         address: recipientAddress,
//                         value: ergAmount, // This is the ERG amount to be sent
//                     },
//                     {
//                         address: recipientAddress,
//                         value: 0, // No additional ERG is sent with the NFT
//                         tokenId: tokenId, // Specify the NFT token ID
//                         amount: 1 // Typically, the amount for NFTs is 1
//                     }
//                 ],
//                 fee: 1000000 // Specify the necessary transaction fee
//             };

//             // Now send the transaction using ergo
//             window.ergo.requestTransaction(transactionObject).then((response: any) => {
//                 console.log('Transaction response:', response);
//                 this.isSuccessful = true;
//                 this.message = `Transaction successful with Box ID: ${boxId}`;
//             }).catch((error: { toString: () => string | null; }) => {
//                 console.error('Transaction error:', error);
//                 this.isSuccessful = false;
//                 this.message = error.toString();
//             });

//         }).catch(error => {
//             console.error(`Error connecting to the wallet: ${error}`);
//             this.isSuccessful = false;
//             this.message = "Error connecting to the wallet. Please try again.";
//         });
//     } else {
//         console.log("Nautilus wallet extension is not detected.");
//         alert("Nautilus wallet is not detected. Please install the Nautilus wallet extension to proceed.");
//         this.isSuccessful = false;
//         this.message = "Nautilus wallet extension is not detected.";
//     }
// }

  onImageLoad(card: any) {
    card.isLoaded = true;
    card.imageLoaded = true;
  }
  onImageError(card: any) {
    card.isLoaded = true;
    card.imageLoaded = false;
  }
  private extractDescription(description: string) {
    try {
      // Try to parse the description as JSON
      const jsonData = JSON.parse(description);

      // If parsing succeeds and the parsed object has a 'description' field, return that
      if (jsonData.description) {
        return jsonData.description;
      }
    } catch (error) {
      // If there's an error in parsing, it means the description was not a JSON string
      // So, just return the original description
    }
    return description;
  }
  private timeAgo(dateTimeStr: string) {
    // Parse the provided date string
    const pastDate: any = new Date(dateTimeStr);

    // Get the current date and time
    const currentDate: any = new Date();

    // Calculate the difference in milliseconds
    const diffMilliseconds = currentDate - pastDate;

    // Convert milliseconds to minutes, hours, days
    const diffMinutes = Math.floor(diffMilliseconds / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return `Listed ${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `Listed ${diffHours} hours ago`;
    } else if (diffDays < 30) {
      return `Listed ${diffDays} days ago`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      return `Listed ${diffMonths} months ago`;
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
